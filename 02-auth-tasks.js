// ============================================
// 02: AUTH + TASKS - Firebase auth, sign-in/out, task add/toggle/remove, task list rendering
// Part of DISCIPLANT - split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 4 files.
// ============================================

// ============================================
// Auth architecture
//
// Google Sign-In is the primary account provider, but nobody is ever
// forced through a login screen: on first visit the app immediately
// signs the visitor in ANONYMOUSLY so they can start planting right
// away. That anonymous account can later be upgraded to a Google
// account (via linkWithPopup) without losing any of the guest's
// existing garden data - the anonymous uid keeps its Firestore
// documents, only the auth PROVIDER changes.
//
// currentUserProfile (see state block above) tracks the signed-in
// identity shown in the auth widget and the Stats page profile
// header. It's kept separate from `tasks`/garden data.
// ============================================

var googleProvider = new firebase.auth.GoogleAuthProvider();

// ---- Step 1: sign the visitor in anonymously (fallback identity) ----
// Only signs in as a guest if there's truly no session yet - this is
// checked inside the onIdTokenChanged observer below (`if (!user)`)
// rather than fired unconditionally here, so it never races with a
// Google redirect sign-in/link that's still being processed after
// coming back from the redirect flow (see signInWithGoogle()).

// ---- Where can redirect sign-in actually work? ----
// signInWithRedirect() only completes when the Firebase auth handler is
// served from the SAME ORIGIN as this app. If authDomain points at
// <project>.firebaseapp.com while the app is served from localhost or a
// custom domain, the sign-in result comes back through a cross-origin
// iframe that Chrome 115+, Safari 16.1+ and Firefox 109+ all block, and
// getRedirectResult() resolves with null forever.
// See: https://firebase.google.com/docs/auth/web/redirect-best-practices
var AUTH_DOMAIN        = (firebase.app().options.authDomain || '').toLowerCase();
var APP_HOST           = location.hostname.toLowerCase();
var REDIRECT_IS_USABLE = AUTH_DOMAIN === APP_HOST;

if (!REDIRECT_IS_USABLE) {
  console.warn(
    'DISCIPLANT: authDomain (' + AUTH_DOMAIN + ') does not match this app\'s host (' +
    APP_HOST + '). Redirect sign-in CANNOT complete here - popup only. ' +
    'Fix by pointing authDomain at this domain and serving /__/auth/* from it.'
  );
}

// ---- Catch the result of a redirect-based sign-in / link ----
// We record a flag in sessionStorage before navigating away, so that on
// the way back we can tell the difference between "no redirect was ever
// in progress" (normal page load - stay quiet) and "a redirect WAS in
// progress and came back empty" (the storage-partitioning failure -
// surface a real error instead of failing silently).
var redirectWasPending = false;
try {
  redirectWasPending = sessionStorage.getItem('disciplant:redirectPending') === '1';
  sessionStorage.removeItem('disciplant:redirectPending');
} catch (e) { /* sessionStorage unavailable (private mode) - ignore */ }

auth.getRedirectResult().then(function (result) {
  if (result && result.user) {
    console.log('DISCIPLANT: redirect sign-in succeeded, uid =', result.user.uid);
    authActionPending = false;
    refreshIdentityUI(result.user);
    closeAuthModal();
    return;
  }
  if (redirectWasPending) {
    authActionPending = false;
    authActionError = 'Sign-in could not be completed. Please try again.';
    console.error(
      'DISCIPLANT: redirect result was lost. authDomain=' + AUTH_DOMAIN +
      ' host=' + APP_HOST + ' - these must match for redirect sign-in to work.'
    );
    renderAuthModal();
  }
}).catch(function (error) {
  authActionPending = false;
  var code = error && error.code;
  if (code === 'auth/credential-already-in-use') {
    // The guest account can't take this Google credential because another
    // account already owns it. Do NOT auto-fire another redirect here -
    // that runs with no user gesture and can loop. Ask the user instead.
    authActionError = 'That Google account is already in use. Tap Sign in with Google again to switch to it.';
  } else if (code && code !== 'auth/no-auth-event') {
    authActionError = 'Sign-in failed. Please try again.';
    console.error('DISCIPLANT: redirect sign-in failed:', error);
  }
  renderAuthModal();
});

// ---- User profile doc (users/{uid}) - separate from garden data ----
// Holds just identity info (display name, email, avatar, provider),
// kept in sync with Firebase Auth on every sign-in. Garden data
// itself stays in the existing gardens/{uid} collection untouched.
var lastProfileSignature = null;

function ensureUserProfileDoc(user) {
  if (!user) return;

  // The auth observer fires on every ID-token refresh (roughly hourly),
  // not just on real identity changes. Only write when something the
  // user would actually see has changed.
  var signature = [
    user.uid,
    user.isAnonymous,
    readUserField(user, 'displayName'),
    readUserField(user, 'email'),
    readUserField(user, 'photoURL'),
  ].join('|');
  if (signature === lastProfileSignature) return;
  lastProfileSignature = signature;

  var profileData = {
    uid:         user.uid,
    isAnonymous: user.isAnonymous,
    displayName: readUserField(user, 'displayName'),
    email:       readUserField(user, 'email'),
    photoURL:    readUserField(user, 'photoURL'),
    updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
  };

  // Every owner write to users/{uid} has to advance the rl* counter or
  // the rule rejects it. This one fires roughly once per account
  // thanks to the signature guard above, so it barely touches the
  // budget — but it is still a write, and the rule makes no
  // exceptions.
  //
  // Note this deliberately does NOT pass the friend-request flag: the
  // fr* fields must stay untouched here, or an ordinary profile save
  // would be charged against the social budget (see frUntouched() in
  // firestore.rules).
  withUserRlFields(profileData, false);

  db.collection('users').doc(user.uid).set(profileData, { merge: true })
    .catch(function (error) {
      if (error && error.code === 'permission-denied') {
        // Clear the signature so this is attempted again on the next
        // ID-token refresh. Without that, the guard above would treat
        // the change as already saved and the update would be lost.
        //
        // This path is realistic on a page load that happens within
        // one window of a previous profile write: the users listener
        // in 06 has not attached yet, so this write has no idea a
        // window is already open and asks to start a fresh one, which
        // the rule refuses.
        lastProfileSignature = null;
        console.error(
          'DISCIPLANT: profile write denied. Either firestore.rules is not ' +
          'published yet, or this account has hit the per-window write limit ' +
          'on its user document. It will be retried automatically.'
        );
        return;
      }
      console.error('DISCIPLANT: could not save profile doc:', error);
    });
}

// Reads a field off the Firebase user, falling back to its linked
// provider's own copy of that field. Needed because linkWithPopup()
// doesn't always immediately copy the newly-linked provider's
// displayName/email/photoURL onto the top-level user object - the
// data IS there under providerData[0], just not yet mirrored up, so
// without this fallback the profile header can show blank fields
// right after linking until the next full page reload.
function readUserField(user, field) {
  if (user[field]) return user[field];
  var providerEntry = (user.providerData || []).find(function (p) { return p && p[field]; });
  return (providerEntry && providerEntry[field]) || null;
}

