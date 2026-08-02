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

// Set to false if you'd rather not interrupt a first-time visitor:
// the modal then only appears when they open the Friends page (or
// tap "Choose a username" there).
var PROMPT_USERNAME_ON_LOAD = true;


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
var usernamePromptShown   = false;

var friendsListenerUid  = null;
var unsubscribeProfile  = null;
var unsubscribeIncoming = null;
var unsubscribeOutgoing = null;


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

// Only auto-opens once per page load, and never on top of the auth
// modal (which the user is more likely to be mid-way through).
function maybePromptForUsername() {
  if (myUsername) return;
  if (usernamePromptShown) return;
  if (!currentUserId) return;
  if (authModalEl && !authModalEl.classList.contains('hidden')) return;
  if (!PROMPT_USERNAME_ON_LOAD && currentPage !== 'friends') return;

  usernamePromptShown = true;
  openUsernameModal();
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
}

function startFriendsListeners(uid) {
  if (!uid) return;
  if (friendsListenerUid === uid) return; // already listening for this user

  stopFriendsListeners();
  friendsListenerUid = uid;

  // Reset per-user state so a signed-out user's data never lingers.
  myUsername       = null;
  myFriendUids     = [];
  friendProfiles   = [];
  incomingRequests = [];
  outgoingRequests = [];
  friendsSearchResult = null;
  friendsStatusMsg    = null;

  unsubscribeProfile = db.collection('users').doc(uid)
    .onSnapshot(function (docSnapshot) {
      var data = docSnapshot.exists ? (docSnapshot.data() || {}) : {};
      myUsername   = data.username || null;
      myFriendUids = Array.isArray(data.friends) ? data.friends : [];
      refreshFriendProfiles();
      maybePromptForUsername();
      renderFriendsIfVisible();
    }, function (error) {
      console.error('DISCIPLANT: profile listener failed:', error);
    });

  // Single-field queries on purpose — adding a status filter here would
  // turn each one into a composite query needing a manual index, so the
  // status check happens in collectPendingRequests() instead.
  unsubscribeIncoming = db.collection('friendRequests').where('to', '==', uid)
    .onSnapshot(function (querySnapshot) {
      incomingRequests = collectPendingRequests(querySnapshot);
      renderFriendsIfVisible();
    }, function (error) {
      console.error('DISCIPLANT: incoming request listener failed:', error);
    });

  unsubscribeOutgoing = db.collection('friendRequests').where('from', '==', uid)
    .onSnapshot(function (querySnapshot) {
      outgoingRequests = collectPendingRequests(querySnapshot);
      renderFriendsIfVisible();
    }, function (error) {
      console.error('DISCIPLANT: outgoing request listener failed:', error);
    });
}

function collectPendingRequests(querySnapshot) {
  var list = [];
  querySnapshot.forEach(function (doc) {
    var data = doc.data() || {};
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

// Friends are stored as bare UIDs, so names come from the usernames
// collection. `in` takes at most 10 values per query, hence the chunking.
function refreshFriendProfiles() {
  if (!myFriendUids.length) {
    friendProfiles = [];
    return;
  }

  var chunks = [];
  for (var i = 0; i < myFriendUids.length; i += 10) {
    chunks.push(myFriendUids.slice(i, i + 10));
  }

  Promise.all(chunks.map(function (chunk) {
    return db.collection('usernames').where('uid', 'in', chunk).get();
  })).then(function (snapshots) {
    var found = [];
    snapshots.forEach(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        var data = doc.data() || {};
        found.push({ uid: data.uid, username: data.username || doc.id });
      });
    });

    // A friend with no username doc (claimed one, deleted it) still
    // belongs on the list — just without a name.
    myFriendUids.forEach(function (uid) {
      var known = found.some(function (f) { return f.uid === uid; });
      if (!known) found.push({ uid: uid, username: null });
    });

    friendProfiles = found;
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

  friendsBusy = true;
  renderFriendsPage();

  db.collection('usernames').doc(lower).get()
    .then(function (docSnapshot) {
      friendsBusy = false;
      if (!docSnapshot.exists) {
        friendsSearchResult = { notFound: true, query: lower };
      } else {
        var data = docSnapshot.data() || {};
        friendsSearchResult = { uid: data.uid, username: data.username || lower };
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

function sendFriendRequest(targetUid, targetUsername) {
  var blocked = friendRequestBlockedReason(targetUid);
  if (blocked) {
    setFriendsStatus(blocked, true);
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
