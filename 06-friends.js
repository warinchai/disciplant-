// ============================================
// 06: FRIENDS — usernames, friend requests, Friends page
// Part of DISCIPLANT — split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05 -> 06,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 5 files.
// ============================================

// ============================================
// Friend architecture
//
// Three pieces of Firestore data, none of which touch the existing
// gardens/{uid} documents:
//
//  1. usernames/{lowercaseName} = { uid, username, createdAt }
//     The doc ID IS the uniqueness lock — Firestore will only let a
//     doc be created once, so no query or scan is needed. This is
//     also the only collection other users can read, which is why
//     it holds the display name and nothing private (users/{uid}
//     holds the email, and stays owner-only).
//
//  2. users/{uid}.username / .usernameLower / .friends
//     A convenience copy of the name plus the friend UID list. The
//     usernames doc is the authority for names — always resolve
//     someone else's name through that collection, never through
//     their user doc (which we can't read anyway).
//
//  3. friendRequests/{fromUid}_{toUid} = { from, to, fromUsername,
//     toUsername, status, createdAt, updatedAt }
//     The deterministic ID means the same pair can only ever have
//     one request doc, so "already sent" is free. Both sides can
//     find their own with a single-field query (from == me, or
//     to == me) — deliberately single-field, so neither one needs
//     a composite index.
//
// Accepting is a BATCH, not three writes: Firestore evaluates every
// operation in a batch against the pre-batch snapshot, so the rule
// guarding the write into the other person's document can still see
// the request doc that the same batch is marking as accepted.
// ============================================


// ---- Username shape (must stay in sync with the Firestore rules) ----
var USERNAME_MIN     = 3;
var USERNAME_MAX     = 20;
var USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

// NOTHING opens the username modal on its own. It is reached only by
// tapping "Choose a username" on the Friends page — see
// renderFriendsMe() and the choose-username action below.
//
// Claiming a name is not something anyone needs to do before they can
// use the app: a garden works perfectly without one, and a username
// only matters at the point someone wants to be findable. Interrupting
// a first visit to demand one asked for a decision at the moment it
// mattered least. There is deliberately no setting to turn this back
// on — the Friends page is the place, whenever they want it.


// ============================================
// Friends state
// ============================================
var myUsername       = null;  // display casing; null until claimed
var myFriendUids     = [];    // UIDs from users/{uid}.friends
var friendProfiles   = [];    // [{ uid, username }] resolved for display
var incomingRequests = [];    // pending requests sent TO me
var outgoingRequests = [];    // pending requests sent BY me

var friendsSearchResult = null;  // { uid, username } | { notFound: true, query }
var friendsStatusMsg    = null;
var friendsStatusIsError = false;
var friendsBusy         = false; // true while a lookup/write is in flight

var usernameDraft         = '';
var usernameModalError    = null;
var usernameModalPending  = false;

// Has the SERVER ever answered for this uid's profile doc? Not the
// same as "the listener has fired" — see the long note on the profile
// listener in startFriendsListeners(). Nothing may conclude that a
// user has no username until this is true.
var profileSynced         = false;


var friendsListenerUid  = null;
var unsubscribeProfile  = null;
var unsubscribeIncoming = null;
var unsubscribeOutgoing = null;
var requestListenerUid  = null;   // uid the request listeners are attached for


// ============================================
// DOM references
// ============================================
var friendsMeEl          = document.getElementById('friendsMe');
var friendsSearchForm    = document.getElementById('friendsSearchForm');
var friendsSearchInput   = document.getElementById('friendsSearchInput');
var friendsSearchResultEl = document.getElementById('friendsSearchResult');
var friendsStatusEl      = document.getElementById('friendsStatus');
var friendsIncomingList  = document.getElementById('friendsIncomingList');
var friendsIncomingEmpty = document.getElementById('friendsIncomingEmpty');
var friendsOutgoingList  = document.getElementById('friendsOutgoingList');
var friendsOutgoingEmpty = document.getElementById('friendsOutgoingEmpty');
var friendsListEl        = document.getElementById('friendsList');
var friendsEmptyEl       = document.getElementById('friendsEmpty');

var usernameModalEl       = document.getElementById('usernameModal');
var usernameModalBackdrop = document.getElementById('usernameModalBackdrop');
var usernameModalClose    = document.getElementById('usernameModalClose');
var usernameModalBody     = document.getElementById('usernameModalBody');


// ============================================
// Username helpers
// ============================================
function normalizeUsername(raw) {
  return String(raw || '').trim().toLowerCase();
}

// Returns an error string, or null if the name is usable.
function usernameProblem(raw) {
  var name = String(raw || '').trim();
  if (name.length < USERNAME_MIN) {
    return 'Usernames need at least ' + USERNAME_MIN + ' characters.';
  }
  if (name.length > USERNAME_MAX) {
    return 'Usernames can be at most ' + USERNAME_MAX + ' characters.';
  }
  if (!USERNAME_PATTERN.test(name.toLowerCase())) {
    return 'Use letters, numbers and underscores only.';
  }
  return null;
}

