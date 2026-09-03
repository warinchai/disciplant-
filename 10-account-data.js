// ============================================
// 10: ACCOUNT DATA — export and permanent deletion
// Part of DISCIPLANT — a new file, not a split of an old one.
// Loaded as a plain global script (no modules), AFTER 07, so
// everything it calls already exists: db/auth (firebase-config.js),
// currentUserId + tasks (01), clearPerAccountState + saveData (02),
// escapeHtml (04), myUsername/myFriendUids/stopFriendsListeners (06),
// clearFriendGardenStateOnSignOut (07).
//
// Numbered 10 rather than 08 because 08-home-stats.js and
// 09-dev-mode.js already own those numbers. Its <script> tag sits
// directly after 07's, ABOVE the two commented-out ones, because
// unlike those this file ships.
//
//
// WHAT THIS FILE IS FOR
//
// Two rights, one screen. Under Thailand's PDPA (and the same idea
// appears in Singapore's PDPA, the GDPR and most modern privacy law)
// a person can ask for a copy of what you hold about them, and can
// ask you to erase it. Habit text makes that sharper than it looks:
// "physio for my knee", "take lithium", "AA meeting" are all
// perfectly ordinary things to track, and all of them are health data
// under PDPA s.26. Nothing here is a substitute for a privacy policy
// naming a controller and a contact address — but a working delete
// button is the part of compliance that has to live in the product.
//
//
// WHAT GETS DELETED, AND IN WHAT ORDER
//
//   1. friends    — my uid comes off every friend's users document
//                   FIRST, while my own friends array still exists to
//                   say who they are. Once step 3 runs, that list is
//                   gone and there is no way to find them again.
//   2. requests   — every friendRequests document with me on either
//                   side, in either direction, at any status.
//   3. my data    — gardens/{uid}, gardenSummaries/{uid}, users/{uid}
//                   and my /usernames reservation, in ONE atomic
//                   batch. The security rules refuse any of the four
//                   unless all four go, so a half-deleted account is
//                   not a state that can exist.
//   4. this device — listeners detached, in-memory state emptied,
//                   localStorage caches cleared.
//   5. the login  — the Firebase Auth user itself, which is what
//                   holds the email address and the Google link.
//
// Auth goes LAST because deleting it first would throw away the
// credential every step above needs. If it fails at the end, the data
// really is gone and only the empty sign-in remains, which the UI
// says plainly rather than claiming success.
//
//
// WHAT SURVIVES, AND WHY
//
//   * /stats/global — three integers, no names, no uids. Rewritten
//     from scratch by recompute-stats.js, so the next run simply
//     counts one fewer gardener. Nothing to erase.
//   * Google Analytics and Vercel's request logs. Neither is in this
//     database and neither can be reached from a browser; they are a
//     retention-policy question for the privacy policy, not a code
//     one.
//   * Firestore's own backups, for as long as Google keeps them.
//   * 'disciplant:dailyGrowth' in localStorage — a per-device display
//     preference that records nothing about who was signed in. Left
//     alone here for the same reason sign-out leaves it alone.
// ============================================


// True from the moment a deletion actually starts until the page
// reloads. Everything that writes checks it: a save landing after the
// documents are gone would recreate the garden and undo the erasure.
var accountDeletionInProgress = false;

// Two more flags, because "a deletion is running" and "the tab must
// not be closed" and "the documents are already gone" stop being the
// same thing the moment something fails.
//
//   deletionBlocksUnload  - armed only while writes are in flight, so
//                           the beforeunload prompt does not fire on
//                           the reload this file triggers itself.
//   deletionDocsGone      - once true, there is no going back to the
//                           app: the in-memory state describes an
//                           account that no longer exists, so every
//                           exit from here has to be a page reload.
var deletionBlocksUnload = false;
var deletionDocsGone     = false;

var DELETE_CONFIRM_WORD = 'DELETE';

// Firestore caps a batch at 500 operations. Friend removals are one
// write each, so anyone with more friends than this gets several
// batches. Well under the limit on purpose — a batch that fails is
// retried whole.
var DELETE_BATCH_SIZE = 200;


