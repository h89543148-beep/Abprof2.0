window.onload = function() {
  var currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../login/login.html';
    return;
  }

  var db = firebase.database();
  
  // Display username
  document.getElementById('profileName').textContent = currentUser.username;

  // Load Winsh balance
  db.ref('users/' + currentUser.username + '/winsh').once('value').then(function(snapshot) {
    var winsh = snapshot.exists() ? snapshot.val() : 0;
    document.getElementById('winshCount').textContent = winsh;
  });

  // Load equipped items
  db.ref('users/' + currentUser.username + '/equipped').once('value').then(function(snapshot) {
    if (snapshot.exists()) {
      var equipped = snapshot.val();
      
      // Border
      if (equipped.border) {
        document.getElementById('borderText').textContent = 'Border: ' + equipped.border;
      }
      
      // Badge
      if (equipped.badge) {
        document.getElementById('badgeText').textContent = 'Badge: ' + equipped.badge;
      }
      
      // Theme
      if (equipped.theme) {
        document.getElementById('themeText').textContent = 'Theme: ' + equipped.theme;
      }
      
      // Title
      if (equipped.title) {
        document.getElementById('titleText').textContent = 'Title: ' + equipped.title;
      }
    }
  });

  // Back button
  document.getElementById('backBtn').onclick = function() {
    window.location.href = '../Index.html';
  };

  // Shop button
  document.getElementById('shopBtn').onclick = function() {
    window.location.href = '../winsh-shop/shop.html';
  };
};