function applyUserToProfileState(user) {
  currentUserProfile = {
    uid:         user.uid,
    isAnonymous: user.isAnonymous,
    displayName: readUserField(user, 'displayName'),
    email:       readUserField(user, 'email'),
    photoURL:    readUserField(user, 'photoURL'),
  };
}

// ---- Repaint everything that displays WHO is signed in ----
// Called from two places, and it needs to be safe to call from both:
//
//   1. the auth observer below (covers page load, sign-out, and
//      switching accounts), and
//   2. directly in signInWithGoogle()'s success handler, so the widget
//      updates the instant the popup closes instead of waiting on an
//      observer round-trip.
//
// This is deliberately idempotent - running it twice in a row costs
// nothing and paints the same result, which is what lets both callers
// fire without coordinating.
function refreshIdentityUI(user) {
  if (!user) return;
  applyUserToProfileState(user);
  renderAuthWidget();
  renderAuthModal();
  ensureUserProfileDoc(user);
  if (currentPage === 'stats' && authReady) renderProfileHeader();
}

// ---- Sign in with Google (upgrades a guest, or signs a new user in) ----
// If the current session is anonymous, LINK the Google credential to it
// first so the guest's existing plants/streaks carry over. If that Google
// account is already used elsewhere (auth/credential-already-in-use), fall
// back to a plain sign-in, which switches to that account's own garden.
//
// POPUP IS ALWAYS TRIED FIRST, and it is called directly off the click with
// no intervening window.open() - the browser's user-activation token must
// still be live at the moment signInWithPopup()/linkWithPopup() runs, or the
// popup gets blocked. (An earlier version probed for popup support by
// opening and closing a test window; that spent the activation token and
// tripped popup blockers, i.e. it caused the very failure it tested for.)
//
// Redirect is used as a fallback ONLY when it can actually complete on this
// origin - see REDIRECT_IS_USABLE above. Otherwise we show a real error
// telling the user to allow pop-ups, rather than bouncing them through a
// redirect that will silently lose the result.
function signInWithGoogle() {
  authActionPending = true;
  authActionError   = null;
  renderAuthModal();

  var currentUser = auth.currentUser;
  var isAnon      = !!(currentUser && currentUser.isAnonymous);

  function startRedirectFlow() {
    try { sessionStorage.setItem('disciplant:redirectPending', '1'); } catch (e) {}
    return isAnon
      ? currentUser.linkWithRedirect(googleProvider)
      : auth.signInWithRedirect(googleProvider);
    // Page navigates away here - nothing after this runs.
  }

  function fail(message, error) {
    authActionPending = false;
    authActionError   = message;
    if (error) console.error('DISCIPLANT: Google sign-in failed:', error);
    renderAuthModal();
  }

  var attempt = isAnon
    ? currentUser.linkWithPopup(googleProvider)
    : auth.signInWithPopup(googleProvider);

  attempt
    .then(function (result) {
      // Repaint straight away from the credential we just got back,
      // rather than waiting for the observer. For the anonymous-link
      // case this is what makes the name and avatar appear the moment
      // the popup closes.
      authActionPending = false;
      refreshIdentityUI((result && result.user) || auth.currentUser);
      closeAuthModal();
    })
    .catch(function (error) {
      var code = error && error.code;

      if (code === 'auth/credential-already-in-use') {
        // That Google account already has its own saved garden - sign into
        // it directly instead of linking.
        //
        // NOT with a second popup. The click's user-activation token was
        // spent opening the FIRST popup, and this runs after that popup has
        // already resolved, so window.open() here has no gesture behind it
        // and every browser blocks it - auth/popup-blocked, every time, on
        // localhost as well as in production. (This was a real bug: the
        // popup-blocked handler further down would have recovered it, but
        // this inner catch swallowed the error into a generic failure
        // message before it could get there.)
        //
        // Redirect carries no activation requirement, so use it wherever it
        // can actually complete on this origin. Where it can't, ask for a
        // fresh click rather than firing a popup that is guaranteed to fail.
        //
        // Deliberately auth.signInWithRedirect and NOT startRedirectFlow():
        // that helper branches on isAnon and would call linkWithRedirect,
        // landing straight back on credential-already-in-use after the round
        // trip. The whole point here is to stop linking and switch accounts.
        if (REDIRECT_IS_USABLE) {
          try { sessionStorage.setItem('disciplant:redirectPending', '1'); } catch (e) {}
          return auth.signInWithRedirect(googleProvider);
          // Page navigates away here - nothing after this runs.
        }
        return fail(
          'That Google account already has its own garden. Tap Sign in with ' +
          'Google again to switch to it.',
          error
        );
      }

      if (code === 'auth/popup-blocked' ||
          code === 'auth/web-storage-unsupported' ||
          code === 'auth/operation-not-supported-in-this-environment') {
        if (REDIRECT_IS_USABLE) return startRedirectFlow();
        return fail(
          'Your browser blocked the sign-in window. Please allow pop-ups for this site and try again.',
          error
        );
      }

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User backed out on purpose - not an error worth showing.
        authActionPending = false;
        renderAuthModal();
        return;
      }

      fail('Sign-in failed. Please try again.', error);
    });
}

// ---- Sign out (drops back to a fresh anonymous guest session) ----
// ============================================
// Sign-out
//
// Signing out does NOT reload the page — it swaps the session for a
// fresh anonymous one in place. So anything held in memory or in
// localStorage survives unless it is cleared deliberately, and the
// next person at this browser inherits it.
//
// clearPerAccountState() runs FIRST, synchronously, before
// auth.signOut(). Doing it after would leave a window in which the
// old account's data is still on screen and still on disk, and a user
// who closes the tab during that window never gets it cleared at all.
//
// Everything here is state that BELONGS TO AN ACCOUNT. Deliberately
// left alone: 'disciplant:dailyGrowth' in 04, which is a display
// preference for this device and says nothing about who was signed
// in.
// ============================================
function clearPerAccountState() {
  // Rate-limit window bookkeeping — per document, so a value carried
  // into a new uid guarantees a rejected write on that account's first
  // save (see the notes on the counters above).
  resetGardenRateLimitWindow();
  resetUserRateLimitWindows();

  // Forces the next ensureUserProfileDoc() to write for the new
  // account rather than assuming the previous one's profile was saved.
  lastProfileSignature = null;

  // The friend-visible summary has to be republished by the new
  // account before it counts as written.
  gardenSummaryWritten = false;

  // Owned by 06 and 07. Guarded because those files load after this
  // one and a partial page could otherwise turn a sign-out into an
  // exception.
  if (typeof clearFriendsStateOnSignOut === 'function')     clearFriendsStateOnSignOut();
  if (typeof clearFriendGardenStateOnSignOut === 'function') clearFriendGardenStateOnSignOut();
}

function signOutUser() {
  clearPerAccountState();

  auth.signOut()
    .then(function () { return auth.signInAnonymously(); })
    .then(function () { closeAuthModal(); })
    .catch(function (error) {
      console.error('DISCIPLANT: sign-out failed:', error);
    });
}

