var db = firebase.database();
var currentUser = null;
var relayCode = null;
var playerPosition = null;
var questions = [];
var currentQuestion = 0;
var scores = {p1: 0, p2: 0, p3: 0, p4: 0};
var timer = null;
var timeLeft = 30;
var answered = false;

window.onload = function() {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../login/login.html';
    return;
  }

  document.getElementById('createRelayBtn').onclick = createRelayRoom;
  document.getElementById('joinRelayBtn').onclick = joinRelayRoom;
  document.getElementById('cancelRelayBtn').onclick = cancelRelay;
  document.getElementById('copyRelayBtn').onclick = copyRelayCode;
  document.getElementById('backBtn').onclick = cancelRelay;
};

function createRelayRoom() {
  relayCode = Math.random().toString(36).substr(2, 6).toUpperCase();
  playerPosition = 1;
  
  var roomData = {
    p1: currentUser.username,
    p2: null, p3: null, p4: null,
    status: 'waiting',
    currentQuestion: 0, currentPlayer: 1,
    p1Score: 0, p2Score: 0, p3Score: 0, p4Score: 0,
    createdAt: Date.now()
  };

  db.ref('relay/' + relayCode).set(roomData).then(function() {
    showScreen('waitingScreen');
    document.getElementById('displayRelayCode').textContent = relayCode;
    document.getElementById('p1NameWait').textContent = currentUser.username + ' ✅';
    listenRelayRoom();
  }).catch(function(err) { alert('Error: ' + err.message); });
}

function joinRelayRoom() {
  var code = document.getElementById('relayCodeInput').value.trim().toUpperCase();
  if (!code) { alert('Code likho!'); return; }

  db.ref('relay/' + code).once('value').then(function(snapshot) {
    if (!snapshot.exists()) { alert('Room nahi mila!'); return; }
    var room = snapshot.val();
    relayCode = code;

    if (!room.p2) { playerPosition = 2; db.ref('relay/' + relayCode).update({p2: currentUser.username}); }
    else if (!room.p3) { playerPosition = 3; db.ref('relay/' + relayCode).update({p3: currentUser.username}); }
    else if (!room.p4) { playerPosition = 4; db.ref('relay/' + relayCode).update({p4: currentUser.username}); }
    else { alert('Room full hai!'); return; }

    showScreen('waitingScreen');
    document.getElementById('displayRelayCode').textContent = relayCode;
    listenRelayRoom();
  });
}

function listenRelayRoom() {
  db.ref('relay/' + relayCode).on('value', function(snapshot) {
    var room = snapshot.val();
    if (!room) return;

    if (room.p1) document.getElementById('p1NameWait').textContent = room.p1 + ' ✅';
    if (room.p2) document.getElementById('p2NameWait').textContent = room.p2 + ' ✅';
    if (room.p3) document.getElementById('p3NameWait').textContent = room.p3 + ' ✅';
    if (room.p4) document.getElementById('p4NameWait').textContent = room.p4 + ' ✅';

    if (room.p1 && room.p2 && room.p3 && room.p4 && room.status === 'waiting') {
      document.getElementById('waitingMsg').innerHTML = '🎮 All players joined! Starting game...';
      startGame();
    }

    if (room.status === 'playing') updateGameUI(room);
    if (room.status === 'finished') showResult(room);
  });
}

