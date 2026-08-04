// ============================================
// 01: APP CORE - categories, state, DOM refs, navigation, date/growth helpers
// Part of DISCIPLANT - split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 4 files.
// ============================================

// ============================================
// DISCIPLANT - Task-based habit garden
//
// How it works:
// 1. Every task/habit the user adds gets its OWN plant in the
//    garden. The plant's species/art comes from the task's
//    category; its growth stage comes from that task's own
//    streak, not the category as a whole.
// 2. Tasks belong to a category (for art + lore + suggestions).
//    At the start of each new calendar day (local time), all
//    tasks reset to unchecked.
// 3. Each task tracks its own streak: +1 for every calendar day
//    it gets checked off, reset if a day is missed.
// 4. Daily Garden view: each plant is simply "done today" or not.
//    Long-Term Garden view: each plant's stage reflects its
//    total completed days + current streak.
// 5. The sky background reflects the current local time and
//    updates every 60 seconds so it stays live.
// 6. Multi-page navigation: Home / Garden / Tasks (with
//    category subpages) / Stats / Greenhouse. All show/hide
//    via JS, no reload.
// 7. Greenhouse page: one card per plant. Open a card and pick
//    a skin; the card and the plant in the garden both repaint,
//    because both read the same task.skinId.
// ============================================


// ============================================
// Fixed category definitions
// ============================================
const CATEGORIES = [
  {
    id:          'education',
    name:        'Education',
    species:     'Oak',
    streakStages: [
      { min: 0, },
      { min: 3, },
      { min: 14, },
      { min: 60, },
    ],
  },
  {
    id:          'exercise',
    name:        'Exercise',
    species:     'Sunflower',
    streakStages: [
      { min: 0, },
      { min: 3, },
      { min: 14, },
      { min: 60, },
    ],
  },
  {
    id:          'mindfulness',
    name:        'Mindfulness',
    species:     'Lotus',
    streakStages: [
      { min: 0, },
      { min: 3, },
      { min: 14, },
      { min: 60, },
    ],
  },
  {
    id:          'sleep',
    name:        'Sleep',
    species:     'Lavender',
    streakStages: [
      { min: 0, },
      { min: 3, },
      { min: 14, },
      { min: 60, },
    ],
  },
  {
    id:          'chores',
    name:        'Chores',
    species:     'Bamboo',
    streakStages: [
      { min: 0, },
      { min: 3, },
      { min: 14, },
      { min: 60, },
    ],
  },
  {
    id:          'finance',
    name:        'Finance',
    species:     'Clover',
    streakStages: [
      { min: 0, },
      { min: 3, },
      { min: 14, },
      { min: 60, },
    ],
  },
  {
    id:          'misc',
    name:        'Misc',
    species:     'Mushroom',
    streakStages: [
      { min: 0, },
      { min: 3, },
      { min: 14, },
      { min: 60, },
    ],
  },
];

// Emoji were taken out of the interface in favour of the plant artwork
// and drawn icons. The key is kept, empty, so any older render path
// that still concatenates it produces nothing rather than "undefined".
CATEGORIES.forEach(function (cat) { cat.emoji = ''; });


// ============================================
// Sky color key-frames
// ============================================
const SKY_KEY_FRAMES = [
  { hour: 0,  top: '#0a1628', bottom: '#1a2a44' },
  { hour: 5,  top: '#0d1e38', bottom: '#1e3050' },
  { hour: 6,  top: '#b04830', bottom: '#e07020' },
  { hour: 7,  top: '#4a8ec4', bottom: '#96c8dc' },
  { hour: 12, top: '#2a6cb8', bottom: '#68aadc' },
  { hour: 17, top: '#3880c4', bottom: '#88bce0' },
  { hour: 18, top: '#c85c28', bottom: '#f09040' },
  { hour: 19, top: '#782840', bottom: '#b04828' },
  { hour: 20, top: '#1a2a44', bottom: '#0a1628' },
  { hour: 24, top: '#0a1628', bottom: '#1a2a44' },
];