// ---- Auth widget (persistent pill, top-right on every page) ----
function renderAuthWidget() {
  if (!authWidgetBtn) return;
  var profile = currentUserProfile;

  // Everyone wears the sprout now, signed in or not. The Google
  // account photo is deliberately not painted: a stranger's face in
  // the corner of a garden reads as a different app, and it was one
  // more third-party request on every page. profile.photoURL is still
  // read and stored on the user doc, it just no longer draws anything.
  // #authAvatarImg stays in the markup, permanently hidden, so
  // restoring the photo is one branch rather than new elements.
  authAvatarImg.classList.add('hidden');
  authAvatarFallback.classList.remove('hidden');
  authAvatarFallback.innerHTML = AVATAR_SPROUT_SVG;

  authWidgetLabel.textContent = profile.isAnonymous
    ? 'Guest'
    : (profile.displayName || profile.email || 'Signed in');
}

// ---- Auth modal (sign in / sign out) ----
function openAuthModal() {
  authActionError = null;
  if (authModalEl) authModalEl.classList.remove('hidden');
  renderAuthModal();
}
function closeAuthModal() {
  if (authModalEl) authModalEl.classList.add('hidden');
}

// The account picture, everywhere one is shown: the widget pill, the
// auth modal, the username modal in 06 and the profile header in 05.
// Self-contained circle - it carries its own disc, so it needs no
// border-radius, no clip path and no currentColor from its host.
// Drawn flat and id-free like the rest of the app's inline SVG, so
// several copies on one page cannot collide.
var AVATAR_SPROUT_SVG =
  '<svg class="avatar-sprout" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
  '<circle cx="32" cy="32" r="32" fill="#FAF0DC"/>' +
  '<path d="M0.06 34 C10 32.4 20 34.6 32 34 C44 33.4 54 31.6 63.94 34 A32 32 0 0 1 0.06 34 Z" fill="#F0DFC0"/>' +
  '<path d="M2.34 44 C11 42.2 17.5 44.4 24 44.6 C27.4 40.6 36.4 40.4 40 44.3 C47 44.6 54 42 61.66 44 A32 32 0 0 1 2.34 44 Z" fill="#8A6A4B"/>' +
  '<path d="M0.9 47.6 C12 45.4 22 49.4 32 48.4 C42 47.4 52.5 44.6 63.1 47.6 A32 32 0 0 1 0.9 47.6 Z" fill="#6B4F37"/>' +
  '<path d="M31.5 46.5 C31 39 33.2 33 32.9 22.6" stroke="#5C8149" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
  '<path d="M32.3 33.2 C27 35.4 18.2 33.6 14.6 26 C21.8 23.2 29.5 26 32.3 33.2 Z" fill="#7FA968"/>' +
  '<path d="M32.3 33.2 C27 35.4 18.2 33.6 14.6 26 C22 28.4 28.6 30.4 32.3 33.2 Z" fill="#6C9556"/>' +
  '<path d="M32.7 27.8 C38.2 29.4 47 26.2 50 18.4 C42.6 16.2 34.9 20.2 32.7 27.8 Z" fill="#93BC7A"/>' +
  '<path d="M32.7 27.8 C38.2 29.4 47 26.2 50 18.4 C42.7 21.2 36.2 24.4 32.7 27.8 Z" fill="#7FA968"/>' +
  '<path d="M17.6 51.4 C19.8 50.4 22.2 50.6 23.4 51.8 C21.4 52.7 19 52.6 17.6 51.4 Z" fill="#83644A"/>' +
  '<path d="M42.4 49.6 C44.2 48.8 46 49 47 50 C45.3 50.8 43.5 50.7 42.4 49.6 Z" fill="#83644A"/>' +
  '</svg>';

var GOOGLE_G_ICON_SVG =
  '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">' +
  '<path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.6-6.6C35.3 2.5 30 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.7 6C12.1 13 17.6 9.5 24 9.5z"/>' +
  '<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-17.4z"/>' +
  '<path fill="#FBBC05" d="M10.2 19.2a14.5 14.5 0 0 0 0 9.6l-7.7 6a24 24 0 0 1 0-21.6l7.7 6z"/>' +
  '<path fill="#34A853" d="M24 48c6 0 11.3-2 15.1-5.4l-7.4-5.7c-2 1.4-4.7 2.2-7.7 2.2-6.4 0-11.9-3.5-13.8-8.7l-7.7 6C6.5 42.6 14.6 48 24 48z"/>' +
  '<path fill="none" d="M0 0h48v48H0z"/>' +
  '</svg>';

function renderAuthModal() {
  if (!authModalBody) return;
  var profile = currentUserProfile;

  var avatarHtml = AVATAR_SPROUT_SVG;

  var titleText = profile.isAnonymous
    ? 'Guest Gardener'
    : (profile.displayName || 'Signed in');

  var subtitleText = profile.isAnonymous
    ? 'You\u2019re gardening as a guest. Sign in with Google to save your garden to your account and access it anywhere.'
    : (profile.email || 'Signed in with Google');

  var actionHtml = profile.isAnonymous
    ? (
        '<button id="authGoogleBtn" class="auth-google-btn" type="button"' +
        (authActionPending ? ' disabled' : '') + '>' +
          GOOGLE_G_ICON_SVG +
          '<span>' + (authActionPending ? 'Signing in…' : 'Sign in with Google') + '</span>' +
        '</button>'
      )
    : (
        '<button id="authSignOutBtn" class="auth-signout-btn" type="button">Sign Out</button>'
      );

  var errorHtml = authActionError
    ? '<p class="auth-modal-error">' + escapeHtml(authActionError) + '</p>'
    : '';

  var noteHtml = profile.isAnonymous
    ? '<p class="auth-modal-note">Your current garden stays exactly as it is - linking just adds Google sign-in on top.</p>'
    : '';

  authModalBody.innerHTML =
    '<div class="auth-modal-avatar">' + avatarHtml + '</div>' +
    '<h3 class="auth-modal-title">' + escapeHtml(titleText) + '</h3>' +
    '<p class="auth-modal-subtitle">' + escapeHtml(subtitleText) + '</p>' +
    actionHtml +
    errorHtml +
    noteHtml;

  var googleBtn = document.getElementById('authGoogleBtn');
  if (googleBtn) googleBtn.addEventListener('click', signInWithGoogle);

  var signOutBtn = document.getElementById('authSignOutBtn');
  if (signOutBtn) signOutBtn.addEventListener('click', signOutUser);
}

// ============================================
// Guest sign-in, on demand
//
// This used to fire on page load, which meant someone who opened the
// site, read the tagline and left still got an anonymous account, a
// garden document, and a full set of listener attachments - several
// Firestore reads for a visitor who never tended anything. At launch,
// when most traffic is people glancing at a shared link, that is
// mostly what the quota would have gone on.
//
// Now nothing signs in until the visitor actually enters the app.
// navigateTo() (01-app-core.js) calls this for any page other than
// home, so a bounce costs zero reads and creates no account at all.
//
// Called on every such navigation, so it has to be idempotent: an
// existing session short-circuits, and concurrent calls share one
// in-flight promise rather than racing to create two guests.
// ============================================
var pendingAnonSignIn = null;

