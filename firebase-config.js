// ============================================
// Paste the config object Firebase gave you here.
// (Project settings → Your apps → the </> web icon)
// It looks like this — replace every value below
// with your own project's real values:
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBHXHADlzTxN5X_t5g_w-Xb32eGLx5IGWM",
  authDomain: "disciplant-e3bb7.firebaseapp.com",
  projectId: "disciplant-e3bb7",
  storageBucket: "disciplant-e3bb7.firebasestorage.app",
  messagingSenderId: "239835244723",
  appId: "1:239835244723:web:7d156b1770fab7913828c6",
  measurementId: "G-Q64R6MP546"
};

// This connects your app to that Firebase project.
// Don't worry — these values aren't secret in the way a
// password is; Firebase's real security comes from the
// rules you set in the Firestore console, not from hiding this file.
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