// Claims a name by creating usernames/{lower} inside a transaction.
// The transaction only guards against a read-then-write race in this
// tab; the real guarantee is the security rule, which allows create
// and never update — so a second person claiming the same name gets a
// permission error rather than overwriting the first.
function claimUsername(raw) {
  var display = String(raw || '').trim();
  var lower   = display.toLowerCase();
  var uid     = currentUserId;

  if (!uid) return Promise.reject(new Error('not-signed-in'));

  var nameRef = db.collection('usernames').doc(lower);
  var userRef = db.collection('users').doc(uid);

  return db.runTransaction(function (transaction) {
    return transaction.get(nameRef).then(function (snapshot) {
      if (snapshot.exists) {
        // Already ours (e.g. a retry after a flaky write) — nothing to do.
        if ((snapshot.data() || {}).uid === uid) return;
        throw new Error('username-taken');
      }
      transaction.set(nameRef, {
        uid:       uid,
        username:  display,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      transaction.set(userRef, {
        username:      display,
        usernameLower: lower,
      }, { merge: true });
    });
  });
}


// ============================================
// Username modal — reuses the .auth-modal shell
// ============================================
function openUsernameModal() {
  usernameModalError   = null;
  usernameModalPending = false;
  usernameDraft        = myUsername || '';
  if (usernameModalEl) usernameModalEl.classList.remove('hidden');
  renderUsernameModal();

  // Focus after the paint so the caret actually lands in the field.
  window.setTimeout(function () {
    var input = document.getElementById('usernameInput');
    if (input) input.focus();
  }, 0);
}

function closeUsernameModal() {
  if (usernameModalEl) usernameModalEl.classList.add('hidden');
}

// Called when a username arrives while the modal happens to be open —
// the user opened it themselves before the profile loaded, or a claim
// went through in another tab. Without this the modal would sit there
// showing an empty "Choose a username" form to someone who now has
// one, which is exactly how it looked when the prompt fired too early.
//
// Only ever called on a null -> value transition, so it can't repaint
// (and wipe the caret of) a field someone is mid-way through typing.
function refreshOpenUsernameModal() {
  if (!usernameModalEl || usernameModalEl.classList.contains('hidden')) return;
  if (usernameModalPending) return;   // a claim is in flight; leave it alone
  usernameModalError = null;
  usernameDraft      = myUsername || usernameDraft;
  renderUsernameModal();
}

// Deliberately NOT re-rendered on every keystroke — that would blow
// away the input and its caret. usernameDraft tracks what's typed;
// this only repaints on open, submit, and error.
function renderUsernameModal() {
  if (!usernameModalBody) return;

  var errorHtml = usernameModalError
    ? '<p class="auth-modal-error">' + escapeHtml(usernameModalError) + '</p>'
    : '';

  usernameModalBody.innerHTML =
    '<div class="auth-modal-avatar">\uD83C\uDF31</div>' +
    '<h3 class="auth-modal-title">' + (myUsername ? 'Your username' : 'Choose a username') + '</h3>' +
    '<p class="auth-modal-subtitle">This is how other gardeners find you. ' +
      USERNAME_MIN + '\u2013' + USERNAME_MAX + ' characters: letters, numbers and underscores.</p>' +
    '<div class="username-form">' +
      '<input type="text" id="usernameInput" class="username-input" ' +
        'maxlength="' + USERNAME_MAX + '" autocomplete="off" spellcheck="false" ' +
        'placeholder="e.g. leafy_sam" value="' + escapeHtml(usernameDraft) + '"' +
        (usernameModalPending || myUsername ? ' disabled' : '') + ' />' +
      (myUsername
        ? '<p class="auth-modal-note">Usernames can\u2019t be changed yet.</p>'
        : '<button id="usernameSubmitBtn" class="auth-google-btn username-submit-btn" type="button"' +
            (usernameModalPending ? ' disabled' : '') + '>' +
            '<span>' + (usernameModalPending ? 'Claiming\u2026' : 'Claim username') + '</span>' +
          '</button>') +
    '</div>' +
    errorHtml +
    '<p class="auth-modal-note">You can skip this and pick one later from the Friends page.</p>';

  var input = document.getElementById('usernameInput');
  if (input) {
    input.addEventListener('input', function () { usernameDraft = input.value; });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitUsername();
      }
    });
  }

  var submitBtn = document.getElementById('usernameSubmitBtn');
  if (submitBtn) submitBtn.addEventListener('click', submitUsername);
}