// THE RACE THIS EXISTS TO PREVENT - do not remove this gate.
//
// auth.currentUser is null for the first few hundred milliseconds of
// EVERY page load, while Firebase restores the saved session out of
// IndexedDB. It is not "no user"; it is "not known yet". Checking it
// directly and creating a guest on null meant that clicking into the
// app quickly enough replaced a real signed-in session with a brand
// new anonymous one - the user watched themselves turn into a guest.
//
// For an anonymous user the same race is worse: the new guest gets a
// new uid, and the old guest's garden becomes unreachable forever,
// because nothing but that uid ever pointed at it.
//
// The auth observer's FIRST callback is the signal that Firebase has
// finished making up its mind - it fires after the session has been
// restored, and after any pending Google redirect has been resolved.
// So the answer is: never decide before that has happened.
var authSessionResolved = false;
var markAuthSessionResolved = null;
var authSessionResolvedPromise = new Promise(function (resolve) {
  markAuthSessionResolved = resolve;
});

function noteAuthSessionResolved() {
  if (authSessionResolved) return;
  authSessionResolved = true;
  markAuthSessionResolved();
}

function ensureSignedIn() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (pendingAnonSignIn) return pendingAnonSignIn;

  pendingAnonSignIn = authSessionResolvedPromise
    .then(function () {
      // Re-checked on the other side of the wait: the session may well
      // have restored while we were waiting, which is exactly the case
      // that used to get clobbered.
      if (auth.currentUser) return auth.currentUser;

      return auth.signInAnonymously().then(function (credential) {
        // Nothing else to do here - onIdTokenChanged fires next and
        // boots the app exactly as it does on reload.
        return credential.user;
      });
    })
    .then(function (user) {
      pendingAnonSignIn = null;
      return user;
    })
    .catch(function (error) {
      pendingAnonSignIn = null;
      console.error('DISCIPLANT: guest sign-in failed:', error);
      throw error;
    });

  return pendingAnonSignIn;
}


if (authWidgetBtn)     authWidgetBtn.addEventListener('click', openAuthModal);
if (authModalClose)    authModalClose.addEventListener('click', closeAuthModal);
if (authModalBackdrop) authModalBackdrop.addEventListener('click', closeAuthModal);


// ============================================
// Step 2: Listen to this user's data in real time
// ============================================
// onIdTokenChanged, NOT onAuthStateChanged.
//
// onAuthStateChanged only fires when *which user* is signed in changes.
// Linking Google onto an anonymous guest keeps the SAME uid - the auth
// state technically never changed - so that callback stays silent and
// the widget goes on saying "Guest" until a manual page reload.
// onIdTokenChanged additionally fires whenever the ID token is reissued,
// which linking always does (the new token carries the new provider), so
// the upgrade is picked up immediately.
//
// It also fires on routine hourly token refreshes. Everything below is
// guarded to be a no-op in that case: refreshIdentityUI() just repaints,
// ensureUserProfileDoc() skips unchanged data, and the snapshot listener
// is left alone when the uid hasn't moved.
auth.onIdTokenChanged(function (user) {
  // First thing, on every path: this callback firing at all is what
  // tells ensureSignedIn() that Firebase has finished restoring any
  // saved session, so it's safe to conclude there isn't one.
  noteAuthSessionResolved();

  if (!user) {
    // No session, and DELIBERATELY no sign-in here - see
    // ensureSignedIn() below for why. A visitor reading the home page
    // has no account, no garden document and costs no Firestore reads;
    // the widget stays on its default "Guest" state until they go in.
    //
    // This callback is also where a Google redirect result lands, and
    // Firebase holds off firing it with `null` until any pending
    // redirect has resolved - so reaching here really does mean there
    // is no session, not that one is still in flight.
    return;
  }

  refreshIdentityUI(user);

  if (currentUserId === user.uid && unsubscribeSnapshot) return;

  currentUserId = user.uid;
  console.log('Signed in as:', currentUserId, user.isAnonymous ? '(guest)' : '(Google)');

  // Username / friends listeners live in 06-friends.js and key off the
  // same uid. Guarded because 06 loads after this file - on the very
  // rare occasion auth resolves first, 06 catches up on its own.
  if (typeof startFriendsListeners === 'function') startFriendsListeners(currentUserId);

  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  unsubscribeSnapshot = db.collection('gardens').doc(currentUserId)
    .onSnapshot(function (docSnapshot) {
      try {

        if (docSnapshot.exists) {
          var data  = docSnapshot.data();

          // Adopt the server's rate-limit window (see the RL block
          // further down) — but only as a FALLBACK, when this client
          // has no estimate of its own. Once it has opened a window
          // itself it keeps its own reading, because the two clocks
          // are not the same clock: rlStart is the server's time and
          // every comparison here is against Date.now(), which is the
          // user's device clock and can be minutes out. Preferring the
          // local reading keeps the whole comparison inside one clock
          // and makes device skew irrelevant while a session is live.
          //
          // A pending local write shows a null timestamp here, so
          // guard for that and keep whatever we had.
          if (!gardenRlStartIsLocal &&
              data.rlStart && typeof data.rlStart.toMillis === 'function') {
            gardenRlStartMs = data.rlStart.toMillis();
          }
          tasks = (data.tasks || []).map(function (t) {
            t = t || {};
            return {
              id:                t.id                || 0,
              text:              t.text               || '',
              categoryId:        t.categoryId          || 'misc',
              // Which look this plant wears. Unknown ids fall back to
              // the species' default skin at render time.
              skinId:            t.skinId              || SKIN_DEFAULT_ID,
              completed:         t.completed           || false,
              // Every day count coming out of the document goes
              // through clampGrowthDays() (01): this is the edge the
              // data arrives at, and the document is writable by the
              // browser, so it is the first place a nonsense value -
              // a hand-edited 1e18, a NaN, a negative - can be caught
              // before anything tries to lay out a garden with it.
              streak:            clampGrowthDays(t.streak),
              lastCleanDate:     t.lastCleanDate        || null,
              prevLastCleanDate: t.prevLastCleanDate    || null,
              totalGrowthDays:   clampGrowthDays(t.totalGrowthDays),
              // All-time longest streak this task has ever reached.
              // Backfilled from the current streak on load in case a
              // task already had a streak before this field existed.
              maxStreak:         Math.max(clampGrowthDays(t.maxStreak), clampGrowthDays(t.streak)),
              // All-time high-water mark for totalGrowthDays, which
              // is NOT monotonic - un-ticking today's box takes a day
              // back off it. Without this, a plant sitting exactly on
              // a 30-day skin unlock would lose that skin the moment
              // its owner corrected a mis-tap. Backfilled from the
              // current total for tasks saved before this existed.
              maxGrowthDays:     Math.max(clampGrowthDays(t.maxGrowthDays), clampGrowthDays(t.totalGrowthDays)),
              // Per-day completion log - { "YYYY-MM-DD": true, ... } -
              // one entry per day this task was actually checked off.
              // Powers the Stats page heatmaps; only starts recording
              // from whenever this field was introduced, so days
              // before that won't have an entry.
              history:           (t.history && typeof t.history === 'object') ? t.history : {},
              // Manual placement override - set when the user drags
              // this plant to a spot themselves. null/undefined means
              // "use the automatic layout" (see computePlantLayout).
              posX:              (typeof t.posX === 'number') ? t.posX : null,
              posY:              (typeof t.posY === 'number') ? t.posY : null,
            };
          });
          lastResetDate = data.lastResetDate || null;
          // Which landscape the plot is wearing. An id that no longer
          // exists resolves to the default at render time rather than
          // here, so a skin that comes back later comes back worn.
          gardenSkinId  = data.gardenSkinId || null;
        } else {
          tasks         = [];
          lastResetDate = null;
          gardenSkinId  = null;

          // No garden document means a brand new account — a fresh
          // guest, or a sign-out into a new one. Any window state
          // carried over from the PREVIOUS account is meaningless
          // here, and worse than meaningless: the client would send
          // an increment against a document that has to be CREATED,
          // and the create rule insists on rlStart == request.time.
          // Clearing it makes the next save open window 1 correctly.
          resetGardenRateLimitWindow();
        }

        nextId = getNextId(tasks);

        var anyChanged = applyDayBoundaries();
        if (assignPermanentPositions()) anyChanged = true;
        if (anyChanged) saveData();

        render();

        // First snapshot: mark auth ready and reveal appropriate UI
        if (!authReady) {
          authReady = true;
        }

        // Covers the case where the friends list arrived before the
        // garden did - see ensureGardenSummaryPublished(). Whichever of
        // the two lands second does the write; the flag stops both.
        ensureGardenSummaryPublished();

      } catch (err) {
        console.error('DISCIPLANT: error while processing garden data:', err);
      }

      // Always keep loading/content states correct, even if something
      // above threw, so the UI never gets stuck on the spinner.
      if (loadingState)      loadingState.classList.add('hidden');
      if (tasksLoadingState) tasksLoadingState.classList.add('hidden');
      if (mainContent)       mainContent.classList.remove('hidden');
      if (statsLoadingState) statsLoadingState.classList.add('hidden');
      if (statsContent)      statsContent.classList.remove('hidden');
      if (greenhouseLoadingState) greenhouseLoadingState.classList.add('hidden');
      if (greenhouseContent)      greenhouseContent.classList.remove('hidden');
      if (friendsLoadingState) friendsLoadingState.classList.add('hidden');
      if (friendsContent)      friendsContent.classList.remove('hidden');

      // Garden scene: only visible on garden page
      if (gardenSceneEl) gardenSceneEl.classList.toggle('hidden', currentPage !== 'garden');

    }, function (error) {
      console.error('Error loading data:', error);
      if (loadingState)      loadingState.classList.add('hidden');
      if (tasksLoadingState) tasksLoadingState.classList.add('hidden');
    });
});


