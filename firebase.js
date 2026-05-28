// firebase.js - CLEAN VERSION
const firebaseConfig = {
  apiKey: "AIzaSyD7RwL8kwQ91P1vcPhXnxFNFIDQsWdUfhE",
  authDomain: "ad-hoc-d078c.firebaseapp.com",
  databaseURL: "https://ad-hoc-d078c-default-rtdb.firebaseio.com",
  projectId: "ad-hoc-d078c",
  storageBucket: "ad-hoc-d078c.firebasestorage.app",
  messagingSenderId: "485452494263",
  appId: "1:485452494263:web:edacb32bc6f1ed597a6432"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

console.log("✅ Firebase ready");