function submitUsername() {
  if (usernameModalPending) return;

  var raw     = usernameDraft;
  var problem = usernameProblem(raw);
  if (problem) {
    usernameModalError = problem;
    renderUsernameModal();
    return;
  }

  if (!rateLimit('claimUsername', USERNAME_CLAIM_COOLDOWN_MS)) {
    usernameModalError =
      'Just a second — try again in ' +
      rateLimitWaitSeconds('claimUsername', USERNAME_CLAIM_COOLDOWN_MS) + 's.';
    renderUsernameModal();
    return;
  }

  if (!budgetAllowsWrite('claimUsername')) {
    usernameModalError = 'Too many actions at once. Reload the page and try again.';
    renderUsernameModal();
    return;
  }

  usernameModalPending = true;
  usernameModalError   = null;
  renderUsernameModal();

  claimUsername(raw)
    .then(function () {
      usernameModalPending = false;
      // The profile listener repaints everything else; just close up.
      closeUsernameModal();
    })
    .catch(function (error) {
      usernameModalPending = false;
      if (error && error.message === 'username-taken') {
        usernameModalError = 'That username is taken. Try another.';
      } else if (error && error.code === 'permission-denied') {
        usernameModalError = 'That username is taken. Try another.';
      } else {
        usernameModalError = 'Could not save that username. Try again.';
        console.error('DISCIPLANT: claiming username failed:', error);
      }
      renderUsernameModal();
    });
}

if (usernameModalClose)    usernameModalClose.addEventListener('click', closeUsernameModal);
if (usernameModalBackdrop) usernameModalBackdrop.addEventListener('click', closeUsernameModal);


// ============================================
// Live listeners — profile, incoming, outgoing
// ============================================
function stopFriendsListeners() {
  if (unsubscribeProfile)  { unsubscribeProfile();  unsubscribeProfile  = null; }
  if (unsubscribeIncoming) { unsubscribeIncoming(); unsubscribeIncoming = null; }
  if (unsubscribeOutgoing) { unsubscribeOutgoing(); unsubscribeOutgoing = null; }
  friendsListenerUid = null;
  requestListenerUid = null;
}

function startFriendsListeners(uid) {
  if (!uid) return;
  if (friendsListenerUid === uid) return; // already listening for this user

  stopFriendsListeners();
  friendsListenerUid = uid;

  // Reset per-user state so a signed-out user's data never lingers.
  myUsername       = null;
  myFriendUids     = [];
  profileSynced      = false;  // nothing is known about this uid yet
  lastFriendSkinTier = null;   // a different user has a different count
  friendProfiles   = [];
  incomingRequests = [];
  outgoingRequests = [];
  friendsSearchResult = null;
  friendsStatusMsg    = null;

  // WHY THIS LISTENER IS FUSSY ABOUT metadata
  //
  // Firestore serves a listener from its local cache the moment it's
  // attached, before it has heard a word from the server. On a fresh
  // page load that cache is empty — and 02-auth-tasks.js writes this
  // very document on every load (ensureUserProfileDoc, keeping the
  // display name and avatar in sync) with a merge set. That write
  // lands in the empty cache as a document containing ONLY the fields
  // it wrote: uid, isAnonymous, displayName, email, photoURL. No
  // username — not because the user hasn't got one, but because there
  // was nothing local to merge it onto.
  //
  // So the first snapshot on every single reload used to say "this
  // person has no username", and the prompt believed it. That is what
  // made the modal reappear on every reload for someone who had had a
  // username for weeks — and why closing it and looking again showed
  // the name perfectly, because by then the server had answered.
  //
  // includeMetadataChanges is what makes this fixable. Without it, a
  // listener whose server data matches what's already cached never
  // fires a second time — so for a user who genuinely has no username
  // there would be no later event to distinguish "still syncing" from
  // "really hasn't got one", and the prompt would never appear at all.
  // With it, the flip of fromCache is itself an event.
  unsubscribeProfile = db.collection('users').doc(uid)
    .onSnapshot({ includeMetadataChanges: true }, function (docSnapshot) {
      var data       = docSnapshot.exists ? (docSnapshot.data() || {}) : {};
      var fromServer = !(docSnapshot.metadata && docSnapshot.metadata.fromCache);
      var hadUsername = myUsername;

      if (fromServer) profileSynced = true;

      // A cache-only snapshot is allowed to ADD what it knows, never to
      // take away what it simply hasn't been told. Only the server gets
      // to clear a username or empty a friends list.
      if (fromServer || data.username) {
        myUsername = data.username || null;
      }
      if (fromServer || Array.isArray(data.friends)) {
        myFriendUids = Array.isArray(data.friends) ? data.friends : [];
      }

      repaintIfFriendSkinsChanged();
      refreshFriendProfiles();

      // gardenSummaries/{uid} is only written when somebody is allowed
      // to read it (see summaryHasAudience in 02-auth-tasks.js). This
      // is the moment that changes: accepting a request rewrites this
      // document's friends array on both sides, so both people publish
      // their summary here — including a user whose garden hasn't been
      // saved since before they had any friends at all.
      if (typeof ensureGardenSummaryPublished === 'function') {
        ensureGardenSummaryPublished();
      }
      if (myUsername && !hadUsername) refreshOpenUsernameModal();
      renderFriendsIfVisible();
    }, function (error) {
      console.error('DISCIPLANT: profile listener failed:', error);
    });

  // The two friend-request listeners are NOT attached here — they wait
  // until the Friends page is actually opened. See
  // startFriendRequestListeners() below.
  //
  // Except in one case: someone can reach the Friends page BEFORE this
  // runs, because navigating there is what triggers guest sign-in in
  // the first place. navigateTo() calls the function below while the
  // sign-in is still in flight, so there is no uid yet and it does
  // nothing. This is the retry for that ordering.
  if (currentPage === 'friends') startFriendRequestListeners();
}