// ============================================
// App state
// ============================================
let tasks               = [];
let lastResetDate       = null;
let nextId              = 1;
let currentUserId       = null;
let unsubscribeSnapshot = null;

// Auth / profile identity state - kept separate from `tasks` (garden
// data) since it describes the SIGNED-IN USER, not their garden.
// isAnonymous === true means "Guest Gardener" (no Google account
// linked yet); displayName/email/photoURL are populated once a
// Google account is linked/signed in.
let currentUserProfile = {
  uid:         null,
  isAnonymous: true,
  displayName: null,
  email:       null,
  photoURL:    null,
};
let authActionPending = false; // true while a popup sign-in/link is in flight
let authActionError   = null;  // last-error message shown in the modal, if any

// Navigation state
let currentPage      = 'home';
let currentTaskTab   = 'all';
let currentGardenTab = 'daily';
let authReady        = false;

// Set true whenever we navigate TO the garden page, so the next
// renderGarden() call knows to center the (horizontally scrollable)
// garden scene instead of leaving it wherever it last scrolled to.
let pendingGardenScrollCenter = false;


// ============================================
// DOM references
// ============================================
const loadingState      = document.getElementById('loadingState');
const tasksLoadingState = document.getElementById('tasksLoadingState');
const mainContent       = document.getElementById('mainContent');
const taskForm          = document.getElementById('taskForm');
const taskInput         = document.getElementById('taskInput');
const categorySelect    = document.getElementById('categorySelect');
const taskList          = document.getElementById('taskList');
const emptyState        = document.getElementById('emptyState');
const gardenSceneEl     = document.getElementById('gardenScene');
const gardenTrackEl     = document.getElementById('gardenSceneTrack');
const gardenBackdropEl  = document.getElementById('gardenBackdrop');
const skyEl             = document.getElementById('sky');
const skyBodyEl         = document.getElementById('skyBody');

// Page containers
const pageHomeEl   = document.getElementById('page-home');
const pageGardenEl = document.getElementById('page-garden');
const pageTasksEl  = document.getElementById('page-tasks');
const pageStatsEl  = document.getElementById('page-stats');
const pageGreenhouseEl = document.getElementById('page-greenhouse');
const pageFriendsEl    = document.getElementById('page-friends');
// Read-only view of ONE friend's garden. Its own page + its own
// fixed scene element, so opening it never touches #gardenScene and
// the user's own garden keeps its scroll position and render state.
// Declared here, next to the other page/scene refs, and NOT
// re-declared in 07 - these files share one global scope, so a
// second `var` of the same name there would be a redeclaration.
const pageFriendGardenEl   = document.getElementById('page-friend-garden');
const friendGardenSceneEl  = document.getElementById('friendGardenScene');
const friendGardenTrackEl  = document.getElementById('friendGardenTrack');

// Greenhouse page elements
const greenhouseLoadingState = document.getElementById('greenhouseLoadingState');
const greenhouseContent      = document.getElementById('greenhouseContent');

// Friends page elements
const friendsLoadingState = document.getElementById('friendsLoadingState');
const friendsContent      = document.getElementById('friendsContent');

// Stats page elements
const statsLoadingState = document.getElementById('statsLoadingState');
const statsContent      = document.getElementById('statsContent');
const heatmapTooltipEl   = document.getElementById('heatmapTooltip');
const profileHeaderEl    = document.getElementById('profileHeader');

// Auth widget / modal elements
const authWidgetBtn      = document.getElementById('authWidgetBtn');
const authAvatarImg      = document.getElementById('authAvatarImg');
const authAvatarFallback = document.getElementById('authAvatarFallback');
const authWidgetLabel    = document.getElementById('authWidgetLabel');
const authModalEl        = document.getElementById('authModal');
const authModalBackdrop  = document.getElementById('authModalBackdrop');
const authModalClose     = document.getElementById('authModalClose');
const authModalBody      = document.getElementById('authModalBody');

