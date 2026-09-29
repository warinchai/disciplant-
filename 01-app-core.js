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
// 4. The Garden: one view, not two. Each plant's stage and size
//    come from its total completed days, with a flourish while a
//    streak is alive. A show/hide button rolls back the day of
//    growth a ticked habit earned today so the plant can be
//    watched growing into it - purely a view, changing no day
//    count, streak or height (see the today's growth section in
//    04-garden-scene.js).
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
    // The id stays 'misc'. It is not a label - it is the value stored
    // as task.categoryId in every existing garden document, the key
    // PLANT_SVG_DATA / PLANT_ANCHORS / PLANT_SKINS are looked up by,
    // and the fallback every one of those lookups falls back TO.
    // Renaming it would orphan every task already saved under it.
    id:          'misc',
    name:        'Miscellaneous',
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
// Which landscape skin the plot is wearing - garden state, not user
// state, which is why it sits here beside lastResetDate rather than
// in currentUserProfile below. Loaded from gardens/{uid} by
// 02-auth-tasks.js and read by getActiveGardenSkinId() in 03.
//
// null rather than the default id on purpose: 03-plant-art.js loads
// AFTER this file, so GARDEN_SKIN_DEFAULT_ID doesn't exist yet and
// naming it here would throw. null already means "no choice stored",
// which resolves to the default at read time anyway.
let gardenSkinId        = null;
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
const gardenSceneEl     = document.getElementById('gardenScene');
const gardenTrackEl     = document.getElementById('gardenSceneTrack');
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
// Navigation
// ============================================
// Pages that get their own URL hash and a back/forward history entry.
// friend-garden is deliberately left out: it needs a friend uid to mean
// anything, which the hash doesn't carry, so a bare "#friend-garden"
// from the back button would land on a page with no friend loaded.
// Leaving the browser on whatever hash it already had for that case
// (see the guard in navigateTo below) is a smaller gap than that.
var NAV_HASH_PAGES = ['home', 'garden', 'tasks', 'stats', 'greenhouse', 'friends', 'guide'];

// The guide is the one page with a second part to its hash:
// "#guide/education" is that category's guide, bare "#guide" the
// front page. Everything else is just "#page".
function parseNavHash() {
  var parts = (location.hash || '').slice(1).split('/');
  var page  = parts[0];
  if (NAV_HASH_PAGES.indexOf(page) === -1) page = 'home';
  var cat = (page === 'guide' && typeof isGuideCategory === 'function' &&
             isGuideCategory(parts[1])) ? parts[1] : null;
  return { page: page, guideCat: cat };
}

function navigateTo(page, opts) {
  opts = opts || {};

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

  // Which guide is showing. Only navigating TO the guide changes it,
  // so the Back button from a category's tasks returns to that guide.
  if (page === 'guide' && typeof guideCategory !== 'undefined') {
    guideCategory = opts.guideCat || null;
  }

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
  if (typeof pageGuideEl !== 'undefined' && pageGuideEl) {
    pageGuideEl.classList.toggle('hidden', page !== 'guide');
  }

  // Garden scene: only visible on garden page once auth is ready
  if (gardenSceneEl) gardenSceneEl.classList.toggle('hidden', page !== 'garden' || !authReady);

  // Friend garden scene: same idea, but it doesn't wait on authReady
  // - that flag tracks the user's OWN garden snapshot, and this page
  // is only ever reached by clicking a friend, which can't happen
  // before auth has resolved anyway. It draws its own loading message
  // while the summary fetch is in flight.
  if (friendGardenSceneEl) friendGardenSceneEl.classList.toggle('hidden', page !== 'friend-garden');

  // The universal time-of-day sky (gradient, stars, clouds/birds,
  // sun/moon) stays visible on every page, including Garden, so
  // night/day looks identical everywhere.
  //
  // What comes OFF on the two garden pages is everything that sky
  // keeps at its own horizon - its ground strip, hills, haze and
  // fireflies. Those are pinned to the window, and the garden's ground
  // scrolls, so leaving them on would slide a second, motionless
  // horizon out from behind the real one as soon as you scrolled up.
  // The garden draws its own lawn inside the scrollable track instead
  // (renderLawn in 04). Nothing about the unscrolled view changes:
  // all of it sits below the 50vh line, where the lawn covered it
  // anyway.
  //
  // Home is the exception to all of that: it is a close-up of a
  // potting bench with no sky in it at all, and the bench is opaque,
  // so the whole #sky element comes off rather than being covered up.
  // Nothing about updateSky() cares - it keeps setting classes on a
  // hidden element, and they are all correct again the moment you
  // leave.
  if (skyEl) {
    skyEl.classList.toggle('sky-on-garden', page === 'garden' || page === 'friend-garden');
    skyEl.classList.toggle('sky-off', page === 'home');
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

  if (page === 'guide' && typeof renderGuidePage === 'function') {
    // Static content, so it draws without waiting on auth. Only the
    // "Plant this" buttons need the garden, and render() redraws
    // this page when it arrives.
    renderGuidePage();
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
  if (page === 'guide' && typeof pageGuideEl !== 'undefined' && pageGuideEl) pageGuideEl.scrollTop = 0;

  // Keep the URL in sync so the back/forward buttons work between
  // pages, without doing this for a popstate-triggered call (the
  // history entry already exists in that case - pushing again would
  // just stack a duplicate on top of it) or for friend-garden (see
  // NAV_HASH_PAGES above).
  if (!opts.fromPopState && NAV_HASH_PAGES.indexOf(page) !== -1) {
    var hash = '#' + page;
    if (page === 'guide' && typeof guideCategory !== 'undefined' && guideCategory) {
      hash += '/' + guideCategory;
    }
    if (location.hash !== hash) history.pushState(null, '', hash);
  }
}

// Back/forward button support: a hash we recognize navigates there; any
// other hash (or none, e.g. after a full "back" past the first visit)
// falls back to home. fromPopState stops navigateTo from pushing a new
// history entry for a transition the browser already recorded.
window.addEventListener('popstate', function () {
  var nav = parseNavHash();
  navigateTo(nav.page, { fromPopState: true, guideCat: nav.guideCat });
});

// Deep-linking: a bookmarked or shared "#tasks" (etc.) link opens
// straight to that page instead of always landing on Home. Deferred to
// DOMContentLoaded so every script (02-12) has finished loading first -
// this file (01) runs before any of them, and navigateTo() calls things
// like ensureSignedIn() and startFriendRequestListeners() that only
// exist once those later files are in. fromPopState:true because the
// browser's own initial history entry already matches this hash; we're
// just catching it up to what that hash means, not creating a new one.
document.addEventListener('DOMContentLoaded', function () {
  var nav = parseNavHash();
  if (nav.page !== 'home') {
    navigateTo(nav.page, { fromPopState: true, guideCat: nav.guideCat });
  }
});




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
    // The guide is reached from Tasks, so it lights that plank.
    var here = (currentPage === 'guide') ? 'tasks' : currentPage;
    plank.classList.toggle('current', plank.dataset.page === here);
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


// ============================================
// About panel
// ============================================
// The fifth sign on the bench is the only one that does not go
// anywhere. It opens the panel sitting under the row, which explains
// what the app is for and how it is played.
//
// The panel's text lives in index.html, not here. Two reasons: it is
// the only prose on the home page, so it should still be readable if
// this script never runs, and a search engine reading the markup has
// nothing else on this page to go on. All that happens here is a
// class being toggled.
//
// No Firestore, no account, no cost. A visitor can read the whole
// thing and leave without an account ever being created for them,
// which is the same promise the rest of the home page makes.
var aboutBtnEl      = document.getElementById('btn-about');
var aboutPanelEl    = document.getElementById('homeAbout');
var aboutCloseEl    = document.getElementById('homeAboutClose');
var homeInnerEl     = document.querySelector('.home-inner');

function setHomeAboutOpen(open) {
  if (!aboutBtnEl || !aboutPanelEl) return;
  aboutPanelEl.classList.toggle('hidden', !open);
  aboutBtnEl.setAttribute('aria-expanded', open ? 'true' : 'false');

  // Step the whole menu layer in front of the near props while the
  // panel is open, or the soil tray and the pots lie across the text.
  // It has to be the layer and not the panel: .home-inner is a stacking
  // context, so nothing inside it can climb past the props on its own.
  if (homeInnerEl) homeInnerEl.classList.toggle('is-about-open', open);

  // Opening it pushes the page taller than the window, and a panel
  // that opens below the fold reads as a button that did nothing.
  if (open && aboutPanelEl.scrollIntoView) {
    aboutPanelEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  // Closing hands focus back to the sign that opened it, or the
  // keyboard is left standing at the end of the document.
  if (!open && document.activeElement === aboutCloseEl) aboutBtnEl.focus();
}

if (aboutBtnEl && aboutPanelEl) {
  aboutBtnEl.addEventListener('click', function () {
    setHomeAboutOpen(aboutPanelEl.classList.contains('hidden'));
  });
}

if (aboutCloseEl) {
  aboutCloseEl.addEventListener('click', function () { setHomeAboutOpen(false); });
}

// Escape closes it, but only when it is the thing on screen - the nav
// drawer listens for Escape too, and both closing on one press would
// be a surprise.
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape' || !aboutPanelEl) return;
  if (aboutPanelEl.classList.contains('hidden')) return;
  if (navDrawerEl && navDrawerEl.classList.contains('is-open')) return;
  setHomeAboutOpen(false);
});

// Tasks -> Garden in one tap. The daily loop shouldn't cost a menu.
var plotGateEl = document.getElementById('plotGate');
if (plotGateEl) plotGateEl.addEventListener('click', function () { navigateTo('garden'); });


// Garden sub-nav


// ============================================
// Home scene: the potting bench
// ============================================
// The home page is a close-up of a potting bench, seen from above.
// There is no sky and no horizon on this page at all - the wood IS
// the background - which is why navigateTo() hides #sky while we are
// here (see the sky-off toggle further down this file).
//
// Division of labour, and it is worth keeping to it:
//
//   style.css    owns the table itself (planks, grain, seams, the
//                warm pool of light and the vignette) and where every
//                object sits. Layout is CSS, because only CSS knows
//                how wide the window is.
//   this file    owns what each object LOOKS like. Every prop is one
//                self-contained SVG string dropped into a host span
//                that style.css has already positioned and sized.
//
// So: to move a pot, edit style.css. To redraw it, edit here.
//
// Two rules the art follows throughout, both of them lessons from the
// version of this page that did not work:
//
//   1. No flat fills. Every surface carries a gradient or a painted
//      shading pass. A single-tone shape on a lit table reads as a
//      sticker.
//   2. No bare circles or plain ellipses, including for shadows. Every
//      contact shadow is an irregular blob with a soft radial falloff,
//      offset down and slightly right, because the light pools above
//      and a little left of centre. Consistent shadow direction is
//      most of what makes separate drawings feel like one scene.
//
// Gradient ids are prefixed 'hb' and are unique per prop. That is safe
// here in a way it is not in 04-garden-scene.js: this scene is built
// exactly once, so no id is ever duplicated in the document.
//
// Costs nothing at runtime beyond one string build per prop: no
// Firestore read, no auth, no account. A visitor who never leaves the
// home page is still free (see ensureSignedIn in 02-auth-tasks.js).

// Palette. Deliberately NOT the :root tokens - those are interface
// colours with a job each, and this is scenery, the same exception
// the garden's lawn and sky already take.
var HB = {
  potLight:  '#DE9765',
  potMid:    '#C4713F',
  potDeep:   '#9E4E27',
  potShade:  '#7C3A1C',
  soil:      '#4B3423',
  soilLight: '#66472F',
  leaf:      '#4E7A3C',
  leafLight: '#7CAE5C',
  leafDeep:  '#3B5F2C',
  stem:      '#5E8A45',
  bloom:     '#D89A8E',   // the accent, used in exactly four places
  bloomDeep: '#BC6F62',
  sun:       '#E8B75C',
  sunDeep:   '#C4913A',
  paper:     '#F4E7CD',
  paperEdge: '#DCC9A4',
  metal:     '#AFB9BA',
  metalMid:  '#889294',
  metalDeep: '#5E6A6D',
  twine:     '#D8BE8B',
  twineDeep: '#B0925F',
  wood:      '#B98A57',
  woodDeep:  '#7C5533',
  ink:       '#42301F'
};


// --- Shared drawing helpers ---------------------------------------

// A contact shadow: irregular outline, soft radial falloff, always
// offset down-right. `id` must be unique within its own prop.
function hbShadow(id, cx, cy, rx, ry, alpha) {
  var l = cx - rx, r = cx + rx, t = cy - ry, b = cy + ry;
  return '' +
    '<radialGradient id="' + id + '">' +
      '<stop offset="42%" stop-color="#2E1A0A" stop-opacity="' + alpha + '"/>' +
      '<stop offset="100%" stop-color="#2E1A0A" stop-opacity="0"/>' +
    '</radialGradient>' +
    '<path d="M' + l + ',' + (cy + ry * 0.1) +
      ' C' + (l + rx * 0.1) + ',' + (t + ry * 0.1) + ' ' + (cx - rx * 0.3) + ',' + (t - ry * 0.15) + ' ' + (cx + rx * 0.08) + ',' + t +
      ' C' + (cx + rx * 0.6) + ',' + (t + ry * 0.05) + ' ' + (r - rx * 0.05) + ',' + (cy - ry * 0.5) + ' ' + r + ',' + (cy + ry * 0.15) +
      ' C' + (r - rx * 0.06) + ',' + (b - ry * 0.1) + ' ' + (cx + rx * 0.4) + ',' + (b + ry * 0.12) + ' ' + (cx - rx * 0.05) + ',' + b +
      ' C' + (cx - rx * 0.55) + ',' + (b - ry * 0.02) + ' ' + (l + rx * 0.04) + ',' + (b - ry * 0.5) + ' ' + l + ',' + (cy + ry * 0.1) + 'Z"' +
    ' fill="url(#' + id + ')"/>';
}

// A leaf. Two-tone: the full blade, then a lighter wedge along the
// top edge so it turns towards the light instead of lying flat.
function hbLeaf(x, y, rot, scale, dark, light) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + scale + ')">' +
    '<path d="M0,0 C7,-10 21,-12 28,-2 C21,9 7,10 0,0Z" fill="' + dark + '"/>' +
    '<path d="M0,0 C7,-10 21,-12 28,-2 C21,-5 10,-4 0,0Z" fill="' + light + '"/>' +
    '<path d="M1.5,0 C10,-1.5 19,-2.5 26,-2.4" stroke="' + HB.leafDeep +
      '" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.55"/>' +
    '</g>';
}