// ============================================
// DOM references
// ============================================
var accountModalEl        = document.getElementById('accountModal');
var accountModalBackdrop  = document.getElementById('accountModalBackdrop');
var accountModalCard      = document.getElementById('accountModalCard');
var accountModalClose     = document.getElementById('accountModalClose');
var accountModalBody      = document.getElementById('accountModalBody');
var accountModalStatusEl  = document.getElementById('accountModalStatus');

var accountModalOpen   = false;
var accountModalBusy   = false;
var accountReturnFocus = null;   // what to hand focus back to on close


// ============================================
// Export — "Download my data"
//
// Built entirely from what is already in memory, so it costs zero
// Firestore reads and cannot be used to pull anything the signed-in
// user could not already see on screen.
//
// It deliberately does NOT include other people's uids. A friends
// list is as much a fact about them as about you, and a portability
// export is not a licence to hand out identifiers for other accounts.
// The count is there instead, which is the part that is about you.
// ============================================
function buildAccountExport() {
  var profile = (typeof currentUserProfile === 'object' && currentUserProfile) || {};

  return {
    export_format:    'disciplant.account.v1',
    exported_at:      new Date().toISOString(),
    note:
      'Everything Disciplant holds about this account, taken from the ' +
      'live session. Aggregate community counters are not included ' +
      'because they identify nobody. Analytics and web-server logs are ' +
      'held by Google and Vercel respectively and are not part of this ' +
      'application database.',

    account: {
      user_id:      (typeof currentUserId === 'string') ? currentUserId : null,
      sign_in:      profile.isAnonymous ? 'guest (no email)' : 'Google',
      display_name: profile.displayName || null,
      email:        profile.email || null,
      username:     (typeof myUsername === 'string') ? myUsername : null,
    },

    friends: {
      count: (typeof myFriendUids !== 'undefined' && myFriendUids) ? myFriendUids.length : 0,
      note:  'Other people\u2019s account identifiers are deliberately left out.',
    },

    habits: (typeof tasks !== 'undefined' && tasks ? tasks : []).map(function (t) {
      return {
        habit:              t.text,
        category:           t.categoryId,
        plant_skin:         t.skinId,
        // 'habit' repeats; 'once' is a one-off assignment, which
        // holds no streak and never unticks itself overnight.
        type:               t.kind || 'habit',
        // null means every day. Otherwise seven characters, Sunday
        // first, one per weekday.
        schedule:           t.schedule || null,
        // Inferred from the first completed day for habits that
        // predate the field, so it is a best estimate rather than a
        // record for anything planted before September 2026.
        planted_on:         t.createdAt || null,
        due_on:             t.due || null,
        finished_on:        t.doneAt || null,
        notes:              t.notes || '',
        steps:              (t.subtasks || []).map(function (s) {
          return { step: s.text, done: !!s.done };
        }),
        done_today:         !!t.completed,
        current_streak:     t.streak,
        longest_streak:     t.maxStreak,
        days_grown:         t.totalGrowthDays,
        most_days_grown:    t.maxGrowthDays,
        // Only assignments carry one, and it is what finishing this
        // was worth in growth days. Exported because it is something
        // the person told the app about their own work, which is
        // exactly the kind of thing an export exists to hand back.
        impact:             (t.kind === 'once')
                              ? normalizeImpact(t.impact) : null,
        // Expanded back out of the packed year strings, so this
        // field is identical to what it was before history was
        // packed: same name, same 'YYYY-MM-DD' strings, same order.
        // An export taken before that change and one taken after
        // are the same document.
        completed_on:       histDates(t.history),
      };
    }),

    garden: {
      landscape_skin: (typeof gardenSkinId !== 'undefined') ? gardenSkinId : null,
      last_day_roll:  (typeof lastResetDate !== 'undefined') ? lastResetDate : null,
    },
  };
}

function downloadAccountExport() {
  var json = JSON.stringify(buildAccountExport(), null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);

  var a = document.createElement('a');
  a.href     = url;
  a.download = 'disciplant-my-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke on a tick rather than immediately: Safari has been known to
  // abandon the download if the object URL dies in the same frame.
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

  setAccountStatus('Your data has been downloaded as disciplant-my-data.json.', false);
}


// ============================================
// Deletion, step by step
// ============================================