// ============================================
// Saving to Firestore
// ============================================
// A save deferred by the throttle above would be lost if the tab were
// closed inside that half-second. visibilitychange is the reliable
// hook for that on both desktop and mobile, so flush there: clear the
// timer and save immediately.
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'hidden') return;
  if (!pendingSaveTimer) return;
  clearTimeout(pendingSaveTimer);
  pendingSaveTimer = null;
  lastSaveAt = 0;            // bypass the cooldown for this final write
  saveData();
});

function buildCleanTasks() {
  return tasks.map(function (t) {
    // Position comes via getPersistedPosition() (04-garden-scene.js)
    // rather than straight off the task. While the garden is in edit
    // mode that returns the pre-edit snapshot, so a save triggered by
    // something else entirely - a midnight rollover, a habit ticked on
    // another page - writes those changes without also committing
    // drags the user hasn't saved yet and may still discard.
    var pos = (typeof getPersistedPosition === 'function') ? getPersistedPosition(t) : t;
    return {
      id:                t.id,
      text:              t.text,
      categoryId:        t.categoryId,
      skinId:            t.skinId || SKIN_DEFAULT_ID,
      completed:         t.completed,
      // Clamped on the way out as well as on the way in. The read side
      // protects this session; this side means the next ordinary save
      // rewrites an over-large stored value back down to the ceiling,
      // and stops one from reaching gardenSummaries - which friends
      // read - or the community counters.
      streak:            clampGrowthDays(t.streak),
      lastCleanDate:     t.lastCleanDate || null,
      prevLastCleanDate: t.prevLastCleanDate || null,
      totalGrowthDays:   clampGrowthDays(t.totalGrowthDays),
      maxStreak:         Math.max(clampGrowthDays(t.maxStreak), clampGrowthDays(t.streak)),
      maxGrowthDays:     Math.max(clampGrowthDays(t.maxGrowthDays), clampGrowthDays(t.totalGrowthDays)),
      history:           t.history || {},
      posX:              (typeof pos.posX === 'number') ? pos.posX : null,
      posY:              (typeof pos.posY === 'number') ? pos.posY : null,
    };
  });
}

// Leading-edge throttle with a trailing flush.
//
// The FIRST save in a burst goes straight through, so ticking a habit
// still feels instant. Anything within the cooldown after it is folded
// into one deferred save at the end - and because that deferred call
// re-reads the live tasks array, the final state always lands. Nothing
// is dropped; repeats are merged.
//
// This is what stops a stuck Enter key writing hundreds of documents:
// held down, it now costs well under one write a second instead of
// dozens.
//
// Raised from 500ms to 1500ms alongside the server-side limiter. The
// server now caps gardens at rlGardenMax() writes per rlWindow(), and
// the cheapest way to stay far clear of that ceiling is to coalesce
// more aggressively here. Ticking ten habits in a row still feels
// instant — only the WRITE is deferred, never the UI — but it now
// costs roughly three writes instead of ten.
var SAVE_MIN_INTERVAL_MS = 1500;
var lastSaveAt      = 0;
var pendingSaveTimer = null;


// ============================================
// Server-side rate limit bookkeeping
//
// The rules in firestore.rules keep a counter ON each rate-limited
// document: rlAt, rlStart, rlCount. A write is accepted only if it
// continues the current window (rlCount exactly one higher, still
// under the ceiling) or opens a fresh one (rlStart == request.time)
// after the old window has expired.
//
// So every write has to pick a branch, and picking the wrong one is
// rejected. The client can't compute rlStart itself — it's a server
// timestamp — so it learns the real value from the garden snapshot
// above and tracks it here.
//
// Two failure directions, and they are NOT symmetric:
//
//   Think the window is live when the server has moved on -> the
//   "same window" branch still passes (rlStart unchanged, count+1,
//   under the ceiling). Harmless; the reset just happens later.
//
//   Think the window has expired when the server says it hasn't ->
//   the fresh-window branch is REJECTED.
//
// Hence the margin below: only declare the window expired once it is
// comfortably past, and prefer the harmless direction.
// ============================================
var RL_WINDOW_MS        = 10 * 60 * 1000;  // must match rlWindow() in firestore.rules
var RL_EXPIRY_MARGIN_MS = 20 * 1000;       // err towards "still live"
var gardenRlStartMs     = 0;               // 0 = unknown, treat as expired
var gardenRlStartIsLocal = false;          // did WE open this window, or did it come from a snapshot?

// Called when the account changes under us — a sign-out into a fresh
// guest, a guest upgrading to Google, or any first load where the
// garden document does not exist yet. Window state is per-document,
// so carrying it across accounts guarantees a rejected write.
function resetGardenRateLimitWindow() {
  gardenRlStartMs      = 0;
  gardenRlStartIsLocal = false;
}