// Five sparse petals. Sparse on purpose - overlapping petal stacks
// turn to mush at this size.
function hbFlower(x, y, scale, petal, petalDeep, heart) {
  var out = '<g transform="translate(' + x + ',' + y + ') scale(' + scale + ')">';
  var a;
  for (a = 0; a < 5; a++) {
    out += '<g transform="rotate(' + (a * 72 - 90) + ')">' +
      '<path d="M0,0 C5,-8 14,-10 17,-2 C14,6 5,7 0,0Z" fill="' + petal + '"/>' +
      '<path d="M0,0 C5,-8 14,-10 17,-2 C13,-3 6,-2 0,0Z" fill="' + petalDeep + '" opacity="0.42"/>' +
      '</g>';
  }
  out += '<path d="M0,-5 C3.4,-4 4.8,-1.6 4.2,1.8 C1.6,4.6 -2,4.4 -4,2 C-5,-1.4 -3,-4.2 0,-5Z" fill="' + heart + '"/>';
  return out + '</g>';
}


// ============================================
// The wordmark
// ============================================
// DISCIPLANT, grown rather than typed. Each letter is a skeleton
// stroke - no font is involved - drawn three times:
//
//   1. a dark pass, nudged down, which is the vine's own shadow
//      falling onto the plank underneath it
//   2. the main stem
//   3. a thin light pass, nudged up-left, which is the highlight that
//      makes a flat stroke read as a round stem
//
// Leaves and the one flower are added afterwards at hand-picked
// anchor points, kept sparse: a leaf on every curve buries the word.
// The flower is the accent colour's first of four appearances.
var HB_LETTERS = [
  'M28,30 C26,60 29,92 28,122',                                  // D stem
  'M28,31 C58,28 70,50 69,76 C68,101 56,124 28,121',             // D bowl
  'M94,30 C92,60 96,92 94,122',                                  // I
  'M154,46 C148,31 123,30 121,50 C119,70 153,68 154,90 C155,112 129,124 119,108', // S
  'M212,50 C203,30 177,32 176,76 C175,118 203,122 212,104',      // C
  'M237,30 C235,60 239,92 237,122',                              // I
  'M266,30 C264,60 268,92 266,122',                              // P stem
  'M266,31 C291,29 302,38 301,54 C300,70 289,78 266,77',         // P bowl
  'M323,30 C321,60 325,94 323,121 C336,123 346,122 352,120',     // L
  'M371,122 C379,92 387,58 392,30',                              // A left
  'M392,30 C398,58 406,92 413,122',                              // A right
  'M379,90 C389,87 397,87 406,90',                               // A bar
  'M436,122 C435,92 437,58 436,30',                              // N left
  'M436,32 C448,60 460,90 473,120',                              // N diagonal
  'M473,120 C472,90 474,58 473,30',                              // N right
  'M495,32 C509,29 523,31 535,31',                               // T bar
  'M515,31 C513,60 517,94 515,122'                               // T stem
];

function hbWordmark() {
  var i, pass = '';

  // Pass 1: shadow onto the wood.
  pass += '<g transform="translate(2,6)" opacity="0.34">';
  for (i = 0; i < HB_LETTERS.length; i++) {
    pass += '<path d="' + HB_LETTERS[i] + '" stroke="#2B1A0C" stroke-width="19" fill="none"' +
            ' stroke-linecap="round" stroke-linejoin="round"/>';
  }
  pass += '</g>';

  // Pass 2: the stem itself.
  pass += '<g>';
  for (i = 0; i < HB_LETTERS.length; i++) {
    pass += '<path d="' + HB_LETTERS[i] + '" stroke="' + HB.leaf + '" stroke-width="17" fill="none"' +
            ' stroke-linecap="round" stroke-linejoin="round"/>';
  }
  pass += '</g>';

  // Pass 3: the roll of light along the top of each stem.
  pass += '<g transform="translate(-1.5,-3.6)" opacity="0.85">';
  for (i = 0; i < HB_LETTERS.length; i++) {
    pass += '<path d="' + HB_LETTERS[i] + '" stroke="' + HB.leafLight + '" stroke-width="5.5" fill="none"' +
            ' stroke-linecap="round" stroke-linejoin="round"/>';
  }
  pass += '</g>';

  // Two tendrils, curling off where a real vine would run out of
  // letter to follow.
  pass += '<path d="M94,30 C92,20 84,15 78,19 C73,22 74,30 80,30 C85,30 86,25 84,22"' +
          ' stroke="' + HB.stem + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
  pass += '<path d="M473,122 C476,132 486,136 492,132 C497,128 494,120 488,121"' +
          ' stroke="' + HB.stem + '" stroke-width="5" fill="none" stroke-linecap="round"/>';

  // Seven leaves. Counted, not sprinkled.
  pass += hbLeaf(70, 56, -34, 0.85, HB.leaf, HB.leafLight);
  pass += hbLeaf(120, 44, 196, 0.72, HB.leaf, HB.leafLight);
  pass += hbLeaf(177, 104, 148, 0.78, HB.leaf, HB.leafLight);
  pass += hbLeaf(302, 48, -22, 0.82, HB.leaf, HB.leafLight);
  pass += hbLeaf(353, 119, -14, 0.74, HB.leaf, HB.leafLight);
  pass += hbLeaf(393, 34, 202, 0.66, HB.leaf, HB.leafLight);
  pass += hbLeaf(537, 29, -30, 0.8, HB.leaf, HB.leafLight);

  // Accent 1 of 4.
  pass += hbFlower(27, 24, 0.92, HB.bloom, HB.bloomDeep, HB.sun);

  return '<svg viewBox="0 0 566 152" xmlns="http://www.w3.org/2000/svg" role="img" ' +
         'aria-label="Disciplant">' + pass + '</svg>';
}


// ============================================
// Carved lettering
// ============================================
// The four sign faces do not use a font. Every letter below is a
// skeleton drawn by hand as one or more stroked paths on a 101-unit
// cap height, and hbCutText() walks a string, lays the glyphs out and
// stamps them three times to make them look cut into the wood rather
// than printed on it.
//
// Why not a font: an inscription is not ink, it is a groove, and a
// groove is defined by which of its walls the light hits. That needs
// three offset copies of the same shape, which you cannot get from
// text-shadow on a real font without the copies being letterforms in
// their own right - they end up looking like a bad emboss. Drawing
// the skeleton once and stroking it three times is both cheaper and
// correct.
//
// The three passes, in paint order:
//
//   1. LIT WALL     nudged down-right, in a tint of the paint. This
//                   is the lower wall of the groove, the only part
//                   of a cut that faces the lamp.
//   2. SHADOW WALL  nudged up-left, very dark. The upper wall, which
//                   the light never reaches.
//   3. FLOOR        centred and slightly narrower, mid-dark. What is
//                   left is the bottom of the cut.
//
// The offsets are down-right and up-left because the bench's light
// pools above and a little left of centre - the same direction every
// prop shadow in the scene above already uses. Change one, change
// both, or the signs will be lit from a different lamp than the pots.
//
// Round caps and joins throughout: a router bit has a radius, so a
// cut letter cannot have a sharp corner.
//
// Letters are stored with a small amount of wobble in the control
// points. Perfectly straight stems are what make hand-drawn
// lettering read as a font again.

// Advance width per glyph, then its strokes. Only the letters the
// five signs actually need are here - adding a word means adding its
// missing letters, and hbCutText will warn in the console rather than
// silently dropping one.
var HB_GLYPHS = {
  ' ': { w: 30, d: [] },
  'A': { w: 72, d: ['M7,101 C16,72 27,38 36,3',
                    'M36,3 C45,38 56,72 65,101',
                    'M18,67 C29,64 43,64 54,67'] },
  'B': { w: 68, d: ['M11,3 C9,36 12,70 11,101',
                    'M11,4 C33,1 56,8 56,27 C56,45 38,52 11,51',
                    'M11,51 C38,49 61,57 61,76 C61,96 37,103 11,100'] },
  'C': { w: 70, d: ['M62,22 C53,3 30,-1 16,14 C1,31 1,73 16,89 C31,104 55,100 63,82'] },
  'D': { w: 70, d: ['M11,3 C9,36 12,70 11,101',
                    'M11,4 C38,1 63,14 62,52 C61,90 38,103 11,100'] },
  'E': { w: 58, d: ['M13,3 C11,36 14,70 13,101',
                    'M13,4 C27,1 43,3 54,2',
                    'M13,51 C25,48 37,49 46,50',
                    'M13,100 C27,103 43,100 55,99'] },
  'F': { w: 56, d: ['M13,3 C11,36 14,70 13,101',
                    'M13,4 C27,1 43,3 53,2',
                    'M13,51 C25,48 37,49 45,50'] },
  'G': { w: 76, d: ['M64,22 C55,3 32,-1 18,14 C3,31 3,73 18,89 C33,104 60,99 65,82 L65,58 L44,58'] },
  'H': { w: 70, d: ['M11,3 C9,36 12,70 11,101',
                    'M60,3 C58,36 61,70 60,101',
                    'M11,52 C25,49 46,49 60,52'] },
  'I': { w: 26, d: ['M13,3 C11,36 15,70 13,101'] },
  'K': { w: 68, d: ['M11,3 C9,36 12,70 11,101',
                    'M62,3 C48,20 33,38 22,53',
                    'M29,45 C42,63 54,82 64,101'] },
  'L': { w: 56, d: ['M13,3 C11,36 14,70 13,101',
                    'M13,100 C27,103 43,100 55,99'] },
  'M': { w: 88, d: ['M9,101 C7,70 10,36 9,3',
                    'M9,4 C19,36 32,66 44,88',
                    'M44,88 C56,66 69,36 79,4',
                    'M79,3 C77,36 80,70 79,101'] },
  'N': { w: 72, d: ['M10,101 C8,70 11,36 10,3',
                    'M10,4 C24,36 47,72 62,100',
                    'M62,100 C60,70 63,36 62,3'] },
  'O': { w: 76, d: ['M38,2 C15,2 4,23 4,52 C4,81 15,101 38,101 C61,101 72,81 72,52 C72,23 61,2 38,2Z'] },

  // P is R with the leg left off, and it shares R's stem and bowl on
  // purpose - the two letters sit next to each other in DISCIPLANT
  // and a bowl drawn to a different curve would show.
  'P': { w: 64, d: ['M11,3 C9,36 12,70 11,101',
                    'M11,4 C34,1 62,6 62,29 C62,48 44,54 11,52'] },
  'R': { w: 68, d: ['M11,3 C9,36 12,70 11,101',
                    'M11,4 C34,1 62,6 62,29 C62,48 44,54 11,52',
                    'M35,52 C45,68 56,85 64,101'] },
  'S': { w: 64, d: ['M56,20 C48,4 20,0 12,18 C4,36 27,45 41,54 C57,63 60,84 45,94 C31,103 12,97 6,83'] },
  'T': { w: 62, d: ['M4,5 C20,2 43,3 58,3',
                    'M31,4 C29,36 33,70 31,101'] },
  'U': { w: 70, d: ['M11,3 C9,28 10,52 11,68 C12,90 23,101 37,101 C51,101 61,90 62,68 C63,52 64,28 62,3'] },
  'W': { w: 92, d: ['M8,3 C13,36 18,70 25,101',
                    'M25,101 C32,74 39,48 46,26',
                    'M46,26 C53,48 60,74 67,101',
                    'M67,101 C74,70 79,36 84,3'] },
  'Y': { w: 68, d: ['M6,3 C15,20 26,38 34,52',
                    'M62,3 C53,20 42,38 34,52',
                    'M34,52 C32,68 35,85 34,101'] },

  // The full stop is a stroke with almost no length. Because every
  // cap and join in here is round, a 0.6-unit segment comes out as a
  // disc the width of the cut - and it therefore picks up all three
  // passes on its own, with no special case anywhere in hbCutPass.
  '.': { w: 24, d: ['M11,99 L11.6,99.6'] }
};

var HB_TRACKING = 12;   // space between glyph boxes, in glyph units
var HB_CUT_W     = 15;  // width of the cut
var HB_CUT_DX    = 1.9; // how far the lit wall sits down and right
var HB_CUT_DY    = 2.2;