// Step 1 — take my uid off every friend's document.
//
// This has to happen while users/{me}.friends still exists, because
// that array is the only record of who those people are. It is read
// fresh rather than trusted from memory: 06's copy is only populated
// once the Friends page has been visited, and someone who never opened
// it would otherwise leave their uid sitting on other people's
// documents forever.
//
// The rule that permits this (see users/{uid} in firestore.rules)
// allows removing exactly one entry, my own, and touching no other
// field. It cannot add anyone, cannot remove anyone else, and cannot
// reach the owner's counters.
function severFriendships(uid, friendUids) {
  if (!friendUids.length) return Promise.resolve({ removed: 0, failed: 0 });

  var chunks = [];
  for (var i = 0; i < friendUids.length; i += DELETE_BATCH_SIZE) {
    chunks.push(friendUids.slice(i, i + DELETE_BATCH_SIZE));
  }

  var removed = 0;
  var failed  = 0;

  function removeOne(friendUid) {
    return db.collection('users').doc(friendUid)
      .update({ friends: firebase.firestore.FieldValue.arrayRemove(uid) })
      .then(function () { removed++; })
      .catch(function () {
        // Counted, not named, and never rethrown. Two ordinary things
        // land here: a friend document that has already had this uid
        // taken off it (the rule requires my uid to still be present,
        // precisely so nobody can hammer a stranger's document with
        // no-ops, which means a retried deletion legitimately fails on
        // everyone it already reached), and an account that has since
        // deleted itself.
        failed++;
      });
  }

  // A batch is one write per friend and commits atomically, which is
  // what we want for speed - but atomically is also the problem: one
  // unwritable document among two hundred would reject the other one
  // hundred and ninety-nine. So a failed batch is retried one document
  // at a time, and whatever still will not budge is counted and
  // stepped over.
  //
  // The asymmetry is deliberate. Failing to write to somebody ELSE'S
  // document must never be able to block a person from deleting their
  // own account - a right to erasure that any third party's data can
  // veto is not a right. The user's own four documents, below, are the
  // opposite: those are all-or-nothing.
  return chunks.reduce(function (chain, chunk) {
    return chain.then(function () {
      var batch = db.batch();
      chunk.forEach(function (friendUid) {
        batch.update(db.collection('users').doc(friendUid), {
          friends: firebase.firestore.FieldValue.arrayRemove(uid),
        });
      });

      return batch.commit()
        .then(function () { removed += chunk.length; })
        .catch(function () {
          return chunk.reduce(function (inner, friendUid) {
            return inner.then(function () { return removeOne(friendUid); });
          }, Promise.resolve());
        });
    });
  }, Promise.resolve()).then(function () {
    if (failed) {
      console.warn(
        'DISCIPLANT: ' + failed + ' of ' + friendUids.length + ' friend links ' +
        'could not be removed (already gone, or that account no longer exists). ' +
        'Continuing with the deletion.'
      );
    }
    return { removed: removed, failed: failed };
  });
}


// Step 2 — every friend request with me on either side.
//
// Two queries, because Firestore has no OR across fields. Neither
// filters on status, and that matters: accepting a request marks it
// `accepted` and leaves the document in place, so filtering on
// 'pending' the way the Friends page does would walk straight past
// every friendship this account ever formed. Each of those documents
// carries both uids and the sender's username.
function deleteFriendRequests(uid) {
  var requests = db.collection('friendRequests');

  return Promise.all([
    requests.where('from', '==', uid).get(),
    requests.where('to',   '==', uid).get(),
  ]).then(function (snapshots) {
    var refs = [];
    var seen = {};

    snapshots.forEach(function (snapshot) {
      snapshot.forEach(function (docSnapshot) {
        if (seen[docSnapshot.id]) return;   // a request to myself would appear twice
        seen[docSnapshot.id] = true;
        refs.push(docSnapshot.ref);
      });
    });

    if (!refs.length) return 0;

    var chunks = [];
    for (var i = 0; i < refs.length; i += DELETE_BATCH_SIZE) {
      chunks.push(refs.slice(i, i + DELETE_BATCH_SIZE));
    }

    return chunks.reduce(function (chain, chunk) {
      return chain.then(function () {
        var batch = db.batch();
        chunk.forEach(function (ref) { batch.delete(ref); });
        return batch.commit();
      });
    }, Promise.resolve()).then(function () { return refs.length; });
  });
}


