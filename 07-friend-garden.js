// ============================================
// 07: FRIEND GARDEN — read-only view of a friend's garden
// Part of DISCIPLANT — split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 6 files.
// ============================================

// ============================================
// Why this reads gardenSummaries and not gardens
//
// Firestore rules are document-level: they can allow or deny a whole
// document, never a subset of its fields. gardens/{uid} holds every
// task's raw text and its full per-day completion history, so opening
// it to friends — even "just to draw the plants" — would hand over
// all of it. It therefore stays owner-only, permanently.
//
// Instead the owner's own client writes a second, deliberately lossy
// document, gardenSummaries/{uid}, every time it saves (see
// buildGardenSummary() in 02-auth-tasks.js). That one holds species,
// skin, growth, streak and position and nothing else, and the rules
// let friends read it. This file renders from that.
//
// Two consequences worth knowing about:
//
//  1. A friend's summary only exists once THEY have saved at least
//     once since this feature shipped. Anyone who hasn't opened the
//     app since then has no summary document, and this view says so
//     rather than pretending their garden is empty.
//  2. What's on screen is only as fresh as their last save. There's
//     no listener here on purpose — a one-shot read matches the
//     "snapshot of someone else's garden" idea, and avoids holding an
//     open subscription to another user's document for as long as the
//     page is left open.
// ============================================


// ============================================
// Friend garden state
// ============================================
var friendGardenUid      = null;   // whose garden is on screen
var friendGardenUsername = null;   // display name, for the header
var friendGardenSummary  = null;   // the fetched gardenSummaries doc, or null
var friendGardenLoading  = false;
var friendGardenError    = null;   // user-facing message, or null
var friendGardenTab      = 'daily'; // 'daily' | 'longterm' — separate from the
                                    // user's own currentGardenTab so looking at
                                    // a friend never changes their own view

// Bumped on every open. A slow fetch for friend A must not paint over
// friend B's garden if the user clicked through to B in the meantime.
var friendGardenRequestSeq = 0;


// ============================================
// DOM references
// ============================================
// friendGardenSceneEl and friendGardenTrackEl are declared in 01,
// alongside the other page and scene refs. All seven files share one
// global scope, so re-declaring them here would be a redeclaration
// error that takes the whole app down.
var friendGardenMsgEl    = document.getElementById('friendGardenMsg');
var friendGardenTitleEl  = document.getElementById('friendGardenTitle');
var friendGardenNoteEl   = document.getElementById('friendGardenNote');


// ============================================
// Opening and closing
// ============================================

// Called from the Friends page (06) when a friend's "View garden"
// button is clicked.
// Friend garden summaries, cached for a few minutes.
//
// Bouncing between the Friends list and a friend's garden used to cost
// a read every time you opened the same one. The summary only changes
// when its owner saves, so re-reading it seconds later is pure waste.
//
// Time-limited rather than session-long on purpose: a friend ticking a
// habit while you're looking around should show up reasonably soon,
// and a cached MISS ("no summary yet") must not stick around for the
// whole session if they publish one a minute later. Five minutes is
// short enough that nothing feels frozen and long enough to kill the
// repeat-open cost.
var FRIEND_GARDEN_CACHE_MS = 5 * 60 * 1000;
var friendGardenCache      = {}; // uid -> { at, summary, error }