// One pass over the whole string: every glyph's strokes, translated
// into place, at one stroke width and one colour.
function hbCutPass(chars, width, colour, dx, dy, opacity) {
  var out = '<g transform="translate(' + dx + ',' + dy + ')"' +
            (opacity === 1 ? '' : ' opacity="' + opacity + '"') + '>';
  var x = 0, i, j, g;

  for (i = 0; i < chars.length; i++) {
    g = HB_GLYPHS[chars[i]];
    if (g.d.length) {
      out += '<g transform="translate(' + x + ',0)">';
      for (j = 0; j < g.d.length; j++) {
        out += '<path d="' + g.d[j] + '" fill="none" stroke="' + colour +
               '" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round"/>';
      }
      out += '</g>';
    }
    x += g.w + HB_TRACKING;
  }

  return out + '</g>';
}

// sign = { text, lit, shadow, floor }
function hbCutText(sign) {
  var raw = String(sign.text).toUpperCase();
  var chars = [];
  var total = 0;
  var i;

  for (i = 0; i < raw.length; i++) {
    if (!HB_GLYPHS[raw[i]]) {
      console.warn('DISCIPLANT: no carved glyph for "' + raw[i] +
                   '" - add it to HB_GLYPHS in 01-app-core.js.');
      continue;
    }
    chars.push(raw[i]);
    total += HB_GLYPHS[raw[i]].w + HB_TRACKING;
  }
  total -= HB_TRACKING;   // no tracking after the last glyph

  // Room for the stroke and for both offsets, on all four sides.
  var pad = HB_CUT_W / 2 + 6;

  return '<svg viewBox="' + (-pad) + ' ' + (-pad) + ' ' + (total + pad * 2) +
         ' ' + (101 + pad * 2) + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    hbCutPass(chars, HB_CUT_W,       sign.lit,     HB_CUT_DX,  HB_CUT_DY,  0.95) +
    hbCutPass(chars, HB_CUT_W,       sign.shadow, -HB_CUT_DX * 0.7, -HB_CUT_DY * 0.7, 0.9) +
    hbCutPass(chars, HB_CUT_W - 2.2, sign.floor,   0,          0,          1) +
  '</svg>';
}

// One entry per sign. The three colours are always derived from the
// same paint as the block it is cut into (see the four .marker-*
// paint classes in style.css): a light tint for the lit wall, a very
// dark shade for the shadowed wall, and a mid-dark for the floor.
// Keeping them here rather than in CSS avoids relying on custom
// properties resolving inside injected SVG.
var HB_SIGNS = [
  { hostId: 'cutGarden',     text: 'ENTER GARDEN',
    lit: '#B9DE9B', shadow: '#20401A', floor: '#3B6629' },
  { hostId: 'cutTasks',      text: 'TASKS',
    lit: '#ADD5E8', shadow: '#17323F', floor: '#305A72' },
  { hostId: 'cutGreenhouse', text: 'GREENHOUSE',
    lit: '#FBE4AF', shadow: '#563608', floor: '#8C6019' },
  { hostId: 'cutFriends',    text: 'FRIENDS',
    lit: '#F4BAA9', shadow: '#4A1C12', floor: '#7C3B29' },

  // The tagline, cut into the pale board under the plank rather than
  // printed on it. Its three colours are the odd ones out: the board
  // is nearly white, so the lit wall can only be a shade brighter
  // than the surface it sits on - which is exactly what a real groove
  // in a pale board looks like. That means the FLOOR pass is what
  // carries the reading here, where on the four painted signs the
  // lit wall does most of the work.
  { hostId: 'cutLabel',      text: 'Tend your habits. Watch them bloom.',
    lit: '#FFFBF0', shadow: '#432E14', floor: '#7A5B36' },

  // The About sign and the heading of the panel it opens. Both are
  // cut into pale stock rather than paint, so they take the same three
  // colours as the tagline above: on a nearly white board the lit wall
  // can only be a shade brighter than the surface, and the FLOOR pass
  // is what carries the reading.
  { hostId: 'cutAbout',      text: 'ABOUT',
    lit: '#FFFBF0', shadow: '#432E14', floor: '#7A5B36' },
  { hostId: 'cutAboutTitle', text: 'ABOUT DISCIPLANT',
    lit: '#FFFBF0', shadow: '#432E14', floor: '#7A5B36' }
];


// ============================================
// The props
// ============================================

// Big terracotta pot, front left. Carries the mascot and accent 2 of 4.
function hbPotMain() {
  return '<svg viewBox="0 0 164 208" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="hbPmBody" x1="0" y1="0" x2="1" y2="0.35">' +
        '<stop offset="0%" stop-color="' + HB.potLight + '"/>' +
        '<stop offset="46%" stop-color="' + HB.potMid + '"/>' +
        '<stop offset="100%" stop-color="' + HB.potShade + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="hbPmRim" x1="0" y1="0" x2="1" y2="0.6">' +
        '<stop offset="0%" stop-color="#EAA773"/>' +
        '<stop offset="55%" stop-color="' + HB.potMid + '"/>' +
        '<stop offset="100%" stop-color="' + HB.potDeep + '"/>' +
      '</linearGradient>' +
    '</defs>' +
    hbShadow('hbPmSh', 88, 190, 68, 15, 0.5) +

    // Body: tapered, with the bottom corners rolled.
    '<path d="M36,74 L128,74 L116,172 C115,180 104,184 82,184 C60,184 49,180 48,172 Z" fill="url(#hbPmBody)"/>' +
    // The turn of the clay on the left, where the light lands.
    '<path d="M42,78 C46,116 52,152 58,178 C52,177 49,175 48,171 L38,80Z" fill="#F0B183" opacity="0.5"/>' +
    // ...and the far side falling away.
    '<path d="M112,78 L122,80 L112,171 C111,177 104,181 92,183 C104,150 110,114 112,78Z" fill="' + HB.potShade + '" opacity="0.45"/>' +

    // Rim, overhanging on both sides so the pot has a lip to catch light.
    '<path d="M26,50 L138,50 C142,50 143,53 142,57 L138,74 C137,78 134,80 130,80 L34,80 C30,80 27,78 26,74 L22,57 C21,53 22,50 26,50Z" fill="url(#hbPmRim)"/>' +
    '<path d="M28,54 C60,49 106,49 136,54 C106,58 58,58 28,54Z" fill="#F3B98C" opacity="0.55"/>' +

    // Soil, sitting below the rim line.
    '<path d="M34,55 C58,48 108,48 132,55 C126,63 100,66 82,66 C62,66 40,62 34,55Z" fill="' + HB.soil + '"/>' +
    '<path d="M46,56 C62,52 100,52 118,56 C104,60 62,61 46,56Z" fill="' + HB.soilLight + '" opacity="0.65"/>' +

    // The plant: one stem, two leaves, one bloom. Accent 2 of 4.
    '<path d="M84,58 C80,42 84,26 94,16" stroke="' + HB.stem + '" stroke-width="6" fill="none" stroke-linecap="round"/>' +
    hbLeaf(83, 44, -152, 1.05, HB.leaf, HB.leafLight) +
    hbLeaf(86, 32, -18, 0.95, HB.leaf, HB.leafLight) +
    hbFlower(97, 14, 1.05, HB.bloom, HB.bloomDeep, HB.sun) +

    // Mascot: a sprout that has decided this pot is its house. Peeks
    // over the near rim, small enough to lose an argument with the
    // wordmark. Its cheek mark is accent 3 of 4.
    '<g transform="translate(44,30)">' +
      '<path d="M0,30 C-3,16 2,4 12,2 C22,0 29,9 28,22 C27,31 22,36 14,36 C6,36 1,34 0,30Z" fill="#79AE5A"/>' +
      '<path d="M4,30 C1,17 5,7 13,4 C9,14 8,24 11,35 C7,35 5,33 4,30Z" fill="#96C776" opacity="0.75"/>' +
      hbLeaf(11, 2, -108, 0.6, HB.leaf, HB.leafLight) +
      hbLeaf(19, 3, -46, 0.55, HB.leaf, HB.leafLight) +
      '<path d="M8,18 C10,16 12,17 12,20 C12,23 10,24 8,22Z" fill="' + HB.ink + '"/>' +
      '<path d="M19,18 C21,16 23,17 23,20 C23,23 21,24 19,22Z" fill="' + HB.ink + '"/>' +
      '<path d="M12,27 C14,29 17,29 19,27" stroke="' + HB.ink + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '<path d="M2,23 C4,22 6,23 6,25 C6,27 3,27 2,25Z" fill="' + HB.bloom + '" opacity="0.8"/>' +
    '</g>' +
  '</svg>';
}

// Medium pot with two seedling leaves, front left, sitting behind the
// big one so the two overlap rather than line up.
function hbPotSmall() {
  return '<svg viewBox="0 0 120 148" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="hbPsBody" x1="0" y1="0" x2="1" y2="0.3">' +
        '<stop offset="0%" stop-color="' + HB.potLight + '"/>' +
        '<stop offset="52%" stop-color="' + HB.potMid + '"/>' +
        '<stop offset="100%" stop-color="' + HB.potShade + '"/>' +
      '</linearGradient>' +
    '</defs>' +
    hbShadow('hbPsSh', 62, 134, 47, 11, 0.46) +
    '<path d="M28,60 L94,60 L85,124 C84,131 76,134 61,134 C46,134 38,131 37,124 Z" fill="url(#hbPsBody)"/>' +
    '<path d="M33,63 C36,90 40,112 44,130 C40,129 38,127 37,123 L30,65Z" fill="#F0B183" opacity="0.45"/>' +
    '<path d="M20,42 L102,42 C105,42 106,45 105,48 L102,60 C101,63 99,65 96,65 L26,65 C23,65 21,63 20,60 L17,48 C16,45 17,42 20,42Z" fill="url(#hbPsBody)"/>' +
    '<path d="M22,45 C46,41 78,41 100,45 C78,49 44,49 22,45Z" fill="#F3B98C" opacity="0.5"/>' +
    '<path d="M26,46 C44,41 78,41 96,46 C90,53 74,56 61,56 C46,56 30,52 26,46Z" fill="' + HB.soil + '"/>' +
    '<path d="M60,48 C57,36 58,26 63,18" stroke="' + HB.stem + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    hbLeaf(59, 34, -158, 0.9, HB.leaf, HB.leafLight) +
    hbLeaf(61, 22, -24, 0.85, HB.leaf, HB.leafLight) +
    hbLeaf(62, 12, -96, 0.62, HB.leaf, HB.leafLight) +
  '</svg>';
}

// Small pot, back right. Smaller and lower-contrast than the front
// two - that is the whole depth cue.
function hbPotBack() {
  return '<svg viewBox="0 0 104 126" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="hbPbBody" x1="0" y1="0" x2="1" y2="0.3">' +
        '<stop offset="0%" stop-color="#D68F62"/>' +
        '<stop offset="55%" stop-color="' + HB.potMid + '"/>' +
        '<stop offset="100%" stop-color="' + HB.potDeep + '"/>' +
      '</linearGradient>' +
    '</defs>' +
    hbShadow('hbPbSh', 53, 112, 40, 10, 0.4) +
    '<path d="M24,54 L82,54 L74,104 C73,110 66,113 53,113 C40,113 33,110 32,104 Z" fill="url(#hbPbBody)"/>' +
    '<path d="M28,57 C31,79 34,96 37,110 C34,109 33,107 32,104 L26,58Z" fill="#EDAC7E" opacity="0.42"/>' +
    '<path d="M17,38 L89,38 C92,38 93,41 92,44 L89,54 C88,57 86,58 83,58 L23,58 C20,58 18,57 17,54 L14,44 C13,41 14,38 17,38Z" fill="url(#hbPbBody)"/>' +
    '<path d="M19,41 C40,37 66,37 87,41 C66,45 40,45 19,41Z" fill="#F1B589" opacity="0.45"/>' +
    '<path d="M22,42 C40,38 66,38 84,42 C78,48 64,50 53,50 C40,50 26,47 22,42Z" fill="' + HB.soil + '"/>' +
    // Three sprigs, staggered heights so the silhouette is not a fan.
    '<path d="M46,44 C42,32 44,22 50,16" stroke="' + HB.stem + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>' +
    '<path d="M56,44 C57,33 62,25 69,21" stroke="' + HB.stem + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>' +
    '<path d="M51,45 C51,37 53,31 56,27" stroke="' + HB.stem + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    hbLeaf(50, 15, -122, 0.72, HB.leaf, HB.leafLight) +
    hbLeaf(69, 20, -34, 0.7, HB.leaf, HB.leafLight) +
    hbLeaf(56, 26, -78, 0.6, HB.leaf, HB.leafLight) +
  '</svg>';
}

// Watering can, back left. Handle, spout, rose, and a dented body -
// a perfectly smooth can looks like a rendering, not a tool.
function hbWateringCan() {
  return '<svg viewBox="0 0 196 142" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="hbWcBody" x1="0" y1="0" x2="0.25" y2="1">' +
        '<stop offset="0%" stop-color="#C9D2D3"/>' +
        '<stop offset="38%" stop-color="' + HB.metal + '"/>' +
        '<stop offset="100%" stop-color="' + HB.metalDeep + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="hbWcSpout" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#BEC8C9"/>' +
        '<stop offset="100%" stop-color="#6C7679"/>' +
      '</linearGradient>' +
    '</defs>' +
    hbShadow('hbWcSh', 106, 124, 66, 12, 0.44) +
    // Spout, running out to the left and down to the rose.
    '<path d="M74,66 C56,68 38,78 26,94 C22,100 24,106 30,106 C36,106 40,100 46,94 C56,84 68,80 80,80Z" fill="url(#hbWcSpout)"/>' +
    '<path d="M14,88 L38,80 C42,86 42,96 38,102 L14,108 C10,102 10,94 14,88Z" fill="' + HB.metalDeep + '"/>' +
    '<path d="M16,91 L34,85 C36,89 36,95 34,99 L16,105 C14,100 14,96 16,91Z" fill="#8E9A9C"/>' +
    // Body.
    '<path d="M72,56 C68,56 66,60 67,66 L76,110 C77,118 84,122 104,122 C124,122 132,118 133,110 L142,66 C143,60 141,56 137,56Z" fill="url(#hbWcBody)"/>' +
    '<path d="M78,60 C80,80 84,102 90,120 C84,119 80,116 79,111 L72,62Z" fill="#DCE4E5" opacity="0.55"/>' +
    '<path d="M128,60 L138,61 L128,111 C127,116 121,119 114,120 C122,102 126,80 128,60Z" fill="#576265" opacity="0.4"/>' +
    // Collar and handle.
    '<path d="M66,48 L144,48 C147,48 148,51 147,55 L146,60 C145,63 143,64 140,64 L70,64 C67,64 65,63 64,60 L63,55 C62,51 63,48 66,48Z" fill="#BCC6C7"/>' +
    '<path d="M84,50 C88,26 122,24 128,48" stroke="#7D888B" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M86,47 C90,29 118,27 125,45" stroke="#B7C1C2" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
  '</svg>';
}