// ============================================
// Friend-request listeners — attached on demand
//
// These two only ever feed the Friends page: nothing else reads
// incomingRequests or outgoingRequests, and there is no unread badge
// anywhere in the nav. Attaching them on sign-in therefore spent two
// Firestore reads on every single page load, for a page most visits
// never open.
//
// They now attach the first time the Friends page is opened, and stay
// attached for the rest of the session — deliberately NOT detached on
// leaving the page, because bouncing in and out would then re-read
// everything on each visit and cost more than it saved. They're torn
// down only by stopFriendsListeners(), i.e. when the user changes.
//
// If you ever add an unread-requests badge to the nav, this has to go
// back to attaching on sign-in: a badge can't count what nobody is
// listening to.
//
// The status filter is what stops these growing forever. Accepting a
// request flips its status to 'accepted' rather than deleting it, so
// without the filter every request you had ever accepted was re-read
// on every attach, for the life of the account. Filtered, both queries
// only ever return what is genuinely outstanding.
//
// NO INDEX IS NEEDED FOR THIS, despite it being a two-clause query.
// Both clauses are equality filters, and Firestore answers those by
// merging the single-field indexes it maintains automatically. A
// composite index only becomes necessary once an equality filter is
// combined with a RANGE filter (>, <, !=) or an orderBy on some other
// field — so if you ever add either to these queries, expect the
// failed-precondition branch below to fire, and follow the link in it.
// ============================================
function startFriendRequestListeners() {
  var uid = friendsListenerUid;
  if (!uid) return;                        // not signed in yet
  if (requestListenerUid === uid) return;  // already listening for this user

  requestListenerUid = uid;

  unsubscribeIncoming = db.collection('friendRequests')
    .where('to', '==', uid)
    .where('status', '==', 'pending')
    .onSnapshot(function (querySnapshot) {
      incomingRequests = collectPendingRequests(querySnapshot);
      renderFriendsIfVisible();
    }, function (error) {
      reportRequestListenerError('incoming', error);
    });

  unsubscribeOutgoing = db.collection('friendRequests')
    .where('from', '==', uid)
    .where('status', '==', 'pending')
    .onSnapshot(function (querySnapshot) {
      outgoingRequests = collectPendingRequests(querySnapshot);
      renderFriendsIfVisible();
    }, function (error) {
      reportRequestListenerError('outgoing', error);
    });
}

function reportRequestListenerError(which, error) {
  if (error && error.code === 'failed-precondition') {
    console.error(
      'DISCIPLANT: the ' + which + ' friend-request query needs a Firestore ' +
      'index that does not exist yet. The message below contains a link ' +
      'that creates it in one click — open it, wait for the index to ' +
      'finish building, then reload.',
      error
    );
    return;
  }
  console.error('DISCIPLANT: ' + which + ' request listener failed:', error);
}


function collectPendingRequests(querySnapshot) {
  var list = [];
  querySnapshot.forEach(function (doc) {
    var data = doc.data() || {};
    // Redundant now that the queries filter on status, and kept
    // anyway: it costs nothing and means a malformed document can
    // never show up as an outstanding request.
    if (data.status !== 'pending') return;
    list.push({
      id:           doc.id,
      from:         data.from,
      to:           data.to,
      fromUsername: data.fromUsername || null,
      toUsername:   data.toUsername   || null,
    });
  });
  return list;
}

// How many friends this user has. Exposed as a function rather than
// letting other files read myFriendUids directly, because 02 loads
// first and needs a typeof-guardable handle (see summaryHasAudience).
function getFriendCount() {
  return Array.isArray(myFriendUids) ? myFriendUids.length : 0;
}


// ============================================
// Username cache (localStorage)
//
// Friends are stored as bare UIDs, so every load used to run a
// `usernames where uid in [...]` query purely to turn those UIDs back
// into names — a read per friend, every single time, for data that
// essentially never changes.
//
// It never changes because the rules forbid it: /usernames has
// `allow update: if false`, so a name, once claimed, is permanently
// bound to that UID. A cached pair can therefore never go stale, which
// is what makes caching it safe rather than merely convenient.
//
// Stored in localStorage, so it survives reloads. Nothing private goes
// in here — usernames are the public directory every signed-in user
// can already read, and the cache holds no UIDs the browser's own user
// wasn't already shown.
// ============================================
var USERNAME_CACHE_KEY = 'disciplant:usernames';
var usernameCache      = readUsernameCache(); // { uid: username }