function openFriendGarden(uid, username) {
  if (!uid) return;

  friendGardenRequestSeq++;
  var seq = friendGardenRequestSeq;

  friendGardenUid      = uid;
  friendGardenUsername = username || null;
  friendGardenSummary  = null;
  friendGardenError    = null;
  friendGardenLoading  = true;
  friendGardenTab      = 'daily';

  navigateTo('friend-garden');

  var cached = friendGardenCache[uid];
  if (cached && (Date.now() - cached.at) < FRIEND_GARDEN_CACHE_MS) {
    friendGardenLoading = false;
    friendGardenSummary = cached.summary;
    friendGardenError   = cached.error;
    renderFriendGardenIfVisible();
    return;
  }

  db.collection('gardenSummaries').doc(uid).get()
    .then(function (docSnapshot) {
      if (seq !== friendGardenRequestSeq) return; // superseded by a later open
      friendGardenLoading = false;

      if (!docSnapshot.exists) {
        // Not an error, and specifically not "their garden is empty":
        // the summary is only written when its owner saves, so a
        // friend who hasn't opened the app since this feature shipped
        // simply doesn't have one yet.
        friendGardenSummary = null;
        friendGardenError   = 'Nothing to show yet — this gardener hasn\u2019t opened DISCIPLANT since garden sharing was added.';
      } else {
        friendGardenSummary = docSnapshot.data() || {};
        friendGardenError   = null;
      }

      // Cached whether it was found or not — see the note above on why
      // a miss is cached too, and why the window is short.
      friendGardenCache[uid] = {
        at:      Date.now(),
        summary: friendGardenSummary,
        error:   friendGardenError,
      };

      renderFriendGardenIfVisible();
    })
    .catch(function (error) {
      if (seq !== friendGardenRequestSeq) return;
      friendGardenLoading = false;
      friendGardenSummary = null;

      if (error && error.code === 'permission-denied') {
        // Either the rules haven't been published, or this pair aren't
        // actually friends on the server (the friends array is the
        // authority, not the list this client happens to be holding).
        friendGardenError = 'You can\u2019t view this garden. You may no longer be friends, or garden sharing isn\u2019t set up on the server yet.';
        console.error(
          'DISCIPLANT: read of gardenSummaries/' + uid + ' was denied. ' +
          'Check that the gardenSummaries rules (with the isFriend helper) ' +
          'have been published in Firebase Console -> Firestore -> Rules.'
        );
      } else {
        friendGardenError = 'Could not load that garden. Check your connection and try again.';
        console.error('DISCIPLANT: loading friend garden failed:', error);
      }
      renderFriendGardenIfVisible();
    });
}

// Drops the fetched data so a friend's garden isn't sitting in memory
// (or one frame away from being painted) once the user has navigated
// off. Called from navigateTo() in 01 on the way OUT of this page,
// not from the back button — leaving via the nav bar has to clean up
// exactly the same way as leaving via "Friends", and routing it
// through navigateTo is the only way to catch every exit.
//
// Bumping the sequence number also orphans any summary fetch still in
// flight, so a slow response can't repopulate this state after the
// user has already left.
function clearFriendGardenState() {
  friendGardenRequestSeq++;
  friendGardenUid      = null;
  friendGardenUsername = null;
  friendGardenSummary  = null;
  friendGardenError    = null;
  friendGardenLoading  = false;
  if (friendGardenTrackEl) friendGardenTrackEl.innerHTML = '';
}

function closeFriendGarden() {
  // The state teardown happens in navigateTo — see above.
  navigateTo('friends');
}

function switchFriendGardenTab(tabId) {
  friendGardenTab = tabId;
  document.querySelectorAll('[data-friend-garden-tab]').forEach(function (btn) {
    btn.classList.toggle('active', btn.getAttribute('data-friend-garden-tab') === tabId);
  });
  renderFriendGardenIfVisible();
}

function renderFriendGardenIfVisible() {
  if (currentPage === 'friend-garden') renderFriendGarden();
}


// ============================================
// Rendering
// ============================================

function friendGardenDisplayName() {
  return friendGardenUsername ? '@' + friendGardenUsername : 'This gardener';
}

// Shown whenever a garden is on screen. The summary deliberately
// carries no date of any kind (see buildGardenSummary in 02), so there
// is no way to tell whether its `completed` flags are from today or
// from whenever its owner last opened the app. Rather than quietly
// presenting a possibly-stale tick as today's, this view never claims
// "today" anywhere and states plainly what it is showing.
var FRIEND_GARDEN_CAVEAT =
  'Shows this gardener\u2019s last saved progress \u2014 today\u2019s may not be in yet.';