// Trowel, front right, lying at an angle across the boards.
function hbTrowel() {
  return '<svg viewBox="0 0 208 96" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="hbTrBlade" x1="0" y1="0" x2="0.3" y2="1">' +
        '<stop offset="0%" stop-color="#CBD4D5"/>' +
        '<stop offset="44%" stop-color="' + HB.metal + '"/>' +
        '<stop offset="100%" stop-color="#606B6E"/>' +
      '</linearGradient>' +
      '<linearGradient id="hbTrGrip" x1="0" y1="0" x2="0.2" y2="1">' +
        '<stop offset="0%" stop-color="#C98A57"/>' +
        '<stop offset="50%" stop-color="#A96C3C"/>' +
        '<stop offset="100%" stop-color="#784823"/>' +
      '</linearGradient>' +
    '</defs>' +
    hbShadow('hbTrSh', 104, 74, 88, 11, 0.42) +
    // Blade: scooped, asymmetric, with a worn tip.
    '<path d="M14,44 C22,26 44,18 68,20 C86,22 96,32 96,44 C96,56 86,64 68,66 C44,68 22,60 14,44Z" fill="url(#hbTrBlade)"/>' +
    '<path d="M22,44 C30,30 48,24 68,26 C56,32 44,40 38,52 C30,50 25,48 22,44Z" fill="#DDE5E6" opacity="0.5"/>' +
    '<path d="M60,62 C80,60 92,54 95,44 C97,56 87,64 68,66Z" fill="#4E585B" opacity="0.5"/>' +
    // Shaft and ferrule.
    '<path d="M94,38 L122,36 L124,52 L94,50Z" fill="#8B9698"/>' +
    '<path d="M120,34 L136,33 C140,33 142,36 142,42 C142,49 140,53 136,53 L120,52Z" fill="#6E797C"/>' +
    // Wooden grip with a grain line and a light top edge.
    '<path d="M138,32 L186,30 C194,30 199,35 199,43 C199,51 194,56 186,56 L138,54Z" fill="url(#hbTrGrip)"/>' +
    '<path d="M142,35 L184,34 C189,34 192,37 192,40 C186,38 160,38 142,39Z" fill="#DDA470" opacity="0.55"/>' +
    '<path d="M146,48 C162,47 180,47 192,48" stroke="#7A4A24" stroke-width="1.6" fill="none" opacity="0.5"/>' +
  '</svg>';
}

// Two seed packets, front right, overlapping and tossed at different
// angles. The upper one's illustration is accent 4 of 4.
function hbPackets() {
  return '<svg viewBox="0 0 216 174" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="hbPkA" x1="0" y1="0" x2="0.3" y2="1">' +
        '<stop offset="0%" stop-color="#FBF1DC"/>' +
        '<stop offset="62%" stop-color="' + HB.paper + '"/>' +
        '<stop offset="100%" stop-color="#D8C29A"/>' +
      '</linearGradient>' +
      '<linearGradient id="hbPkB" x1="0" y1="0" x2="0.3" y2="1">' +
        '<stop offset="0%" stop-color="#F3E4C4"/>' +
        '<stop offset="62%" stop-color="#E7D5B0"/>' +
        '<stop offset="100%" stop-color="#C9B084"/>' +
      '</linearGradient>' +
    '</defs>' +
    hbShadow('hbPkSh', 108, 148, 88, 13, 0.42) +

    // Lower packet, rotated the other way.
    '<g transform="rotate(-9 60 100)">' +
      '<path d="M12,64 L108,52 C112,52 114,54 114,58 L124,140 C124,144 122,146 118,147 L22,158 C18,158 16,156 16,152Z" fill="url(#hbPkB)"/>' +
      '<path d="M14,70 L112,58 L114,72 L16,84Z" fill="#B58F5C" opacity="0.32"/>' +
      // A carrot-ish root, drawn not photographed.
      '<path d="M52,96 C60,92 70,94 74,102 C78,112 70,128 58,132 C48,128 46,110 52,96Z" fill="#D9873F"/>' +
      '<path d="M55,99 C60,97 66,98 69,103 C64,105 58,110 55,118 C52,111 52,103 55,99Z" fill="#EFA362" opacity="0.6"/>' +
      hbLeaf(66, 92, -128, 0.62, HB.leaf, HB.leafLight) +
      hbLeaf(74, 96, -66, 0.58, HB.leaf, HB.leafLight) +
      '<path d="M30,140 L96,132" stroke="#9C7C4E" stroke-width="3" stroke-linecap="round" opacity="0.4"/>' +
      '<path d="M30,148 L74,143" stroke="#9C7C4E" stroke-width="3" stroke-linecap="round" opacity="0.28"/>' +
    '</g>' +

    // Upper packet, lying across the first.
    '<g transform="rotate(7 150 84)">' +
      '<path d="M92,26 L188,20 C192,20 194,22 194,26 L200,112 C200,116 198,118 194,118 L98,126 C94,126 92,124 92,120Z" fill="url(#hbPkA)"/>' +
      '<path d="M92,32 L194,26 L195,42 L93,48Z" fill="#C39A62" opacity="0.3"/>' +
      hbFlower(140, 72, 1.28, HB.bloom, HB.bloomDeep, HB.sun) +
      hbLeaf(150, 88, -22, 0.72, HB.leaf, HB.leafLight) +
      hbLeaf(130, 90, 202, 0.68, HB.leaf, HB.leafLight) +
      '<path d="M106,104 L180,99" stroke="#9C7C4E" stroke-width="3" stroke-linecap="round" opacity="0.4"/>' +
      '<path d="M106,112 L152,108" stroke="#9C7C4E" stroke-width="3" stroke-linecap="round" opacity="0.28"/>' +
      // Torn corner, so it reads as used.
      '<path d="M182,20 L194,26 L194,34 C188,30 184,25 182,20Z" fill="#C7AF86"/>' +
    '</g>' +
  '</svg>';
}

// Ball of twine, back right, with a loose end trailing off.
function hbTwine() {
  return '<svg viewBox="0 0 128 118" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<radialGradient id="hbTwBall" cx="0.36" cy="0.3" r="0.78">' +
        '<stop offset="0%" stop-color="#EBD7A9"/>' +
        '<stop offset="55%" stop-color="' + HB.twine + '"/>' +
        '<stop offset="100%" stop-color="#9C7C4B"/>' +
      '</radialGradient>' +
    '</defs>' +
    hbShadow('hbTwSh', 60, 104, 44, 10, 0.42) +
    '<path d="M12,58 C12,30 32,14 60,14 C88,14 106,32 106,58 C106,84 88,100 60,100 C32,100 12,84 12,58Z" fill="url(#hbTwBall)"/>' +
    // Wound strands: arcs following the ball, not concentric rings.
    '<path d="M18,44 C34,28 66,22 94,34" stroke="' + HB.twineDeep + '" stroke-width="2.6" fill="none" opacity="0.5"/>' +
    '<path d="M14,62 C32,44 70,38 102,52" stroke="' + HB.twineDeep + '" stroke-width="2.6" fill="none" opacity="0.45"/>' +
    '<path d="M18,78 C36,62 74,58 104,70" stroke="' + HB.twineDeep + '" stroke-width="2.6" fill="none" opacity="0.4"/>' +
    '<path d="M30,92 C48,80 82,78 100,86" stroke="' + HB.twineDeep + '" stroke-width="2.4" fill="none" opacity="0.34"/>' +
    '<path d="M24,36 C38,52 44,76 42,98" stroke="#F0DDB4" stroke-width="2.2" fill="none" opacity="0.4"/>' +
    // Loose end.
    '<path d="M100,74 C114,80 122,92 118,104 C116,110 110,112 106,108" stroke="' + HB.twine +
      '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
  '</svg>';
}

// Spilled soil with stray seeds. Sits low and wide under the buttons,
// which is what stops the bottom of the frame going empty.
function hbSoil() {
  return '<svg viewBox="0 0 260 96" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="hbSoHeap" x1="0.2" y1="0" x2="0.7" y2="1">' +
        '<stop offset="0%" stop-color="#6B4A30"/>' +
        '<stop offset="55%" stop-color="#503725"/>' +
        '<stop offset="100%" stop-color="#382517"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<path d="M18,64 C34,44 66,36 106,38 C150,40 186,34 214,42 C238,49 246,64 236,74 C222,88 170,88 122,84 C74,80 30,84 18,74 C12,70 13,68 18,64Z" fill="url(#hbSoHeap)" opacity="0.92"/>' +
    '<path d="M40,58 C64,46 100,44 130,48 C112,52 78,54 56,62 C46,62 42,60 40,58Z" fill="#7A563A" opacity="0.55"/>' +
    // Crumbs walking away from the heap - the reason it reads as spilt.
    '<path d="M244,52 C248,50 252,52 251,56 C249,60 244,59 243,56Z" fill="#4E3524"/>' +
    '<path d="M12,52 C16,50 20,52 19,56 C17,59 12,58 11,55Z" fill="#4E3524"/>' +
    '<path d="M204,26 C208,24 211,26 210,30 C208,33 204,32 203,29Z" fill="#5A3E29"/>' +
    '<path d="M62,28 C66,26 69,28 68,32 C66,35 62,34 61,31Z" fill="#5A3E29"/>' +
    // Seeds: teardrops, pale, catching the light.
    '<path d="M92,26 C97,22 104,24 104,30 C104,36 96,38 92,33Z" fill="#D9C193"/>' +
    '<path d="M96,29 C99,26 102,27 103,30 C100,31 98,31 96,29Z" fill="#F0DDB4"/>' +
    '<path d="M162,20 C167,16 174,18 174,24 C174,30 166,32 162,27Z" fill="#D9C193"/>' +
    '<path d="M166,23 C169,20 172,21 173,24 C170,25 168,25 166,23Z" fill="#F0DDB4"/>' +
    '<path d="M228,86 C233,82 240,84 240,90 C240,96 232,97 228,92Z" fill="#D9C193"/>' +
    '<path d="M34,84 C39,80 46,82 46,88 C46,94 38,95 34,90Z" fill="#D9C193"/>' +
  '</svg>';
}

// Two stray leaves, blown off something. One per host.
function hbStrayLeafA() {
  return '<svg viewBox="0 0 96 68" xmlns="http://www.w3.org/2000/svg">' +
    hbShadow('hbLaSh', 50, 50, 32, 7, 0.34) +
    '<g transform="translate(10,40) rotate(-16) scale(2.5)">' +
      '<path d="M0,0 C7,-10 21,-12 28,-2 C21,9 7,10 0,0Z" fill="#5C8B44"/>' +
      '<path d="M0,0 C7,-10 21,-12 28,-2 C21,-5 10,-4 0,0Z" fill="#84B865"/>' +
      '<path d="M1.5,0 C10,-1.5 19,-2.5 26,-2.4" stroke="#3B5F2C" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.5"/>' +
      '<path d="M8,-1 C9,-4 10,-5 12,-6" stroke="#3B5F2C" stroke-width="0.9" fill="none" opacity="0.35"/>' +
      '<path d="M15,-2 C16,-5 17,-6 19,-7" stroke="#3B5F2C" stroke-width="0.9" fill="none" opacity="0.35"/>' +
    '</g>' +
  '</svg>';
}

function hbStrayLeafB() {
  return '<svg viewBox="0 0 86 62" xmlns="http://www.w3.org/2000/svg">' +
    hbShadow('hbLbSh', 44, 46, 28, 6, 0.3) +
    '<g transform="translate(72,26) rotate(154) scale(2.2)">' +
      '<path d="M0,0 C7,-10 21,-12 28,-2 C21,9 7,10 0,0Z" fill="#6E9A50"/>' +
      '<path d="M0,0 C7,-10 21,-12 28,-2 C21,-5 10,-4 0,0Z" fill="#93C271"/>' +
      '<path d="M1.5,0 C10,-1.5 19,-2.5 26,-2.4" stroke="#41682F" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.45"/>' +
    '</g>' +
  '</svg>';
}