function readUsernameCache() {
  try {
    var raw    = localStorage.getItem(USERNAME_CACHE_KEY);
    var parsed = raw ? JSON.parse(raw) : null;
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) {
    // Private browsing, storage disabled, or corrupt JSON. An empty
    // cache just means every lookup falls through to Firestore, which
    // is exactly the old behaviour.
    return {};
  }
}

function rememberUsername(uid, username) {
  if (!uid || !username) return;
  if (usernameCache[uid] === username) return;
  usernameCache[uid] = username;
  try {
    localStorage.setItem(USERNAME_CACHE_KEY, JSON.stringify(usernameCache));
  } catch (e) {}
}

// Reverse lookup for the search box. Linear, which is fine — this map
// holds one entry per person you've ever looked up.
function findCachedUidByUsername(lower) {
  for (var uid in usernameCache) {
    if (!Object.prototype.hasOwnProperty.call(usernameCache, uid)) continue;
    if (String(usernameCache[uid]).toLowerCase() === lower) return uid;
  }
  return null;
}

function buildFriendProfilesFromCache() {
  return myFriendUids.map(function (uid) {
    return { uid: uid, username: usernameCache[uid] || null };
  });
}


// Resolves friend UIDs to names, hitting Firestore only for the ones
// the cache has never seen. For a returning user with a settled friend
// list that means ZERO reads, and the names paint instantly instead of
// after a round trip. `in` takes at most 10 values per query, hence
// the chunking of whatever is left over.
function refreshFriendProfiles() {
  if (!myFriendUids.length) {
    friendProfiles = [];
    return;
  }

  // Paint from cache first — a known friend shows their name with no
  // network at all, and any unknown one shows as a nameless entry for
  // the moment it takes to look them up.
  friendProfiles = buildFriendProfilesFromCache();
  renderFriendsIfVisible();

  var unknown = myFriendUids.filter(function (uid) { return !usernameCache[uid]; });
  if (!unknown.length) return;   // everything already known — no query at all

  var chunks = [];
  for (var i = 0; i < unknown.length; i += 10) {
    chunks.push(unknown.slice(i, i + 10));
  }

  Promise.all(chunks.map(function (chunk) {
    return db.collection('usernames').where('uid', 'in', chunk).get();
  })).then(function (snapshots) {
    snapshots.forEach(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        var data = doc.data() || {};
        rememberUsername(data.uid, data.username || doc.id);
      });
    });

    // Rebuilt from the cache, so a friend with no username doc at all
    // (never claimed one) still appears — just without a name, exactly
    // as before. Those UIDs stay uncached and are retried next load,
    // which is what you want: they may claim a name later.
    friendProfiles = buildFriendProfilesFromCache();
    renderFriendsIfVisible();
  }).catch(function (error) {
    console.error('DISCIPLANT: could not resolve friend usernames:', error);
  });
}


// ============================================
// Search
// ============================================
function setFriendsStatus(message, isError) {
  friendsStatusMsg     = message;
  friendsStatusIsError = !!isError;
}

function searchForUsername(raw) {
  var lower = normalizeUsername(raw);

  setFriendsStatus(null, false);

  if (!lower) {
    friendsSearchResult = null;
    renderFriendsPage();
    return;
  }

  // Reads, not writes, so this is a cooldown only and never touches the
  // write budget. Silent: a search fired twice in half a second is a
  // double-tap, and an error message would be noise.
  if (!rateLimit('usernameSearch', USERNAME_SEARCH_COOLDOWN_MS)) return;

  // A name we've already resolved this browser can be answered with no
  // read at all. Only HITS are cached: a miss must always go to the
  // server, since the whole point of searching a name that wasn't
  // there a minute ago is that someone may have just claimed it.
  var cachedUid = findCachedUidByUsername(lower);
  if (cachedUid) {
    friendsSearchResult = { uid: cachedUid, username: usernameCache[cachedUid] };
    renderFriendsPage();
    return;
  }

  friendsBusy = true;
  renderFriendsPage();

  db.collection('usernames').doc(lower).get()
    .then(function (docSnapshot) {
      friendsBusy = false;
      if (!docSnapshot.exists) {
        friendsSearchResult = { notFound: true, query: lower };
      } else {
        var data = docSnapshot.data() || {};
        var name = data.username || lower;
        rememberUsername(data.uid, name);
        friendsSearchResult = { uid: data.uid, username: name };
      }
      renderFriendsPage();
    })
    .catch(function (error) {
      friendsBusy = false;
      friendsSearchResult = null;
      setFriendsStatus('Search failed. Check your connection and try again.', true);
      console.error('DISCIPLANT: username search failed:', error);
      renderFriendsPage();
    });
}

if (friendsSearchForm) {
  friendsSearchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    searchForUsername(friendsSearchInput ? friendsSearchInput.value : '');
  });
}


// ============================================
// Sending, accepting, declining
// ============================================