// Sanity check: warn loudly in the console if any required element is
// missing from the page, instead of silently crashing later when we
// try to touch its classList.
(function checkRequiredElements() {
  var required = {
    loadingState:      loadingState,
    tasksLoadingState: tasksLoadingState,
    mainContent:       mainContent,
    gardenSceneEl:     gardenSceneEl,
    gardenTrackEl:     gardenTrackEl,
    gardenBackdropEl:  gardenBackdropEl,
    taskForm:          taskForm,
    taskInput:         taskInput,
    categorySelect:    categorySelect,
    taskList:          taskList,
    emptyState:        emptyState,
    skyEl:             skyEl,
    skyBodyEl:         skyBodyEl,
    pageHomeEl:        pageHomeEl,
    pageGardenEl:      pageGardenEl,
    pageTasksEl:       pageTasksEl,
    pageStatsEl:       pageStatsEl,
    statsLoadingState: statsLoadingState,
    statsContent:      statsContent,
    pageGreenhouseEl:       pageGreenhouseEl,
    greenhouseLoadingState: greenhouseLoadingState,
    greenhouseContent:      greenhouseContent,
    pageFriendsEl:          pageFriendsEl,
    friendsLoadingState:    friendsLoadingState,
    friendsContent:         friendsContent,
    pageFriendGardenEl:     pageFriendGardenEl,
    friendGardenSceneEl:    friendGardenSceneEl,
    friendGardenTrackEl:    friendGardenTrackEl,
  };
  Object.keys(required).forEach(function (key) {
    if (!required[key]) {
      console.error('DISCIPLANT: expected element for "' + key + '" was not found in the page (check the id in index.html).');
    }
  });
})();


// ============================================
// Populate the category <select> dropdown
// ============================================
CATEGORIES.forEach(function (cat) {
  var opt       = document.createElement('option');
  opt.value     = cat.id;
  opt.textContent = cat.name;
  categorySelect.appendChild(opt);
});
categorySelect.value = 'misc';


// ============================================
// Build the category plot and its tab panels
//
// One card per plant, not a row of text pills. The card shows the
// species' own artwork, so the tasks page finally has plants on it -
// which is the whole point of the app and used to be invisible here.
//
// Split in two on purpose: the shells are built once at parse time,
// but the artwork and the counts need task data, which arrives later
// and changes on every tick. refreshCategoryCards() does that half and
// is called from renderTaskList().
// ============================================
function buildCategoryTabs() {
  var plot      = document.getElementById('catSubnav');
  var container = document.getElementById('taskTabsContainer');
  if (!plot || !container) return;

  plot.innerHTML      = '';
  container.innerHTML = '';

  // "All tasks" is a card too, but a plainer one - it has no species.
  var allCard         = document.createElement('button');
  allCard.type        = 'button';
  allCard.className   = 'plot-card plot-card-all active';
  allCard.dataset.tab = 'all';
  allCard.innerHTML   =
    '<span class="plot-card-name">All tasks</span>' +
    '<span class="plot-card-count" id="plot-count-all"></span>';
  allCard.addEventListener('click', function () { switchTaskTab('all'); });
  plot.appendChild(allCard);

  CATEGORIES.forEach(function (cat) {
    var card         = document.createElement('button');
    card.type        = 'button';
    card.className   = 'plot-card';
    card.dataset.tab = cat.id;
    card.innerHTML =
      '<span class="plot-card-art" id="plot-art-' + cat.id + '"></span>' +
      '<span class="plot-card-name">' + cat.name + '</span>' +
      '<span class="plot-card-count" id="plot-count-' + cat.id + '"></span>' +
      '<span class="plot-card-streak hidden" id="plot-streak-' + cat.id + '"></span>';
    card.addEventListener('click', function () { switchTaskTab(cat.id); });
    plot.appendChild(card);

    // ---- Tab panel: header, list, empty state. Nothing else. ----
    var panel = document.createElement('div');
    panel.id        = 'tab-' + cat.id;
    panel.className = 'task-tab-panel hidden';

    var head = document.createElement('div');
    head.className = 'panel-head';

    var nameEl         = document.createElement('h3');
    nameEl.className   = 'panel-head-name';
    nameEl.textContent = cat.name;

    var speciesEl         = document.createElement('span');
    speciesEl.className   = 'panel-head-species';
    speciesEl.textContent = cat.species;

    head.appendChild(nameEl);
    head.appendChild(speciesEl);
    panel.appendChild(head);

    var catListEl       = document.createElement('ul');
    catListEl.id        = 'cat-list-' + cat.id;
    catListEl.className = 'task-list';
    panel.appendChild(catListEl);

    var catEmptyEl         = document.createElement('p');
    catEmptyEl.id          = 'cat-empty-' + cat.id;
    catEmptyEl.className   = 'empty-state';
    catEmptyEl.textContent = 'Nothing planted here yet. Add a ' +
                             cat.name.toLowerCase() + ' task above.';
    panel.appendChild(catEmptyEl);

    container.appendChild(panel);
  });
}