// Marks in the wood itself: knots and a split. These go in their own
// layer UNDER every prop, because they are part of the table, not
// objects on it - a knot with a drop shadow would look like a stain
// floating above the bench.
function hbKnot(rx, ry) {
  return '<svg viewBox="0 0 ' + (rx * 2) + ' ' + (ry * 2) + '" xmlns="http://www.w3.org/2000/svg">' +
    '<g transform="translate(' + rx + ',' + ry + ')" opacity="0.5">' +
      '<path d="M' + (-rx * 0.94) + ',0 C' + (-rx * 0.8) + ',' + (-ry * 0.86) + ' ' + (rx * 0.5) + ',' + (-ry * 0.98) + ' ' + (rx * 0.9) + ',' + (-ry * 0.16) +
        ' C' + (rx * 0.96) + ',' + (ry * 0.6) + ' ' + (-rx * 0.3) + ',' + (ry * 0.96) + ' ' + (-rx * 0.94) + ',0Z" fill="none" stroke="#6A4728" stroke-width="2.4"/>' +
      '<path d="M' + (-rx * 0.6) + ',0 C' + (-rx * 0.5) + ',' + (-ry * 0.55) + ' ' + (rx * 0.34) + ',' + (-ry * 0.62) + ' ' + (rx * 0.56) + ',' + (-ry * 0.1) +
        ' C' + (rx * 0.6) + ',' + (ry * 0.4) + ' ' + (-rx * 0.2) + ',' + (ry * 0.6) + ' ' + (-rx * 0.6) + ',0Z" fill="none" stroke="#6A4728" stroke-width="2"/>' +
      '<path d="M' + (-rx * 0.24) + ',' + (ry * 0.05) + ' C' + (-rx * 0.16) + ',' + (-ry * 0.26) + ' ' + (rx * 0.16) + ',' + (-ry * 0.28) + ' ' + (rx * 0.22) + ',0' +
        ' C' + (rx * 0.2) + ',' + (ry * 0.24) + ' ' + (-rx * 0.14) + ',' + (ry * 0.26) + ' ' + (-rx * 0.24) + ',' + (ry * 0.05) + 'Z" fill="#5C3D22"/>' +
    '</g>' +
  '</svg>';
}

function hbSplit() {
  return '<svg viewBox="0 0 40 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">' +
    '<path d="M20,4 C16,44 24,86 19,128 C15,166 22,196 18,216" stroke="#5E3F23" stroke-width="2.6" fill="none" opacity="0.42" stroke-linecap="round"/>' +
    '<path d="M22,10 C18,48 26,88 21,130" stroke="#C79A66" stroke-width="1.4" fill="none" opacity="0.3" stroke-linecap="round"/>' +
  '</svg>';
}


// ============================================
// Painting it
// ============================================
// Host id -> builder. style.css has already decided where each host
// sits and how big it is; all that happens here is that the drawing
// goes in. Nothing repaints: the bench does not change.
var HOME_BENCH_ART = [
  { hostId: 'homeWordmark',   build: hbWordmark    },
  { hostId: 'benchPotMain',   build: hbPotMain     },
  { hostId: 'benchPotSmall',  build: hbPotSmall    },
  { hostId: 'benchPotBack',   build: hbPotBack     },
  { hostId: 'benchCan',       build: hbWateringCan },
  { hostId: 'benchTrowel',    build: hbTrowel      },
  { hostId: 'benchPackets',   build: hbPackets     },
  { hostId: 'benchTwine',     build: hbTwine       },
  { hostId: 'benchSoil',      build: hbSoil        },
  { hostId: 'benchLeafA',     build: hbStrayLeafA  },
  { hostId: 'benchLeafB',     build: hbStrayLeafB  },
  { hostId: 'benchKnotA',     build: function () { return hbKnot(34, 22); } },
  { hostId: 'benchKnotB',     build: function () { return hbKnot(26, 17); } },
  { hostId: 'benchKnotC',     build: function () { return hbKnot(20, 14); } },
  { hostId: 'benchSplit',     build: hbSplit       }
];