// Returns a reason the request can't be sent, or null if it can.
function friendRequestBlockedReason(targetUid) {
  if (!currentUserId) return 'Still signing in — try again in a moment.';
  if (!myUsername)    return 'Choose a username first so they know who\u2019s asking.';
  if (!targetUid)     return 'That account looks incomplete.';
  if (targetUid === currentUserId) return 'That\u2019s you.';

  if (myFriendUids.indexOf(targetUid) !== -1) {
    return 'You\u2019re already friends.';
  }
  var alreadySent = outgoingRequests.some(function (r) { return r.to === targetUid; });
  if (alreadySent) return 'Request already sent — waiting on them.';

  var theyAsked = incomingRequests.some(function (r) { return r.from === targetUid; });
  if (theyAsked) return 'They already sent you a request — accept it below.';

  return null;
}

var FRIEND_ACTION_COOLDOWN_MS = 3000;
var USERNAME_CLAIM_COOLDOWN_MS = 3000;
var USERNAME_SEARCH_COOLDOWN_MS = 500;

function sendFriendRequest(targetUid, targetUsername) {
  var blocked = friendRequestBlockedReason(targetUid);
  if (blocked) {
    setFriendsStatus(blocked, true);
    renderFriendsPage();
    return;
  }

  // Stops someone holding the button down, and takes the edge off
  // scripted mass-requesting — though a script that skips this file
  // entirely is unaffected, which is why the real limit has to be a
  // rule. See the rate limiting notes in 01-app-core.js.
  if (!rateLimit('friendRequest', FRIEND_ACTION_COOLDOWN_MS)) {
    setFriendsStatus(
      'Slow down a moment — try again in ' +
      rateLimitWaitSeconds('friendRequest', FRIEND_ACTION_COOLDOWN_MS) + 's.',
      true
    );
    renderFriendsPage();
    return;
  }

  if (!budgetAllowsWrite('sendFriendRequest')) {
    setFriendsStatus('Too many actions at once. Reload the page and try again.', true);
    renderFriendsPage();
    return;
  }

  friendsBusy = true;
  setFriendsStatus(null, false);
  renderFriendsPage();

  var requestId = currentUserId + '_' + targetUid;

  // create-only by rule, so this can never quietly overwrite an
  // existing request between the same two people.
  db.collection('friendRequests').doc(requestId).set({
    from:         currentUserId,
    to:           targetUid,
    fromUsername: myUsername,
    toUsername:   targetUsername || null,
    status:       'pending',
    createdAt:    firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt:    firebase.firestore.FieldValue.serverTimestamp(),
  })
    .then(function () {
      friendsBusy = false;
      setFriendsStatus('Request sent to ' + (targetUsername || 'that gardener') + '.', false);
      renderFriendsPage();
    })
    .catch(function (error) {
      friendsBusy = false;
      if (error && error.code === 'permission-denied') {
        setFriendsStatus('That request couldn\u2019t be sent — you may already have one open with them.', true);
      } else {
        setFriendsStatus('Could not send that request. Try again.', true);
      }
      console.error('DISCIPLANT: sending friend request failed:', error);
      renderFriendsPage();
    });
}

