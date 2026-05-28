var db = firebase.database();
var currentUser = null;
var roomCode = null;
var playerRole = null;
var questions = [];
var currentQuestion = 0;
var myScore = 0;
var opponentScore = 0;
var timer = null;
var timeLeft = 30;
var answered = false;

window.onload = function() {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../login/login.html';
    return;
  }

  document.getElementById('createRoomBtn').onclick = createRoom;
  document.getElementById('joinRoomBtn').onclick = joinRoom;
  document.getElementById('cancelBtn').onclick = cancelRoom;
  document.getElementById('copyBtn').onclick = copyCode;
  document.getElementById('backBtn').onclick = cancelRoom;
};

function createRoom() {
  roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
  playerRole = 'player1';
  
  var allQ = window.generalQuestions || [];
  questions = shuffleArray(allQ).slice(0, 10);
  
  var roomData = {
    player1: currentUser.username,
    player2: null,
    status: 'waiting',
    currentQuestion: 0,
    player1Score: 0,
    player2Score: 0,
    player1Answered: -1,
    player2Answered: -1,
    questions: questions,
    createdAt: Date.now()
  };

  db.ref('rooms/' + roomCode).set(roomData).then(function() {
    showScreen('waitingScreen');
    document.getElementById('displayRoomCode').textContent = roomCode;
    document.getElementById('player1Name').textContent = currentUser.username;
    listenRoom();
  }).catch(function(err) {
    alert('Error: ' + err.message);
  });
}

function joinRoom() {
  var code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
  if (!code) {
    alert('Code likho!');
    return;
  }

  db.ref('rooms/' + code).once('value').then(function(snapshot) {
    if (!snapshot.exists()) {
      alert('Room nahi mila!');
      return;
    }

    var room = snapshot.val();
    roomCode = code;
    playerRole = 'player2';
    questions = room.questions;

    db.ref('rooms/' + roomCode).update({
      player2: currentUser.username,
      status: 'ready'
    }).then(function() {
      showScreen('waitingScreen');
      document.getElementById('displayRoomCode').textContent = roomCode;
      document.getElementById('player1Name').textContent = room.player1;
      document.getElementById('player2Name').textContent = currentUser.username;
      listenRoom();
    });
  });
}

function listenRoom() {
  db.ref('rooms/' + roomCode).on('value', function(snapshot) {
    if (!snapshot.exists()) return;
    
    var room = snapshot.val();

    if (room.player2 && playerRole === 'player1' && room.status === 'ready') {
      document.getElementById('player2Status').textContent = '✅ Ready';
      setTimeout(function() {
        db.ref('rooms/' + roomCode).update({status: 'playing', currentQuestion: 0});
      }, 2000);
    }

    if (room.status === 'playing') {
      if (document.getElementById('quizScreen').classList.contains('hidden')) {
        document.getElementById('p1Name').textContent = room.player1;
        document.getElementById('p2Name').textContent = room.player2;
        showScreen('quizScreen');
        currentQuestion = 0;
        loadQuestion();
      }

      if (room.currentQuestion !== currentQuestion) {
        currentQuestion = room.currentQuestion;
        answered = false;
        clearInterval(timer);
        loadQuestion();
      }

      document.getElementById('p1Score').textContent = room.player1Score || 0;
      document.getElementById('p2Score').textContent = room.player2Score || 0;
    }

    if (room.status === 'finished') {
      showResult(room);
    }
  });
}

function loadQuestion() {
  answered = false;
  if (currentQuestion >= questions.length) {
    endGame();
    return;
  }

  var q = questions[currentQuestion];
  document.getElementById('questionText').textContent = q.question;
  document.getElementById('qNum').textContent = (currentQuestion + 1) + '/' + questions.length;

  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    opts[i].textContent = q.options[i];
    opts[i].onclick = (function(idx) {
      return function() { checkAnswer(idx); };
    })(i);
  }

  startTimer();
}

function startTimer() {
  timeLeft = 30;
  document.getElementById('timerText').textContent = timeLeft;
  clearInterval(timer);

  timer = setInterval(function() {
    timeLeft--;
    document.getElementById('timerText').textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      timeUp();
    }
  }, 1000);
}

function checkAnswer(selected) {
  if (answered) return;
  answered = true;
  clearInterval(timer);

  var q = questions[currentQuestion];
  var opts = document.querySelectorAll('.option-btn');

  for (var i = 0; i < opts.length; i++) {
    opts[i].disabled = true;
    if (i === q.correct) opts[i].style.backgroundColor = 'green';
  }

  if (selected === q.correct) {
    myScore += 10;
  }

  var update = {};
  update[playerRole === 'player1' ? 'player1Score' : 'player2Score'] = myScore;
  update[playerRole === 'player1' ? 'player1Answered' : 'player2Answered'] = currentQuestion;
  db.ref('rooms/' + roomCode).update(update);

  if (playerRole === 'player1') {
    setTimeout(function() {
      var next = currentQuestion + 1;
      if (next >= questions.length) {
        endGame();
      } else {
        db.ref('rooms/' + roomCode).update({
          currentQuestion: next,
          player1Answered: -1,
          player2Answered: -1
        });
      }
    }, 2000);
  }
}

function timeUp() {
  if (answered) return;
  answered = true;
  
  var q = questions[currentQuestion];
  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    if (i === q.correct) opts[i].style.backgroundColor = 'green';
  }

  var update = {};
  update[playerRole === 'player1' ? 'player1Answered' : 'player2Answered'] = currentQuestion;
  db.ref('rooms/' + roomCode).update(update);

  if (playerRole === 'player1') {
    setTimeout(function() {
      var next = currentQuestion + 1;
      if (next >= questions.length) {
        endGame();
      } else {
        db.ref('rooms/' + roomCode).update({currentQuestion: next});
      }
    }, 2000);
  }
}

function endGame() {
  clearInterval(timer);
  db.ref('rooms/' + roomCode).update({status: 'finished'});
}

function showResult(room) {
  showScreen('resultScreen');
  document.getElementById('finalP1Name').textContent = room.player1;
  document.getElementById('finalP2Name').textContent = room.player2;
  document.getElementById('finalP1Score').textContent = room.player1Score || 0;
  document.getElementById('finalP2Score').textContent = room.player2Score || 0;
}

function cancelRoom() {
  if (roomCode) db.ref('rooms/' + roomCode).remove();
  window.location.reload();
}

function copyCode() {
  navigator.clipboard.writeText(roomCode);
  document.getElementById('copyBtn').textContent = '✅ Copied!';
}

function showScreen(id) {
  ['lobbyScreen', 'waitingScreen', 'quizScreen', 'resultScreen'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
document.getElementById('createRelayBtn').onclick = function() {
  window.location.href = 'relay.html';
};