function renderHomeScene() {
  HOME_BENCH_ART.forEach(function (entry) {
    var host = document.getElementById(entry.hostId);
    if (!host || host.dataset.painted === '1') return;
    host.innerHTML = entry.build();
    host.dataset.painted = '1';
  });

  // The four sign faces. Same one-shot treatment as the props: the
  // labels never change, so this runs once and never again.
  HB_SIGNS.forEach(function (sign) {
    var host = document.getElementById(sign.hostId);
    if (!host || host.dataset.painted === '1') return;
    host.innerHTML = hbCutText(sign);
    host.dataset.painted = '1';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderHomeScene);
} else {
  renderHomeScene();
}


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
// Packed per-day history
//
// WHAT CHANGED AND WHY
// A task's history used to be one map entry per completed day:
//
//     history: { '2026-08-15': true, '2026-08-14': true, ... }
//
// Firestore charges a map key as its UTF-8 length + 1 and a boolean
// as 1 byte, so each of those cost 12 bytes. Six habits over a year
// came to about 26 KB, and it only ever grew.
//
// Storage was never the problem. The problem is that the ENTIRE
// gardens/{uid} document is rewritten on every tick, and Firestore's
// watch stream sends whole documents back rather than deltas - so
// the garden listener in 02 re-downloads the full history on every
// single save. At year three with ten habits that is ~130 KB per
// tick, in both directions. Fifteen ticks a day is about 2 MB of
// egress per user per day, which is the wall the free plan actually
// hits, long before the 1 MiB document ceiling.
//
// So history is now one string per year, one character per day:
//
//     history: { '2026': '0010111...' }
//
// Index 0 is 1 January. Six habits come to ~2.2 KB a year instead of
// 26 KB - roughly a twelvefold saving, which puts a ten-year,
// ten-habit garden at about 37 KB and takes the whole question off
// the table for the life of the app.
//
// THE CHARACTER IS AN EFFORT LEVEL, NOT A BOOLEAN (C1)
// '0' is still "not done" and every other digit is still "done", so
// nothing about the paragraphs above changes and no row anywhere
// needs rewriting. What the digit now also says is how hard that day
// was: '1' steady, '2' hard, '3' all out - see EFFORT_LEVELS below.
//
// The migration is nil, and that is not luck, it is why the ladder is
// numbered from one. Every day ever recorded holds a '1', and '1'
// means an ordinary day at the ordinary rate. A garden that never
// touches the effort control writes exactly the rows it wrote before,
// costs exactly the bytes it cost before, and grows exactly as fast.
//
// This buys ONE character per day and no more, which is a deliberate
// limit rather than a first pass. Two characters would double the one
// number this whole design exists to keep small, and the second
// character's only job would be storing what each day's growth was
// actually worth - see the note on buildGrowthSeries().
//
// WHAT IS SAFE TO ASSUME ABOUT THIS DATA
// Nothing is derived from history. streak, totalGrowthDays,
// maxStreak and maxGrowthDays are all their own stored fields, so
// even a total loss here cannot shrink a plant or reset a streak -
// it would only blank the Stats heatmaps. That is the reason this
// change was safe to make at all.
//
// The heatmaps read at most the last 371 days (buildYearGrid in 05)
// and the summary cards read the last 7 and 30. The ONLY consumer
// that wants every date is the account export in 10, which calls
// histDates() below.
//
// TRAILING ZEROS ARE TRIMMED, and that is load-bearing rather than
// tidy: a year in progress is only as long as its last completed
// day, and charAt() past the end of a string returns '' - which is
// falsy - so histGet needs no bounds check for short rows.
//
// EVERYTHING HERE IS UTC. These functions only ever parse and format
// 'YYYY-MM-DD' strings that were already built in local time by
// getTodayString(); doing the arithmetic in UTC means no date can
// shift by a day across a daylight-saving boundary. Do not "fix"
// this by switching to the local Date constructors - that
// reintroduces exactly the off-by-one this avoids.
// ============================================

// ============================================
// Effort (C1/C2)
//
// How hard a given day was, logged by the person who had it, stored
// as one digit in that day's slot in the packed history.
//
// EFFORT ONLY EVER ADDS. There is no bucket below Steady and that is
// a design decision rather than an oversight: a ladder with an "easy"
// rung on it charges you for honesty, and a tracker that grows less
// when you tell the truth teaches you not to. So the question this
// control asks is not "how much did today count" - every day counts
// the same - it is "did today cost you more than usual", and the
// only two answers that do anything are yes and very.
//
// Self-declared and unverified, exactly like impact, and the same
// consequence follows: it must never reach a leaderboard.
//
// THE INDEX IS THE STORED CHARACTER. Do not reorder this array. '1'
// has to keep meaning Steady forever, because every day in every
// history that predates this feature holds a '1'.
var EFFORT_LEVELS = [
  null,                                                    // '0' = not done
  { value: 1, label: 'Steady',  mult: 1,   hint: 'an ordinary day' },
  { value: 2, label: 'Hard',    mult: 1.5, hint: 'it cost you' },
  { value: 3, label: 'All out', mult: 2,   hint: 'as much as you had' },
];

var EFFORT_DEFAULT = 1;

// Anything unrecognised reads as Steady rather than as nothing: a
// character this version does not know is still a completed day, and
// the safe reading of an unknown effort is the ordinary one.
function normalizeEffort(value) {
  var n = Math.floor(Number(value));
  if (!isFinite(n) || n < 1 || n >= EFFORT_LEVELS.length) return EFFORT_DEFAULT;
  return n;
}

function effortMultiplier(level) {
  return EFFORT_LEVELS[normalizeEffort(level)].mult;
}

function getEffortLevel(level) {
  return EFFORT_LEVELS[normalizeEffort(level)];
}

// 0-based day of the year. 1 January -> 0, 31 December -> 364 or 365.
function dayOfYear(dateStr) {
  var p = String(dateStr).split('-');
  return Math.round(
    (Date.UTC(+p[0], +p[1] - 1, +p[2]) - Date.UTC(+p[0], 0, 1)) / 86400000
  );
}

// The inverse. Used only when expanding history back out for export.
function dateFromDayOfYear(year, index) {
  return new Date(Date.UTC(year, 0, 1 + index)).toISOString().slice(0, 10);
}

// Was this date completed? Safe against a missing history, a missing
// year, and a row shorter than the index asked for.
//
// ANY non-zero character counts as done, which is what lets the
// effort digits share the slot without a migration. charAt() past the
// end of a trimmed row returns '', which is neither '0' nor done.
function histGet(hist, dateStr) {
  var row = hist && hist[String(dateStr).slice(0, 4)];
  if (!row) return false;
  var c = row.charAt(dayOfYear(dateStr));
  return c !== '' && c !== '0';
}

// How hard this date was: 0 for a day that was not done at all, else
// an effort level. An unknown character on a completed day reads as
// Steady rather than as not-done - see normalizeEffort().
function histLevel(hist, dateStr) {
  if (!histGet(hist, dateStr)) return 0;
  var row = hist[String(dateStr).slice(0, 4)];
  return normalizeEffort(row.charAt(dayOfYear(dateStr)));
}

// Set or clear one day, in place.
//
// THE TWO GUARDS ARE NOT THEORETICAL, and the second one exists
// because the first was not enough. A malformed key parses without
// complaint and rolls over: '2026-13-45' becomes a date in 2027,
// which the bounds check catches, but '2026-02-99' becomes
// 2026-05-10, whose index is perfectly valid - so it would have been
// silently recorded as a completion on a day that was never ticked.
// The round-trip check is the real test: a date string is only
// accepted if formatting the parsed index back out reproduces it
// exactly. The bounds check stays as a cheap early-out, since
// without it a far-future rollover would pad hundreds of junk
// characters onto the row before anything else looked at it.
//
// Nothing in the app writes such a key - histSet is only ever called
// with getTodayString(), which is always well-formed and zero-padded
// - but migrateHistory() below runs over whatever is actually in the
// database, which is a different standard of trust. Note the strict
// consequence: an unpadded '2026-8-15' is rejected rather than
// repaired, which is the right direction for a one-way conversion.
function histSet(hist, dateStr, on) {
  if (!hist) return;
  var key  = String(dateStr);
  var year = key.slice(0, 4);
  var i    = dayOfYear(key);
  if (!(i >= 0 && i <= 365)) return;
  if (dateFromDayOfYear(+year, i) !== key) return;

  // `on` may be a boolean or an effort level. true is Steady, which
  // is what every caller that predates effort meant by it and what
  // every row already written holds.
  var ch = '0';
  if (on === true)          ch = String(EFFORT_DEFAULT);
  else if (on && on !== '0') ch = String(normalizeEffort(on));

  var row = hist[year] || '';
  while (row.length < i) row += '0';
  row = (row.slice(0, i) + ch + row.slice(i + 1))
          .replace(/0+$/, '');

  if (row) hist[year] = row;
  else delete hist[year];
}

// How many of the last `windowDays` days this task was completed on.
//
// The window ends today. includeToday exists for the garden's
// show/hide growth toggle: while the growth is hidden the plant on
// screen is yesterday's, and a gain figure that counted today would
// be describing a plant that is not there.
function recentGrowthDays(task, windowDays, includeToday) {
  if (!task || !task.history) return 0;
  var today = getTodayString();
  var n = 0;
  for (var i = includeToday ? 0 : 1; i < windowDays; i++) {
    if (histGet(task.history, shiftDate(today, -i))) n++;
  }
  return n;
}

// The plant's day count on each of the last `windowDays` days,
// oldest first.
//
// WALKED BACKWARDS FROM THE STORED TOTAL, not summed forwards out of
// history, and that is the whole trick. history only goes back to the
// day the field was introduced, so summing it forwards would report
// a plant shorter than the one standing in the garden. Anchoring on
// totalGrowthDays and subtracting each day's completion on the way
// back means anything earned before history existed shows up as the
// flat baseline it actually is, and today's end of the line always
// matches the plant.
function buildGrowthSeries(task, windowDays) {
  var days  = clampGrowthPoints(task && task.totalGrowthDays);
  var base  = taskBaseAward(task);
  var today = getTodayString();
  var out   = [];

  for (var i = 0; i < windowDays; i++) {
    var date = shiftDate(today, -i);
    out.push({ date: date, days: days });
    // Each completed day comes off at its OWN effort, which the row
    // now records, times the task's base award, which it does not.
    //
    // BE CLEAR ABOUT WHAT IS STILL AN APPROXIMATION. C1 made the
    // effort half of this exact and left the other half alone: the
    // weight and the checklist ratio are still read at their CURRENT
    // values, because one character per day has room for how hard a
    // day was or for what it paid out, and it is spent on the former.
    // Re-rate an assignment or edit a checklist weeks later and the
    // earlier end of this one line shifts under it. Making that exact
    // needs a second character per day, which doubles the field this
    // whole packing exists to keep small, and is not worth it to fix
    // a line on a chart.
    if (task && histGet(task.history, date)) {
      days = clampGrowthPoints(days - base * effortMultiplier(histLevel(task.history, date)));
    }
  }
  out.reverse();
  return out;
}

// The same window as recentGrowthDays(), in POINTS rather than in
// ticks. The delta under a plant is a claim about how much the plant
// grew, so it has to be measured in the thing the plant is sized by.
//
// Summed day by day rather than multiplied out, because since C1 the
// days in a window are not worth the same as each other - a hard
// Tuesday is worth half again what a steady Monday was.
function recentGrowthPoints(task, windowDays, includeToday) {
  if (!task) return 0;
  var today = getTodayString();
  var base  = taskBaseAward(task);
  var total = 0;
  for (var i = includeToday ? 0 : 1; i < windowDays; i++) {
    var date  = shiftDate(today, -i);
    var level = histLevel(task.history, date);
    if (level) total += base * effortMultiplier(level);
  }
  return clampGrowthPoints(total);
}

// Did this task earn its growth TODAY, and how much?
//
// history is the authority rather than task.completed, and the
// difference is entirely about assignments. A one-off finished last
// week is still `completed` - that is what finished means for
// something that never unticks - so reading the flag would have
// credited it with growth it earned in another week, and the
// show/hide toggle in 04 would have shrunk it by a day it did not
// gain today.
function growthEarnedToday(task) {
  if (!task) return 0;
  if (!histGet(task.history, getTodayString())) return 0;
  return taskCompletionAward(task);
}


// Every completed date, ascending, as 'YYYY-MM-DD' strings.
//
// This is the exact inverse of the packing, and it is what keeps the
// account export byte-for-byte identical to what it produced before
// this change - same field, same shape, same order.
function histDates(hist) {
  var out = [];
  if (!hist || typeof hist !== 'object') return out;

  for (var year in hist) {
    if (!Object.prototype.hasOwnProperty.call(hist, year)) continue;
    var row = hist[year];
    if (typeof row !== 'string') continue;
    for (var i = 0; i < row.length; i++) {
      if (row.charAt(i) !== '0') out.push(dateFromDayOfYear(+year, i));
    }
  }
  return out.sort();
}

// The earliest day this habit was ever completed, or null if it never
// has been.
//
// Used by the Overall heatmap to work out roughly when a habit came
// into existence, so a habit added last week does not drag down the
// percentage on every day of the preceding year. See the note on
// computeOverallDayStats() in 05-stats-app.js for why that is an
// inference rather than a fact - the app has never recorded creation
// dates, and adding one now would not help the gardens that already
// exist.
//
// Cheap BECAUSE the history is packed. It walks the year keys, of
// which there are a handful, and finds the first '1' in the earliest
// one that has any - it never expands a year into dates. Calling
// histDates()[0] would produce the same answer by building the entire
// list first, and is the version to avoid.
function firstCompletedDate(hist) {
  if (!hist || typeof hist !== 'object') return null;

  var years = [];
  for (var y in hist) {
    if (!Object.prototype.hasOwnProperty.call(hist, y)) continue;
    if (!/^\d{4}$/.test(y)) continue;
    if (typeof hist[y] !== 'string') continue;
    if (!/[^0]/.test(hist[y])) continue;
    years.push(y);
  }
  if (!years.length) return null;

  years.sort();
  return dateFromDayOfYear(+years[0], hist[years[0]].search(/[^0]/));
}


// Accepts either shape and always returns the packed one.
//
// Called from the garden snapshot handler in 02, so an existing
// garden converts the first time it loads and the next ordinary save
// writes the new shape. A mixed document - part migrated, part not,
// which is what a save interrupted mid-flight would leave - is
// handled too, because both branches feed the same output.
//
// THE OLD KEYS DO NOT LINGER. That is worth stating plainly, because
// saveData() writes with merge:true and the note there warns that
// dropped fields survive a merge. They do - but only for top-level
// and nested MAP fields. `tasks` is an ARRAY, and Firestore replaces
// array values whole rather than merging into them, so the first
// save after migration removes every old date key on its own. No
// FieldValue.delete() is needed, and none would work here anyway.
//
// One-way, with no undo once that save lands. The round-trip test in
// verify-history.js is what stands in for the undo.
function migrateHistory(raw) {
  var packed = {};
  if (!raw || typeof raw !== 'object') return packed;

  for (var k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;

    // Already packed: a four-digit year mapping to a row string.
    //
    // The alphabet is normalised on the way through. A character this
    // version does not recognise is a completed day at an effort
    // level it cannot read, and the safe reading of that is Steady -
    // never "not done", which would silently erase a day from the
    // heatmap. Only '0' means not done.
    if (/^\d{4}$/.test(k) && typeof raw[k] === 'string') {
      var row = raw[k].replace(/[^0-9]/g, '1').replace(/0+$/, '');
      row = row.replace(/[0-9]/g, function (c) {
        return c === '0' ? '0' : String(normalizeEffort(c));
      });
      if (row) packed[k] = row;
      continue;
    }

    // Old shape: 'YYYY-MM-DD' -> true. Only truthy values carried
    // over, which matches what the heatmaps treated as completed.
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && raw[k]) {
      histSet(packed, k, true);
    }

    // Anything else is silently dropped. There should be nothing
    // else; if there is, it was not readable by the old code either.
  }
  return packed;
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

// How much faster plants grow than they used to.
//
// This is a compression of TIME, not a bigger number bolted onto the
// end of the curve. A plant on day 4 is now the size a plant on day 11
// used to be - same curve, same shape, same proportions at every point
// along it, just walked faster. Nothing here changes what a plant CAN
// become, only how long it takes to get there.
//
// It reaches only as far as SIZE. The two other things a day count
// drives are left alone on purpose:
//
//   the art stages    STAGE_MILESTONES below turns them over on
//                     days 2, 7 and 30, on its own schedule - see
//                     the note there. It is not derived from this
//                     number and changing this one will not move it.
//   the hover height  untouched. That number answers "how much has
//                     this grown"; it is read straight from the day
//                     count in computeHeightMeters()
//                     (04-garden-scene.js) and has never been derived
//                     from the on-screen size, so a plant that is now
//                     the size of a two-month-old at three weeks still
//                     honestly says three weeks' worth of metres.
// 2.75 was the first pass at this. x1.5 again on top of that is
// 4.125, which is what is here - written out as one number rather
// than left as `2.75 * 1.5`, so there is one thing to read and one
// thing to change next time.
var GROWTH_SPEEDUP = 4.125;

// Day thresholds where the art itself changes to a more detailed
// stage (seed → sprout → young → mature). Matches the 4 SVG stages
// already defined per category in PLANT_SVG_DATA.
//
// Hand-picked, NOT derived from GROWTH_SPEEDUP. The speedup is a
// property of the size curve and these are a property of the art, so
// they are set independently and either can be moved without the
// other. A plant is a sprout on day 2, a young plant on day 7 and a
// mature one on day 30: the seed lasts the first two days, the rest
// of the first week is the sprout's, the first month the young
// plant's, and everything past a month is the mature drawing.
//
// Was [0, 1, 7, 30]. The seed stage now gets a second day before it
// hands off to the sprout, on the same day 7 / day 30 schedule as
// before.
var STAGE_MILESTONES = [0, 2, 7, 30];

// scale = 1 + GROWTH_SCALE_K * totalGrowthDays^0.7 - unbounded, no
// ceiling.
//
// Speeding the curve up means feeding it GROWTH_SPEEDUP * days instead
// of days. Because the curve is a plain power law, that factor can be
// pulled straight out of the exponent -
//
//     (k * d)^0.7  ==  k^0.7 * d^0.7
//
// - so multiplying the coefficient once, here, is exactly the same
// thing as scaling every day count at every call site, for a fraction
// of the arithmetic. 0.074 * 4.125^0.7 works out to about 0.200.
//
// Where that lands: 3.6x at day 60 is now 4.5x, 10.3x at a year is
// now 13.4x, and any given size arrives in two thirds of the days it
// used to - 3x was day 40, now day 27. On screen that takes a 60-day
// plant from about 437px wide to about 541px before depth.
//
// Nothing needs capping for this. A plant leaning past the end of the
// plot is cut off by .garden-scene-clip and can no longer drag the
// scene's scroll range out with it (see style.css), so a bigger plant
// costs nothing but its own overhang.
var GROWTH_SCALE_K = 0.074 * Math.pow(GROWTH_SPEEDUP, 0.7);

// ---- Ceiling on a plant's age ------------------------------------
// A plant stops ageing at MAX_GROWTH_DAYS. 1000 days is well past any
// real habit - the growth curve is nearly flat by then, so the last
// few hundred days barely change the drawing - and everything above it
// is either a typo, a bug, or someone editing the document by hand.
//
// Be clear about what this is NOT: it is not a security boundary. The
// browser writes gardens/{uid} itself, and Firestore rules cannot loop
// over the tasks array, so nothing stops a determined person storing
// 1e18 in that field. What the ceiling guarantees is that whatever
// ends up in the document, the app draws a plant rather than a
// 1e18-scaled one, and writes the value back down on the next save.
//
// The clamp is also the junk filter for this field, so it has to
// survive everything a hand-edited document can hold: strings, null,
// NaN, Infinity, negatives, fractions. Anything it cannot make sense
// of becomes 0, which renders as a seed.
var MAX_GROWTH_DAYS = 1000;

// ---- Days became POINTS ------------------------------------------
//
// totalGrowthDays used to be a count of days and could only ever move
// by one. It is now a POINT TOTAL, and one point is defined as
// exactly what it always was: one completed day of an ordinary habit.
//
// That definition is the whole migration. Every stored number keeps
// the meaning it had, every curve below is fed the same value it was
// fed before, and a garden of plain daily habits is drawn and
// measured identically to how it was drawn and measured yesterday.
// What changes is only that the number can now move by something
// other than one - see taskGrowthWeight() further down - and that it
// no longer has to be a whole number.
//
// The FIELD NAME is deliberately left alone. A friend's browser
// running yesterday's cached copy of this app reads totalGrowthDays
// straight out of gardenSummaries (see 07); renaming it would show
// them a plot full of seeds until they happened to reload.
//
// Two clamps now, where there was one, and the split is the reason
// this block is worth reading twice. Growth is fractional. A STREAK
// is not - it is a count of days and half a day is not a thing - and
// neither is maxStreak. Handing a streak to the growth clamp would
// have quietly let 3.5 through the moment anything wrote one.
var GROWTH_POINT_DECIMALS = 3;

function clampGrowthPoints(value) {
  var n = Number(value);
  if (!isFinite(n) || n <= 0) return 0;
  if (n > MAX_GROWTH_DAYS) return MAX_GROWTH_DAYS;
  // Rounded on the way through, not just on display. Points are added
  // and subtracted across sessions and stored between them, so
  // 0.1 + 0.2 drift would otherwise accumulate in the document itself
  // and eventually surface as a plant that will not return to zero.
  var f = Math.pow(10, GROWTH_POINT_DECIMALS);
  return Math.round(n * f) / f;
}

// Whole days, and nothing else. Same ceiling, because a streak longer
// than the age ceiling is junk by the same argument.
function clampStreak(value) {
  var n = Number(value);
  if (!isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), MAX_GROWTH_DAYS);
}

// The two curves below take a point total straight from a task, so
// they clamp rather than trusting the caller: they are the last thing
// standing between a bad number and the layout.
function computeScaleForDays(totalGrowthDays) {
  var days = clampGrowthPoints(totalGrowthDays);
  return 1 + GROWTH_SCALE_K * Math.pow(days, 0.7);
}

function getStageIndexForDays(totalGrowthDays) {
  var days = Math.max(0, totalGrowthDays || 0);
  var idx  = 0;
  STAGE_MILESTONES.forEach(function (threshold, i) {
    if (days >= threshold) idx = i;
  });
  return idx;
}

// Points are still printed as "days grown" everywhere they were, and
// that is not a shortcut left over from the rename - it is the point
// of anchoring one point to one day. A number denominated in days can
// be read as days.
//
// A whole number prints as a whole number, which is every plant in
// every garden that only holds ordinary habits. Anything else gets
// one decimal, because two would be noise at the size a plant is.
function formatGrowthPoints(points) {
  var n = clampGrowthPoints(points);
  if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
  return n.toFixed(1);
}

