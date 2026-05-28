var currentQuestion = 0;
var score = 0;
var timer = null;
var timeLeft = 30;
var questions = [];
var answered = false;

// ========== DEBOUNCE FUNCTION ==========
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// ========== SKELETON LOADER ==========
function showSkeletonLoader() {
    var qEl = document.getElementById('questionText');
    if (qEl) qEl.innerHTML = '<div class="skeleton skeleton-question"></div>';
    var opts = document.querySelectorAll('.option-btn');
    for (var i = 0; i < opts.length; i++) {
        opts[i].innerHTML = '<div class="skeleton skeleton-option"></div>';
        opts[i].disabled = true;
    }
}

// ========== PAGE LOAD ==========
window.onload = function() {
    var currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '../login/login.html';
        return;
    }

    var savedTheme = localStorage.getItem('quizTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light');
    }

    var category = localStorage.getItem('quizCategory') || 'general';
    var categoryName = document.getElementById('categoryName');
    if (categoryName) categoryName.textContent = category;

    // Load questions
    if (category === 'general') questions = window.generalQuestions || [];
    else if (category === 'science') questions = window.scienceQuestions || [];
    else if (category === 'math') questions = window.mathQuestions || [];
    else if (category === 'custom') questions = window.customQuestions || [];

    // Fallback if no questions
    if (!questions || questions.length === 0) {
        questions = [
            { question: "Sample Question 1", options: ["A", "B", "C", "D"], correct: 0 },
            { question: "Sample Question 2", options: ["A", "B", "C", "D"], correct: 1 }
        ];
    }

    // Shuffle and take 10
    questions = questions.slice().sort(function() {
        return Math.random() - 0.5;
    }).slice(0, 10);

    if (questions.length === 0) {
        alert('Questions load nahi hue — reload karo!');
        return;
    }

    loadQuestion();

    var quitBtn = document.getElementById('quitBtn');
    if (quitBtn) {
        quitBtn.onclick = function() {
            clearInterval(timer);
            window.location.href = '../Index.html';
        };
    }

    var nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.onclick = function() {
            currentQuestion++;
            if (currentQuestion < questions.length) {
                loadQuestion();
            } else {
                endQuiz();
            }
        };
    }
};

// ========== LOAD QUESTION (with skeleton) ==========
function loadQuestion() {
    showSkeletonLoader();
    answered = false;
    
    var nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.style.display = 'none';
    
    setTimeout(function() {
        var q = questions[currentQuestion];
        if (!q) {
            console.error('Question not found!');
            return;
        }
        
        var questionText = document.getElementById('questionText');
        var questionCount = document.getElementById('questionCount');
        var progressFill = document.getElementById('progressFill');
        
        if (questionText) questionText.textContent = q.question;
        if (questionCount) questionCount.textContent = 'Question ' + (currentQuestion + 1) + '/10';
        if (progressFill) progressFill.style.width = ((currentQuestion + 1) / 10 * 100) + '%';
        
        var opts = document.querySelectorAll('.option-btn');
        for (var i = 0; i < opts.length; i++) {
            opts[i].innerHTML = q.options[i];
            opts[i].className = 'option-btn';
            opts[i].disabled = false;
            opts[i].onclick = (function(idx) {
                return function() { checkAnswer(idx); };
            })(i);
        }
        
        startTimer();
    }, 300);
}

// ========== START TIMER ==========
function startTimer() {
    timeLeft = 30;
    var timerText = document.getElementById('timerText');
    var timerCircle = document.getElementById('timerCircle');
    
    if (timerText) timerText.textContent = timeLeft;
    if (timerCircle) timerCircle.className = 'timer-circle';
    clearInterval(timer);

    timer = setInterval(function() {
        timeLeft--;
        if (timerText) timerText.textContent = timeLeft;
        
        if (timerCircle) {
            if (timeLeft <= 15 && timeLeft > 5) {
                timerCircle.className = 'timer-circle warning';
            }
            if (timeLeft <= 5) {
                timerCircle.className = 'timer-circle danger';
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            timeUp();
        }
    }, 1000);
}

// ========== TIME UP ==========
function timeUp() {
    if (answered) return;
    answered = true;
    
    var q = questions[currentQuestion];
    if (!q) return;
    
    var opts = document.querySelectorAll('.option-btn');
    for (var i = 0; i < opts.length; i++) {
        opts[i].disabled = true;
        if (i === q.correct) opts[i].classList.add('correct');
    }
    
    var nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.style.display = 'block';
}

// ========== CHECK ANSWER (Debounced) ==========
var checkAnswerDebounced = debounce(function(selected) {
    if (answered) return;
    answered = true;
    clearInterval(timer);
    
    var q = questions[currentQuestion];
    if (!q) return;
    
    var opts = document.querySelectorAll('.option-btn');
    
    for (var i = 0; i < opts.length; i++) {
        opts[i].disabled = true;
        if (i === q.correct) opts[i].classList.add('correct');
    }
    
    if (selected === q.correct) {
        score += 10;
        var scoreCount = document.getElementById('scoreCount');
        if (scoreCount) scoreCount.textContent = 'Score: ' + score;
    } else {
        if (opts[selected]) opts[selected].classList.add('wrong');
    }
    
    var nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.style.display = 'block';
}, 500);

function checkAnswer(selected) {
    checkAnswerDebounced(selected);
}

// ========== END QUIZ ==========
function endQuiz() {
    clearInterval(timer);

    var currentUser = JSON.parse(localStorage.getItem('currentUser'));
    var percentage = Math.round((score / 100) * 100);
    var category = localStorage.getItem('quizCategory');

    // Save to localStorage first
    localStorage.setItem('quizResult', JSON.stringify({
        score: score,
        total: 100,
        percentage: percentage,
        category: category
    }));

    // Firebase score save (with error handling)
    if (typeof firebase !== 'undefined' && firebase.database) {
        try {
            var db = firebase.database();
            db.ref('leaderboard').push({
                username: currentUser.username,
                score: score,
                percentage: percentage,
                category: category,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now()
            });

            db.ref('stats/' + currentUser.username).once('value').then(function(snapshot) {
                var old = snapshot.exists() ? snapshot.val() : {
                    totalQuiz: 0, bestScore: 0, totalPoints: 0
                };
                db.ref('stats/' + currentUser.username).set({
                    totalQuiz: old.totalQuiz + 1,
                    bestScore: Math.max(old.bestScore, percentage),
                    totalPoints: old.totalPoints + score
                });
            }).catch(function(e) {
                console.log('Stats save error:', e);
            });
        } catch(e) {
            console.log('Firebase error:', e);
        }
    }

    // Redirect to result
    window.location.href = '../result/result.html';
}