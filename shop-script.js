// ========== WINSH SYSTEM – CLEANED CODE ==========
var currentUser = null;
var userWinsh = 0;
var userStyles = { borders: [], badges: [], themes: [], titles: [] };
var equipped = { border: null, badge: null, theme: null, title: null };

// ✅ SPACES REMOVED FROM IDS AND VALUES
var shopItems = {
    borders: [
        { id: "green-neon", name: "Green Neon", cost: 200, color: "#00ff88", icon: "⚡" },
        { id: "fire", name: "Fire Border", cost: 500, color: "#ff4400", icon: "🔥" },
        { id: "gold", name: "Gold Border", cost: 1000, color: "#ffd700", icon: "👑" }
    ],
    badges: [
        { id: "rookie", name: "Rookie", cost: 100, color: "#66cc66", icon: "🌱" },
        { id: "pro", name: "Pro", cost: 500, color: "#3399ff", icon: "⭐" },
        { id: "master", name: "Master", cost: 1500, color: "#9900cc", icon: "🎓" }
    ],
    themes: [
        { id: "ocean", name: "Ocean", cost: 300, gradient: "#0066ff, #003366", icon: "🌊" },
        { id: "sunset", name: "Sunset", cost: 600, gradient: "#ff6600, #ff0066", icon: "🌅" },
        { id: "midnight", name: "Midnight", cost: 1500, gradient: "#1a1a2e, #16213e", icon: "🌙" }
    ],
    titles: [
        { id: "king", name: "Quiz King", cost: 1000, prefix: "👑", icon: "👑" },
        { id: "beast", name: "Beast", cost: 2000, prefix: "🔥", icon: "🔥" }
    ]
};

window.onload = function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = '../login/login.html';
        return;
    }
    currentUser = user;
    
    var db = firebase.database();
    db.ref('users/' + currentUser.uid).once('value', function(snap) {
        var data = snap.val() || {};
        userWinsh = data.winsh || 100;
        userStyles = data.styles || { borders: [], badges: [], themes: [], titles: [] };
        equipped = data.equipped || { border: null, badge: null, theme: null, title: null };
        
        updateWinshDisplay();
        loadShop();
    });

    // Tab switching logic
    var tabs = document.querySelectorAll('.tab-btn');    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            var allTabs = document.querySelectorAll('.tab-btn');
            for (var j = 0; j < allTabs.length; j++) {
                allTabs[j].classList.remove('active');
            }
            this.classList.add('active');
            loadShop();
        });
    }
};

function updateWinshDisplay() {
    var el = document.getElementById('headerWinsh');
    if (el) el.textContent = userWinsh;
}

function loadShop() {
    var grid = document.getElementById('itemsGrid');
    if (!grid) return;
    
    var activeTab = document.querySelector('.tab-btn.active');
    var category = activeTab ? activeTab.getAttribute('data-cat') : 'borders';
    var items = shopItems[category] || [];
    
    grid.innerHTML = '';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var owned = userStyles[category] && userStyles[category].indexOf(item.id) !== -1;
        
        var div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">💎 ${item.cost}</div>
            ${!owned 
                ? `<button class="buy-btn" onclick="purchaseItem('${category}','${item.id}')">Buy</button>` 
                : `<button class="equip-btn" onclick="equipItem('${category}','${item.id}')">Equip</button>`
            }
        `;
        grid.appendChild(div);
    }
}

function purchaseItem(category, itemId) {
    var items = shopItems[category];
    var item = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i].id === itemId) { item = items[i]; break; }    }
    if (!item) return;

    if (userWinsh >= item.cost) {
        userWinsh -= item.cost;
        if (!userStyles[category]) userStyles[category] = [];
        if (userStyles[category].indexOf(itemId) === -1) {
            userStyles[category].push(itemId);
        }
        
        firebase.database().ref('users/' + currentUser.uid).update({
            winsh: userWinsh,
            styles: userStyles
        }).then(function() {
            updateWinshDisplay();
            loadShop();
            alert('🎉 ' + item.name + ' purchased! Remaining Winsh: ' + userWinsh);
        }).catch(function(err) {
            alert('Error: ' + err.message);
        });
    } else {
        alert('❌ Need ' + (item.cost - userWinsh) + ' more Winsh!');
    }
}

function equipItem(category, itemId) {
    if (userStyles[category] && userStyles[category].includes(itemId)) {
        equipped[category] = itemId;
        
        firebase.database().ref('users/' + currentUser.uid + '/equipped').set(equipped)
        .then(function() {
            alert('✅ ' + itemId + ' equipped! Go to Profile to see.');
        })
        .catch(function(err) {
            alert('Error: ' + err.message);
        });
    } else {
        alert('❌ You don\'t own this style!');
    }
}

function earnWinsh(amount, reason) {
    userWinsh += amount;
    updateWinshDisplay();
    firebase.database().ref('users/' + currentUser.uid + '/winsh').set(userWinsh);
    alert('💎 +' + amount + ' Winsh! ' + reason);
}

// Helper for multiplayer
window.getUserEquipped = function(username) {    return firebase.database().ref('users/' + username + '/equipped').once('value')
    .then(snap => snap.val() || {});
};