buildCategoryTabs();


// Repaints the artwork and the numbers on every card. Safe to call
// before 04-garden-scene.js has loaded (it owns getPlantSVG) and before
// any tasks exist - both cases just leave the plot at its seed stage.
function refreshCategoryCards() {
  var allCount = document.getElementById('plot-count-all');
  if (allCount) {
    allCount.textContent = tasks.length
      ? countDone(tasks) + ' of ' + tasks.length + ' done'
      : 'empty';
  }

  CATEGORIES.forEach(function (cat) {
    var mine = tasks.filter(function (t) { return t.categoryId === cat.id; });

    var countEl = document.getElementById('plot-count-' + cat.id);
    if (countEl) {
      countEl.textContent = mine.length
        ? countDone(mine) + ' of ' + mine.length + ' done'
        : 'empty';
    }

    // The card shows this category's furthest-along plant, so the plot
    // reads as a garden rather than a row of identical seeds.
    var lead = null;
    mine.forEach(function (t) {
      if (!lead || (t.totalGrowthDays || 0) > (lead.totalGrowthDays || 0)) lead = t;
    });

    var streakEl = document.getElementById('plot-streak-' + cat.id);
    if (streakEl) {
      var best = 0;
      mine.forEach(function (t) { best = Math.max(best, t.streak || 0); });
      streakEl.textContent = best + (best === 1 ? ' day' : ' days');
      streakEl.classList.toggle('hidden', best < 2);
    }

    var artEl = document.getElementById('plot-art-' + cat.id);
    if (artEl && typeof getPlantSVG === 'function') {
      var stage  = lead ? getStageIndexForDays(lead.totalGrowthDays) : 0;
      var skinId = (lead && typeof getTaskSkinId === 'function')
        ? getTaskSkinId(lead)
        : null;
      // Building seven SVG strings and reparsing them costs nothing in
      // Firestore but is the most expensive thing on this page, and it
      // ran on every checkbox tick. A plant's stage and skin change far
      // less often than its done-count, so only redraw on a real change.
      var stamp = stage + ':' + (skinId || '');
      if (artEl.dataset.stamp !== stamp) {
        artEl.innerHTML = getPlantSVG(cat.id, stage, skinId, 56);
        artEl.dataset.stamp = stamp;
      }
    }
  });
}

function countDone(list) {
  var n = 0;
  list.forEach(function (t) { if (t.completed) n++; });
  return n;
}