// ============================================
// The same bookkeeping for users/{uid}
//
// Kept as its own small set of variables rather than folded into a
// generic tracker, because the garden path above is verified working
// and refactoring it to share code would put that at risk for no
// behavioural gain. Two documents, two counters, same shape.
//
// users/{uid} carries TWO independent counters:
//   rl*  — every owner write (profile save, username claim, accepting
//          a friend request). Window rlWindow(), ceiling rlUserMax().
//   fr*  — friend-request sends only. Window rlSocialWindow(),
//          ceiling rlFriendReqMax(). Ordinary writes must leave these
//          fields alone or the rule charges them against the social
//          budget.
// ============================================
var RL_SOCIAL_WINDOW_MS  = 60 * 60 * 1000;  // must match rlSocialWindow() in firestore.rules
var userRlStartMs        = 0;
var userRlStartIsLocal   = false;
var userFrStartMs        = 0;
var userFrStartIsLocal   = false;

function resetUserRateLimitWindows() {
  userRlStartMs      = 0;
  userRlStartIsLocal = false;
  userFrStartMs      = 0;
  userFrStartIsLocal = false;
}

function userRlWindowLooksExpired() {
  if (!userRlStartMs) return true;
  return (Date.now() - userRlStartMs) > (RL_WINDOW_MS + RL_EXPIRY_MARGIN_MS);
}

function userFrWindowLooksExpired() {
  if (!userFrStartMs) return true;
  return (Date.now() - userFrStartMs) > (RL_SOCIAL_WINDOW_MS + RL_EXPIRY_MARGIN_MS);
}

// The rl* trio for a write to users/{uid}. Every owner write needs
// these, including ones that only mean to change one unrelated field.
function userRlFields() {
  var opens = userRlWindowLooksExpired();
  var stamp = firebase.firestore.FieldValue.serverTimestamp();

  if (opens) {
    userRlStartMs      = Date.now();
    userRlStartIsLocal = true;
    return { rlAt: stamp, rlStart: stamp, rlCount: 1 };
  }
  return { rlAt: stamp, rlCount: firebase.firestore.FieldValue.increment(1) };
}

// The fr* trio, added ON TOP of userRlFields() for a friend-request
// send. Both counters advance in that one write.
function userFrFields() {
  var opens = userFrWindowLooksExpired();
  var stamp = firebase.firestore.FieldValue.serverTimestamp();

  if (opens) {
    userFrStartMs      = Date.now();
    userFrStartIsLocal = true;
    return { frAt: stamp, frStart: stamp, frCount: 1 };
  }
  return { frAt: stamp, frCount: firebase.firestore.FieldValue.increment(1) };
}

// Merges the counter fields into a payload object, so call sites stay
// readable. Returns the same object it was given.
function withUserRlFields(payload, includeFriendRequest) {
  var counters = userRlFields();
  var k;
  for (k in counters) payload[k] = counters[k];

  if (includeFriendRequest) {
    var fr = userFrFields();
    for (k in fr) payload[k] = fr[k];
  }
  return payload;
}

// Retry pacing for a write the server rejected. Deliberately short:
// a rate-limit rejection is usually a branch mismatch that the very
// next attempt gets right, not a real ceiling hit.
var RL_RETRY_DELAYS_MS  = [400, 2000, 6000];

function rlWindowLooksExpired() {
  if (!gardenRlStartMs) return true;
  return (Date.now() - gardenRlStartMs) > (RL_WINDOW_MS + RL_EXPIRY_MARGIN_MS);
}

// The three counter fields to merge into a rate-limited write.
// `opensWindow` true starts a fresh window at 1; false adds one to
// whatever is already there, without the client needing to know what
// that number is — FieldValue.increment resolves server-side and the
// rules see the resolved value.
function rlFields(opensWindow) {
  var stamp = firebase.firestore.FieldValue.serverTimestamp();
  if (opensWindow) {
    return { rlAt: stamp, rlStart: stamp, rlCount: 1 };
  }
  return { rlAt: stamp, rlCount: firebase.firestore.FieldValue.increment(1) };
}

// A permission-denied on a path the user demonstrably owns is almost
// always the rate limiter rather than a genuine authorisation problem
// — the ownership half of these rules hasn't changed. Kept as its own
// function so the distinction stays visible at the call sites.
function isRateLimitDenial(error) {
  return !!error && error.code === 'permission-denied';
}

function saveData(rlOpensWindow, retryIndex) {
  if (!currentUserId) return;

  // Retries come back in already past the throttle and with a branch
  // chosen, so don't re-throttle or re-charge the client budget.
  var isRetry = (typeof retryIndex === 'number');

  if (!isRetry) {
    var sinceLast = Date.now() - lastSaveAt;
    if (sinceLast < SAVE_MIN_INTERVAL_MS) {
      // Already one queued - it will pick up whatever the tasks array
      // looks like when it fires, including this change.
      if (!pendingSaveTimer) {
        pendingSaveTimer = setTimeout(function () {
          pendingSaveTimer = null;
          saveData();
        }, SAVE_MIN_INTERVAL_MS - sinceLast);
      }
      return;
    }

    if (typeof budgetAllowsWrite === 'function' && !budgetAllowsWrite('saveData')) return;

    lastSaveAt = Date.now();
    rlOpensWindow = rlWindowLooksExpired();
  }

  var cleanTasks = buildCleanTasks();

  var payload = {
    tasks:         cleanTasks,
    lastResetDate: lastResetDate,
    // One string on a document that was already being written. The
    // landscape skin therefore costs no extra write of its own, and
    // no extra read: it arrives in the same snapshot as the tasks.
    gardenSkinId:  gardenSkinId || GARDEN_SKIN_DEFAULT_ID,
  };
  var counters = rlFields(rlOpensWindow);
  for (var k in counters) payload[k] = counters[k];

  // Record the window locally the moment we ask for one, rather than
  // waiting for the snapshot to come back and tell us what rlStart
  // resolved to. Without this there is a gap of one network round
  // trip in which the client still believes the window is expired, so
  // a second save landing inside that gap sends a SECOND fresh-window
  // write — which the server rejects, because the window it just
  // opened is very much still live.
  //
  // Safe if this write is rejected: a rejection means the server's
  // window is newer than we thought, i.e. a window really is open, so
  // believing one is open is the correct conclusion either way.
  if (rlOpensWindow) {
    gardenRlStartMs      = Date.now();
    gardenRlStartIsLocal = true;
  }

  // merge:true, where this used to be a plain set(). Required, not
  // cosmetic: on the "same window" branch the client deliberately does
  // NOT send rlStart (it has no way to produce the server's exact
  // value), so a full overwrite would delete the counter it is trying
  // to increment. Merge is safe here because every field this document
  // holds is rewritten on every save — but that is now a rule to keep:
  // ANY field dropped from the payload above will linger in the stored
  // document rather than disappearing, so removing one means deleting
  // it explicitly with FieldValue.delete().
  db.collection('gardens').doc(currentUserId)
    .set(payload, { merge: true })
    .catch(function (error) {
      if (isRateLimitDenial(error)) {
        var next = (isRetry ? retryIndex : -1) + 1;

        if (next < RL_RETRY_DELAYS_MS.length) {
          // Flip the branch. The overwhelmingly likely cause is that
          // the client guessed the window state wrong, and there are
          // only two guesses to make.
          setTimeout(function () {
            saveData(!rlOpensWindow, next);
          }, RL_RETRY_DELAYS_MS[next]);
          return;
        }

        // Out of retries: this is a real ceiling, not a mismatch.
        // Say so plainly rather than leaving a bare permission error
        // in the console, because the visible symptom is confusing —
        // Firestore rolls the rejected write back out of its local
        // cache, so the habit the user just ticked will appear to
        // untick itself a moment later.
        console.error(
          'DISCIPLANT: save rejected — the per-window write limit in ' +
          'firestore.rules has been reached for this account. Saving ' +
          'resumes when the window rolls over (see rlWindow()). Nothing ' +
          'was lost: the next successful save writes the current state.'
        );
        return;
      }
      console.error('Error saving data:', error);
    });

  saveGardenSummary(cleanTasks, rlOpensWindow);
}



