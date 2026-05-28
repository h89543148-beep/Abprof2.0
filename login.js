// ========== LOGIN - FIREBASE AUTH ==========

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('errorMsg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('⚠️ Email aur password dono bharo!');
            return;
        }

        // Loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            // Sign in with Firebase Auth
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // Get user data from database
            const snapshot = await firebase.database().ref('users/' + uid).once('value');
            const userData = snapshot.val();

            if (!userData) {
                throw new Error('User data not found!');
            }

            // Save to localStorage
            const currentUser = {
                uid: uid,
                username: userData.username,
                email: email,
                winsh: userData.winsh || 100,
                styles: userData.styles || { borders: [], badges: [], themes: [], titles: [] },
                equipped: userData.equipped || { border: null, badge: null, theme: null, title: null }
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            console.log('✅ Login Success!', currentUser.username);
            console.log('UID:', uid);
            console.log('Winsh:', currentUser.winsh);

            // Redirect to home
            window.location.href = '../Index.html';

        } catch (error) {
            console.error('Login error:', error);

            if (error.code === 'auth/user-not-found') {
                showError('❌ Email not registered!');
            } else if (error.code === 'auth/wrong-password') {
                showError('❌ Wrong password!');
            } else if (error.code === 'auth/invalid-email') {
                showError('❌ Invalid email!');
            } else {
                showError('❌ ' + error.message);
            }

            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 3000);
    }
});