// ============================================
// Navigation
// ============================================
function navigateTo(page) {
  // Leaving the friend garden - by the back button OR by any nav
  // button on that page - forgets whose garden it was. Checked before
  // currentPage moves, and skipped when we're navigating INTO the
  // page, since openFriendGarden() sets that state up just before it
  // calls this.
  if (currentPage === 'friend-garden' && page !== 'friend-garden' &&
      typeof clearFriendGardenState === 'function') {
    clearFriendGardenState();
  }

  // Every page except home needs an account. Guests are created here,
  // at the moment someone actually enters the app, rather than on page
  // load - so a visitor who only reads the home page never gets an
  // account and never costs a Firestore read. Fire-and-forget: the
  // auth observer in 02-auth-tasks.js boots everything once the
  // sign-in lands, the same way it does on a reload.
  if (page !== 'home' && typeof ensureSignedIn === 'function') {
    ensureSignedIn().catch(function () {});
  }

  // Leaving the Garden page abandons an unsaved rearrangement, on
  // purpose: "Save & exit" is the only thing that commits, so walking
  // away behaves exactly like Discard. Positions are restored from the
  // snapshot here so the garden you come back to matches what is
  // actually stored.
  if (currentPage === 'garden' && page !== 'garden' &&
      typeof discardGardenEdits === 'function') {
    discardGardenEdits();
  }

  currentPage = page;

  // Picking a destination is the end of using the menu.
  if (typeof setNavDrawer === 'function') setNavDrawer(false);
  if (typeof highlightNavPlank === 'function') highlightNavPlank();

  if (pageHomeEl)   pageHomeEl.classList.toggle('hidden',   page !== 'home');
  if (pageGardenEl) pageGardenEl.classList.toggle('hidden', page !== 'garden');
  if (pageTasksEl)  pageTasksEl.classList.toggle('hidden',  page !== 'tasks');
  if (pageStatsEl)  pageStatsEl.classList.toggle('hidden',  page !== 'stats');
  if (pageGreenhouseEl) pageGreenhouseEl.classList.toggle('hidden', page !== 'greenhouse');
  if (pageFriendsEl)    pageFriendsEl.classList.toggle('hidden',    page !== 'friends');
  if (pageFriendGardenEl) pageFriendGardenEl.classList.toggle('hidden', page !== 'friend-garden');

  // Garden scene: only visible on garden page once auth is ready
  if (gardenSceneEl) gardenSceneEl.classList.toggle('hidden', page !== 'garden' || !authReady);

  // Friend garden scene: same idea, but it doesn't wait on authReady
  // - that flag tracks the user's OWN garden snapshot, and this page
  // is only ever reached by clicking a friend, which can't happen
  // before auth has resolved anyway. It draws its own loading message
  // while the summary fetch is in flight.
  if (friendGardenSceneEl) friendGardenSceneEl.classList.toggle('hidden', page !== 'friend-garden');

  // The universal time-of-day sky (gradient, stars, hills, fireflies,
  // clouds/birds, sun/moon) stays visible on every page, including
  // Garden, so night/day looks identical everywhere. The garden
  // backdrop now only adds the garden-specific ground (fence + lawn)
  // on top of it while on the Garden page.
  // The friend garden page shows the same ground as the user's own
  // garden, so the lawn stays on for both.
  if (gardenBackdropEl) {
    gardenBackdropEl.classList.toggle('hidden', page !== 'garden' && page !== 'friend-garden');
  }

  if (page === 'garden') {
    if (loadingState) loadingState.classList.toggle('hidden', authReady);
    // Center the garden scene's horizontal scroll on this visit -
    // consumed by renderGarden() below (or later, once auth/data is
    // ready, whenever it next runs).
    pendingGardenScrollCenter = true;
    if (authReady) renderGarden();
  }

  if (page === 'tasks') {
    if (tasksLoadingState) tasksLoadingState.classList.toggle('hidden', authReady);
    if (mainContent) mainContent.classList.toggle('hidden', !authReady);
    if (authReady) renderTaskList();
  }

  if (page === 'stats') {
    if (statsLoadingState) statsLoadingState.classList.toggle('hidden', authReady);
    if (statsContent) statsContent.classList.toggle('hidden', !authReady);
    if (authReady) renderStatsPage();
  }

  if (page === 'greenhouse') {
    if (greenhouseLoadingState) greenhouseLoadingState.classList.toggle('hidden', authReady);
    if (greenhouseContent) greenhouseContent.classList.toggle('hidden', !authReady);
    if (authReady) renderGreenhouse();
  }

  if (page === 'friends') {
    // The friend-request listeners live here rather than at sign-in:
    // nothing outside this page reads them, so opening the page is the
    // first moment they're worth paying for. Attaches once per session
    // - see startFriendRequestListeners in 06-friends.js.
    if (typeof startFriendRequestListeners === 'function') {
      startFriendRequestListeners();
    }

    if (friendsLoadingState) friendsLoadingState.classList.toggle('hidden', authReady);
    if (friendsContent) friendsContent.classList.toggle('hidden', !authReady);
    if (authReady) renderFriendsPage();
    // No modal is opened here. The page renders a "Choose a username"
    // button when there isn't one yet (renderFriendsMe in 06), and that
    // button is the only thing that opens it - arriving on this page is
    // not the same as asking to be prompted.
  }

  if (page === 'friend-garden') {
    // 07 loads after this file, so guard the call the same way the
    // friends hooks in 02 do.
    if (typeof renderFriendGarden === 'function') renderFriendGarden();
  }

  // Scroll the destination page back to top
  if (page === 'tasks'  && pageTasksEl)  pageTasksEl.scrollTop  = 0;
  if (page === 'garden' && pageGardenEl) pageGardenEl.scrollTop = 0;
  if (page === 'home'   && pageHomeEl)   pageHomeEl.scrollTop   = 0;
  if (page === 'stats'  && pageStatsEl)  pageStatsEl.scrollTop  = 0;
  if (page === 'greenhouse' && pageGreenhouseEl) pageGreenhouseEl.scrollTop = 0;
  if (page === 'friends' && pageFriendsEl) pageFriendsEl.scrollTop = 0;
  if (page === 'friend-garden' && pageFriendGardenEl) pageFriendGardenEl.scrollTop = 0;
}

