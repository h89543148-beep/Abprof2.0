// ========== SIGNUP - FIREBASE AUTH ==========

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const signupBtn = document.getElementById('signupBtn');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const errorMsg = document.getElementById('errorMsg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        // Validations
        if (!username || !email || !password) {
            showError('⚠️ Sab fields bharo!');
            return;
        }

        if (username.length < 3) {
            showError('❌ Username kam se kam 3 character ka ho!');
            return;
        }

        if (password.length < 6) {
            showError('❌ Password kam se kam 6 character ka ho!');
            return;
        }

        if (password !== confirm) {
            showError('❌ Password match nahi ho raha!');
            return;
        }

        // Loading state
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account...';

        try {
            // Check if username already exists
            const usernameCheck = await firebase.database().ref('usernames/' + username).once('value');
            if (usernameCheck.exists()) {
                throw new Error('Username already taken!');
            }

            // Create user in Firebase Auth
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // Save user data in database
            const userData = {
                username: username,
                email: email,
                winsh: 100,
                styles: {
                    borders: [],
                    badges: [],
                    themes: [],
                    titles: []
                },
                equipped: {
                    border: null,
                    badge: null,
                    theme: null,
                    title: null
                },
                createdAt: new Date().toISOString()
            };

            await firebase.database().ref('users/' + uid).set(userData);
            await firebase.database().ref('usernames/' + username).set(uid);

            // Save to localStorage
            const currentUser = {
                uid: uid,
                username: username,
                email: email,
                winsh: 100,
                styles: userData.styles,
                equipped: userData.equipped
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            console.log('✅ Account created! UID:', uid);
            alert('🎉 Welcome ' + username + '!');

            // Redirect to home
            window.location.href = '../Index.html';

        } catch (error) {
            console.error('Signup error:', error);

            if (error.code === 'auth/email-already-in-use') {
                showError('❌ Email already registered!');
            } else if (error.code === 'auth/invalid-email') {
                showError('❌ Invalid email address!');
            } else if (error.code === 'auth/weak-password') {
                showError('❌ Password too weak!');
            } else {
                showError('❌ ' + error.message);
            }

            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        }
    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 4000);
    }
});