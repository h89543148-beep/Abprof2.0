// ===== RESULT JS =====

// ===== ELEMENTS =====
const trophy = document.getElementById('trophy');
const resultTitle = document.getElementById('resultTitle');
const resultMsg = document.getElementById('resultMsg');
const scoreText = document.getElementById('scoreText');
const percentText = document.getElementById('percentText');
const totalText = document.getElementById('totalText');
const categoryBadge = document.getElementById('categoryBadge');

// ===== ON PAGE LOAD =====
window.onload = function () {

  // Login check
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../login/login.html';
    return;
  }

  // Theme load
  const savedTheme = localStorage.getItem('quizTheme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
  }

  // Result load
  const result = JSON.parse(localStorage.getItem('quizResult'));
  if (!result) {
    window.location.href = '../Index.html';
    return;
  }

  // Score dikhao
  scoreText.textContent = result.score;
  percentText.textContent = result.percentage + '%';
  totalText.textContent = result.total;

  // Category dikhao
  categoryBadge.textContent = result.category || 'General';

  // Performance message
  showPerformance(result.percentage);

};

// ===== PERFORMANCE MESSAGE =====
function showPerformance(percentage) {

  if (percentage === 100) {
    trophy.textContent = '🏆';
    resultTitle.textContent = 'Perfect Score!';
    resultMsg.textContent = 'Waah! Tum genius ho! 100% sahi jawab!';
  } else if (percentage >= 80) {
    trophy.textContent = '🥇';
    resultTitle.textContent = 'Zabardast!';
    resultMsg.textContent = 'Bahut accha kiya! Top performer ho tum!';
  } else if (percentage >= 60) {
    trophy.textContent = '🥈';
    resultTitle.textContent = 'Accha Kiya!';
    resultMsg.textContent = 'Theek hai! Thodi aur practice karo!';
  } else if (percentage >= 40) {
    trophy.textContent = '🥉';
    resultTitle.textContent = 'Theek Hai!';
    resultMsg.textContent = 'Koshish karo, next time better karoge!';
  } else {
    trophy.textContent = '😅';
    resultTitle.textContent = 'Koi Baat Nahi!';
    resultMsg.textContent = 'Haar mat mano! Dobara try karo!';
  }

}// ========== ADD ERROR HANDLING ==========
window.onload = function() {
    try {
        var result = JSON.parse(localStorage.getItem('quizResult'));
        if (!result) {
            throw new Error('No result found');
        }
        
        document.getElementById('score').textContent = result.score;
        document.getElementById('total').textContent = result.total;
        document.getElementById('percentage').textContent = result.percentage + '%';
        document.getElementById('category').textContent = result.category;
        
        // Save to leaderboard
        var currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && firebase.database) {
            firebase.database().ref('leaderboard').push({
                username: currentUser.username,
                score: result.score,
                percentage: result.percentage,
                category: result.category,
                date: new Date().toISOString()
            });
        }
    } catch (error) {
        showError('Result load nahi hua: ' + error.message);
    }
};

function showError(msg) {
    var errDiv = document.createElement('div');
    errDiv.className = 'error-msg show';
    errDiv.innerHTML = msg + '<button onclick="location.reload()">Retry</button>';
    document.body.appendChild(errDiv);
}