// ============================================
// Paste the config object Firebase gave you here.
// (Project settings → Your apps → the </> web icon)
// It looks like this — replace every value below
// with your own project's real values:
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBHXHADlzTxN5X_t5g_w-Xb32eGLx5IGWM",
  // ---------------------------------------------------------------
  // authDomain MUST match the domain this app is served from, or
  // signInWithRedirect() will never complete (the result comes back
  // through a cross-origin iframe that modern browsers block).
  //
  //   Firebase Hosting + custom domain -> set this to that domain,
  //     e.g. "disciplant.app"  (no https://, no trailing slash)
  //   Vercel / Netlify / Cloudflare   -> set this to your domain AND
  //     proxy /__/auth/* + /__/firebase/* to disciplant-e3bb7.firebaseapp.com
  //   GitHub Pages / plain localhost  -> leave as-is; redirect can never
  //     work there, so the app falls back to popup-only sign-in.
  //
  // Whatever you set here also needs to be listed under
  // Firebase Console -> Authentication -> Settings -> Authorized domains,
  // and under the OAuth client in Google Cloud Console as both an
  // authorized JavaScript origin and a redirect URI ending in
  // /__/auth/handler
  // ---------------------------------------------------------------
  authDomain: "disciplant.vercel.app",
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