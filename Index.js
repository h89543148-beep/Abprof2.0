window.onload = function() {
  var currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'login/login.html';
    return;
  }

  // User name dikhao
  document.getElementById('userName').textContent = currentUser.username;
  document.getElementById('welcomeName').textContent = currentUser.username;

  // Theme load
  var savedTheme = localStorage.getItem('quizTheme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeBtn').textContent = '☀️';
  }

  // Stats load from Firebase
  var db = firebase.database();
  db.ref('stats/' + currentUser.username).once('value').then(function(snapshot) {
    if (snapshot.exists()) {
      var stats = snapshot.val();
      document.getElementById('totalQuiz').textContent = stats.totalQuiz || 0;
      document.getElementById('bestScore').textContent = (stats.bestScore || 0) + '%';
      document.getElementById('totalPoints').textContent = stats.totalPoints || 0;
    }
  });

  // Leaderboard load from Firebase
  db.ref('leaderboard').orderByChild('score').limitToLast(5).once('value').then(function(snapshot) {
    var tbody = document.getElementById('leaderboardBody');
    if (!snapshot.exists()) {
      tbody.innerHTML = '<tr><td colspan="4" class="leaderboard-empty">Abhi koi data nahi — quiz khelo!</td></tr>';
      return;
    }

    var data = [];
    snapshot.forEach(function(child) {
      data.push(child.val());
    });
    data.sort(function(a, b) { return b.score - a.score; });

    tbody.innerHTML = '';
    data.slice(0, 5).forEach(function(item, index) {
      var tr = document.createElement('tr');
      if (item.username === currentUser.username) {
        tr.className = 'current-user-row';
      }
      var rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index+1);
      tr.innerHTML = '<td>' + rank + '</td><td>' + item.username + '</td><td>' + item.score + '</td><td>' + item.percentage + '%</td>';
      tbody.appendChild(tr);
    });
  });

  // Category buttons
  document.getElementById('cat-general').onclick = function() {
    localStorage.setItem('quizCategory', 'general');
    window.location.href = 'quiz/quiz.html';
  };
  document.getElementById('cat-science').onclick = function() {
    localStorage.setItem('quizCategory', 'science');
    window.location.href = 'quiz/quiz.html';
  };
  document.getElementById('cat-math').onclick = function() {
    localStorage.setItem('quizCategory', 'math');
    window.location.href = 'quiz/quiz.html';
  };
  document.getElementById('cat-custom').onclick = function() {
    localStorage.setItem('quizCategory', 'custom');
    window.location.href = 'quiz/quiz.html';
  };
  document.getElementById('cat-multiplayer').onclick = function() {
    window.location.href = 'quiz/multiplayer.html';
  };

  // Leaderboard toggle
  document.getElementById('leaderboardHeader').onclick = function() {
    document.getElementById('leaderboardSection').classList.toggle('collapsed');
  };

  // View all button
  document.getElementById('viewAllBtn').onclick = function() {
    window.location.href = 'leaderboard/leaderboard.html';
  };

  // Theme toggle
  document.getElementById('themeBtn').onclick = function() {
    document.body.classList.toggle('light');
    var isLight = document.body.classList.contains('light');
    document.getElementById('themeBtn').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('quizTheme', isLight ? 'light' : 'dark');
  };

  // Logout
  document.getElementById('logoutBtn').onclick = function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login/login.html';
  };
};
function loadUserTheme() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;
  firebase.database().ref('users/' + user.username + '/equipped').once('value', snap => {
    const style = snap.val() || {};
    if (style.theme) {
      const themes = { ocean: '#0066ff', sunset: '#ff6600', midnight: '#1a1a2e' };
      document.body.style.background = `linear-gradient(135deg, ${themes[style.theme] || '#1a1a2e'}, #0a0a1a)`;
    }
    if (style.border) {
      const colors = { 'green-neon':'#00ff88', 'fire':'#ff4400', 'gold':'#ffd700' };
      document.querySelector('.profile-card').style.border = `3px solid ${colors[style.border] || '#e94560'}`;
    }
  });
}