function renderFriendGardenHeader() {
  if (friendGardenTitleEl) {
    friendGardenTitleEl.textContent = friendGardenUsername
      ? '@' + friendGardenUsername + '\u2019s garden'
      : 'A friend\u2019s garden';
  }

  if (!friendGardenNoteEl) return;

  // Only worth saying once there's actually a garden on screen.
  var note = friendGardenSummary ? FRIEND_GARDEN_CAVEAT : '';

  friendGardenNoteEl.textContent = note;
  friendGardenNoteEl.classList.toggle('hidden', !note);
}

// Shows one of the loading / error / empty messages in the scene, and
// returns true if a message took over (i.e. there are no plants to
// draw). Mirrors how #gardenEmptyMsg works on the user's own garden.
function renderFriendGardenMessage(plants) {
  if (!friendGardenMsgEl) return false;

  var message = null;

  if (friendGardenLoading) {
    message = '\uD83C\uDF31 Loading ' + friendGardenDisplayName() + '\u2019s garden\u2026';
  } else if (friendGardenError) {
    message = friendGardenError;
  } else if (!plants.length) {
    message = friendGardenDisplayName() + ' hasn\u2019t planted anything yet.';
  }

  friendGardenMsgEl.textContent = message || '';
  friendGardenMsgEl.classList.toggle('hidden', !message);
  return !!message;
}

// Centers the (3x-viewport-wide) friend track, same deferred-frame
// trick as centerGardenScroll() in 04 — scrollWidth read immediately
// after an innerHTML swap can still be the previous render's.
function centerFriendGardenScroll() {
  requestAnimationFrame(function () {
    if (!friendGardenSceneEl) return;
    friendGardenSceneEl.scrollLeft =
      (friendGardenSceneEl.scrollWidth - friendGardenSceneEl.clientWidth) / 2;
  });
}

// Builds one plant's art. Deliberately NOT buildPlantVisual() from 04:
// that keys its crossfade cache (plantStageMemory) on task.id, and a
// friend's plant ids collide with the viewer's own — plant #1 of
// theirs would inherit plant #1 of yours' remembered stage and
// crossfade for no reason. A read-only snapshot has nothing to
// animate between anyway, so this just draws the current stage.
function buildFriendPlantVisual(plant, cat, stageIdx) {
  var container = document.createElement('div');
  container.className = 'plant-stage-crossfade';

  var layer = document.createElement('div');
  layer.className = 'plant-stage-layer';
  layer.style.opacity = '1';
  layer.innerHTML = getPlantSVG(cat.id, stageIdx, plant.skinId || SKIN_DEFAULT_ID);

  container.appendChild(layer);
  return container;
}