// ============================================
// What a completion is worth
//
// Every habit is worth 1, exactly as before. An ASSIGNMENT is worth
// what its owner said it was worth when they created it, because the
// alternative was worse in a way that only shows up once one-offs
// have their own plants: finishing a term paper and replying to an
// email both grew a seed by one day, so the garden said they were the
// same piece of work. They are not.
//
// The scale is denominated in days on purpose. "This was worth a
// week" is a judgement a person can actually make about their own
// afternoon; "this was worth 4.5 growth units" is not.
//
// SELF-DECLARED, AND NOT VERIFIED. Nothing stops someone marking
// every errand Major. That is a tracker someone is keeping for
// themselves, and the only person it misleads is its owner - the same
// reasoning that already lets anyone tick a habit they did not do.
// What it does mean is that impact must never reach a leaderboard.
//
// Habits do NOT read this field even when it is set, which is what
// keeps per-habit difficulty a separate decision (A5) rather than
// something that shipped by accident here: flipping it on later is a
// change to this one function and the picker in 12, not to the
// document format.
var TASK_IMPACTS = [
  { value: 1,  label: 'Small',  hint: 'a day of growth' },
  { value: 3,  label: 'Medium', hint: 'about three days' },
  { value: 7,  label: 'Large',  hint: 'about a week' },
  { value: 14, label: 'Major',  hint: 'about a fortnight' },
];

var TASK_IMPACT_DEFAULT = 1;

// Anything not on the list becomes the default rather than being
// clamped to the nearest rung: an unrecognised number is a document
// written by a newer version of the app or by hand, and in both cases
// the honest reading is "no claim made".
function normalizeImpact(value) {
  var n = Number(value);
  var ok = TASK_IMPACTS.some(function (i) { return i.value === n; });
  return ok ? n : TASK_IMPACT_DEFAULT;
}

function taskGrowthWeight(task) {
  if (!task || task.kind !== 'once') return 1;
  return normalizeImpact(task.impact);
}

// ---- Partial credit from steps ------------------------------------
//
// A task with a checklist is worth the FRACTION of it that is done.
// Ticking three of five steps and then ticking the task itself grows
// the plant by three fifths of what finishing it would, because that
// is what happened.
//
// This only ever comes up when someone ticks the parent by hand with
// steps outstanding, since ticking the last step ticks the task for
// them at full credit (see syncParentFromSubtasks). So the fraction
// is not a punishment for using checklists - it is the answer to
// "I am calling this done, but it isn't quite".
//
// A TICK IS NEVER WORTH NOTHING. Ticking the box with no steps done
// at all would otherwise grow the plant by zero, which reads as the
// app ignoring the click rather than as a considered judgement about
// partial work. The floor is one step: claiming a task is done is
// itself worth at least as much as doing one part of it.
//
// A task with no steps is worth its full weight, exactly as before -
// which is every task in every existing garden, so nothing moves.
function taskSubtaskRatio(task) {
  var subs = (task && task.subtasks) || [];
  if (!subs.length) return 1;
  var done = 0;
  subs.forEach(function (s) { if (s.done) done++; });
  return Math.min(Math.max(done, 1), subs.length) / subs.length;
}

// What a completion is worth BEFORE the day it happened on gets a
// say: the task's own weight, scaled by how much of its checklist is
// done. Everything about this number is a property of the task.
function taskBaseAward(task) {
  return taskGrowthWeight(task) * taskSubtaskRatio(task);
}

// The effort logged for a given day, as a multiplier. A day that was
// never ticked has no effort and no multiplier to apply.
function taskEffortOn(task, dateStr) {
  return histLevel(task && task.history, dateStr) || EFFORT_DEFAULT;
}

function taskEffortToday(task) {
  return taskEffortOn(task, getTodayString());
}

// What ticking this task RIGHT NOW is worth. The single answer to
// that question: 02 awards it, 04 rolls it back for the show/hide
// toggle, and setTaskEffort() below re-tunes against it.
//
// Effort comes from TODAY'S slot in the history, which is the one
// piece of this that is a property of the day rather than the task.
// Before the box is ticked there is no slot yet, so it reads Steady -
// which is exactly what the first tick of the day is worth.
function taskCompletionAward(task) {
  return clampGrowthPoints(taskBaseAward(task) * effortMultiplier(taskEffortToday(task)));
}

// Logging how hard today was, after the fact.
//
// Only ever about TODAY. Effort is a memory of a day you have just
// had, and there is no interface anywhere for editing an older one -
// which is also what keeps this inside the reversible window, so the
// retune below is always allowed to move the plant.
function setTaskEffort(task, level) {
  if (!task) return;
  var today = getTodayString();
  // Nothing to log against a day that was not done.
  if (!histGet(task.history, today)) return;

  var prevAward = taskCompletionAward(task);
  histSet(task.history, today, normalizeEffort(level));
  retuneAward(task, prevAward);
}

// Can this task's credit still be taken back?
//
// A habit's tick is always today's, because the day boundary unticks
// it overnight. An assignment's can be weeks old, and once a day has
// rolled over the growth is banked - the same rule the boundary has
// always enforced, and the reason neither a dropdown nor a checklist
// gets to reopen it.
function isAwardReversible(task) {
  if (!task || !task.completed) return false;
  if (task.kind !== 'once') return true;
  return !task.doneAt || task.doneAt === getTodayString();
}

// THE INVARIANT THIS FILE IS BUILT ON: while a tick is reversible, the
// plant is carrying exactly taskCompletionAward(task) for it.
//
// Everything that can change what a completion is worth - re-rating an
// assignment, ticking a step, adding one, deleting one - has to call
// this afterwards with the award as it was BEFORE the change. Without
// it the two drift apart, and the drift is not theoretical: tick a
// task at two steps of five, tick a third step, untick the task, and
// the refund would hand back three fifths having paid out two.
function retuneAward(task, prevAward) {
  if (!task) return;
  var next = taskCompletionAward(task);
  if (next === prevAward) return;
  if (!isAwardReversible(task)) return;

  task.totalGrowthDays = clampGrowthPoints(
    Math.max(0, (task.totalGrowthDays || 0) + (next - prevAward))
  );
  task.maxGrowthDays = Math.max(clampGrowthPoints(task.maxGrowthDays),
                                task.totalGrowthDays);
}

// Changing what an assignment was worth AFTER ticking it moves the
// plant by the difference, and only while that tick is still
// reversible. Past that the credit is banked and this is a relabel,
// exactly like every other retroactive edit in the app.
function setTaskImpact(task, value) {
  if (!task) return;
  var prevAward = taskCompletionAward(task);
  task.impact = normalizeImpact(value);
  retuneAward(task, prevAward);
}


// ============================================
// The task model
//
// A task used to be nine fields and every one of them was about
// growth. It now has a TYPE, and the type is what the day boundary
// below actually branches on:
//
//   kind: 'habit'  Repeats. Unticks itself overnight, carries a
//                  streak, and is only due on the days its schedule
//                  names. Every task in every garden that already
//                  exists is one of these, which is why a document
//                  with no kind field loads as a habit.
//
//   kind: 'once'   An assignment. Ticked once and finished: it does
//                  NOT untick overnight, it holds no streak, and it
//                  can never break one. It keeps its plant and the
//                  growth day it earned.
//
// FIELDS ADDED, AND THE ONES DELIBERATELY NOT ADDED
//   kind, schedule, createdAt, due, doneAt, notes, subtasks, impact.
//
// impact is read only for kind: 'once' - see taskGrowthWeight() in
// the growth block above. Per-habit weight, effort logging, streak
// freezes and pause windows are all designed for and none of them are
// here. There is no migration cost to adding them later: the
// normalizer in 02 supplies a default for every field it does not
// find, so a document written today and one written before any of
// this existed load identically.
//
// That is also why buildCleanTasks() OMITS a field sitting at its
// default rather than writing a null. A garden of plain daily habits
// still saves byte-for-byte the document it saved before this change,
// and the whole tasks array is rewritten and re-downloaded on every
// tick - see the packed-history note above - so bytes that mean
// nothing are bytes worth not sending.
// ============================================

// Caps on everything a user can type into a task. These are document
// size guards, not design opinions: free text on a task is the one
// place someone can make their own saves expensive.
var TASK_TEXT_MAX     = 120;
var NOTE_MAX          = 500;
var SUBTASK_MAX       = 20;
var SUBTASK_TEXT_MAX  = 90;

// Seven characters, index 0 = Sunday, to match Date#getUTCDay().
var SCHEDULE_WEEKDAYS = '0111110';
var SCHEDULE_WEEKENDS = '1000001';

// Anything that is not a well-formed seven-day mask becomes null,
// and so does a mask that means "every day" - daily is the default,
// and the default is stored as absent rather than as '1111111'.
// An all-zero mask is not a schedule, it is a deletion; it reads
// back as daily rather than as a habit that can never be due.
function normalizeSchedule(s) {
  if (typeof s !== 'string') return null;
  if (!/^[01]{7}$/.test(s))  return null;
  if (s.indexOf('0') === -1) return null;
  if (s.indexOf('1') === -1) return null;
  return s;
}

function isCustomSchedule(task) {
  return !!task && typeof task.schedule === 'string' && task.schedule.length === 7;
}

function isScheduledOnDayIndex(task, dayIndex) {
  if (!isCustomSchedule(task)) return true;
  return task.schedule.charAt(dayIndex) === '1';
}

// UTC like every other date function here, so a schedule cannot
// shift by a day across a daylight-saving boundary.
function dayOfWeek(dateStr) {
  var p = String(dateStr).split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
}

function shiftDate(dateStr, delta) {
  var p = String(dateStr).split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + delta))
           .toISOString().slice(0, 10);
}

// An assignment is never "scheduled": it is due, which is a different
// question and is asked of task.due instead.
function isScheduledOn(task, dateStr) {
  if (!task || task.kind === 'once') return false;
  return isScheduledOnDayIndex(task, dayOfWeek(dateStr));
}