function switchTaskTab(tabId) {
  currentTaskTab = tabId;

  // Update button active states
  document.querySelectorAll('.plot-card').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Show the right tab panel, hide others
  document.getElementById('tab-all').classList.toggle('hidden', tabId !== 'all');
  CATEGORIES.forEach(function (cat) {
    var panel = document.getElementById('tab-' + cat.id);
    if (panel) panel.classList.toggle('hidden', tabId !== cat.id);
  });

  // Pre-select category in the shared form
  if (tabId !== 'all') {
    categorySelect.value = tabId;
  }
}



// ============================================
// Client-side rate limiting
//
// WHAT THIS IS AND IS NOT
// This stops accidents, stuck keys and casual mischief: holding Enter
// on a checkbox, hammering "Send request", a render loop that calls
// saveData() forever. It is NOT a security control. Anyone can open
// DevTools and call the Firestore SDK directly, or hit the REST API
// with their own ID token, and never execute a line of this file. Real
// enforcement has to live in firestore.rules or App Check - see the
// notes in firestore.rules. Treat everything here as a courtesy to the
// quota, not a defence of it.
//
// WHY IT MATTERS AT ALL
// On the free Spark plan, exceeding the daily write allowance doesn't
// bill anybody - it stops the app for EVERY user until midnight
// Pacific. A single person with a stuck key can do that. These limits
// make that essentially impossible by accident.
// ============================================

// Simple per-key cooldown. Returns true if the action may proceed, and
// starts the clock; returns false if it's too soon since the last one.
var rateLimitClocks = {}; // key -> timestamp of last allowed action