// One atomic batch: my friends list, their friends list, and the
// request doc. The rule that lets me touch THEIR document checks that
// friendRequests/{them}_{me} exists — which it still does from the
// batch's point of view, because rules see the pre-batch state.
function acceptFriendRequest(request) {
  if (!currentUserId || !request) return;
  if (!rateLimit('friendDecision', FRIEND_ACTION_COOLDOWN_MS)) {
    setFriendsStatus('One at a time — try again in a moment.', true);
    renderFriendsPage();
    return;
  }
  if (!budgetAllowsWrite('acceptFriendRequest')) {
    setFriendsStatus('Too many actions at once. Reload the page and try again.', true);
    renderFriendsPage();
    return;
  }

  friendsBusy = true;
  setFriendsStatus(null, false);
  renderFriendsPage();

  var batch      = db.batch();
  var myRef      = db.collection('users').doc(currentUserId);
  var theirRef   = db.collection('users').doc(request.from);
  var requestRef = db.collection('friendRequests').doc(request.id);

  batch.set(myRef, {
    friends: firebase.firestore.FieldValue.arrayUnion(request.from),
  }, { merge: true });

  // Nothing but `friends` may change here — the security rule rejects
  // the whole batch if any other field is touched (no updatedAt).
  batch.update(theirRef, {
    friends: firebase.firestore.FieldValue.arrayUnion(currentUserId),
  });

  batch.update(requestRef, {
    status:    'accepted',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  batch.commit()
    .then(function () {
      friendsBusy = false;
      setFriendsStatus('You\u2019re now friends with ' + (request.fromUsername || 'them') + '.', false);
      renderFriendsPage();
    })
    .catch(function (error) {
      friendsBusy = false;
      setFriendsStatus('Could not accept that request. Try again.', true);
      console.error('DISCIPLANT: accepting friend request failed:', error);
      renderFriendsPage();
    });
}

// Declining deletes the doc rather than marking it, so the sender is
// free to try again later.
function declineFriendRequest(request) {
  removeFriendRequest(request, 'Request declined.');
}

function cancelFriendRequest(request) {
  removeFriendRequest(request, 'Request cancelled.');
}

function removeFriendRequest(request, successMessage) {
  if (!request) return;
  // Shares a clock with accept: they're the same pair of buttons, and
  // a burst of either is the thing worth slowing down.
  if (!rateLimit('friendDecision', FRIEND_ACTION_COOLDOWN_MS)) {
    setFriendsStatus('One at a time — try again in a moment.', true);
    renderFriendsPage();
    return;
  }
  if (!budgetAllowsWrite('removeFriendRequest')) {
    setFriendsStatus('Too many actions at once. Reload the page and try again.', true);
    renderFriendsPage();
    return;
  }

  friendsBusy = true;
  setFriendsStatus(null, false);
  renderFriendsPage();

  db.collection('friendRequests').doc(request.id).delete()
    .then(function () {
      friendsBusy = false;
      setFriendsStatus(successMessage, false);
      renderFriendsPage();
    })
    .catch(function (error) {
      friendsBusy = false;
      setFriendsStatus('Could not update that request. Try again.', true);
      console.error('DISCIPLANT: removing friend request failed:', error);
      renderFriendsPage();
    });
}


// ============================================
// Friend-gated skins
// ============================================
// Two skins in every species unlock on friend count (see
// SKIN_UNLOCK_RULES in 03-plant-art.js). That count lives here, and
// it changes from a snapshot — someone accepting a request across the
// world repaints this user's Greenhouse. Nothing else was listening
// for that, so accepting a third friend would have left the gold skin
// looking locked until the next navigation.
//
// Only a change in how many friend gates are OPEN triggers a repaint:
// going from 11 friends to 12 changes nothing on screen, and render()
// redraws every plant in the garden.
var lastFriendSkinTier = null;

function countOpenFriendSkinGates() {
  if (typeof SKIN_UNLOCK_RULES === 'undefined') return 0;
  var count = getMyFriendCount();
  var open  = 0;
  SKIN_UNLOCK_RULES.forEach(function (rule) {
    if (rule.kind === 'friends' && count >= rule.need) open++;
  });
  return open;
}

function repaintIfFriendSkinsChanged() {
  var tier = countOpenFriendSkinGates();
  if (tier === lastFriendSkinTier) return;
  lastFriendSkinTier = tier;
  // Fires on the first snapshot too, on purpose: the profile can
  // easily arrive after the garden has already been drawn, and a user
  // who signs in with friends already earned should not have to
  // navigate before their gold plants look gold.
  if (typeof render === 'function') render();
}


// ============================================
// Rendering the Friends page
// ============================================
function renderFriendsIfVisible() {
  if (currentPage === 'friends' && authReady) renderFriendsPage();
}

function friendRowHtml(name, subLabel, actionsHtml) {
  return (
    '<li class="friend-item">' +
      '<span class="friend-name">' + escapeHtml(name) + '</span>' +
      (subLabel ? '<span class="friend-sub">' + escapeHtml(subLabel) + '</span>' : '') +
      '<span class="friend-actions">' + actionsHtml + '</span>' +
    '</li>'
  );
}

function renderFriendsMe() {
  if (!friendsMeEl) return;

  if (myUsername) {
    friendsMeEl.innerHTML =
      '<span class="friend-name">@' + escapeHtml(myUsername) + '</span>' +
      '<span class="friend-sub">Share this so friends can find you</span>';
    return;
  }

  // Until the server has actually answered, "no username" is just the
  // empty local cache talking (see the profile listener). Saying so
  // out loud to someone who has had one for months is the same wrong
  // claim the old startup prompt used to make — so say nothing yet.
  if (!profileSynced) {
    friendsMeEl.innerHTML =
      '<span class="friend-sub">Loading your profile\u2026</span>';
    return;
  }

  friendsMeEl.innerHTML =
    '<span class="friend-sub">You don\u2019t have a username yet — friends can\u2019t find you without one.</span>' +
    '<span class="friend-actions">' +
      '<button class="friend-btn is-primary" data-friend-action="choose-username" type="button">Choose a username</button>' +
    '</span>';
}

function renderFriendsSearchResult() {
  if (!friendsSearchResultEl) return;

  if (friendsBusy && !friendsSearchResult) {
    friendsSearchResultEl.innerHTML = '<p class="friend-sub">Searching\u2026</p>';
    return;
  }

  if (!friendsSearchResult) {
    friendsSearchResultEl.innerHTML = '';
    return;
  }

  if (friendsSearchResult.notFound) {
    friendsSearchResultEl.innerHTML =
      '<p class="friend-sub">No gardener called \u201C' +
      escapeHtml(friendsSearchResult.query) + '\u201D. Check the spelling.</p>';
    return;
  }

  var blocked = friendRequestBlockedReason(friendsSearchResult.uid);
  var actionsHtml = blocked
    ? '<span class="friend-sub">' + escapeHtml(blocked) + '</span>'
    : '<button class="friend-btn is-primary" type="button" data-friend-action="send" ' +
        'data-friend-uid="' + escapeHtml(friendsSearchResult.uid) + '" ' +
        'data-friend-username="' + escapeHtml(friendsSearchResult.username) + '"' +
        (friendsBusy ? ' disabled' : '') + '>Send request</button>';

  friendsSearchResultEl.innerHTML =
    '<ul class="friends-list">' +
      friendRowHtml('@' + friendsSearchResult.username, null, actionsHtml) +
    '</ul>';
}

function renderFriendsRequests() {
  if (friendsIncomingList) {
    friendsIncomingList.innerHTML = incomingRequests.map(function (request) {
      var actions =
        '<button class="friend-btn is-primary" type="button" data-friend-action="accept" ' +
          'data-friend-request="' + escapeHtml(request.id) + '"' +
          (friendsBusy ? ' disabled' : '') + '>Accept</button>' +
        '<button class="friend-btn" type="button" data-friend-action="decline" ' +
          'data-friend-request="' + escapeHtml(request.id) + '"' +
          (friendsBusy ? ' disabled' : '') + '>Decline</button>';
      return friendRowHtml('@' + (request.fromUsername || 'unknown'), 'wants to be friends', actions);
    }).join('');
  }
  if (friendsIncomingEmpty) {
    friendsIncomingEmpty.classList.toggle('hidden', incomingRequests.length > 0);
  }

  if (friendsOutgoingList) {
    friendsOutgoingList.innerHTML = outgoingRequests.map(function (request) {
      var actions =
        '<button class="friend-btn" type="button" data-friend-action="cancel" ' +
          'data-friend-request="' + escapeHtml(request.id) + '"' +
          (friendsBusy ? ' disabled' : '') + '>Cancel</button>';
      return friendRowHtml('@' + (request.toUsername || 'unknown'), 'waiting for a reply', actions);
    }).join('');
  }
  if (friendsOutgoingEmpty) {
    friendsOutgoingEmpty.classList.toggle('hidden', outgoingRequests.length > 0);
  }
}

function renderFriendsList() {
  if (friendsListEl) {
    friendsListEl.innerHTML = friendProfiles.map(function (friend) {
      var name = friend.username ? '@' + friend.username : 'A gardener with no username';
      // Opens the read-only garden view (07). What that page can show
      // is limited by gardenSummaries/{uid}, not by anything decided
      // here — their task text is never readable by this client.
      var actions =
        '<button class="friend-btn" type="button" data-friend-action="view-garden" ' +
          'data-friend-uid="' + escapeHtml(friend.uid) + '" ' +
          'data-friend-username="' + escapeHtml(friend.username || '') + '">View garden</button>';
      return friendRowHtml(name, null, actions);
    }).join('');
  }
  if (friendsEmptyEl) {
    friendsEmptyEl.classList.toggle('hidden', friendProfiles.length > 0);
  }
}

function renderFriendsStatus() {
  if (!friendsStatusEl) return;
  friendsStatusEl.textContent = friendsStatusMsg || '';
  friendsStatusEl.classList.toggle('hidden', !friendsStatusMsg);
  friendsStatusEl.classList.toggle('is-error', friendsStatusIsError);
}

function renderFriendsPage() {
  renderFriendsMe();
  renderFriendsSearchResult();
  renderFriendsRequests();
  renderFriendsList();
  renderFriendsStatus();
}


// ============================================
// Click delegation — every list is re-rendered, so the handler lives
// on the page container rather than on the buttons themselves.
// ============================================
if (friendsContent) {
  friendsContent.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-friend-action]');
    if (!btn) return;

    var action = btn.getAttribute('data-friend-action');

    if (action === 'choose-username') {
      openUsernameModal();
      return;
    }

    if (action === 'view-garden') {
      // 07 loads after this file; guarded the same way as the other
      // cross-file calls in the codebase.
      if (typeof openFriendGarden === 'function') {
        openFriendGarden(
          btn.getAttribute('data-friend-uid'),
          btn.getAttribute('data-friend-username') || null
        );
      }
      return;
    }

    if (action === 'send') {
      sendFriendRequest(
        btn.getAttribute('data-friend-uid'),
        btn.getAttribute('data-friend-username')
      );
      return;
    }

    var requestId = btn.getAttribute('data-friend-request');
    if (!requestId) return;

    if (action === 'accept') {
      acceptFriendRequest(findRequestById(incomingRequests, requestId));
    } else if (action === 'decline') {
      declineFriendRequest(findRequestById(incomingRequests, requestId));
    } else if (action === 'cancel') {
      cancelFriendRequest(findRequestById(outgoingRequests, requestId));
    }
  });
}

function findRequestById(list, requestId) {
  return list.find(function (r) { return r.id === requestId; }) || null;
}


// ============================================
// Kick things off
// ============================================
// The auth observer in 02 calls startFriendsListeners() whenever the
// signed-in uid changes. This catch-up call covers the (unlikely) case
// where auth resolved before this file finished loading.
if (currentUserId) startFriendsListeners(currentUserId);