function normalizeDateString(value) {
  if (typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

// Subtasks are display-and-ordering only. They do not feed growth:
// ticking the last one ticks the TASK, and the task is what grows.
// Partial credit is a change to what a completion is worth and is
// not wired up - see the list above.
function normalizeSubtasks(raw) {
  if (!Array.isArray(raw)) return [];
  var out = [];
  raw.forEach(function (s) {
    if (!s || typeof s.text !== 'string') return;
    if (out.length >= SUBTASK_MAX) return;
    var text = s.text.trim().slice(0, SUBTASK_TEXT_MAX);
    if (!text) return;
    out.push({
      id:   (typeof s.id === 'number' && s.id > 0) ? Math.floor(s.id) : 0,
      text: text,
      done: !!s.done,
    });
  });
  // Ids have to be unique within a task or the click handlers pick
  // the wrong step. Renumber a collision rather than drop the step.
  var seen = {};
  out.forEach(function (s, i) {
    if (!s.id || seen[s.id]) s.id = i + 1;
    seen[s.id] = true;
  });
  return out;
}

// The one place a brand new task is defined. Called from the add form
// in 12; the normalizer in 02 has to agree with it field for field.
function makeTask(id, text, catId) {
  return {
    id:                id,
    text:              String(text || '').trim().slice(0, TASK_TEXT_MAX),
    categoryId:        catId || 'misc',
    skinId:            (typeof SKIN_DEFAULT_ID !== 'undefined') ? SKIN_DEFAULT_ID : null,
    completed:         false,
    streak:            0,
    lastCleanDate:     null,
    prevLastCleanDate: null,
    totalGrowthDays:   0,
    maxStreak:         0,
    maxGrowthDays:     0,
    history:           {},
    posX:              null,
    posY:              null,
    kind:              'habit',
    schedule:          null,
    // Recorded from now on. Gardens that predate this field infer it
    // from their first completed day instead - see the normalizer.
    createdAt:         getTodayString(),
    due:               null,
    doneAt:            null,
    notes:             '',
    subtasks:          [],
    // What finishing this is worth, in growth points, for an
    // assignment. Carried by habits too so the shape is uniform, and
    // ignored by them. 1 is both the default and what every task in
    // every existing garden effectively already had.
    impact:            TASK_IMPACT_DEFAULT,
    // Manual list position. null until the user drags or nudges
    // this task, exactly like posX/posY above.
    order:             null,
  };
}


// ============================================
// Editing a task
//
// None of these save or render. The call sites in 12-tasks-page.js do
// both, once, after the edit - so changing three fields in the detail
// sheet is still three saves and the throttle coalesces them.
// ============================================
function setTaskField(task, field, value) {
  if (!task) return;

  if (field === 'text') {
    var text = String(value || '').trim().slice(0, TASK_TEXT_MAX);
    // An empty name would leave a nameless plant and no way back to
    // it, so the old name stands.
    if (text) task.text = text;
    return;
  }
  if (field === 'notes') {
    task.notes = String(value || '').slice(0, NOTE_MAX);
    return;
  }
  if (field === 'due') {
    task.due = normalizeDateString(value);
    return;
  }
  if (field === 'categoryId') {
    // Changing the plot changes the SPECIES, so refuse an id that has
    // no artwork behind it rather than drawing a fallback forever.
    var known = CATEGORIES.some(function (c) { return c.id === value; });
    if (known) task.categoryId = value;
    return;
  }
}

// Switching type is not just a label. A streak is a claim about
// consecutive days and an assignment has none, so it goes; a due date
// is meaningless on something that repeats, so that goes the other
// way. maxStreak is left alone in both directions - it already
// happened, and the banked figure is never given back.
function setTaskKind(task, kind) {
  var next = (kind === 'once') ? 'once' : 'habit';
  if (!task || task.kind === next) return;
  task.kind = next;

  if (next === 'once') {
    task.streak   = 0;
    task.schedule = null;
    task.doneAt   = task.completed ? getTodayString() : null;
    // A habit becoming an assignment is worth what an assignment with
    // no claim on it is worth. Anything else would silently multiply
    // a plant that is already ticked, on a change of TYPE.
    task.impact   = normalizeImpact(task.impact);
  } else {
    task.due    = null;
    task.doneAt = null;
    // A finished assignment turned back into a habit is a habit that
    // has been done today, which is what completed already means.
    if (task.completed) task.streak = Math.max(task.streak || 0, 1);
  }
}

function setTaskSchedule(task, schedule) {
  if (!task) return;
  task.schedule = normalizeSchedule(schedule);
}

function toggleTaskScheduleDay(task, dayIndex) {
  if (!task) return;
  if (!(dayIndex >= 0 && dayIndex <= 6)) return;
  var s = isCustomSchedule(task) ? task.schedule : '1111111';
  var flipped = s.slice(0, dayIndex) +
                (s.charAt(dayIndex) === '1' ? '0' : '1') +
                s.slice(dayIndex + 1);
  // Turning off the last remaining day would leave a habit that can
  // never come due. Read it as "no schedule" and fall back to daily.
  if (flipped.indexOf('1') === -1) flipped = '1111111';
  setTaskSchedule(task, flipped);
}

// ============================================
// Was this task due on a given day?
//
// The single authority for the question, because three different
// things ask it: the day boundary above (did a streak survive), the
// heatmap denominator in 05 (how much was owed that day), and the
// weekly and monthly counts on the Stats cards.
//
// Before the schedule field existed, every habit was due every day
// and the answer was trivially yes. It no longer is, and getting it
// wrong in either direction is visible: too generous and a weekend
// reads as two days of failure, too strict and a bonus completion
// vanishes out of the chart.
//
// ASSIGNMENTS ALWAYS ANSWER NO, which looks wrong and is not. A
// one-off is not owed on any particular past day - it is owed NOW,
// until it is done, and there is no single day in the year it can be
// said to have failed on. Its overdue-ness belongs on the Tasks page,
// where it is actionable, rather than as a permanent red square in
// the year. It still reaches the chart, through the other half of the
// rule in dayTally() (05): a day that was DONE counts whether or not
// it was due.
function wasDueOn(task, dateStr) {
  if (!task) return false;
  if (task.kind === 'once') return false;
  // String comparison is safe and intended: 'YYYY-MM-DD' sorts
  // lexicographically in the same order it sorts chronologically,
  // which is the whole reason the format is used throughout.
  if (dateStr < taskStartDate(task)) return false;
  return isScheduledOnDayIndex(task, dayOfWeek(dateStr));
}

// The day a task started counting.
//
// createdAt is exact for anything planted since the task model
// landed. For anything older it was backfilled by the normalizer in
// 02 from the first day the task was ever completed, which is an
// approximation that errs towards flattering the past - a habit
// created in January but first kept in March is simply absent from
// January and February rather than counted as two months of misses.
//
// A task with neither has never been completed at all, so there is no
// past to speak of: it starts today.
function taskStartDate(task) {
  return (task && task.createdAt) || getTodayString();
}


function subtasksAllDone(task) {
  var subs = (task && task.subtasks) || [];
  if (!subs.length) return false;
  return subs.every(function (s) { return s.done; });
}

// Steps and the task are kept in step in BOTH directions: ticking the
// last step ticks the task, and unticking a step afterwards unticks
// it again. The second half is conditional on the task having been
// fully stepped-out BEFORE the change, so a task that was ticked by
// hand is never untucked by someone adding a step to it later.
//
// This goes through toggleTask() in 02 rather than setting completed
// here, because that function owns growth: it is the only place a day
// is added to or taken off a plant, and the only place today's
// history bit is written.
function syncParentFromSubtasks(task, wasAllDone) {
  if (!task || !(task.subtasks || []).length) return;
  var allDone = subtasksAllDone(task);
  if (allDone && !task.completed)                 toggleTask(task.id, true);
  else if (!allDone && wasAllDone && task.completed) toggleTask(task.id, false);
}

// All three mutators below follow the same three beats, and the ORDER
// is load-bearing: read the award, change the steps, retune, then
// sync. Retuning before the sync is what makes the sync's own refund
// correct - by the time syncParentFromSubtasks() can call toggleTask()
// to untick the parent, the plant is already carrying the award that
// toggleTask is about to take back off it.
function addSubtask(task, text) {
  if (!task) return;
  if (!Array.isArray(task.subtasks)) task.subtasks = [];
  if (task.subtasks.length >= SUBTASK_MAX) return;
  var clean = String(text || '').trim().slice(0, SUBTASK_TEXT_MAX);
  if (!clean) return;

  var prevAward = taskCompletionAward(task);
  var maxId = 0;
  task.subtasks.forEach(function (s) { if (s.id > maxId) maxId = s.id; });
  task.subtasks.push({ id: maxId + 1, text: clean, done: false });
  retuneAward(task, prevAward);
  // Adding an unticked step to a finished task reopens it, which is
  // the only sensible reading of "there is more to do".
  syncParentFromSubtasks(task, true);
}

function toggleSubtask(task, subId) {
  if (!task || !Array.isArray(task.subtasks)) return;
  var was       = subtasksAllDone(task);
  var prevAward = taskCompletionAward(task);
  task.subtasks.forEach(function (s) { if (s.id === subId) s.done = !s.done; });
  retuneAward(task, prevAward);
  syncParentFromSubtasks(task, was);
}

function removeSubtask(task, subId) {
  if (!task || !Array.isArray(task.subtasks)) return;
  var was       = subtasksAllDone(task);
  var prevAward = taskCompletionAward(task);
  task.subtasks = task.subtasks.filter(function (s) { return s.id !== subId; });
  retuneAward(task, prevAward);
  syncParentFromSubtasks(task, was);
}

// ============================================
// Manual ordering
//
// `order` is a manual override in exactly the sense posX/posY
// already are: a number means the user put this task here, null
// means "use the automatic sort". That parallel is the whole design.
// The garden lets you drag a plant somewhere and leaves every other
// plant to the automatic layout; the list works the same way.
//
// WHY NOT SORT ONLY MANUALLY once the user has dragged anything.
// Because the automatic sorts are load-bearing: assignments by due
// date is how the queue stays legible, and habits by growth puts the
// garden's elders on top. Throwing those away the first time someone
// drags one row would be a large, silent loss for a small, local
// intent. Ordered tasks take the top of their list in the order
// given; everything else keeps sorting itself underneath.
//
// The numbers are dense (0..n-1) and rewritten wholesale on every
// move. Sparse or fractional keys would avoid the rewrite, but
// `tasks` is one Firestore array rewritten whole on every save
// anyway, so there is nothing to buy with the complexity.
// ============================================

// A list longer than this is not a list anyone is ordering by hand,
// and the ceiling keeps a hand-edited document from producing an
// order that sorts oddly against honest ones.
var TASK_ORDER_MAX = 9999;

function normalizeOrder(value) {
  if (value === null || value === undefined || value === '') return null;
  var n = Number(value);
  if (!isFinite(n)) return null;
  n = Math.round(n);
  if (n < 0 || n > TASK_ORDER_MAX) return null;
  return n;
}

function hasManualOrder(task) {
  return !!task && typeof task.order === 'number' && isFinite(task.order);
}

// Returns 0 when manual order has nothing to say, so callers can
// fall through to their automatic sort with `||`.
function compareManualOrder(a, b) {
  var ao = hasManualOrder(a);
  var bo = hasManualOrder(b);
  if (ao && bo) return a.order - b.order;
  if (ao) return -1;
  if (bo) return 1;
  return 0;
}

// THE ONE SORT. 12-tasks-page.js used to hold two comparators of its
// own; they live here now because reordering has to be able to ask
// "what order is this list actually in" without reaching into the
// page that draws it.
//
// Assignments sort by due date, undated last. Habits sort by the
// plant furthest along. Both tie-break on id, so the result is total
// and stable — which matters, because the renumbering below turns
// whatever this returns into stored state.
function compareTasks(a, b) {
  var manual = compareManualOrder(a, b);
  if (manual) return manual;

  if (a.kind === 'once' && b.kind === 'once') {
    if (!a.due && !b.due) return a.id - b.id;
    if (!a.due) return 1;
    if (!b.due) return -1;
    if (a.due === b.due) return a.id - b.id;
    return a.due < b.due ? -1 : 1;
  }

  return (b.totalGrowthDays || 0) - (a.totalGrowthDays || 0) || a.id - b.id;
}

// Habits and assignments are ordered separately. They are drawn in
// separate columns and read for different reasons, so a single
// sequence across both would let a drag in one column silently
// renumber the other.
function taskOrderKind(task) {
  return (task && task.kind === 'once') ? 'once' : 'habit';
}

function tasksOfKindSorted(kind) {
  return tasks
    .filter(function (t) { return taskOrderKind(t) === kind; })
    .sort(compareTasks);
}

// Renumber a whole kind from a sequence. Dense, from zero, no gaps.
function assignOrders(seq) {
  seq.forEach(function (t, i) { t.order = i; });
}

// Move a task `delta` places within its own kind. Powers the up/down
// controls in the detail sheet, which are the keyboard-reachable way
// to do what the drag handle does.
function moveTaskBy(taskId, delta) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task || !delta) return false;

  var seq = tasksOfKindSorted(taskOrderKind(task));
  var from = seq.indexOf(task);
  var to   = from + delta;
  if (from < 0 || to < 0 || to >= seq.length) return false;

  seq.splice(from, 1);
  seq.splice(to, 0, task);
  assignOrders(seq);
  return true;
}

// Commit the order of ONE section after a drag.
//
// A section is a filter over the task array, not a list of its own —
// "Habits today" and "Not today" are both windows onto the same
// sequence. So a drag inside one section must not disturb where the
// other section's tasks sit. The trick is to take the slots the
// dragged section already occupies in the full sequence and refill
// just those, in the new order, leaving every other task exactly
// where it was.
function applySectionOrder(idsInDisplayedOrder) {
  var members = (idsInDisplayedOrder || [])
    .map(function (id) {
      return tasks.find(function (t) { return t.id === id; });
    })
    .filter(Boolean);
  if (members.length < 2) return false;

  // A section never mixes kinds, and a caller that hands over a
  // mixture is confused about something — refuse rather than pick.
  var kind = taskOrderKind(members[0]);
  for (var i = 0; i < members.length; i++) {
    if (taskOrderKind(members[i]) !== kind) return false;
  }

  var seq   = tasksOfKindSorted(kind);
  var slots = [];
  seq.forEach(function (t, idx) {
    if (members.indexOf(t) !== -1) slots.push(idx);
  });
  if (slots.length !== members.length) return false;

  slots.forEach(function (slotIdx, k) { seq[slotIdx] = members[k]; });
  assignOrders(seq);
  return true;
}

// Hand a kind back to the automatic sort.
function clearManualOrder(kind) {
  var changed = false;
  tasks.forEach(function (t) {
    if (kind && taskOrderKind(t) !== kind) return;
    if (hasManualOrder(t)) { t.order = null; changed = true; }
  });
  return changed;
}

// Is any task of this kind manually placed? Drives whether the
// "back to automatic" control is worth showing at all.
function hasAnyManualOrder(kind) {
  return tasks.some(function (t) {
    return (!kind || taskOrderKind(t) === kind) && hasManualOrder(t);
  });
}


// ============================================
// Day-boundary logic
// ============================================
// How far back a single rollover will look before it gives up and
// calls the streak broken. Someone returning after more than a year
// has broken it under any reading, and the loop should not be
// unbounded just because lastResetDate can be arbitrarily old.
var MAX_STREAK_LOOKBACK_DAYS = 400;

// Did this habit miss a day it was actually supposed to be done, in
// the window between the last rollover and today?
//
// The old test was "was yesterday ticked", which is right only for a
// habit scheduled every day. A school-days habit is not missed on a
// Sunday, and breaking its streak every weekend made the schedule
// feature a lie, so the window is now walked a day at a time and
// unscheduled days are skipped.
//
// history is the source of truth for every day except the last
// rollover itself, whose result is still sitting unmerged in
// task.completed - toggleTask() writes both in lockstep, so reading
// either is safe, and reading both is safest.
function missedAScheduledDay(task, fromDate, toDate) {
  // No prior rollover recorded at all. Nothing can be verified, and
  // the old behaviour was to break; keep it.
  if (!fromDate) return true;

  var gap = dayGap(fromDate, toDate);
  if (gap <= 0) return false;
  if (gap > MAX_STREAK_LOOKBACK_DAYS) return true;

  for (var i = 0; i < gap; i++) {
    var day = shiftDate(fromDate, i);
    if (!isScheduledOn(task, day)) continue;
    var done = (i === 0)
      ? (task.completed || histGet(task.history, day))
      : histGet(task.history, day);
    if (!done) return true;
  }
  return false;
}

function applyDayBoundaries() {
  var today   = getTodayString();
  var changed = false;

  if (lastResetDate !== today) {
    tasks.forEach(function (task) {
      // Assignments do not roll over. A finished one stays finished
      // and keeps its tick; an unfinished one stays unfinished and
      // simply becomes more overdue. Neither holds a streak, so
      // there is nothing here for them at all.
      if (task.kind === 'once') return;

      if (missedAScheduledDay(task, lastResetDate, today) && task.streak > 0) {
        task.streak = 0;
        changed = true;
      }
      if (task.completed) {
        task.completed = false;
        changed = true;
      }
      // Steps come back unticked with the task they belong to. A
      // checklist that stayed ticked overnight would auto-complete
      // tomorrow the moment anything called syncParentFromSubtasks.
      (task.subtasks || []).forEach(function (s) {
        if (s.done) { s.done = false; changed = true; }
      });
    });

    lastResetDate = today;
    changed = true;
  }

  tasks.forEach(function (task) {
    if (task.streak < 0) { task.streak = 0; changed = true; }
  });

  return changed;
}