function rateLimit(key, minIntervalMs) {
  var now  = Date.now();
  var last = rateLimitClocks[key] || 0;
  if (now - last < minIntervalMs) return false;
  rateLimitClocks[key] = now;
  return true;
}

// How long until `key` is allowed again, in whole seconds (for
// messages like "wait 2s"). Zero when it's already allowed.
function rateLimitWaitSeconds(key, minIntervalMs) {
  var remaining = minIntervalMs - (Date.now() - (rateLimitClocks[key] || 0));
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}


// ---- Rolling write budget -------------------------------------
// The per-action cooldowns above each police one button. This polices
// the total, and exists to catch the case none of them can: a bug that
// calls a legitimately-throttled write over and over from somewhere
// unexpected. A real person tending habits writes a few dozen times an
// hour; this cap is far above that and only trips on something broken
// or deliberate.
//
// Session-scoped, so a reload resets it. That's fine - it's a runaway
// stopper, not a quota enforcer, and the thing it's stopping happens
// within one page's lifetime.
var WRITE_BUDGET_MAX       = 300;
var WRITE_BUDGET_WINDOW_MS = 60 * 60 * 1000; // one hour
var writeBudgetStamps      = [];
var writeBudgetWarned      = false;

function budgetAllowsWrite(label) {
  var now    = Date.now();
  var cutoff = now - WRITE_BUDGET_WINDOW_MS;

  while (writeBudgetStamps.length && writeBudgetStamps[0] < cutoff) {
    writeBudgetStamps.shift();
  }

  if (writeBudgetStamps.length >= WRITE_BUDGET_MAX) {
    // Logged once per session rather than per blocked write, so a
    // runaway loop doesn't also flood the console.
    if (!writeBudgetWarned) {
      writeBudgetWarned = true;
      console.error(
        'DISCIPLANT: blocked "' + label + '" - more than ' + WRITE_BUDGET_MAX +
        ' writes in an hour from this tab. That is far past normal use, so ' +
        'something is almost certainly looping. Writes are paused until the ' +
        'hour rolls forward or the page is reloaded.'
      );
    }
    return false;
  }

  writeBudgetStamps.push(now);
  return true;
}


// ============================================
// Navigation event listeners
// ============================================
// ============================================
// Navigation drawer
//
// Replaces six copies of the same link row (and the 36 element IDs
// that went with them) with one panel. The home page keeps its own
// entry buttons - those are the front door, not navigation.
// ============================================
const navPostEl   = document.getElementById('navPost');
const navScrimEl  = document.getElementById('navScrim');
const navDrawerEl = document.getElementById('navDrawer');

function setNavDrawer(open) {
  if (!navDrawerEl) return;
  navDrawerEl.classList.toggle('is-open', open);
  if (navScrimEl) navScrimEl.classList.toggle('is-open', open);
  navDrawerEl.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (navPostEl) navPostEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('nav-open', open);
}

function toggleNavDrawer() {
  setNavDrawer(!(navDrawerEl && navDrawerEl.classList.contains('is-open')));
}

// Marks the plank for wherever we are. Called from navigateTo(), so
// the drawer is already correct the moment it opens.
function highlightNavPlank() {
  document.querySelectorAll('.nav-plank').forEach(function (plank) {
    plank.classList.toggle('current', plank.dataset.page === currentPage);
  });
}

if (navPostEl)  navPostEl.addEventListener('click', toggleNavDrawer);
if (navScrimEl) navScrimEl.addEventListener('click', function () { setNavDrawer(false); });

document.querySelectorAll('.nav-plank').forEach(function (plank) {
  plank.addEventListener('click', function () {
    navigateTo(plank.dataset.page);
  });
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') setNavDrawer(false);
});