// ============================================
// Friend-visible garden summary (gardenSummaries/{uid})
//
// WHY THIS EXISTS AT ALL
// Firestore security rules are document-level: a rule can allow or
// deny a whole document, but it cannot hide individual fields. So
// there is no way to let a friend read growth and streaks out of
// gardens/{uid} without also handing them every task's raw text and
// full per-day history. Instead, the owner writes a second, derived
// document containing ONLY the fields meant to be seen, and the
// rules let friends read that one.
//
// Because it's derived, it must be rewritten from the same task data
// in the same place every time - hence being called straight out of
// saveData() above rather than on some separate schedule. Anything
// that drifts here shows a friend a stale garden.
//
// WHAT'S DELIBERATELY MISSING
//   text               - the whole point; free-text habits are private
//   history            - a day-by-day activity log of someone's life
//   maxStreak          - not needed to draw anything
//   lastCleanDate,
//   prevLastCleanDate  - internal day-rollover bookkeeping
//   lastResetDate,
//   updatedAt          - both disclose roughly when this person last
//                        opened the app, which is a fact about their
//                        habits rather than about their garden. Left
//                        out by decision; see the note on `completed`
//                        below for what that costs.
//
// Adding a field here makes it readable by every one of that user's
// friends, immediately and retroactively (the next save rewrites the
// whole document). Treat this list as the privacy boundary it is.
// ============================================
function buildGardenSummary(cleanTasks) {
  return {
    // Stored as data, not just inferred from the document path, so a
    // stray or mis-keyed summary is obvious when reading it back.
    ownerUid: currentUserId,

    // No timestamp of any kind by design. That means a reader cannot
    // tell whether this snapshot is from ten seconds or ten days ago,
    // so `completed` below can't be pinned to a specific day either -
    // the friend view says so in plain words instead of guessing.

    // Which landscape a friend sees the plot standing in. Safe to
    // share by inspection: it is one id out of a fixed list of looks,
    // chosen deliberately to be shown off, and it says nothing about
    // what any habit is or when it was done. The skin actually WORN
    // rather than the one stored, same rule as skinId per plant.
    gardenSkinId: getActiveGardenSkinId(),

    plants: cleanTasks.map(function (t) {
      return {
        // Kept because the automatic garden layout hashes it for a
        // stable slot (see getTaskSlotGroup), and it's the only
        // per-plant key the viewer has now that text is gone.
        id:              t.id,
        // Drives which species art is drawn. NOTE: this necessarily
        // discloses the CATEGORY of each habit (Exercise, Finance,
        // Sleep...) even though the task's text stays private - see
        // the note in the handover summary; showing real species is a
        // product decision, not a technical requirement.
        categoryId:      t.categoryId,
        // The skin actually WORN, not the one stored - a plant whose
        // skin is currently locked shows a friend the same classic it
        // shows its owner, rather than a look it isn't wearing.
        skinId:          getTaskSkinId(t),
        // Growth inputs - the two numbers the garden is actually a
        // picture of.
        streak:          t.streak || 0,
        totalGrowthDays: t.totalGrowthDays || 0,
        // Whether this was ticked off as of the owner's last save.
        // Without a date on the document there's no way for a reader
        // to know WHICH day that was - if its owner hasn't opened the
        // app since yesterday, no day-rollover has run and this still
        // holds yesterday's answer. The friend view therefore labels
        // it "last saved" rather than "today". Reveals how many habits
        // were ticked, never which ones.
        completed:       !!t.completed,
        // Where the owner placed this plant, so a friend sees the
        // garden arranged the way it was actually laid out.
        posX:            (typeof t.posX === 'number') ? t.posX : null,
        posY:            (typeof t.posY === 'number') ? t.posY : null,
      };
    }),
  };
}

// Written as its own request rather than batched with the garden save
// above, on purpose: a batch fails as a unit, so if the new
// gardenSummaries rules haven't been published in the Firebase Console
// yet, batching would take the user's ordinary garden save down with
// it. Kept separate, a missing rule costs only the friend-visible copy
// and logs a pointed message, while the app itself keeps working.
// Has this session published a summary yet? Only used to keep the
// backstop below from writing the same document on every snapshot.
var gardenSummaryWritten = false;

// Does anyone exist who is actually allowed to read the summary?
//
// The rules let a FRIEND read gardenSummaries/{uid} and nobody else -
// so with an empty friends list this document is unreadable by every
// person alive, including its owner. Writing it anyway doubled the
// write cost of every single save for solo users and for every guest
// who never claimed a username, publishing to an audience of zero.
//
// getFriendCount() lives in 06-friends.js, which loads after this file
// - hence the typeof guard. If it isn't there yet we skip the write,
// which is the safe direction: the backstop below will publish as soon
// as the friends list is known.
function summaryHasAudience() {
  return (typeof getFriendCount === 'function') && getFriendCount() > 0;
}

// Called when the friends list becomes non-empty, and again once the
// garden finishes loading.
//
// WHY THIS IS NEEDED: with the skip above, someone who gains a friend
// and then never saves their garden again would never publish a
// summary at all, and their friend would see "hasn't opened DISCIPLANT
// since garden sharing was added" - which would be a lie. This writes
// once, at the first moment the document actually becomes readable.
//
// Guarded on authReady so it can't publish an empty summary before the
// real garden has arrived from Firestore. It's called from both sides
// (the profile listener in 06 and the garden snapshot above) because
// either can land first; gardenSummaryWritten makes the second a no-op.
function ensureGardenSummaryPublished() {
  if (!currentUserId || !authReady) return;
  if (gardenSummaryWritten) return;
  if (!summaryHasAudience()) return;

  writeGardenSummary(buildCleanTasks());
}

function saveGardenSummary(cleanTasks, rlOpensWindow) {
  if (!currentUserId) return;

  // Nobody can read it yet - don't pay to publish it. The moment a
  // friend request is accepted, ensureGardenSummaryPublished() writes
  // the current state, and ordinary saves take over from there.
  if (!summaryHasAudience()) return;

  writeGardenSummary(cleanTasks, rlOpensWindow);
}

