// ===== LEADERBOARD JS — FIREBASE =====

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7RwL8kwQ91P1vcPhXnxFNFIDQsWdUfhE",
  authDomain: "ad-hoc-d078c.firebaseapp.com",
  databaseURL: "https://ad-hoc-d078c-default-rtdb.firebaseio.com",
  projectId: "ad-hoc-d078c",
  storageBucket: "ad-hoc-d078c.firebasestorage.app",
  messagingSenderId: "485452494263",
  appId: "1:485452494263:web:edacb32bc6f1ed597a6432"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const leaderboardList = document.getElementById('leaderboardList');
const emptyMsg = document.getElementById('emptyMsg');
const clearBtn = document.getElementById('clearBtn');
const name1 = document.getElementById('name1');
const name2 = document.getElementById('name2');
const name3 = document.getElementById('name3');
const score1 = document.getElementById('score1');
const score2 = document.getElementById('score2');
const score3 = document.getElementById('score3');

window.onload = async function () {

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../login/login.html';
    return;
  }

  const savedTheme = localStorage.getItem('quizTheme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
  }

  leaderboardList.innerHTML = '<div style="text-align:center;padding:20px;color:#a0a0b0;">Loading...</div>';

  try {
    const leaderRef = query(
      ref(db, 'leaderboard'),
      orderByChild('score'),
      limitToLast(50)
    );

    const snapshot = await get(leaderRef);
    const data = [];

    if (snapshot.exists()) {
      snapshot.forEach(function(child) {
        data.push(child.val());
      });
      data.sort(function(a, b) { return b.score - a.score; });
    }

    if (data.length === 0) {
      emptyMsg.style.display = 'block';
      document.getElementById('top3Section').style.display = 'none';
      leaderboardList.innerHTML = '';
      return;
    }

    // Top 3
    if (data[0]) { name1.textContent = data[0].username; score1.textContent = data[0].score; }
    if (data[1]) { name2.textContent = data[1].username; score2.textContent = data[1].score; }
    else { document.getElementById('second').style.opacity = '0.3'; }
    if (data[2]) { name3.textContent = data[2].username; score3.textContent = data[2].score; }
    else { document.getElementById('third').style.opacity = '0.3'; }

    // Full list
    leaderboardList.innerHTML = '';
    data.forEach(function(item, index) {
      const div = document.createElement('div');
      div.className = 'list-item';

      if (currentUser && item.username === currentUser.username) {
        div.classList.add('current-user');
      }

      let rankText = '#' + (index + 1);
      if (index === 0) rankText = '🥇';
      if (index === 1) rankText = '🥈';
      if (index === 2) rankText = '🥉';

      div.innerHTML =
        '<div class="rank">' + rankText + '</div>' +
        '<div class="user-info">' +
          '<div class="uname">' + item.username + '</div>' +
          '<div class="udate">' + (item.date || '') + '</div>' +
        '</div>' +
        '<div class="cat-tag">' + (item.category || 'general') + '</div>' +
        '<div class="user-score">' +
          '<div class="uscore">' + item.score + '</div>' +
          '<div class="upercent">' + item.percentage + '%</div>' +
        '</div>';

      leaderboardList.appendChild(div);
    });

  } catch(err) {
    leaderboardList.innerHTML = '<div style="text-align:center;padding:20px;color:#ff6b6b;">Error: ' + err.message + '</div>';
  }

};

clearBtn.addEventListener('click', function () {
  alert('Firebase Console se clear karo!');
});// ========== ADD CACHING ==========
var leaderboardCache = null;
var cacheTime = null;

function getCachedLeaderboard() {
    if (leaderboardCache && cacheTime && (Date.now() - cacheTime < 60000)) {
        return leaderboardCache;
    }
    return null;
}

function setCachedLeaderboard(data) {
    leaderboardCache = data;
    cacheTime = Date.now();
}

// ========== ADD SKELETON ==========
function showSkeleton() {
    var container = document.getElementById('leaderboardList');
    if (container) {
        container.innerHTML = '<div class="skeleton skeleton-row"></div>'.repeat(5);
    }
}

// In your loadLeaderboard function
function loadLeaderboard() {
    showSkeleton();
    
    var cached = getCachedLeaderboard();
    if (cached) {
        displayLeaderboard(cached);
        return;
    }
    
    // Your existing Firebase query
    db.ref('leaderboard').orderByChild('score').limitToLast(10).once('value', function(snapshot) {
        var data = snapshot.val();
        setCachedLeaderboard(data);
        displayLeaderboard(data);
    });
}