// Home page entry buttons. These stay: arriving somewhere for the
// first time shouldn't require finding a menu.
document.getElementById('btn-to-garden').addEventListener('click',     function () { navigateTo('garden');     });
document.getElementById('btn-to-tasks').addEventListener('click',      function () { navigateTo('tasks');      });
document.getElementById('btn-to-greenhouse').addEventListener('click', function () { navigateTo('greenhouse'); });
document.getElementById('btn-to-friends').addEventListener('click',    function () { navigateTo('friends');    });

// Tasks -> Garden in one tap. The daily loop shouldn't cost a menu.
var plotGateEl = document.getElementById('plotGate');
if (plotGateEl) plotGateEl.addEventListener('click', function () { navigateTo('garden'); });


// Garden sub-nav
document.getElementById('garden-tab-daily').addEventListener('click',    function () { switchGardenTab('daily');    });
document.getElementById('garden-tab-longterm').addEventListener('click',  function () { switchGardenTab('longterm'); });


// ============================================
// Date helpers
// ============================================
function getTodayString() {
  var d    = new Date();
  var yyyy = d.getFullYear();
  var mm   = String(d.getMonth() + 1).padStart(2, '0');
  var dd   = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function dayGap(earlierDate, laterDate) {
  var a = new Date(earlierDate + 'T00:00:00');
  var b = new Date(laterDate   + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}


// ============================================
// Category helpers
// ============================================
function getCategoryById(catId) {
  return (
    CATEGORIES.find(function (c) { return c.id === catId; }) ||
    CATEGORIES[CATEGORIES.length - 1]
  );
}

// ============================================
// Growth mechanic
//
// Two independent, per-task dimensions:
//  - Size:     driven by totalGrowthDays (lifetime count of days
//              completed). Grows by 1 each time a day is checked
//              off. If you uncheck TODAY's box, that credit is
//              undone and size drops back down - but only for
//              today; once a day has rolled over it's locked in
//              (see applyDayBoundaries()) and can't be undone later.
//  - Vitality: driven by streak (current consecutive-day run).
//              Resets to 0 the moment a full day is missed.
// ============================================

// Day thresholds where the art itself changes to a more detailed
// stage (seed → sprout → young → mature). Matches the 4 SVG stages
// already defined per category in PLANT_SVG_DATA.
var STAGE_MILESTONES = [0, 2, 15, 60];

// scale = 1 + 0.074 * totalGrowthDays^0.7 - unbounded, no ceiling.
// Tuned to ~2.8x at day 100, ~6x at day 365, ~9.8x at day 1000.
function computeScaleForDays(totalGrowthDays) {
  var days = Math.max(0, totalGrowthDays || 0);
  return 1 + 0.074 * Math.pow(days, 0.7);
}

function getStageIndexForDays(totalGrowthDays) {
  var days = Math.max(0, totalGrowthDays || 0);
  var idx  = 0;
  STAGE_MILESTONES.forEach(function (threshold, i) {
    if (days >= threshold) idx = i;
  });
  return idx;
}


// ============================================
// Day-boundary logic
// ============================================
function applyDayBoundaries() {
  var today   = getTodayString();
  var changed = false;

  if (lastResetDate !== today) {
    var gap = lastResetDate ? dayGap(lastResetDate, today) : null;

    tasks.forEach(function (task) {
      // gap === 1: task.completed still reflects "yesterday" - if it
      // wasn't done, that day was missed, so the streak breaks now.
      // gap > 1 (or no prior reset date at all): at least one full
      // day passed with no rollover recorded, which can only mean it
      // was missed - the streak always breaks in that case too.
      var survivedYesterday = (gap === 1) && task.completed;

      if (!survivedYesterday && task.streak > 0) {
        task.streak = 0;
        changed = true;
      }
      if (task.completed) {
        task.completed = false;
        changed = true;
      }
    });

    lastResetDate = today;
    changed = true;
  }

  tasks.forEach(function (task) {
    if (task.streak < 0) { task.streak = 0; changed = true; }
  });

  return changed;
}