// rlOpensWindow is passed down from saveData rather than recomputed,
// so both documents open their windows at the same moment and stay in
// step. They can still drift — this write is skipped entirely while
// the user has no friends, so its window can go stale while the
// garden's keeps turning over. That drift is self-correcting: a stale
// window only means the counter resets late, and the next time the
// GARDEN's window expires this document gets a fresh one too.
function writeGardenSummary(cleanTasks, rlOpensWindow) {
  gardenSummaryWritten = true;

  var payload  = buildGardenSummary(cleanTasks);
  var counters = rlFields(rlOpensWindow === undefined ? rlWindowLooksExpired() : rlOpensWindow);
  for (var k in counters) payload[k] = counters[k];

  // merge:true for the same reason as the garden write above: the
  // "same window" branch omits rlStart, so a full overwrite would
  // destroy the counter. NOTE THE PRIVACY CONSEQUENCE — this document
  // is the friend-visible projection, and under merge a field removed
  // from buildGardenSummary() stops being written but does NOT stop
  // being readable. Anything taken out of that function must also be
  // deleted here explicitly with FieldValue.delete(), or friends keep
  // seeing the last value it ever had.
  db.collection('gardenSummaries').doc(currentUserId)
    .set(payload, { merge: true })
    .catch(function (error) {
      // Left flagged as written even on failure would strand the
      // backstop, so clear it and let the next save or snapshot retry.
      gardenSummaryWritten = false;
      if (error && error.code === 'permission-denied') {
        console.error(
          'DISCIPLANT: could not write gardenSummaries/' + currentUserId + '. ' +
          'Either the rules are not published yet - paste firestore.rules into ' +
          'Firebase Console -> Firestore -> Rules -> Publish - or the per-window ' +
          'write limit for this account has been reached. ' +
          'Your own garden is unaffected; only the friend-visible copy is stale, ' +
          'and the next successful save republishes it.'
        );
        return;
      }
      console.error('DISCIPLANT: error saving garden summary:', error);
    });
}

function getNextId(taskArray) {
  if (taskArray.length === 0) return 1;
  var maxId = Math.max.apply(null, taskArray.map(function (t) { return t.id; }));
  return maxId + 1;
}


// ============================================
// Adding a task
// ============================================
taskForm.addEventListener('submit', function (event) {
  event.preventDefault();
  var text  = taskInput.value.trim();
  var catId = categorySelect.value || 'misc';
  if (text === '') return;
  tasks.push({
    id:                nextId,
    text:              text,
    categoryId:        catId,
    skinId:            SKIN_DEFAULT_ID,
    completed:         false,
    streak:            0,
    lastCleanDate:     null,
    prevLastCleanDate: null,
    totalGrowthDays:    0,
    maxStreak:         0,
    maxGrowthDays:     0,
    history:           {},
    posX:              null,
    posY:              null,
  });
  nextId++;
  taskInput.value = '';
  assignPermanentPositions();
  saveData();
  render();
});


// ============================================
// Toggling a task's completed state
// ============================================
function toggleTask(taskId, newChecked) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;

  // Compare against the PREVIOUS completed state, not a date string.
  // completed and "credit given" are always toggled in lockstep by
  // this function, so "was it already completed" is a perfectly
  // reliable signal for "was today's credit already given" - and
  // unlike comparing lastCleanDate to today's date string, it can't
  // be thrown off by the dev rollover simulation, timezone edge
  // cases, or any other date-comparison mismatch.
  var wasCompleted = task.completed;
  task.completed   = newChecked;
  if (!task.history) task.history = {};

  if (newChecked && !wasCompleted) {
    // Fresh completion - grow both streak and size, once, and log
    // today in this task's per-day history (powers the Stats page
    // heatmaps).
    task.streak          = (task.streak || 0) + 1;
    task.totalGrowthDays = (task.totalGrowthDays || 0) + 1;
    task.history[getTodayString()] = true;
    task.maxStreak        = Math.max(task.maxStreak || 0, task.streak);
    // Banked, and never given back - see the field's note on load.
    task.maxGrowthDays    = Math.max(task.maxGrowthDays || 0, task.totalGrowthDays);
  } else if (!newChecked && wasCompleted) {
    // Undoing a completion - reverse today's credit for both, and
    // remove today's history entry so the heatmap reflects reality.
    task.streak          = Math.max(0, (task.streak || 0) - 1);
    task.totalGrowthDays = Math.max(0, (task.totalGrowthDays || 0) - 1);
    delete task.history[getTodayString()];
  }

  saveData();
  render();
}


// ============================================
// Removing a task
// ============================================
function removeTask(taskId) {
  tasks = tasks.filter(function (t) { return t.id !== taskId; });
  saveData();
  render();
}


// ============================================
// Rendering task lists
// ============================================

// Renders a filtered subset of tasks into a given list + empty-state element.
function renderFilteredList(catId, listEl, emptyEl) {
  listEl.innerHTML = '';

  var filtered = catId === 'all'
    ? tasks
    : tasks.filter(function (t) { return t.categoryId === catId; });

  filtered.forEach(function (task) {
    var cat = getCategoryById(task.categoryId);

    var li       = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');

    var checkbox      = document.createElement('input');
    checkbox.type     = 'checkbox';
    checkbox.checked  = task.completed;
    (function (id, cb) {
      cb.addEventListener('change', function () { toggleTask(id, cb.checked); });
    }(task.id, checkbox));

    var textSpan       = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    li.appendChild(checkbox);
    li.appendChild(textSpan);

    // Show category badge only in the "all" view
    if (catId === 'all') {
      var badge            = document.createElement('span');
      badge.className      = 'cat-badge';
      badge.dataset.category = task.categoryId;
      badge.textContent    = cat.name;
      li.appendChild(badge);
    }

    // Skin pip - shows the plant's current colours right on the
    // row, and doubles as a shortcut into the Greenhouse, where
    // skins are actually chosen.
    var skinBtn       = document.createElement('button');
    skinBtn.type      = 'button';
    skinBtn.className = 'skin-btn';
    skinBtn.innerHTML = skinPipHtml(getSkin(task.categoryId, getTaskSkinId(task)));
    skinBtn.setAttribute('aria-label', 'Open this ' + cat.species + ' in the Greenhouse');
    skinBtn.title     = 'Change how this ' + cat.species + ' looks - opens the Greenhouse';
    (function (id) {
      skinBtn.addEventListener('click', function () { openPlantSkins(id); });
    }(task.id));
    li.appendChild(skinBtn);

    var removeBtn      = document.createElement('button');
    removeBtn.className  = 'remove';
    removeBtn.innerHTML   = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>';
    removeBtn.setAttribute('aria-label', 'Remove task');
    (function (id) {
      removeBtn.addEventListener('click', function () { removeTask(id); });
    }(task.id));
    li.appendChild(removeBtn);

    listEl.appendChild(li);
  });

  emptyEl.classList.toggle('hidden', filtered.length > 0);
}

// Renders all task views: the "all" tab and every category tab.
function renderTaskList() {
  // The plot of plant cards above the lists: counts, streaks and the
  // artwork all move when a task is ticked.
  if (typeof refreshCategoryCards === 'function') refreshCategoryCards();

  // "All" tab
  renderFilteredList('all', taskList, emptyState);

  // Each category tab
  CATEGORIES.forEach(function (cat) {
    var listEl  = document.getElementById('cat-list-' + cat.id);
    var emptyEl = document.getElementById('cat-empty-' + cat.id);
    if (listEl && emptyEl) {
      renderFilteredList(cat.id, listEl, emptyEl);
    }
  });
}