// Step 3 — my own four documents, atomically.
//
// One batch, because the security rules make it the only shape that
// can succeed: each delete checks, via existsAfter(), that the others
// are going too. Split this into separate commits and every one of
// them is denied.
function deleteOwnDocuments(uid, usernameLower) {
  var batch = db.batch();

  batch.delete(db.collection('gardens').doc(uid));
  batch.delete(db.collection('gardenSummaries').doc(uid));
  batch.delete(db.collection('users').doc(uid));

  // Only if one was ever claimed. Deleting a document that does not
  // exist is a no-op to Firestore but still evaluates the rule, and
  // /usernames/{name} reads resource.data.uid — which is null for a
  // document that was never there, so the rule would deny and take the
  // whole batch down with it.
  if (usernameLower) {
    batch.delete(db.collection('usernames').doc(usernameLower));
  }

  return batch.commit();
}


// Step 4 — this browser.
//
// Detaching the listeners first is not tidiness. The gardens listener
// fires the moment its document disappears, lands in the "no document"
// branch of 02's snapshot handler, and that branch can call saveData()
// — which would write the garden straight back. accountDeletionInProgress
// is the belt to this file's braces.
function wipeLocalAccountState() {
  if (typeof unsubscribeSnapshot === 'function') {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  if (typeof stopFriendsListeners === 'function') stopFriendsListeners();

  // Cancels a throttled save that is still sitting on its timer.
  if (typeof pendingSaveTimer !== 'undefined' && pendingSaveTimer) {
    clearTimeout(pendingSaveTimer);
    pendingSaveTimer = null;
  }

  // Everything sign-out clears — rate-limit windows, the profile
  // signature, the friends and friend-garden state, the localStorage
  // username cache — plus the in-memory garden itself, which sign-out
  // leaves for the next snapshot to overwrite. There is no next
  // snapshot here.
  if (typeof clearPerAccountState === 'function') clearPerAccountState();

  if (typeof tasks !== 'undefined')         tasks = [];
  if (typeof lastResetDate !== 'undefined') lastResetDate = null;
  if (typeof gardenSkinId !== 'undefined')  gardenSkinId = null;
  if (typeof currentUserId !== 'undefined') currentUserId = null;
}


// Step 5 — the Auth user, which is where the email address lives.
//
// Deleting a user is a "recent login required" operation, so for a
// Google account this is preceded by a reauthentication popup. That
// popup is fired from the click handler, BEFORE any of the async work
// above, because a browser only honours window.open while the user
// gesture that opened it is still fresh — the same activation-token
// problem that broke the sign-in retry path in 02. By the time three
// Firestore round trips have finished, the gesture is spent.
//
// A guest has no credential to re-present and no email to erase, so it
// skips straight through.
function deleteAuthUser(user) {
  return user.delete();
}

function reauthenticateBeforeDelete(user) {
  if (user.isAnonymous) return Promise.resolve();

  return user.reauthenticateWithPopup(googleProvider).then(function () {});
}


// ============================================
// The whole flow
// ============================================
function runAccountDeletion() {
  var user = auth.currentUser;
  if (!user) {
    setAccountStatus(
      'You are not signed in, so there is nothing here to delete. Reload the page and try again.',
      true
    );
    return;
  }

  var uid = user.uid;

  accountModalBusy          = true;
  accountDeletionInProgress = true;
  deletionBlocksUnload      = true;
  renderAccountModal();
  setAccountStatus('Reading your account\u2026', false);

  // Fresh read rather than 06's cached copy — see severFriendships().
  db.collection('users').doc(uid).get()
    .then(function (docSnapshot) {
      var data          = docSnapshot.exists ? (docSnapshot.data() || {}) : {};
      var friendUids    = Array.isArray(data.friends) ? data.friends : [];
      var usernameLower = (typeof data.usernameLower === 'string') ? data.usernameLower : null;

      setAccountStatus('Removing you from friends\u2019 gardens\u2026', false);

      return severFriendships(uid, friendUids)
        .then(function () {
          setAccountStatus('Clearing friend requests\u2026', false);
          return deleteFriendRequests(uid);
        })
        .then(function () {
          setAccountStatus('Deleting your garden and profile\u2026', false);
          return deleteOwnDocuments(uid, usernameLower);
        })
        .then(function () { deletionDocsGone = true; });
    })
    .then(function () {
      setAccountStatus('Signing you out of this device\u2026', false);
      wipeLocalAccountState();
      return deleteAuthUser(user);
    })
    .then(function () {
      finishDeletion(
        'Your account has been deleted. Nothing of it is left in Disciplant.'
      );
    })
    .catch(function (error) {
      handleDeletionFailure(error);
    });
}

// The one failure worth separating out: the documents are gone but the
// login is not. Saying "something went wrong" there would be a lie in
// the direction that matters — the user's data really has been erased,
// and they should not be left thinking it might not have been.
function handleDeletionFailure(error) {
  var code = (error && error.code) || '';
  console.error('DISCIPLANT: account deletion failed:', error);

  accountModalBusy = false;

  // Everything below this line means the four documents ARE gone and
  // only the empty sign-in is left. Say so exactly: telling someone
  // "it failed" when their data has in fact been erased is the wrong
  // lie in the worse direction, and it invites them to try again
  // looking for something that is not there.
  if (deletionDocsGone) {
    if (code === 'auth/requires-recent-login') {
      finishDeletion(
        'Your garden, habits, profile and friend connections have all been ' +
        'deleted. Only the empty sign-in itself is left, because this ' +
        'session was too old to confirm. Sign in once more and use this ' +
        'screen again to remove it.'
      );
    } else {
      finishDeletion(
        'Your garden, habits, profile and friend connections have all been ' +
        'deleted. The empty sign-in could not be removed just now \u2014 it ' +
        'holds nothing but an account number. Use this screen again to ' +
        'remove it, or contact us.'
      );
    }
    return;
  }

  // Nothing was deleted, or only the reversible parts were. Safe to
  // hand the app back.
  accountDeletionInProgress = false;
  deletionBlocksUnload      = false;

  if (code === 'permission-denied') {
    setAccountStatus(
      'Disciplant could not delete your account. Your data has not been ' +
      'half-removed \u2014 the deletion is written as one all-or-nothing step. ' +
      'Reload the page and try again, and contact us if it keeps failing.',
      true
    );
  } else {
    setAccountStatus(
      'Deletion did not complete. Reload the page and try again, and contact ' +
      'us if it keeps failing.',
      true
    );
  }

  renderAccountModal();
}

// Deletion is done (or done as far as it is going to get). The page is
// reloaded rather than re-rendered: half this app's state lives in
// module-level variables set up at load, and rebuilding it by hand for
// an account that no longer exists is far more likely to leave
// something stale on screen than starting over is.
var accountDeletionFinished = false;

function finishDeletion(message) {
  accountModalBusy        = false;
  deletionBlocksUnload    = false;   // or the reload below prompts
  accountDeletionFinished = true;    // accountDeletionInProgress stays set
  renderAccountModal();
  setAccountStatus(message, false);

  // Long enough to read the sentence, short enough that nobody sits
  // looking at an app whose account no longer exists. location.replace
  // rather than reload() so the dead page leaves no history entry to
  // go Back into.
  setTimeout(function () { location.replace(location.pathname); }, 5000);
}


// ============================================
// The modal
//
// Built to the accessibility bar the rest of this round is meant to
// set, because an irreversible action is the worst possible place to
// need a mouse and working eyesight:
//
//   * role="dialog" + aria-modal, labelled by its own heading, so a
//     screen reader announces what it has landed in.
//   * Focus moves in on open and back to the button that opened it on
//     close, and Tab is trapped inside while it is up. Without the
//     trap, Tab walks out into the page behind and a keyboard user is
//     stranded in content that is visually covered.
//   * A real <label for> on the confirmation field. Placeholder text
//     is not a label: it disappears the moment you type, and several
//     screen readers ignore it entirely.
//   * Progress and errors go through one aria-live region, so each
//     step is spoken as it happens rather than silently repainting.
//   * The destructive button is disabled until the word is typed, and
//     says so in text — never by colour alone.
//   * Escape closes, except mid-deletion, when there is nothing safe
//     to cancel back to.
// ============================================

function setAccountStatus(message, isError) {
  if (!accountModalStatusEl) return;
  accountModalStatusEl.textContent = message || '';
  accountModalStatusEl.classList.toggle('is-error', !!isError);
  accountModalStatusEl.classList.toggle('hidden', !message);
}

function openAccountModal() {
  if (!accountModalEl) return;

  // Where focus goes when this closes. The button that opened it has
  // usually just been removed from the document (the auth modal closes
  // first), which leaves document.activeElement as <body> - focus on
  // <body> means a keyboard user is dropped back at the very top of
  // the page. The account pill is the honest destination: it is what
  // they were operating, and it is always present.
  var opener = document.activeElement;
  accountReturnFocus = (opener && opener !== document.body)
    ? opener
    : (typeof authWidgetBtn !== 'undefined' ? authWidgetBtn : null);
  accountModalOpen   = true;
  accountModalBusy   = false;
  accountDeletionInProgress = false;

  accountModalEl.classList.remove('hidden');
  accountModalEl.removeAttribute('aria-hidden');
  setAccountStatus(null, false);
  renderAccountModal();

  // Focus the heading rather than the first control: a dialog whose
  // first announcement is "Delete account, edit text" tells the user
  // what to type before it tells them what they are in.
  var heading = document.getElementById('accountModalTitle');
  if (heading) heading.focus();
}

function closeAccountModal() {
  if (!accountModalEl) return;
  if (accountModalBusy) return;   // nothing to cancel back to mid-flight

  accountModalOpen = false;
  accountModalEl.classList.add('hidden');
  accountModalEl.setAttribute('aria-hidden', 'true');

  if (accountReturnFocus && typeof accountReturnFocus.focus === 'function') {
    accountReturnFocus.focus();
  }
  accountReturnFocus = null;
}

function renderAccountModal() {
  if (!accountModalBody) return;

  var profile   = (typeof currentUserProfile === 'object' && currentUserProfile) || {};
  var isGuest   = !!profile.isAnonymous;
  var habitCount = (typeof tasks !== 'undefined' && tasks) ? tasks.length : 0;

  if (accountModalBusy) {
    accountModalBody.innerHTML =
      '<h2 class="account-modal-title" id="accountModalTitle" tabindex="-1">Deleting your account</h2>' +
      '<p class="account-modal-lede">This takes a few seconds. Please keep this tab open.</p>';
    if (accountModalClose) accountModalClose.disabled = true;
    return;
  }

  // Done. Offering "Download my data" or "Delete my account" again to
  // someone whose account has just gone would be nonsense, and the
  // reload is already on its way.
  if (accountDeletionFinished) {
    accountModalBody.innerHTML =
      '<h2 class="account-modal-title" id="accountModalTitle" tabindex="-1">Account deleted</h2>' +
      '<p class="account-modal-lede">Disciplant is reloading as a fresh visitor.</p>';
    if (accountModalClose) accountModalClose.disabled = true;
    return;
  }

  if (accountModalClose) accountModalClose.disabled = false;

  var habitLine = habitCount === 1
    ? '1 habit and the plant grown from it'
    : habitCount + ' habits and the plants grown from them';

  accountModalBody.innerHTML =
    '<h2 class="account-modal-title" id="accountModalTitle" tabindex="-1">Your data</h2>' +

    '<section class="account-block">' +
      '<h3 class="account-block-title">Download a copy</h3>' +
      '<p class="account-block-text">' +
        'Everything Disciplant holds about you, as a JSON file: ' + escapeHtml(habitLine) +
        ', your streaks, every day you ticked off, and your account details.' +
      '</p>' +
      '<button id="accountExportBtn" class="account-btn" type="button">Download my data</button>' +
    '</section>' +

    '<section class="account-block account-block-danger">' +
      '<h3 class="account-block-title">Delete this account</h3>' +
      '<p class="account-block-text">Deleting removes, permanently and straight away:</p>' +
      '<ul class="account-list">' +
        '<li>your habits, streaks and full day-by-day history</li>' +
        '<li>your garden, its layout and its landscape</li>' +
        '<li>your username, which becomes free for someone else to take</li>' +
        '<li>your profile' + (isGuest ? '' : ', including your email address') + '</li>' +
        '<li>your friend connections \u2014 you disappear from their friends lists</li>' +
        '<li>every friend request you have sent or received</li>' +
        '<li>your sign-in itself</li>' +
      '</ul>' +
      '<p class="account-block-text account-block-note">' +
        'There is no undo and no recovery period. The community counters on ' +
        'the home page are totals only and name nobody, so they are not ' +
        'affected. Download your data first if you want to keep it.' +
      '</p>' +

      '<label class="account-label" for="accountConfirmInput">' +
        'Type ' + DELETE_CONFIRM_WORD + ' to confirm' +
      '</label>' +
      '<input id="accountConfirmInput" class="account-input" type="text"' +
        ' autocomplete="off" autocapitalize="characters" spellcheck="false"' +
        ' aria-describedby="accountConfirmHelp" />' +
      '<p class="account-help" id="accountConfirmHelp">' +
        'The button below stays switched off until the word matches.' +
      '</p>' +

      '<button id="accountDeleteBtn" class="account-btn account-btn-danger" type="button" disabled>' +
        'Delete my account permanently' +
      '</button>' +
    '</section>';

  wireAccountModalControls();
}

function wireAccountModalControls() {
  var exportBtn  = document.getElementById('accountExportBtn');
  var deleteBtn  = document.getElementById('accountDeleteBtn');
  var confirmInput = document.getElementById('accountConfirmInput');

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      try {
        downloadAccountExport();
      } catch (error) {
        console.error('DISCIPLANT: export failed:', error);
        setAccountStatus('The download could not be created. Try again.', true);
      }
    });
  }

  if (confirmInput && deleteBtn) {
    confirmInput.addEventListener('input', function () {
      var ready = confirmInput.value.trim().toUpperCase() === DELETE_CONFIRM_WORD;
      deleteBtn.disabled = !ready;
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function () {
      if (deleteBtn.disabled) return;

      var user = auth.currentUser;
      if (!user) {
        setAccountStatus(
          'You are not signed in, so there is nothing here to delete.', true
        );
        return;
      }

      // THE POPUP HAS TO GO FIRST. reauthenticateWithPopup opens a
      // window, and a browser only allows that while the click that
      // asked for it is still the current user activation. Doing any
      // Firestore work before this point spends the gesture and the
      // popup is blocked — exactly the failure that broke the
      // Google sign-in retry path in 02-auth-tasks.js.
      deleteBtn.disabled = true;
      setAccountStatus(
        user.isAnonymous ? 'Starting\u2026' : 'Confirm with Google to continue\u2026',
        false
      );

      reauthenticateBeforeDelete(user)
        .then(function () { runAccountDeletion(); })
        .catch(function (error) {
          var code = (error && error.code) || '';
          deleteBtn.disabled = false;

          if (code === 'auth/popup-closed-by-user' ||
              code === 'auth/cancelled-popup-request') {
            setAccountStatus('Deletion cancelled. Nothing was changed.', false);
            return;
          }
          if (code === 'auth/popup-blocked') {
            setAccountStatus(
              'Your browser blocked the confirmation window. Allow pop-ups ' +
              'for this site, then try again.',
              true
            );
            return;
          }
          if (code === 'auth/user-mismatch' || code === 'auth/invalid-credential') {
            setAccountStatus(
              'That is a different Google account from the one signed in here. ' +
              'Confirm with the account you want to delete.',
              true
            );
            return;
          }

          console.error('DISCIPLANT: reauthentication before deletion failed:', error);
          setAccountStatus('Could not confirm it is you. Try again.', true);
        });
    });
  }
}


// ---- Shell wiring: close button, backdrop, Escape, focus trap ----

if (accountModalClose) {
  accountModalClose.addEventListener('click', closeAccountModal);
}
if (accountModalBackdrop) {
  accountModalBackdrop.addEventListener('click', closeAccountModal);
}

document.addEventListener('keydown', function (e) {
  if (!accountModalOpen) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeAccountModal();
    return;
  }

  if (e.key !== 'Tab') return;

  // Focus trap. Queried on every press rather than cached, because the
  // body is rebuilt by renderAccountModal() and a cached list would
  // point at elements that are no longer in the document.
  var focusable = accountModalCard
    ? accountModalCard.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    : [];
  if (!focusable.length) return;

  var first = focusable[0];
  var last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// A tab closing mid-deletion cannot be stopped, but it can be warned
// about: the batches are atomic individually, so an interruption
// between them leaves the account intact but partly disconnected.
window.addEventListener('beforeunload', function (e) {
  if (!deletionBlocksUnload) return;
  e.preventDefault();
  e.returnValue = '';
});