function startGame() {
  var fallbackQuestions = [
    {question: "Photosynthesis mein konsa gas release hota hai?", options: ["Oxygen", "CO2", "Nitrogen", "Hydrogen"], correct: 0},
    {question: "India ki rajdhani kya hai?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], correct: 1},
    {question: "2 + 2 × 2 = ?", options: ["6", "8", "4", "10"], correct: 0},
    {question: "Largest planet in solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correct: 2}
  ];
  db.ref('relay/' + relayCode).update({ questions: fallbackQuestions, status: 'playing' });
}

function updateGameUI(room) {
  if (room.currentPlayer !== playerPosition) {
    document.getElementById('currentPlayerTurn').innerHTML = 'Wait for your turn...';
    return;
  }
  if (!room.questions) return;
  if (questions.length === 0) questions = room.questions;

  var q = questions[room.currentQuestion];
  if (q) {
    document.getElementById('questionTextRelay').textContent = q.question;
    document.getElementById('qNum').textContent = (room.currentQuestion + 1);
    var opts = document.querySelectorAll('.option-btn-relay');
    for (var i = 0; i < opts.length; i++) {
      opts[i].textContent = q.options[i];
      opts[i].disabled = false;
      opts[i].onclick = (function(idx) { return function() { submitAnswer(idx); }; })(i);
    }
    startTimer();
  }
  document.getElementById('p1ScoreRelay').textContent = room.p1Score || 0;
  document.getElementById('p2ScoreRelay').textContent = room.p2Score || 0;
  document.getElementById('p3ScoreRelay').textContent = room.p3Score || 0;
  document.getElementById('p4ScoreRelay').textContent = room.p4Score || 0;
}

function startTimer() {
  timeLeft = 30;
  var timerText = document.getElementById('timerTextRelay');
  if (timerText) timerText.textContent = timeLeft;
  if (timer) clearInterval(timer);
  timer = setInterval(function() {
    timeLeft--;
    if (timerText) timerText.textContent = timeLeft;
    if (timeLeft <= 0) { clearInterval(timer); if (!answered) timeUp(); }
  }, 1000);
}

function timeUp() { if (answered) return; answered = true; moveToNextPlayer(); }

function submitAnswer(selectedIndex) {
  if (answered) return;
  answered = true;
  clearInterval(timer);
  db.ref('relay/' + relayCode).once('value').then(function(snapshot) {
    var room = snapshot.val();
    var q = room.questions[room.currentQuestion];
    var isCorrect = (selectedIndex === q.correct);
    var scoreToAdd = isCorrect ? 10 : 0;
    var updateData = {};
    updateData['p' + playerPosition + 'Score'] = (room['p' + playerPosition + 'Score'] || 0) + scoreToAdd;
    db.ref('relay/' + relayCode).update(updateData).then(function() { moveToNextPlayer(); });
  });
}

function moveToNextPlayer() {
  db.ref('relay/' + relayCode).once('value').then(function(snapshot) {
    var room = snapshot.val();
    var nextPlayer = room.currentPlayer + 1;
    var nextQuestion = room.currentQuestion + 1;
    if (nextPlayer > 4) { db.ref('relay/' + relayCode).update({ status: 'finished' }); }
    else { db.ref('relay/' + relayCode).update({ currentPlayer: nextPlayer, currentQuestion: nextQuestion }); }
    answered = false;
  });
}

function showResult(room) {
  showScreen('resultScreenRelay');
  document.getElementById('finalP1NameRelay').textContent = room.p1 || 'P1';
  document.getElementById('finalP2NameRelay').textContent = room.p2 || 'P2';
  document.getElementById('finalP3NameRelay').textContent = room.p3 || 'P3';
  document.getElementById('finalP4NameRelay').textContent = room.p4 || 'P4';
  document.getElementById('finalP1ScoreRelay').textContent = room.p1Score || 0;
  document.getElementById('finalP2ScoreRelay').textContent = room.p2Score || 0;
  document.getElementById('finalP3ScoreRelay').textContent = room.p3Score || 0;
  document.getElementById('finalP4ScoreRelay').textContent = room.p4Score || 0;
  var scores = [room.p1Score||0, room.p2Score||0, room.p3Score||0, room.p4Score||0];
  var maxScore = Math.max(...scores);
  var winnerIndex = scores.indexOf(maxScore);
  var winnerName = room['p' + (winnerIndex + 1)];
  document.getElementById('resultTitleRelay').textContent = '🏆 ' + winnerName + ' Jeet Gaye!';
}

function cancelRelay() { if (relayCode) { db.ref('relay/' + relayCode).remove(); } window.location.reload(); }
function copyRelayCode() { var code = document.getElementById('displayRelayCode').textContent; navigator.clipboard.writeText(code); alert('Code copied: ' + code); }
function showScreen(screenId) {
  var screens = ['lobbyScreen', 'waitingScreen', 'relayGameScreen', 'resultScreenRelay'];
  for (var i = 0; i < screens.length; i++) { var s = document.getElementById(screens[i]); if (s) s.classList.add('hidden'); }
  document.getElementById(screenId).classList.remove('hidden');
}