function renderFriendGarden() {
  renderFriendGardenHeader();

  if (!friendGardenSceneEl || !friendGardenTrackEl) return;
  friendGardenTrackEl.innerHTML = '';

  // Same ground and fence as the owner's garden, so a friend's plot
  // reads as the same place rather than a different screen. Both take
  // the track as an argument (see 04), which is what makes them
  // reusable here.
  renderGrassField(friendGardenTrackEl);
  renderFence(friendGardenTrackEl);

  var plants = (friendGardenSummary && Array.isArray(friendGardenSummary.plants))
    ? friendGardenSummary.plants
    : [];

  if (renderFriendGardenMessage(plants)) {
    friendGardenSceneEl.scrollLeft = 0;
    return;
  }

  var maxStageIdx = PLANT_SVG_DATA.misc.length - 1;

  // Same two-group slot bucketing as renderGarden() in 04, for the
  // plants their owner never dragged anywhere.
  var slotGroups = { a: [], b: [] };
  plants.forEach(function (plant) {
    if (hasCustomPosition(plant)) return;
    slotGroups[getTaskSlotGroup(plant.id)].push(plant);
  });

  plants.forEach(function (plant) {
    // NOTE — categoryId is what picks the species art, so this view
    // necessarily tells a friend which CATEGORY each habit belongs to
    // (a Sunflower means an Exercise habit). The task text stays
    // private, but the category doesn't. If that's not wanted, this
    // is the line to change: swap in one neutral species for every
    // plant here, and drop categoryId from buildGardenSummary() in 02
    // so it isn't published at all.
    var cat = getCategoryById(plant.categoryId);

    var layout;
    if (hasCustomPosition(plant)) {
      layout = computeCustomLayout(plant);
    } else {
      var group        = getTaskSlotGroup(plant.id);
      var groupPlants  = slotGroups[group];
      layout = computePlantLayout(plant, groupPlants.indexOf(plant), groupPlants.length);
    }

    var totalGrowthDays = Math.max(0, plant.totalGrowthDays || 0);
    var streak          = Math.max(0, plant.streak || 0);
    // Ticked off as of their last save — which may or may not have
    // been today. The label below is worded to be true either way.
    var ticked          = !!plant.completed;

    var stageIdx, scale, subLabel;

    if (friendGardenTab === 'daily') {
      var streakStage = getStageIndexForDays(streak);
      var streakScale = computeScaleForDays(streak);

      stageIdx = ticked ? maxStageIdx        : streakStage;
      scale    = ticked ? streakScale * 1.35 : streakScale;

      // Deliberately not "Done today": nothing in the summary can
      // justify the word "today" now that it carries no date.
      subLabel = (ticked ? 'Done \u2713' : 'Not done') +
        (streak > 0 ? ' \u00B7 \uD83D\uDD25 ' + streak + ' day streak' : '');
    } else {
      stageIdx = getStageIndexForDays(totalGrowthDays);
      var momentum = 1 + Math.min(streak, 60) * 0.004;
      scale = computeScaleForDays(totalGrowthDays) * momentum;

      var streakPart = streak > 0 ? ' \u00B7 \uD83D\uDD25 ' + streak + ' day streak' : '';
      subLabel = totalGrowthDays + ' days grown' + streakPart;
    }

    var growthOnlyScale = scale;
    scale = scale * layout.depthScale;

    var wrap = document.createElement('div');
    // The extra class is what turns off the grab cursor — this garden
    // is look-only, and setupPlantDrag() is deliberately never called.
    wrap.className = 'garden-plant friend-plant';
    wrap.style.left   = layout.center;
    wrap.style.zIndex = layout.z;
    wrap.style.setProperty('--plant-scale', scale.toFixed(3));
    wrap.style.setProperty('--plant-depth-bottom', layout.bottomPct + '%');
    wrap.setAttribute(
      'title',
      cat.name + ' (' + cat.species + ') \u00B7 ' + totalGrowthDays + ' days grown' +
      (streak > 0 ? ' \u00B7 \uD83D\uDD25 ' + streak + ' day streak' : '')
    );

    var visual = document.createElement('div');
    visual.className = 'plant-visual';
    visual.appendChild(buildFriendPlantVisual(plant, cat, stageIdx));
    wrap.appendChild(visual);

    var heightTag = document.createElement('div');
    heightTag.className = 'plant-height-tag';
    heightTag.textContent = formatHeightMeters(computeHeightMeters(growthOnlyScale));
    wrap.appendChild(heightTag);

    // The owner's garden labels each plant with its task text. That's
    // exactly the field this whole feature exists to withhold, so the
    // species name stands in for it here.
    var labelEl = document.createElement('div');
    labelEl.className = 'plant-label-tag';
    labelEl.innerHTML =
      '<span class="plant-label-name">' + escapeHtml(cat.species) + '</span>' +
      '<span class="plant-label-streak">' + subLabel + '</span>';
    wrap.appendChild(labelEl);

    friendGardenTrackEl.appendChild(wrap);
  });

  centerFriendGardenScroll();
}


// ============================================
// Page wiring
// ============================================
var friendGardenBackBtn = document.getElementById('friendGardenBack');
if (friendGardenBackBtn) {
  friendGardenBackBtn.addEventListener('click', closeFriendGarden);
}

var friendGardenTabDaily    = document.getElementById('friend-garden-tab-daily');
var friendGardenTabLongterm = document.getElementById('friend-garden-tab-longterm');
if (friendGardenTabDaily) {
  friendGardenTabDaily.addEventListener('click', function () { switchFriendGardenTab('daily'); });
}
if (friendGardenTabLongterm) {
  friendGardenTabLongterm.addEventListener('click', function () { switchFriendGardenTab('longterm'); });
}
