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


// ============================================
// App Check — proves requests really come from this app
//
// From here on, every Firestore and Auth request carries a
// short-lived App Check token, issued only after reCAPTCHA Enterprise
// has scored the session as a real browser on a registered domain.
// Someone who copies the config object above into a Node script
// cannot obtain one, so their requests are rejected before the
// security rules are even consulted. That is the point: the rules can
// only limit an authenticated uid, and creating fresh anonymous uids
// was free until now.
//
// ORDER MATTERS. This must run after initializeApp() and before
// firestore()/auth() are called at the bottom of this file, or the
// first requests of the page go out unattested.
//
// NOTHING IS REJECTED UNTIL YOU SAY SO IN THE CONSOLE.
// This file only makes the app SEND tokens. Requests without one keep
// working until Firebase Console -> Security -> App Check -> APIs
// flips a product from Monitor to Enforce. Leave Firestore AND
// Authentication on Monitor for a few days first, check the
// verified/unverified split, then enforce Firestore, confirm the
// garden still saves, and only then enforce Authentication.
// ============================================

// Public by design — it ships in the page either way, exactly like the
// apiKey above. The separate reCAPTCHA "secret key" is only for
// backends that verify tokens themselves; App Check does that inside
// Google's infrastructure, so it is never needed here and must never
// be committed to this repo.
const APPCHECK_SITE_KEY = '6LfRnXwtAAAAAM1n1kB22kAXn8yGixz8rDGyxZ4U';

// ---- Local development ----
// A page served from localhost is not on the reCAPTCHA key's domain
// list, so it can never be attested. Firebase's answer is a debug
// token: with the flag below set, the SDK prints one to the console on
// first run, and you register it under App Check -> Apps -> (this app)
// -> Manage debug tokens. That token then stands in for attestation on
// this machine only.
//
// The hostname gate is load-bearing. A debug token reaching
// disciplant.vercel.app would hand anyone a way to skip attestation
// entirely, which is the whole thing being bought here. It is an
// exact-match list rather than a substring test on purpose — a
// hostile domain like "localhost.example.com" must not switch it on.
//
// Note this also means Vercel PREVIEW deployments (the per-push
// disciplant-xxxxx.vercel.app URLs) will fail App Check once
// enforcement is on, since they are neither localhost nor on the key's
// domain list. Test on production, or add the preview domain to the
// reCAPTCHA key.
const APPCHECK_LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', ''];

if (APPCHECK_LOCAL_HOSTS.indexOf(location.hostname) !== -1) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  console.warn(
    'DISCIPLANT: App Check debug mode (local hosts only). Copy the debug ' +
    'token logged below into Firebase Console -> Security -> App Check -> ' +
    'Apps -> Manage debug tokens. Do not commit or share it.'
  );
}

firebase.appCheck().activate(
  new firebase.appCheck.ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY),
  true   // keep refreshing the token for the life of the page
);


const db = firebase.firestore();
const auth = firebase.auth();