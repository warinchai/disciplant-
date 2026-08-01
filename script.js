// ============================================
// DISCIPLANT — Task-based habit garden
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
    emoji:       '📚',
    dailyStages: ['🌱', '🌿', '🌳'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '🪴' },
      { min: 60, emoji: '🌳' },
    ],
  },
  {
    id:          'exercise',
    name:        'Exercise',
    species:     'Sunflower',
    emoji:       '🏃',
    dailyStages: ['🌱', '🌿', '🌻'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '🌷' },
      { min: 60, emoji: '🌻' },
    ],
  },
  {
    id:          'mindfulness',
    name:        'Mindfulness',
    species:     'Lotus',
    emoji:       '🧘',
    dailyStages: ['🌱', '🌿', '🪷'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '🪴' },
      { min: 60, emoji: '🪷' },
    ],
  },
  {
    id:          'sleep',
    name:        'Sleep',
    species:     'Lavender',
    emoji:       '😴',
    dailyStages: ['🌱', '🌿', '🪻'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '🪴' },
      { min: 60, emoji: '🪻' },
    ],
  },
  {
    id:          'chores',
    name:        'Chores',
    species:     'Bamboo',
    emoji:       '🏠',
    dailyStages: ['🌱', '🌿', '🎋'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '🎍' },
      { min: 60, emoji: '🎋' },
    ],
  },
  {
    id:          'finance',
    name:        'Finance',
    species:     'Clover',
    emoji:       '💰',
    dailyStages: ['🌱', '🌿', '🍀'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '☘️' },
      { min: 60, emoji: '🍀' },
    ],
  },
  {
    id:          'misc',
    name:        'Misc',
    species:     'Mushroom',
    emoji:       '🍄',
    dailyStages: ['🌱', '🌿', '🍄'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '🍄' },
      { min: 60, emoji: '🍄' },
    ],
  },
];


// ============================================
// Category lore and suggested tasks
// ============================================
var CATEGORY_CONTENT = {
  education: {
    lore: 'The Oak grows slowly but becomes one of the strongest, longest-living trees in the forest — a symbol of patience, wisdom, and knowledge that compounds over years, not days.',
    suggestions: [
      'Read for 20 minutes',
      'Review today\'s class notes',
      'Do one practice problem set',
      'Watch an educational video',
      'Learn one new word or concept',
    ],
  },
  exercise: {
    lore: 'The Sunflower turns to follow the sun all day — a symbol of vitality, energy, and consistently choosing what nourishes you.',
    suggestions: [
      '20-minute walk or jog',
      'Stretch for 10 minutes',
      'Bodyweight workout',
      'Take the stairs today',
      'Drink enough water',
    ],
  },
  mindfulness: {
    lore: 'The Lotus rises clean and unstained out of muddy water — a symbol of clarity and calm rising above daily noise and stress.',
    suggestions: [
      'Meditate for 5–10 minutes',
      'Write in a journal',
      'Practice slow, deep breathing',
      'One hour phone-free',
      'Sit outside without distractions',
    ],
  },
  sleep: {
    lore: 'Lavender has been used for centuries to calm the mind and ease rest — this plant represents recovery, the quiet foundation everything else is built on.',
    suggestions: [
      'Go to bed at a consistent time',
      'No screens 30 minutes before bed',
      'Wake up at the same time daily',
      'Avoid caffeine after 2pm',
    ],
  },
  chores: {
    lore: 'Bamboo is one of the fastest-growing, most resilient plants on Earth — a symbol of steady discipline in the unglamorous daily upkeep that keeps everything else standing.',
    suggestions: [
      'Tidy your room or desk',
      'Do a load of laundry',
      'Wash the dishes tonight',
      'Plan tomorrow\'s schedule',
      'Take out the rubbish',
    ],
  },
  finance: {
    lore: 'The four-leaf clover is the old emblem of good fortune — but the luck it stands for is the kind you make, one small deliberate choice at a time, by knowing exactly what comes in and what goes out.',
    suggestions: [
      'Track today\'s spending',
      'Check your budget',
      'Pay a bill before it\'s due',
      'Move something into savings',
      'Review one subscription',
    ],
  },
  misc: {
    lore: 'Mushrooms rise overnight in the ground nothing else has claimed, quietly turning leftovers into soil that feeds the whole forest — the odd, uncategorised jobs that hold everything else together.',
    suggestions: [
      'Anything that doesn\'t fit elsewhere — add it here.',
    ],
  },
};


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

// Auth / profile identity state — kept separate from `tasks` (garden
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

// Greenhouse page elements
const greenhouseLoadingState = document.getElementById('greenhouseLoadingState');
const greenhouseContent      = document.getElementById('greenhouseContent');

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
// Build category sub-nav and tab panels
// ============================================
function buildCategoryTabs() {
  var subnav    = document.getElementById('catSubnav');
  var container = document.getElementById('taskTabsContainer');
  if (!subnav || !container) return;

  subnav.innerHTML    = '';
  container.innerHTML = '';

  // "All" tab button
  var allBtn         = document.createElement('button');
  allBtn.className   = 'cat-tab active';
  allBtn.dataset.tab = 'all';
  allBtn.textContent = 'All tasks';
  allBtn.addEventListener('click', function () { switchTaskTab('all'); });
  subnav.appendChild(allBtn);

  CATEGORIES.forEach(function (cat) {
    // Tab button
    var btn         = document.createElement('button');
    btn.className   = 'cat-tab';
    btn.dataset.tab = cat.id;
    btn.textContent = cat.emoji + ' ' + cat.name;
    btn.addEventListener('click', function () { switchTaskTab(cat.id); });
    subnav.appendChild(btn);

    // Tab panel
    var content = CATEGORY_CONTENT[cat.id] || { lore: '', suggestions: [] };
    var panel   = document.createElement('div');
    panel.id        = 'tab-' + cat.id;
    panel.className = 'task-tab-panel hidden';

    // Lore header
    var header = document.createElement('div');
    header.className = 'cat-lore-header';

    var nameEl       = document.createElement('h3');
    nameEl.className = 'cat-lore-name';
    nameEl.textContent = cat.name;

    var speciesEl       = document.createElement('span');
    speciesEl.className = 'cat-lore-species';
    speciesEl.textContent = cat.species;

    header.appendChild(nameEl);
    header.appendChild(speciesEl);
    panel.appendChild(header);

    // Lore text
    var loreEl       = document.createElement('p');
    loreEl.className = 'cat-lore-text';
    loreEl.textContent = content.lore;
    panel.appendChild(loreEl);

    // Suggestions
    if (content.suggestions && content.suggestions.length) {
      var sugSection       = document.createElement('div');
      sugSection.className = 'cat-suggestions';

      var sugLabel       = document.createElement('p');
      sugLabel.className = 'cat-suggestions-label';
      sugLabel.textContent = 'Suggested tasks';
      sugSection.appendChild(sugLabel);

      var sugList       = document.createElement('ul');
      sugList.className = 'suggestion-list';

      content.suggestions.forEach(function (sug) {
        var li        = document.createElement('li');
        var sugBtn    = document.createElement('button');
        sugBtn.className   = 'suggestion-btn';
        sugBtn.textContent = '+ ' + sug;
        (function (catId, text) {
          sugBtn.addEventListener('click', function () {
            taskInput.value     = text;
            categorySelect.value = catId;
            taskInput.focus();
          });
        }(cat.id, sug));
        li.appendChild(sugBtn);
        sugList.appendChild(li);
      });

      sugSection.appendChild(sugList);
      panel.appendChild(sugSection);
    }

    // Filtered task list
    var catListEl       = document.createElement('ul');
    catListEl.id        = 'cat-list-' + cat.id;
    catListEl.className = 'task-list';
    panel.appendChild(catListEl);

    var catEmptyEl       = document.createElement('p');
    catEmptyEl.id        = 'cat-empty-' + cat.id;
    catEmptyEl.className = 'empty-state';
    catEmptyEl.textContent = 'No ' + cat.name.toLowerCase() + ' tasks yet — add one above.';
    panel.appendChild(catEmptyEl);

    container.appendChild(panel);
  });
}

buildCategoryTabs();


// ============================================
// Navigation
// ============================================
function navigateTo(page) {
  currentPage = page;

  if (pageHomeEl)   pageHomeEl.classList.toggle('hidden',   page !== 'home');
  if (pageGardenEl) pageGardenEl.classList.toggle('hidden', page !== 'garden');
  if (pageTasksEl)  pageTasksEl.classList.toggle('hidden',  page !== 'tasks');
  if (pageStatsEl)  pageStatsEl.classList.toggle('hidden',  page !== 'stats');
  if (pageGreenhouseEl) pageGreenhouseEl.classList.toggle('hidden', page !== 'greenhouse');

  // Garden scene: only visible on garden page once auth is ready
  if (gardenSceneEl) gardenSceneEl.classList.toggle('hidden', page !== 'garden' || !authReady);

  // The universal time-of-day sky (gradient, stars, hills, fireflies,
  // clouds/birds, sun/moon) stays visible on every page, including
  // Garden, so night/day looks identical everywhere. The garden
  // backdrop now only adds the garden-specific ground (fence + lawn)
  // on top of it while on the Garden page.
  if (gardenBackdropEl) gardenBackdropEl.classList.toggle('hidden', page !== 'garden');

  if (page === 'garden') {
    if (loadingState) loadingState.classList.toggle('hidden', authReady);
    // Center the garden scene's horizontal scroll on this visit —
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

  // Scroll the destination page back to top
  if (page === 'tasks'  && pageTasksEl)  pageTasksEl.scrollTop  = 0;
  if (page === 'garden' && pageGardenEl) pageGardenEl.scrollTop = 0;
  if (page === 'home'   && pageHomeEl)   pageHomeEl.scrollTop   = 0;
  if (page === 'stats'  && pageStatsEl)  pageStatsEl.scrollTop  = 0;
  if (page === 'greenhouse' && pageGreenhouseEl) pageGreenhouseEl.scrollTop = 0;
}

function switchTaskTab(tabId) {
  currentTaskTab = tabId;

  // Update button active states
  document.querySelectorAll('.cat-tab').forEach(function (btn) {
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
// Navigation event listeners
// ============================================
document.getElementById('btn-to-garden').addEventListener('click',  function () { navigateTo('garden'); });
document.getElementById('btn-to-tasks').addEventListener('click',   function () { navigateTo('tasks');  });
document.getElementById('garden-nav-home').addEventListener('click',  function () { navigateTo('home');   });
document.getElementById('garden-nav-tasks').addEventListener('click', function () { navigateTo('tasks');  });
document.getElementById('garden-nav-stats').addEventListener('click', function () { navigateTo('stats');  });
document.getElementById('tasks-nav-home').addEventListener('click',   function () { navigateTo('home');   });
document.getElementById('tasks-nav-garden').addEventListener('click', function () { navigateTo('garden'); });
document.getElementById('tasks-nav-stats').addEventListener('click',  function () { navigateTo('stats');  });
document.getElementById('stats-nav-home').addEventListener('click',   function () { navigateTo('home');   });
document.getElementById('stats-nav-garden').addEventListener('click', function () { navigateTo('garden'); });
document.getElementById('stats-nav-tasks').addEventListener('click',  function () { navigateTo('tasks');  });

// Greenhouse — reachable from the home page and from every nav bar
document.getElementById('btn-to-greenhouse').addEventListener('click',        function () { navigateTo('greenhouse'); });
document.getElementById('garden-nav-greenhouse').addEventListener('click',    function () { navigateTo('greenhouse'); });
document.getElementById('tasks-nav-greenhouse').addEventListener('click',     function () { navigateTo('greenhouse'); });
document.getElementById('stats-nav-greenhouse').addEventListener('click',     function () { navigateTo('greenhouse'); });
document.getElementById('greenhouse-nav-home').addEventListener('click',      function () { navigateTo('home');   });
document.getElementById('greenhouse-nav-garden').addEventListener('click',    function () { navigateTo('garden'); });
document.getElementById('greenhouse-nav-tasks').addEventListener('click',     function () { navigateTo('tasks');  });
document.getElementById('greenhouse-nav-stats').addEventListener('click',     function () { navigateTo('stats');  });

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
//              undone and size drops back down — but only for
//              today; once a day has rolled over it's locked in
//              (see applyDayBoundaries()) and can't be undone later.
//  - Vitality: driven by streak (current consecutive-day run).
//              Resets to 0 the moment a full day is missed.
// ============================================

// Day thresholds where the art itself changes to a more detailed
// stage (seed → sprout → young → mature). Matches the 4 SVG stages
// already defined per category in PLANT_SVG_DATA.
var STAGE_MILESTONES = [0, 2, 15, 60];

// scale = 1 + 0.074 * totalGrowthDays^0.7 — unbounded, no ceiling.
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
      // gap === 1: task.completed still reflects "yesterday" — if it
      // wasn't done, that day was missed, so the streak breaks now.
      // gap > 1 (or no prior reset date at all): at least one full
      // day passed with no rollover recorded, which can only mean it
      // was missed — the streak always breaks in that case too.
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


// ============================================
// Auth architecture
//
// Google Sign-In is the primary account provider, but nobody is ever
// forced through a login screen: on first visit the app immediately
// signs the visitor in ANONYMOUSLY so they can start planting right
// away. That anonymous account can later be upgraded to a Google
// account (via linkWithPopup) without losing any of the guest's
// existing garden data — the anonymous uid keeps its Firestore
// documents, only the auth PROVIDER changes.
//
// currentUserProfile (see state block above) tracks the signed-in
// identity shown in the auth widget and the Stats page profile
// header. It's kept separate from `tasks`/garden data.
// ============================================

var googleProvider = new firebase.auth.GoogleAuthProvider();

// ---- Step 1: sign the visitor in anonymously (fallback identity) ----
// Only signs in as a guest if there's truly no session yet — this is
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
    APP_HOST + '). Redirect sign-in CANNOT complete here — popup only. ' +
    'Fix by pointing authDomain at this domain and serving /__/auth/* from it.'
  );
}

// ---- Catch the result of a redirect-based sign-in / link ----
// We record a flag in sessionStorage before navigating away, so that on
// the way back we can tell the difference between "no redirect was ever
// in progress" (normal page load — stay quiet) and "a redirect WAS in
// progress and came back empty" (the storage-partitioning failure —
// surface a real error instead of failing silently).
var redirectWasPending = false;
try {
  redirectWasPending = sessionStorage.getItem('disciplant:redirectPending') === '1';
  sessionStorage.removeItem('disciplant:redirectPending');
} catch (e) { /* sessionStorage unavailable (private mode) — ignore */ }

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
      ' host=' + APP_HOST + ' — these must match for redirect sign-in to work.'
    );
    renderAuthModal();
  }
}).catch(function (error) {
  authActionPending = false;
  var code = error && error.code;
  if (code === 'auth/credential-already-in-use') {
    // The guest account can't take this Google credential because another
    // account already owns it. Do NOT auto-fire another redirect here —
    // that runs with no user gesture and can loop. Ask the user instead.
    authActionError = 'That Google account is already in use. Tap Sign in with Google again to switch to it.';
  } else if (code && code !== 'auth/no-auth-event') {
    authActionError = 'Sign-in failed. Please try again.';
    console.error('DISCIPLANT: redirect sign-in failed:', error);
  }
  renderAuthModal();
});

// ---- User profile doc (users/{uid}) — separate from garden data ----
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
  db.collection('users').doc(user.uid).set(profileData, { merge: true })
    .catch(function (error) {
      console.error('DISCIPLANT: could not save profile doc:', error);
    });
}

// Reads a field off the Firebase user, falling back to its linked
// provider's own copy of that field. Needed because linkWithPopup()
// doesn't always immediately copy the newly-linked provider's
// displayName/email/photoURL onto the top-level user object — the
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
// This is deliberately idempotent — running it twice in a row costs
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
// no intervening window.open() — the browser's user-activation token must
// still be live at the moment signInWithPopup()/linkWithPopup() runs, or the
// popup gets blocked. (An earlier version probed for popup support by
// opening and closing a test window; that spent the activation token and
// tripped popup blockers, i.e. it caused the very failure it tested for.)
//
// Redirect is used as a fallback ONLY when it can actually complete on this
// origin — see REDIRECT_IS_USABLE above. Otherwise we show a real error
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
    // Page navigates away here — nothing after this runs.
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
        // That Google account already has its own saved garden — sign
        // into it directly instead of linking.
        return auth.signInWithPopup(googleProvider)
          .then(function (result2) {
            authActionPending = false;
            refreshIdentityUI((result2 && result2.user) || auth.currentUser);
            closeAuthModal();
          })
          .catch(function (err2) {
            fail('Sign-in failed. Please try again.', err2);
          });
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
        // User backed out on purpose — not an error worth showing.
        authActionPending = false;
        renderAuthModal();
        return;
      }

      fail('Sign-in failed. Please try again.', error);
    });
}

// ---- Sign out (drops back to a fresh anonymous guest session) ----
function signOutUser() {
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

  if (!profile.isAnonymous && profile.photoURL) {
    authAvatarImg.src = profile.photoURL;
    authAvatarImg.classList.remove('hidden');
    authAvatarFallback.classList.add('hidden');
  } else {
    authAvatarImg.classList.add('hidden');
    authAvatarFallback.classList.remove('hidden');
    authAvatarFallback.textContent = profile.isAnonymous ? '🌱' : '🌻';
  }

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

  var avatarHtml = (!profile.isAnonymous && profile.photoURL)
    ? '<img src="' + profile.photoURL + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />'
    : (profile.isAnonymous ? '🌱' : '🌻');

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
    ? '<p class="auth-modal-note">Your current garden stays exactly as it is — linking just adds Google sign-in on top.</p>'
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

if (authWidgetBtn)     authWidgetBtn.addEventListener('click', openAuthModal);
if (authModalClose)    authModalClose.addEventListener('click', closeAuthModal);
if (authModalBackdrop) authModalBackdrop.addEventListener('click', closeAuthModal);


// ============================================
// Step 2: Listen to this user's data in real time
// ============================================
// onIdTokenChanged, NOT onAuthStateChanged.
//
// onAuthStateChanged only fires when *which user* is signed in changes.
// Linking Google onto an anonymous guest keeps the SAME uid — the auth
// state technically never changed — so that callback stays silent and
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
  if (!user) {
    // No session at all — sign in as a guest. Doing this here rather
    // than unconditionally at script load means it can never race
    // with a Google redirect sign-in/link still being processed on
    // return from signInWithGoogle()'s redirect fallback: Firebase
    // holds off firing this callback with `null` until any pending
    // redirect result has been resolved, so by the time we get here
    // with no user, there really isn't one yet.
    auth.signInAnonymously().catch(function (error) {
      console.error('Sign-in failed:', error);
    });
    return;
  }

  refreshIdentityUI(user);

  if (currentUserId === user.uid && unsubscribeSnapshot) return;

  currentUserId = user.uid;
  console.log('Signed in as:', currentUserId, user.isAnonymous ? '(guest)' : '(Google)');

  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  unsubscribeSnapshot = db.collection('gardens').doc(currentUserId)
    .onSnapshot(function (docSnapshot) {
      try {

        if (docSnapshot.exists) {
          var data  = docSnapshot.data();
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
              streak:            t.streak              || 0,
              lastCleanDate:     t.lastCleanDate        || null,
              prevLastCleanDate: t.prevLastCleanDate    || null,
              totalGrowthDays:    t.totalGrowthDays       || 0,
              // All-time longest streak this task has ever reached.
              // Backfilled from the current streak on load in case a
              // task already had a streak before this field existed.
              maxStreak:         Math.max(t.maxStreak || 0, t.streak || 0),
              // Per-day completion log — { "YYYY-MM-DD": true, ... } —
              // one entry per day this task was actually checked off.
              // Powers the Stats page heatmaps; only starts recording
              // from whenever this field was introduced, so days
              // before that won't have an entry.
              history:           (t.history && typeof t.history === 'object') ? t.history : {},
              // Manual placement override — set when the user drags
              // this plant to a spot themselves. null/undefined means
              // "use the automatic layout" (see computePlantLayout).
              posX:              (typeof t.posX === 'number') ? t.posX : null,
              posY:              (typeof t.posY === 'number') ? t.posY : null,
            };
          });
          lastResetDate = data.lastResetDate || null;
        } else {
          tasks         = [];
          lastResetDate = null;
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
function saveData() {
  if (!currentUserId) return;
  var cleanTasks = tasks.map(function (t) {
    return {
      id:                t.id,
      text:              t.text,
      categoryId:        t.categoryId,
      skinId:            t.skinId || SKIN_DEFAULT_ID,
      completed:         t.completed,
      streak:            t.streak || 0,
      lastCleanDate:     t.lastCleanDate || null,
      prevLastCleanDate: t.prevLastCleanDate || null,
      totalGrowthDays:    t.totalGrowthDays || 0,
      maxStreak:         Math.max(t.maxStreak || 0, t.streak || 0),
      history:           t.history || {},
      posX:              (typeof t.posX === 'number') ? t.posX : null,
      posY:              (typeof t.posY === 'number') ? t.posY : null,
    };
  });
  db.collection('gardens').doc(currentUserId).set({
    tasks:         cleanTasks,
    lastResetDate: lastResetDate,
  }).catch(function (error) {
    console.error('Error saving data:', error);
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
  // reliable signal for "was today's credit already given" — and
  // unlike comparing lastCleanDate to today's date string, it can't
  // be thrown off by the dev rollover simulation, timezone edge
  // cases, or any other date-comparison mismatch.
  var wasCompleted = task.completed;
  task.completed   = newChecked;
  if (!task.history) task.history = {};

  if (newChecked && !wasCompleted) {
    // Fresh completion — grow both streak and size, once, and log
    // today in this task's per-day history (powers the Stats page
    // heatmaps).
    task.streak          = (task.streak || 0) + 1;
    task.totalGrowthDays = (task.totalGrowthDays || 0) + 1;
    task.history[getTodayString()] = true;
    task.maxStreak        = Math.max(task.maxStreak || 0, task.streak);
  } else if (!newChecked && wasCompleted) {
    // Undoing a completion — reverse today's credit for both, and
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
      badge.textContent    = cat.emoji + ' ' + cat.name;
      li.appendChild(badge);
    }

    // Skin pip — shows the plant's current colours right on the
    // row, and doubles as a shortcut into the Greenhouse, where
    // skins are actually chosen.
    var skinBtn       = document.createElement('button');
    skinBtn.type      = 'button';
    skinBtn.className = 'skin-btn';
    skinBtn.innerHTML = skinPipHtml(getSkin(task.categoryId, getTaskSkinId(task)));
    skinBtn.setAttribute('aria-label', 'Open this ' + cat.species + ' in the Greenhouse');
    skinBtn.title     = 'Change how this ' + cat.species + ' looks — opens the Greenhouse';
    (function (id) {
      skinBtn.addEventListener('click', function () { openPlantSkins(id); });
    }(task.id));
    li.appendChild(skinBtn);

    var removeBtn      = document.createElement('button');
    removeBtn.className  = 'remove';
    removeBtn.textContent = '✕';
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


// ============================================
// SVG plant illustrations
// ============================================
// Each entry is an array of 4 SVG body strings (stages 0–3).
// ViewBox is "0 0 80 130". Plant base sits at y≈118.
// ============================================

var PLANT_SVG_DATA = {

  // ---- OAK (Education) ----
  education: [
    // Stage 0: Acorn on soil
    '<path d="M29,122 C29,120.4 33.9,119 40,119 C46.1,119 51,120.4 51,122 C51,123.6 46.1,125 40,125 C33.9,125 29,123.6 29,122 Z" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/><path d="M40,107 C36.5,107 34.5,110.2 34.5,114 C34.5,117.9 36.5,121 40,121 C43.5,121 45.5,117.9 45.5,114 C45.5,110.2 43.5,107 40,107 Z" style="fill:var(--c-seed,hsl(35,38%,68%))"/><path d="M40,107 C37,107 34.5,109.8 34.5,113 L40,113.4 Z" style="fill:var(--c-seed-dark,hsl(35,38%,56%))"/><path d="M33,107 C33,104.8 36.1,103.5 40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 C36.1,110.5 33,109.2 33,107 Z" style="fill:var(--c-stem,hsl(20,30%,45%))"/><path d="M40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 Z" style="fill:var(--c-stem-dark,hsl(20,30%,35%))"/><path d="M38.7,99 C38.7,97.6 39.2,96.5 40,96.5 C40.8,96.5 41.3,97.6 41.3,99 L41.3,104 L38.7,104 Z" style="fill:var(--c-stem-dark,hsl(20,30%,35%))"/>',

    // Stage 1: Seedling, two round leaves -- recolored to the mature bark/canopy palette
    '<path d="M26,122 C26,120.1 32.3,118.5 40,118.5 C47.7,118.5 54,120.1 54,122 C54,123.9 47.7,125.5 40,125.5 C32.3,125.5 26,123.9 26,122 Z" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/><path d="M39,122 C38.8,113 39,104 39.6,96 C39.7,95 40.3,95 40.4,96 C41,104 41.2,113 41,122 Z" style="fill:var(--c-bark,hsl(8,30%,40%))"/><path d="M40.4,96 C41,104 41.2,113 41,122 L40.2,122 C40.4,113 40.2,104 39.9,96 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><g transform="translate(29,95) rotate(-22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/></g><g transform="translate(51,92) rotate(22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/></g>',

    // Stage 2: Young oak -- rounded three-tier crown as one merged mass,
    '<ellipse cx="40" cy="122" rx="19" ry="5.5" style="fill:var(--c-shadow,rgba(0,0,0,0.15))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round"><path d="M40,83 C37.4,78 35,71 32,52" stroke-width="2.2"/><path d="M40,86 C42.6,81 45,73.5 48,52" stroke-width="2.2"/></g><path d="M34.5,118 C36.2,110 37.2,96 37.9,80 C38.2,74 38.3,67 38.3,59 L40,59 L40,118 Z" style="fill:var(--c-bark,hsl(8,30%,42%))"/><path d="M45.5,118 C43.8,110 42.8,96 42.1,80 C41.8,74 41.7,67 41.7,59 L40,59 L40,118 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><path d="M32.6,37 A9,9 0 1,0 50.6,37 A9,9 0 1,0 32.6,37 Z M21.6,43 A8,8 0 1,0 37.6,43 A8,8 0 1,0 21.6,43 Z M45.6,43 A8,8 0 1,0 61.6,43 A8,8 0 1,0 45.6,43 Z M31.1,47 A10.5,10.5 0 1,0 52.1,47 A10.5,10.5 0 1,0 31.1,47 Z M23.6,53 A8,8 0 1,0 39.6,53 A8,8 0 1,0 23.6,53 Z M43.6,53 A8,8 0 1,0 59.6,53 A8,8 0 1,0 43.6,53 Z M33.6,57 A8,8 0 1,0 49.6,57 A8,8 0 1,0 33.6,57 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/><path d="M31,35 A9,9 0 1,0 49,35 A9,9 0 1,0 31,35 Z M20,41 A8,8 0 1,0 36,41 A8,8 0 1,0 20,41 Z M44,41 A8,8 0 1,0 60,41 A8,8 0 1,0 44,41 Z M29.5,45 A10.5,10.5 0 1,0 50.5,45 A10.5,10.5 0 1,0 29.5,45 Z M22,51 A8,8 0 1,0 38,51 A8,8 0 1,0 22,51 Z M42,51 A8,8 0 1,0 58,51 A8,8 0 1,0 42,51 Z M32,55 A8,8 0 1,0 48,55 A8,8 0 1,0 32,55 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><g fill="none" style="stroke:var(--c-canopy-dark,hsl(58,38%,42%))" stroke-linecap="round" stroke-width="1.3" opacity="0.42"><path d="M31,38 C34.5,43 45.5,43 49,38"/><path d="M22,44 C25,49 31,50.5 35,48"/></g>',

    // Stage 3: Full spreading oak -- ten merged lobes forming a single
    //          connected crown, split-shaded trunk with flared roots,
    //          and limbs that terminate inside the canopy
    '<ellipse cx="40" cy="122" rx="24" ry="6" style="fill:var(--c-shadow,rgba(0,0,0,0.16))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round"><path d="M40,77 C35.2,72 31.4,65.5 28.5,58" stroke-width="2.9"/><path d="M40,80 C44.6,75 48,67 50.5,57.5" stroke-width="2.9"/><path d="M40,68 C37.6,63 35.4,59 33.6,54.5" stroke-width="2"/><path d="M40,70 C42.6,65 44.8,61 46.6,56" stroke-width="2"/></g><path d="M31,118 C33.2,112 35,103 36.3,88 C37.1,78 37.4,68 37.5,58 L40,58 L40,118 Z" style="fill:var(--c-bark,hsl(8,30%,40%))"/><path d="M49,118 C46.8,112 45,103 43.7,88 C42.9,78 42.6,68 42.5,58 L40,58 L40,118 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round" stroke-width="0.8" opacity="0.35"><path d="M37.4,112 C38,100 38.4,86 38.6,72"/><path d="M34.6,116 C35.6,108 36.3,99 36.8,90"/></g><path d="M29,21.6 A13,13 0 1,0 55,21.6 A13,13 0 1,0 29,21.6 Z M17,29.6 A12,12 0 1,0 41,29.6 A12,12 0 1,0 17,29.6 Z M43,29.6 A12,12 0 1,0 67,29.6 A12,12 0 1,0 43,29.6 Z M11,40.6 A10,10 0 1,0 31,40.6 A10,10 0 1,0 11,40.6 Z M53,40.6 A10,10 0 1,0 73,40.6 A10,10 0 1,0 53,40.6 Z M27,36.6 A15,15 0 1,0 57,36.6 A15,15 0 1,0 27,36.6 Z M17,49.6 A12,12 0 1,0 41,49.6 A12,12 0 1,0 17,49.6 Z M43,49.6 A12,12 0 1,0 67,49.6 A12,12 0 1,0 43,49.6 Z M29,52.6 A13,13 0 1,0 55,52.6 A13,13 0 1,0 29,52.6 Z M33,60.6 A9,9 0 1,0 51,60.6 A9,9 0 1,0 33,60.6 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/><path d="M27,19 A13,13 0 1,0 53,19 A13,13 0 1,0 27,19 Z M15,27 A12,12 0 1,0 39,27 A12,12 0 1,0 15,27 Z M41,27 A12,12 0 1,0 65,27 A12,12 0 1,0 41,27 Z M9,38 A10,10 0 1,0 29,38 A10,10 0 1,0 9,38 Z M51,38 A10,10 0 1,0 71,38 A10,10 0 1,0 51,38 Z M25,34 A15,15 0 1,0 55,34 A15,15 0 1,0 25,34 Z M15,47 A12,12 0 1,0 39,47 A12,12 0 1,0 15,47 Z M41,47 A12,12 0 1,0 65,47 A12,12 0 1,0 41,47 Z M27,50 A13,13 0 1,0 53,50 A13,13 0 1,0 27,50 Z M31,58 A9,9 0 1,0 49,58 A9,9 0 1,0 31,58 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><g fill="none" style="stroke:var(--c-canopy-dark,hsl(58,38%,42%))" stroke-linecap="round" stroke-width="1.6" opacity="0.45"><path d="M30,17 C34,23 46,23 50,17"/><path d="M18,30 C22,38 32,40 37,36"/><path d="M62,30 C58,38 48,40 43,36"/></g>'
  ],

  // ---- SUNFLOWER (Exercise) ----
  exercise: [
    // Stage 0: Single seed
    '<ellipse cx="40" cy="121" rx="9" ry="2.5" style="fill:var(--c-shadow,rgba(0,0,0,0.12))"/>' +
    '<ellipse cx="40" cy="113" rx="5" ry="7" style="fill:var(--c-seed,#C8A030)"/>' +
    '<line x1="38" y1="109" x2="42" y2="109" style="stroke:var(--c-seed-line,#908018)" stroke-width="1.5"/>' +
    '<line x1="37" y1="112" x2="43" y2="112" style="stroke:var(--c-seed-line,#908018)" stroke-width="1.5"/>' +
    '<line x1="37" y1="115" x2="43" y2="115" style="stroke:var(--c-seed-line,#908018)" stroke-width="1.5"/>',

    // Stage 1: Sprout with leaves and small bud
    '<ellipse cx="40" cy="122" rx="13" ry="3.5" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/>' +
    '<rect x="39" y="95" width="2" height="27" rx="1" style="fill:var(--c-stem,#6A9A30)"/>' +
    '<ellipse cx="28" cy="103" rx="12" ry="5" style="fill:var(--c-leaf-light,#8FBF7F)" transform="rotate(-28,28,103)"/>' +
    '<ellipse cx="52" cy="99" rx="12" ry="5" style="fill:var(--c-leaf,#7ABF50)" transform="rotate(28,52,99)"/>' +
    '<circle cx="40" cy="93" r="5.5" style="fill:var(--c-petal,#F5C840)"/>' +
    '<circle cx="40" cy="93" r="3" style="fill:var(--c-petal-dark,#D4A010)"/>',

    // Stage 2: Blooming sunflower
    '<ellipse cx="40" cy="122" rx="15" ry="4" style="fill:var(--c-shadow,rgba(0,0,0,0.15))"/>' +
    '<rect x="39" y="80" width="2" height="42" rx="1" style="fill:var(--c-stem,#5A8830)"/>' +
    '<ellipse cx="26" cy="96" rx="14" ry="5.5" style="fill:var(--c-leaf,#7ABF50)" transform="rotate(-25,26,96)"/>' +
    '<ellipse cx="54" cy="91" rx="14" ry="5.5" style="fill:var(--c-leaf-light,#8FBF7F)" transform="rotate(25,54,91)"/>' +
    '<g transform="translate(40,76)">' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(0)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(45)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(90)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(135)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(180)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(225)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(270)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(315)"/>' +
    '<circle cx="0" cy="0" r="10" style="fill:var(--c-disc,#5C3A1A)"/>' +
    '<circle cx="0" cy="0" r="6.5" style="fill:var(--c-disc-dark,#3C2210)"/>' +
    '</g>',

    // Stage 3: Tall full sunflower
    '<ellipse cx="40" cy="122" rx="16" ry="4.5" style="fill:var(--c-shadow,rgba(0,0,0,0.16))"/>' +
    '<rect x="38.5" y="66" width="3" height="56" rx="1.5" style="fill:var(--c-stem,#4A7820)"/>' +
    '<ellipse cx="22" cy="88" rx="17" ry="6.5" style="fill:var(--c-leaf-dark,#6AAF40)" transform="rotate(-22,22,88)"/>' +
    '<ellipse cx="58" cy="82" rx="17" ry="6.5" style="fill:var(--c-leaf,#7ABF50)" transform="rotate(22,58,82)"/>' +
    '<g transform="translate(40,58)">' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(0)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(45)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(90)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(135)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(180)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(225)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(270)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(315)"/>' +
    '<circle cx="0" cy="0" r="14" style="fill:var(--c-disc,#5C3A1A)"/>' +
    '<circle cx="0" cy="0" r="10" style="fill:var(--c-disc-dark,#3C2210)"/>' +
    '<circle cx="-4" cy="-3" r="2.5" style="fill:var(--c-disc-seed,#704820)"/>' +
    '<circle cx="4" cy="-2" r="2.5" style="fill:var(--c-disc-seed,#704820)"/>' +
    '<circle cx="0" cy="5" r="2.5" style="fill:var(--c-disc-seed,#704820)"/>' +
    '</g>'
  ],

  // ---- LOTUS (Mindfulness) ----
  // Every stage below is built from the same "vesica" petal primitive:
  // a path that starts and ends at one shared base point and reaches a
  // single shared tip point via two curves, split down the centerline
  // into a light half + a dark half for two-tone shading. This is what
  // guarantees a genuinely sharp petal tip (both halves close on the
  // exact same coordinate -- no blunt double-point kinks) and keeps every
  // growth stage -- seed, closed bud, half-open, full bloom -- built out
  // of the *same* petal shape at increasing size/count, so the design
  // reads as one continuous plant rather than unrelated art per stage.
  // Palette: petal base #F5BCC6 (hsl 350,75%,85%), petal shadow #E28D9B
  // (hsl 350,60%,72%), leaves/stem sage green #64B47F (hsl 140,35%,55%).
  mindfulness: [
    // Stage 0: Seed on a small lily pad -- a single tiny pointed nub
    '<ellipse cx="40" cy="121" rx="14" ry="4" style="fill:var(--c-shadow,rgba(40,100,50,0.3))"/>' +
    '<ellipse cx="40" cy="119" rx="12" ry="4.5" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<ellipse cx="40" cy="117" rx="11" ry="3.5" style="fill:var(--c-pad,#4A9A5A)"/>' +
    '<path d="M40.0,118.0 C36.4,114.4 36.7,108.2 40.0,105.0 L40.0,118.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,118.0 C43.6,114.4 43.3,108.2 40.0,105.0 L40.0,118.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>',

    // Stage 1: Pad with stem + closed bud (3 tight, upright petal tips)
    '<ellipse cx="40" cy="121" rx="17" ry="4.5" style="fill:var(--c-shadow,rgba(40,100,50,0.28))"/>' +
    '<ellipse cx="40" cy="119" rx="15" ry="5" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<ellipse cx="40" cy="117" rx="13.5" ry="4" style="fill:var(--c-pad,#3A8A4A)"/>' +
    '<rect x="39" y="103" width="2" height="16" rx="1" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<path d="M40.0,103.0 C34.8,98.6 33.7,89.0 36.9,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,103.0 C43.5,97.2 41.7,87.7 36.9,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,103.0 C35.6,97.8 36.0,88.2 40.0,83.0 L40.0,103.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,103.0 C44.4,97.8 44.0,88.2 40.0,83.0 L40.0,103.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,103.0 C36.5,97.2 38.3,87.7 43.1,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,103.0 C45.2,98.6 46.3,89.0 43.1,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>',

    // Stage 2: Half-open lotus -- 2 back petals + 3 front petals + carpel,
    // same shading pairs the full bloom uses (mid pink / light pink)
    '<ellipse cx="40" cy="121" rx="20" ry="5" style="fill:var(--c-shadow,rgba(40,100,50,0.3))"/>' +
    '<ellipse cx="40" cy="119" rx="18" ry="5.5" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<ellipse cx="40" cy="117" rx="16" ry="4.5" style="fill:var(--c-pad,#3A8A4A)"/>' +
    '<ellipse cx="26" cy="120" rx="9" ry="3" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<ellipse cx="54" cy="120" rx="9" ry="3" style="fill:var(--c-pad,#4A9A5A)"/>' +
    '<rect x="39" y="89" width="2" height="30" rx="1" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<path d="M40.0,89.0 C30.5,82.4 24.5,67.7 26.6,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M40.0,89.0 C41.5,77.5 34.6,63.2 26.6,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M40.0,89.0 C38.5,77.5 45.4,63.2 53.4,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M40.0,89.0 C49.5,82.4 55.5,67.7 53.4,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M40.0,89.0 C33.5,82.6 31.4,69.8 34.8,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,89.0 C43.7,80.6 40.8,67.9 34.8,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,89.0 C34.8,81.4 35.2,68.5 40.0,62.0 L40.0,89.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,89.0 C45.2,81.4 44.8,68.5 40.0,62.0 L40.0,89.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,89.0 C36.3,80.6 39.2,67.9 45.2,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,89.0 C46.5,82.6 48.6,69.8 45.2,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<ellipse cx="40" cy="83" rx="5" ry="3.8" style="fill:var(--c-center,#E8D27A)"/>' +
    '<circle cx="40" cy="82" r="2.2" style="fill:var(--c-center-dark,#D9C05C)"/>',

    // Stage 3: Full open lotus -- 3 clean layers (3 back / 4 middle /
    // 4 front = 11 petals total), each a sharp-tipped vesica split into
    // a light/dark half, fanned from one shared base joint so petals
    // stay clearly separated instead of bleeding together. Own stem +
    // 2 leaves, pink/green palette (no purple).
    '<ellipse cx="40" cy="121" rx="24" ry="5.5" style="fill:var(--c-shadow,rgba(40,100,50,0.32))"/>' +
    '<ellipse cx="40" cy="119" rx="22" ry="6" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<ellipse cx="40" cy="117" rx="20" ry="5" style="fill:var(--c-pad,#3A8A4A)"/>' +
    '<ellipse cx="22" cy="120" rx="11" ry="3.5" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<ellipse cx="58" cy="120" rx="11" ry="3.5" style="fill:var(--c-pad,#4A9A5A)"/>' +
    '<g transform="translate(8.5,36) scale(0.21)">' +
    '<path d="M158.6,273.9 C180.8,235.9 234.0,226.3 263.8,249.6 L158.6,273.9 Z" style="fill:var(--c-leaf-dark,#40965D)"/>' +
    '<path d="M158.6,273.9 C195.2,298.3 247.3,283.6 263.8,249.6 L158.6,273.9 Z" style="fill:var(--c-leaf,#64B47F)"/>' +
    '<path d="M166.5,330.7 C139.8,357.8 93.9,354.0 74.6,327.5 L166.5,330.7 Z" style="fill:var(--c-leaf-light,#87C59B)"/>' +
    '<path d="M166.5,330.7 C141.8,301.9 95.7,302.5 74.6,327.5 L166.5,330.7 Z" style="fill:var(--c-leaf,#64B47F)"/>' +
    '<path d="M150.0,213.0 C160.6,223.9 173.9,323.5 178.5,416.0 L150.0,213.0 Z" style="fill:var(--c-leaf-dark,#40965D)"/>' +
    '<path d="M150.0,213.0 C142.8,226.4 157.5,325.8 178.5,416.0 L150.0,213.0 Z" style="fill:var(--c-leaf,#64B47F)"/>' +
    '<path d="M150.0,213.0 C87.4,172.6 44.9,93.5 52.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner,#DA4E65)"/>' +
    '<path d="M150.0,213.0 C146.3,138.6 99.1,62.3 52.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner-light,#D77585)"/>' +
    '<path d="M150.0,213.0 C116.0,146.7 118.7,57.0 150.0,18.0 L150.0,213.0 Z" style="fill:var(--c-petal-inner,#DA4E65)"/>' +
    '<path d="M150.0,213.0 C184.0,146.7 181.3,57.0 150.0,18.0 L150.0,213.0 Z" style="fill:var(--c-petal-inner-light,#D77585)"/>' +
    '<path d="M150.0,213.0 C153.7,138.6 200.9,62.3 247.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner,#DA4E65)"/>' +
    '<path d="M150.0,213.0 C212.6,172.6 255.1,93.5 247.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner-light,#D77585)"/>' +
    '<path d="M150.0,213.0 C83.4,210.3 22.9,164.4 14.8,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C124.7,151.3 60.9,110.2 14.8,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C98.4,170.8 77.7,97.7 99.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C166.9,148.5 140.7,77.2 99.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C133.1,148.5 159.3,77.2 201.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C201.6,170.8 222.3,97.7 201.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C175.3,151.3 239.1,110.2 285.2,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C216.6,210.3 277.1,164.4 285.2,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C100.2,201.2 68.3,156.3 73.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M150.0,213.0 C150.6,161.8 114.7,120.0 73.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M150.0,213.0 C149.4,161.8 185.3,120.0 227.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M150.0,213.0 C199.8,201.2 231.7,156.3 227.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '</g>'
  ],

 // ---- LAVENDER (Sleep) — flat pastel rebuild ----
  // Rebuilt against the reference illustration: a spike of clean,
  // clearly separated whorls instead of a dense pile of buds.
  //
  // Rules this entry follows:
  //   * flat fills only — no strokes, no gradients, no fill-opacity on
  //     any part of the plant (the ground shadow is the one exception,
  //     since it sits on the soil, not on the flower);
  //   * three petals per whorl only — a left and a right bract that fan
  //     outward, and one upright centre bract laid over their bases —
  //     so nothing crowds and no shape is hidden behind another;
  //   * tones alternate like a checkerboard: the centre petal always
  //     takes the opposite tone from its own row's side petals, and
  //     each row flips, so touching shapes always read apart without an
  //     outline;
  //   * a solid deep-lilac head mass sits behind the whorls, so the
  //     wedges between petals read as shade, never as background;
  //   * every shape carries a class hook (petal-dark, petal-light,
  //     calyx, foliage, shadow) as well as a palette variable, so the
  //     plant can be recoloured from CSS classes or from the garden's
  //     --c-* tokens.
  //
  // Each whorl is a bezier bract (a broad, rounded teardrop tapering to
  // its attachment point) sat on an olive calyx cup that stays visible
  // between rows. Whorls tighten and shrink toward the tip, so the head
  // is a full, tapering plume that dominates the plant's silhouette by
  // the final stage. Stem and lance-shaped leaves are tapered bezier
  // paths in sage.
  //
  // Palette hooks (all with pastel fallbacks): --c-bud, --c-bud-shade,
  // --c-bud-pale, --c-calyx, --c-stem, --c-stem-light, --c-shadow.
  sleep: (function () {
    var LAV_MAIN   = 'var(--c-bud,#8A72C8)';
    var LAV_PALE   = 'var(--c-bud-pale,#C7B6EC)';
    var LAV_DEEP   = 'var(--c-bud-shade,#6A55A6)';
    var CALYX_C    = 'var(--c-calyx,#9FA07A)';
    var SAGE       = 'var(--c-stem,#6EA98B)';
    var SAGE_LIGHT = 'var(--c-stem-light,#93C6A8)';
    var SHADOW     = 'var(--c-shadow,rgba(0,0,0,0.12))';

    // bract + calyx geometry, drawn from the attachment point (0,0) up
    var BRACT = 'M0,0C-3.7,-2.0 -5.8,-4.9 -5.8,-8.7C-5.8,-12.5 -3.2,-15.2 0,-15.2C3.2,-15.2 5.8,-12.5 5.8,-8.7C5.8,-4.9 3.7,-2.0 0,0Z';
    var CALYX = 'M0,0C-3.6,-0.3 -5.5,-2.5 -5.1,-5.1C-2.8,-4.3 -0.9,-4.1 0,-4.1C0.9,-4.1 2.8,-4.3 5.1,-5.1C5.5,-2.5 3.6,-0.3 0,0Z';

    function place(cx, cy, rot, s) {
      return '<g transform="translate(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ') rotate(' + rot + ') scale(' + s.toFixed(3) + ')">';
    }
    function bud(cx, cy, rot, s, fill, cls) {
      return place(cx, cy, rot, s) +
        '<path class="' + cls + '" d="' + BRACT + '" style="fill:' + fill + '"/></g>';
    }
    function budCalyx(cx, cy, s) {
      return place(cx, cy, 0, s) +
        '<path class="calyx" d="' + CALYX + '" style="fill:' + CALYX_C + '"/></g>';
    }

    // catmull-rom -> cubic, for organic closed outlines (no ellipses)
    function smoothClosed(pts) {
      var n = pts.length, d = 'M' + pts[0][0].toFixed(2) + ',' + pts[0][1].toFixed(2);
      for (var i = 0; i < n; i++) {
        var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += 'C' + c1[0].toFixed(2) + ',' + c1[1].toFixed(2) + ' ' + c2[0].toFixed(2) + ',' + c2[1].toFixed(2) +
             ' ' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2);
      }
      return d + 'Z';
    }
    // solid backing plate: sits inside the petal envelope, so the small
    // wedges between bracts read as depth instead of holes
    function headMass(rows) {
      var left = [], right = [], i, r, w;
      for (i = 0; i < rows.length; i++) {
        r = rows[i];
        w = r[1] + 3.1 * r[2];
        left.push([40 - w, r[0] - 5.6 * r[2]]);
        right.unshift([40 + w, r[0] - 5.6 * r[2]]);
      }
      var top = rows[rows.length - 1];
      var pts = left.concat([[40, top[0] - 12.4 * top[2]]], right, [[40, rows[0][0] + 1.4]]);
      return '<path class="petal-dark" d="' + smoothClosed(pts) + '" style="fill:' + LAV_DEEP + '"/>';
    }
    // phase flips the two tones row to row so neighbours never match
    function budWhorl(cy, spread, s, phase) {
      var sideC   = phase ? LAV_PALE : LAV_MAIN;
      var sideCls = phase ? 'petal-light' : 'petal-dark';
      var midC    = phase ? LAV_MAIN : LAV_PALE;
      var midCls  = phase ? 'petal-dark' : 'petal-light';
      return bud(40 - spread, cy + 2.0, -40, s * 0.90, sideC, sideCls) +
        bud(40 + spread, cy + 2.0,  40, s * 0.90, sideC, sideCls) +
        budCalyx(40, cy + 4.6, s) +
        bud(40, cy - 1.0, 0, s, midC, midCls);
    }
    // rows: [cy, spread, scale], bottom row first
    function spike(rows) {
      var out = headMass(rows);
      for (var i = 0; i < rows.length; i++) out += budWhorl(rows[i][0], rows[i][1], rows[i][2], i % 2);
      return out;
    }
    function leafShape(x, y, rot, l, w) {
      var d = 'M0,0C' + (w * 0.95).toFixed(2) + ',' + (-l * 0.30).toFixed(2) + ' ' + (w * 0.72).toFixed(2) + ',' +
        (-l * 0.74).toFixed(2) + ' 0,' + (-l).toFixed(2) + 'C' + (-w * 0.66).toFixed(2) + ',' + (-l * 0.72).toFixed(2) +
        ' ' + (-w * 0.88).toFixed(2) + ',' + (-l * 0.28).toFixed(2) + ' 0,0Z';
      var rib = 'M0,' + (-l * 0.08).toFixed(2) + 'C' + (w * 0.13).toFixed(2) + ',' + (-l * 0.38).toFixed(2) + ' ' +
        (w * 0.11).toFixed(2) + ',' + (-l * 0.68).toFixed(2) + ' 0,' + (-l * 0.92).toFixed(2) + 'C' +
        (-w * 0.02).toFixed(2) + ',' + (-l * 0.66).toFixed(2) + ' ' + (-w * 0.03).toFixed(2) + ',' +
        (-l * 0.36).toFixed(2) + ' 0,' + (-l * 0.08).toFixed(2) + 'Z';
      return '<g transform="translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ') rotate(' + rot + ')">' +
        '<path class="foliage" d="' + d + '" style="fill:' + SAGE + '"/>' +
        '<path class="foliage" d="' + rib + '" style="fill:' + SAGE_LIGHT + '"/></g>';
    }
    function stemShape(top, b, t) {
      var mid = 122 - (122 - top) * 0.45, up = top + (122 - top) * 0.3;
      return '<path class="foliage" d="M' + (40 - b).toFixed(2) + ',122C' + (40 - b * 0.9).toFixed(2) + ',' + mid.toFixed(2) + ' ' +
        (40 - t * 1.3).toFixed(2) + ',' + up.toFixed(2) + ' ' + (40 - t).toFixed(2) + ',' + top.toFixed(2) +
        'L' + (40 + t).toFixed(2) + ',' + top.toFixed(2) + 'C' + (40 + t * 1.3).toFixed(2) + ',' + up.toFixed(2) + ' ' +
        (40 + b * 0.9).toFixed(2) + ',' + mid.toFixed(2) + ' ' + (40 + b).toFixed(2) + ',122Z" style="fill:' + SAGE + '"/>' +
        '<path class="foliage" d="M' + (40 - b * 0.38).toFixed(2) + ',122C' + (40 - b * 0.32).toFixed(2) + ',' + mid.toFixed(2) + ' ' +
        (40 - t * 0.45).toFixed(2) + ',' + up.toFixed(2) + ' ' + (40 - t * 0.28).toFixed(2) + ',' + top.toFixed(2) +
        'L' + (40 + t * 0.08).toFixed(2) + ',' + top.toFixed(2) + 'C' + (40 + t * 0.18).toFixed(2) + ',' + up.toFixed(2) + ' ' +
        (40 + b * 0.04).toFixed(2) + ',' + mid.toFixed(2) + ' ' + (40 + b * 0.08).toFixed(2) + ',122Z" style="fill:' + SAGE_LIGHT + '"/>';
    }
    function ground(rx, ry) {
      return '<path class="shadow" d="' + smoothClosed([[40 - rx, 122], [40, 122 - ry], [40 + rx, 122], [40, 122 + ry]]) +
        '" style="fill:' + SHADOW + '"/>';
    }

    return [
      // Stage 0: sprout — two seed leaves and a pair of small whorls
      ground(9, 2.4) + stemShape(103, 1.5, 0.9) +
        leafShape(38.40, 113.00, -36, 12.0, 4.2) + leafShape(41.60, 111.00, 34, 11.0, 4.0) +
        spike([[104.0, 2.94, 0.450], [99.6, 2.30, 0.360]]),

      // Stage 1: young spike — four whorls, the head still slim
      ground(12, 3.0) + stemShape(86, 1.8, 1.0) +
        leafShape(38.20, 115.00, -34, 20.0, 5.4) + leafShape(41.80, 112.00, 32, 18.0, 5.0) +
        spike([[100.0, 3.84, 0.580], [94.2, 3.71, 0.550], [88.8, 3.33, 0.490], [84.0, 2.69, 0.400]]),

      // Stage 2: filling out — the spike broadens at the shoulder, then tapers
      ground(16, 3.6) + stemShape(67, 2.1, 1.1) +
        leafShape(37.90, 116.00, -33, 30.0, 6.8) + leafShape(42.10, 113.00, 31, 27.0, 6.3) +
        spike([[101.0, 5.12, 0.780], [93.7, 4.99, 0.750], [86.7, 4.67, 0.700], [80.1, 4.22, 0.620],
               [74.3, 3.71, 0.530], [69.3, 3.07, 0.430], [65.3, 2.43, 0.340]]),

      // Stage 3: full plant — eight whorls; the flower head dominates
      // the plant's overall height
      ground(21, 4.6) + stemShape(48, 2.5, 1.1) +
        leafShape(37.40, 117.00, -33, 40.0, 7.6) + leafShape(42.60, 114.00, 31, 37.0, 7.2) +
        spike([[103.0, 6.27, 0.950], [94.1, 6.14, 0.930], [85.4, 5.89, 0.890], [77.0, 5.57, 0.840],
               [69.1, 5.12, 0.780], [61.8, 4.61, 0.700], [55.2, 4.03, 0.610], [49.5, 3.33, 0.500]])
    ];
  }()),

  // ---- BAMBOO (Chores) ----
  // Rebuilt from the reference illustration: ONE culm at every stage,
  // grown from real tapering internode segments (not stacked rects),
  // banded by slightly-overhanging tan node collars, and every leaf
  // is grown off a drawn twig so nothing floats detached. Palette is
  // medium pastel green — soft, never neon.
  chores: (function () {

    var LEAF_L = 'var(--c-leaf-light,#C6E4A2)';
    var LEAF_M = 'var(--c-leaf,#96CC72)';
    var LEAF_D = 'var(--c-leaf-dark,#6BA854)';

    function n(v) { return Math.round(v * 100) / 100; }

    // ---- one lance-shaped leaf -------------------------------------
    // The base sits exactly at (x,y) — always a point on a twig — and
    // the blade tapers to a real point. Two-tone: the lower half is
    // repainted one step darker so the midrib reads as a crease,
    // like the reference art, instead of a flat ellipse.
    function leaf(x, y, ang, L, W, top, under) {
      return (
        '<g transform="translate(' + n(x) + ',' + n(y) + ') rotate(' + n(ang) + ')">' +
          '<path d="M0,0C' + n(L * 0.20) + ',' + n(-W) + ' ' + n(L * 0.66) + ',' + n(-W * 0.74) + ' ' + n(L) + ',0' +
            'C' + n(L * 0.66) + ',' + n(W * 0.74) + ' ' + n(L * 0.20) + ',' + n(W) + ' 0,0Z"' +
            ' style="fill:' + top + '"/>' +
          '<path d="M0,0C' + n(L * 0.20) + ',' + n(W) + ' ' + n(L * 0.66) + ',' + n(W * 0.74) + ' ' + n(L) + ',0Z"' +
            ' style="fill:' + under + '"/>' +
          '<path d="M' + n(L * 0.06) + ',0L' + n(L * 0.88) + ',0" fill="none"' +
            ' style="stroke:' + LEAF_L + '" stroke-width="0.35" opacity="0.45"/>' +
        '</g>'
      );
    }

    // ---- a twig with its leaves attached ---------------------------
    // Drawn right-facing in local space, then mirrored with
    // scale(-1,1) for the left side so both sides are built the same
    // way. Every leaf base is pinned to a point ON the twig curve.
    // `pale` swaps the cluster to the lighter pair, which is how the
    // canopy gets depth without extra outlines.
    function spray(x, y, dir, s, pale) {
      var top   = pale ? LEAF_L : LEAF_M;
      var under = pale ? LEAF_M : LEAF_D;

      return (
        '<g transform="translate(' + n(x) + ',' + n(y) + ') scale(' + n(dir * s) + ',' + n(s) + ')">' +
          '<path d="M0,0Q7,-2.5 13.5,-8" fill="none"' +
            ' style="stroke:var(--c-culm-mid,#74AC55)" stroke-width="1.2" stroke-linecap="round"/>' +
          '<path d="M6.5,-2.6Q9,-5.5 10.2,-9.6" fill="none"' +
            ' style="stroke:var(--c-culm-mid,#74AC55)" stroke-width="0.9" stroke-linecap="round"/>' +
          leaf(6.5, -2.6, 26, 14, 3.8, LEAF_M, LEAF_D) +
          leaf(10.2, -9.6, -72, 15.5, 4.1, top, under) +
          leaf(13.5, -8, -38, 18, 4.7, under, LEAF_D) +
          leaf(13.5, -8, -4, 19.5, 5, top, under) +
        '</g>'
      );
    }

    // ---- the crown tuft at the very tip ----------------------------
    function crown(x, y, s) {
      return (
        '<g transform="translate(' + n(x) + ',' + n(y) + ') scale(' + n(s) + ')">' +
          '<path d="M0,0L-1.5,-5" fill="none" style="stroke:var(--c-culm-mid,#74AC55)"' +
            ' stroke-width="1" stroke-linecap="round"/>' +
          leaf(0, -0.5, -62, 15, 4, LEAF_M, LEAF_D) +
          leaf(-1.5, -5, -96, 16.5, 4.2, LEAF_L, LEAF_M) +
          leaf(0, -1, -126, 14, 3.8, LEAF_M, LEAF_D) +
        '</g>'
      );
    }

    // ---- the culm --------------------------------------------------
    // Internodes are individual segments that narrow as they rise, so
    // the stalk actually tapers and carries a lit/shaded side rather
    // than reading as one flat bar. `ys` lists node heights from the
    // ground up; the last entry is the top of the stalk, which gets a
    // rounded cap.
    function culm(cx, baseY, ys, wB, wT) {
      var span = baseY - ys[ys.length - 1];
      function hw(y) { return wB + (wT - wB) * ((baseY - y) / span); }

      var out = '';

      for (var i = 0; i < ys.length; i++) {
        var y0 = (i === 0) ? baseY : ys[i - 1];
        var y1 = ys[i];
        var w0 = hw(y0);
        var w1 = hw(y1);
        var capped = (i === ys.length - 1);
        var lift = capped ? 1.4 : 0;
        var top = capped
          ? 'L' + n(cx - w1) + ',' + n(y1 + 1.6) + 'Q' + n(cx - w1) + ',' + n(y1 - 0.5) + ' ' + n(cx) + ',' + n(y1 - 0.7) +
            'Q' + n(cx + w1) + ',' + n(y1 - 0.5) + ' ' + n(cx + w1) + ',' + n(y1 + 1.6)
          : 'L' + n(cx - w1) + ',' + n(y1) + 'L' + n(cx + w1) + ',' + n(y1);

        out +=
          '<path d="M' + n(cx - w0) + ',' + n(y0) + top + 'L' + n(cx + w0) + ',' + n(y0) + 'Z"' +
            ' style="fill:var(--c-culm,#93C86E)"/>' +
          '<path d="M' + n(cx - w0) + ',' + n(y0) + 'L' + n(cx - w1) + ',' + n(y1 + lift) +
            'L' + n(cx - w1 * 0.42) + ',' + n(y1 + lift) + 'L' + n(cx - w0 * 0.46) + ',' + n(y0) + 'Z"' +
            ' style="fill:var(--c-culm-light,#B7DC92)"/>' +
          '<path d="M' + n(cx + w0 * 0.5) + ',' + n(y0) + 'L' + n(cx + w1 * 0.48) + ',' + n(y1 + lift) +
            'L' + n(cx + w1) + ',' + n(y1 + lift) + 'L' + n(cx + w0) + ',' + n(y0) + 'Z"' +
            ' style="fill:var(--c-culm-mid,#74AC55)"/>';
      }

      for (var j = 0; j < ys.length - 1; j++) {
        var ny = ys[j];
        var w  = hw(ny);
        out +=
          // each internode darkens slightly toward its base, the way
          // the reference art shades its segments
          '<path d="M' + n(cx - w) + ',' + n(ny) + 'L' + n(cx + w) + ',' + n(ny) +
            'L' + n(cx + w) + ',' + n(ny - 4.5) + 'Q' + n(cx) + ',' + n(ny - 2.6) + ' ' + n(cx - w) + ',' + n(ny - 4.5) + 'Z"' +
            ' style="fill:var(--c-culm-mid,#74AC55)" opacity="0.35"/>' +
          '<path d="M' + n(cx - w - 0.9) + ',' + n(ny + 2.3) +
            'Q' + n(cx) + ',' + n(ny + 3.1) + ' ' + n(cx + w + 0.9) + ',' + n(ny + 2.3) +
            'L' + n(cx + w + 0.5) + ',' + n(ny - 0.7) +
            'Q' + n(cx) + ',' + n(ny - 1.4) + ' ' + n(cx - w - 0.5) + ',' + n(ny - 0.7) + 'Z"' +
            ' style="fill:var(--c-node,#B79A6A)"/>' +
          '<path d="M' + n(cx - w - 0.85) + ',' + n(ny + 2.3) +
            'Q' + n(cx) + ',' + n(ny + 3.1) + ' ' + n(cx + w + 0.85) + ',' + n(ny + 2.3) + '" fill="none"' +
            ' style="stroke:var(--c-node-dark,#94764A)" stroke-width="0.85" stroke-linecap="round"/>';
      }

      return out;
    }

    function ground(rx, ry, alpha) {
      return '<ellipse cx="40" cy="121.5" rx="' + rx + '" ry="' + ry + '"' +
             ' style="fill:var(--c-shadow,rgba(0,0,0,' + alpha + '))"/>';
    }

    return [
      // Stage 0: a sprouting shoot — overlapping pointed sheaths still
      // wrapped shut, first tan node ring showing at the soil line.
      ground(9, 2.4, 0.1) +
      '<path d="M35.2,121C34.4,113 35.7,105.8 40,99.6C44.3,105.8 45.6,113 44.8,121Z"' +
        ' style="fill:var(--c-culm,#93C86E)"/>' +
      '<path d="M35.2,121C34.4,113 35.7,105.8 40,99.6L40,121Z"' +
        ' style="fill:var(--c-culm-light,#B7DC92)"/>' +
      '<path d="M36,121C32.8,116.2 31.9,110.6 33.5,106C36.2,110 37.5,115.7 37.8,121Z"' +
        ' style="fill:var(--c-culm-mid,#74AC55)"/>' +
      '<path d="M44,121C46.9,116.6 47.7,111.8 46.4,107.8C43.9,111.4 42.6,116.2 42.3,121Z"' +
        ' style="fill:var(--c-culm-mid,#74AC55)"/>' +
      '<path d="M40,104.2C41.6,108 42.2,113.4 41.8,121L38.2,121C37.8,113.4 38.4,108 40,104.2Z"' +
        ' style="fill:var(--c-leaf,#96CC72)" opacity="0.55"/>' +
      '<path d="M34.8,117.6Q40,116.5 45.2,117.6L44.9,114.6Q40,113.6 35.1,114.6Z"' +
        ' style="fill:var(--c-node,#B79A6A)"/>' +
      '<path d="M34.8,117.6Q40,116.5 45.2,117.6" fill="none"' +
        ' style="stroke:var(--c-node-dark,#94764A)" stroke-width="0.85" stroke-linecap="round"/>',

      // Stage 1: first real culm — three internodes, a twig each side
      // and a small crown tuft.
      ground(11, 2.9, 0.11) +
      culm(40, 121, [109, 98, 88], 4.4, 3.6) +
      spray(43.9, 106.5,  1, 0.6,  false) +
      spray(36.1,  96,   -1, 0.72, true) +
      crown(40, 88, 0.7),

      // Stage 2: taller single culm, five internodes, alternating twigs.
      ground(14, 3.4, 0.13) +
      culm(40, 121, [110, 98, 86, 74, 62], 5, 3.8) +
      spray(44.5, 107,  1, 0.62, false) +
      spray(35.5,  95, -1, 0.76, true) +
      spray(44.2,  83,  1, 0.86, false) +
      spray(35.8,  71, -1, 0.8,  true) +
      crown(40, 62, 0.88),

      // Stage 3: mature culm — seven internodes, bare at the base like
      // the reference, full alternating canopy up top.
      ground(17, 4, 0.15) +
      culm(40, 121, [110, 98, 86, 74, 62, 50, 38], 5.6, 4) +
      spray(45.1,  95,  1, 0.68, false) +
      spray(34.9,  83, -1, 0.8,  true) +
      spray(44.8,  71,  1, 0.92, false) +
      spray(35.2,  59, -1, 0.98, true) +
      spray(44.5,  47,  1, 0.9,  false) +
      spray(35.5,  40, -1, 0.72, true) +
      crown(40, 38, 1)
    ];
  }()),

  // ---- CLOVER (Finance) — pointed-heart leaflets, no circle "blobbiness" ----
  // Each leaflet is a single closed heart path (tip toward the hub, notch at
  // the outer tip) instead of overlapping circles, so the clover actually
  // comes to a point at each lobe. Two half-heart fills (split down the
  // center) give the two-tone shading; a duplicated, slightly offset dark
  // copy underneath adds a soft cast shadow instead of a flat outline.
  // Palette: #0F291E (deep shade) · #274F3C / #3E6B54 / #5C8267 (mid greens)
  // #8A9A86 (soft highlight) · #E5A93C (ochre accent) · #F5F0EB (cream vein line)
  finance: [
    // Stage 0: seed — two-tone capsule, no vein/accent clutter
    '<ellipse cx="40" cy="121" rx="8" ry="2.5" style="fill:var(--c-shadow,rgba(0,0,0,0.11))"/>' +
    '<ellipse cx="40" cy="115" rx="4.6" ry="6.2" style="fill:var(--c-outline,#0F291E)"/>' +
    '<ellipse cx="38.6" cy="113.6" rx="2.5" ry="4.3" style="fill:var(--c-leaf-mid,#3E6B54)" opacity="0.88"/>',

    // Stage 1: single sprouting heart-leaflet, tilted off-axis — one plant,
    // one stem, one leaflet.
    '<ellipse cx="39" cy="122" rx="12" ry="3.2" style="fill:var(--c-shadow,rgba(0,0,0,0.12))"/>' +
    '<path d="M40,122 C39.3,112 39.7,101 41.4,94" style="stroke:var(--c-outline,#0F291E)" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(41.4,94) rotate(-10) scale(0.72)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>',

    // Stage 2: three-leaflet clover — a SINGLE stem rising to one hub point,
    // with all three leaflets fanning out from that same hub, so it still
    // reads as one plant (not three separate sprouts growing side by side).
    '<ellipse cx="40" cy="122" rx="20" ry="4.6" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/>' +
    '<path d="M40,122 C39.6,110 39.8,98 40,88" style="stroke:var(--c-outline,#0F291E)" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(40,88) rotate(-16) scale(0.74)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>' +
    '<g transform="translate(40,88) rotate(6) scale(0.9)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.42"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-mid,#3E6B54)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<ellipse cx="-5.5" cy="-16" rx="5.8" ry="9.2" style="fill:var(--c-sheen,#8A9A86)" opacity="0.28"/>' +
    '</g>' +
    '<g transform="translate(40,88) rotate(20) scale(0.68)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>' +
    '<circle cx="25" cy="70" r="0.8" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.08"/>' +
    '<circle cx="55" cy="66" r="0.9" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.08"/>',

    // Stage 3: full lucky four-leaf clover — one stem to one hub, four
    // pointed hearts fanning around it at off-angle rotations and scales
    // so no two lobes are identical. Still a single plant.
    '<ellipse cx="40" cy="122" rx="27" ry="6" style="fill:var(--c-shadow,rgba(0,0,0,0.17))"/>' +
    '<path d="M40,122 C39.2,105 39.6,86 40,68" style="stroke:var(--c-outline,#0F291E)" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(40,66) rotate(-6) scale(1.14)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.8" cy="-16.5" rx="6.4" ry="10" style="fill:var(--c-sheen,#8A9A86)" opacity="0.34"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(89) scale(0.96)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-mid,#3E6B54)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<ellipse cx="-5.6" cy="-16.5" rx="6.2" ry="9.7" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(182) scale(1.04)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.6" cy="-16.5" rx="6.3" ry="9.7" style="fill:var(--c-sheen,#8A9A86)" opacity="0.32"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(273) scale(1.09)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-mid,#3E6B54)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<ellipse cx="-5.9" cy="-16.5" rx="6.6" ry="10.2" style="fill:var(--c-sheen,#8A9A86)" opacity="0.35"/>' +
    '</g>' +
    '<circle cx="22" cy="80" r="0.8" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.07"/>' +
    '<circle cx="58" cy="78" r="0.9" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.07"/>' +
    '<circle cx="40" cy="45" r="0.8" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.08"/>'
  ],

  // ---- MUSHROOM (Misc) ----
  // Modelled on the flat-illustration reference: a broad, slightly
  // off-centre cap over a swollen tapering stalk, with soft apricot
  // gill tabs tucked under the rim. No outlines anywhere — the cap's
  // shading is cut along its own silhouette (the outline curves are
  // split with de Casteljau) so the dark side can never spill past
  // the edge, and the speckles are hand-wobbled paths rather than
  // circles. Palette is one step softer than the reference: coral
  // instead of pillarbox red, cream instead of white.
  misc: (function () {

    var CAP_L  = 'var(--c-cap-light,#F0967F)';
    var CAP_M  = 'var(--c-cap,#E4715E)';
    var CAP_D  = 'var(--c-cap-dark,#C4574A)';
    var SPOT   = 'var(--c-spot,#F7E9DE)';
    var STEM_L = 'var(--c-stem-light,#F2DECE)';
    var STEM_M = 'var(--c-stem,#E0C0AB)';
    var STEM_D = 'var(--c-stem-dark,#C39C86)';

    function n(v) { return Math.round(v * 100) / 100; }

    // ---- cubic helpers ---------------------------------------------
    function lerpPt(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

    // de Casteljau split: returns { a: [4 pts before t], b: [4 pts after t] }
    function splitCubic(p, t) {
      var q0 = lerpPt(p[0], p[1], t), q1 = lerpPt(p[1], p[2], t), q2 = lerpPt(p[2], p[3], t);
      var r0 = lerpPt(q0, q1, t), r1 = lerpPt(q1, q2, t);
      var s  = lerpPt(r0, r1, t);
      return { a: [p[0], q0, r0, s], b: [s, r1, q2, p[3]] };
    }

    function C(c) { // "C x1,y1 x2,y2 x3,y3" from a 4-point cubic
      return 'C' + n(c[1][0]) + ',' + n(c[1][1]) + ' ' + n(c[2][0]) + ',' + n(c[2][1]) +
             ' ' + n(c[3][0]) + ',' + n(c[3][1]);
    }
    function M(p) { return 'M' + n(p[0]) + ',' + n(p[1]); }
    function L(p) { return 'L' + n(p[0]) + ',' + n(p[1]); }

    // ---- an off-round cream speckle --------------------------------
    // Deliberately not a circle: each quadrant gets its own radius so
    // the spot reads as hand-painted rather than stamped.
    function spot(cx, cy, r, wob) {
      var k = 0.5523 * r;
      var a = 1 + (wob || 0) * 0.12, b = 1 - (wob || 0) * 0.09;
      return '<path d="M' + n(cx - r * a) + ',' + n(cy + r * 0.06) +
        'C' + n(cx - r * a) + ',' + n(cy + r * 0.06 - k * 1.02) + ' ' + n(cx - k * 0.9) + ',' + n(cy - r * b) + ' ' + n(cx + r * 0.05) + ',' + n(cy - r * b) +
        'C' + n(cx + k * 0.96) + ',' + n(cy - r * b) + ' ' + n(cx + r) + ',' + n(cy - k * 0.86) + ' ' + n(cx + r) + ',' + n(cy + r * 0.04) +
        'C' + n(cx + r) + ',' + n(cy + k * 1.0) + ' ' + n(cx + k * 0.88) + ',' + n(cy + r * 1.02) + ' ' + n(cx - r * 0.04) + ',' + n(cy + r * 1.02) +
        'C' + n(cx - k * 1.02) + ',' + n(cy + r * 1.02) + ' ' + n(cx - r * a) + ',' + n(cy + k * 0.94) + ' ' + n(cx - r * a) + ',' + n(cy + r * 0.06) + 'Z"' +
        ' style="fill:' + SPOT + '"/>';
    }

    // ---- the cap ----------------------------------------------------
    // Built from two mirrored cubics meeting at the apex with a gently
    // sagging underside. The shading is cut along the real outline
    // (split with de Casteljau) so the dark side can never bleed past
    // the silhouette — no stroke needed anywhere.
    function cap(cx, rimY, hw, h) {
      var Lp = [cx - hw, rimY];
      var Rp = [cx + hw, rimY];
      var ax = cx - hw * 0.06;              // apex sits a little left of centre
      var Ap = [ax, rimY - h];

      var left  = [Lp, [cx - hw + hw * 0.031, rimY - h * 0.55], [ax - hw * 0.52, rimY - h], Ap];
      var right = [Ap, [ax + hw * 0.60, rimY - h], [cx + hw * 0.97, rimY - h * 0.58], Rp];
      var bottomQ = 'Q' + n(cx) + ',' + n(rimY + hw * 0.203) + ' ' + n(cx - hw) + ',' + n(rimY);

      var body =
        '<path d="' + M(Lp) + C(left) + C(right) + bottomQ + 'Z" style="fill:' + CAP_M + '"/>';

      // shaded lower-left, cut on a diagonal across the cap face
      var lHalf = splitCubic(left, 0.5).a;
      var rTail = splitCubic(right, 0.85).b;
      var shade =
        '<path d="' + M(Lp) + C(lHalf) + L(rTail[0]) + C(rTail) + bottomQ + 'Z"' +
        ' style="fill:' + CAP_D + '"/>';

      // lit sliver riding the top-right rim
      var rHead = splitCubic(right, 0.5).a;
      var Hp = rHead[3];
      var lit =
        '<path d="' + M(Ap) + C(rHead) +
        'C' + n(Hp[0] - hw * 0.30) + ',' + n(Hp[1] - h * 0.10) + ' ' +
              n(Ap[0] + hw * 0.18) + ',' + n(Ap[1] + h * 0.16) + ' ' + n(Ap[0]) + ',' + n(Ap[1]) + 'Z"' +
        ' style="fill:' + CAP_L + '"/>';

      return body + shade + lit;
    }

    // ---- the stalk --------------------------------------------------
    // One closed silhouette that swells toward the soil, then a lit
    // right face and a shaded left crescent laid inside it.
    function stalk(cx, topY, groundY, tw, bw) {
      var H  = groundY - topY;
      var y1 = topY + H * 0.295, y2 = topY + H * 0.526,
          y3 = topY + H * 0.737, y4 = topY + H * 0.916;

      var outline =
        'M' + n(cx - tw) + ',' + n(topY) +
        'C' + n(cx - tw - bw * 0.08) + ',' + n(y1) + ' ' + n(cx - bw * 0.92) + ',' + n(y2) + ' ' + n(cx - bw) + ',' + n(y3) +
        'C' + n(cx - bw * 1.08) + ',' + n(y4) + ' ' + n(cx - bw * 0.65) + ',' + n(groundY) + ' ' + n(cx) + ',' + n(groundY) +
        'C' + n(cx + bw * 0.65) + ',' + n(groundY) + ' ' + n(cx + bw * 1.08) + ',' + n(y4) + ' ' + n(cx + bw) + ',' + n(y3) +
        'C' + n(cx + bw * 0.92) + ',' + n(y2) + ' ' + n(cx + tw + bw * 0.08) + ',' + n(y1) + ' ' + n(cx + tw) + ',' + n(topY) + 'Z';

      var litFace =
        'M' + n(cx) + ',' + n(topY) + 'L' + n(cx + tw) + ',' + n(topY) +
        'C' + n(cx + tw + bw * 0.08) + ',' + n(y1) + ' ' + n(cx + bw * 0.92) + ',' + n(y2) + ' ' + n(cx + bw) + ',' + n(y3) +
        'C' + n(cx + bw * 1.08) + ',' + n(y4) + ' ' + n(cx + bw * 0.65) + ',' + n(groundY) + ' ' + n(cx) + ',' + n(groundY) + 'Z';

      var shadeFace =
        'M' + n(cx - tw) + ',' + n(topY) +
        'C' + n(cx - tw - bw * 0.08) + ',' + n(y1) + ' ' + n(cx - bw * 0.92) + ',' + n(y2) + ' ' + n(cx - bw) + ',' + n(y3) +
        'C' + n(cx - bw * 1.08) + ',' + n(y4) + ' ' + n(cx - bw * 0.65) + ',' + n(groundY) + ' ' + n(cx) + ',' + n(groundY) +
        'C' + n(cx - bw * 0.42) + ',' + n(groundY - H * 0.02) + ' ' + n(cx - bw * 0.62) + ',' + n(y3) + ' ' + n(cx - tw * 0.45) + ',' + n(topY) + 'Z';

      return '<path d="' + outline + '" style="fill:' + STEM_M + '"/>' +
             '<path d="' + litFace + '" style="fill:' + STEM_L + '"/>' +
             '<path d="' + shadeFace + '" style="fill:' + STEM_D + '"/>';
    }

    function ground(rx, ry, alpha) {
      return '<ellipse cx="40" cy="121.5" rx="' + rx + '" ry="' + ry + '"' +
             ' style="fill:var(--c-shadow,rgba(0,0,0,' + alpha + '))"/>';
    }

    // spots placed in cap space: u across (-1..1 of half-width),
    // v up from the rim (0..1 of cap height), r as a share of half-width
    function speckles(cx, rimY, hw, h, list) {
      var out = '';
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        out += spot(cx + s[0] * hw, rimY - s[1] * h, s[2] * hw, s[3] || 0);
      }
      return out;
    }

    function shroom(cfg) {
      return ground(cfg.gr[0], cfg.gr[1], cfg.gr[2]) +
             stalk(40, cfg.rimY - cfg.h * 0.12, 121.5, cfg.tw, cfg.bw) +
             cap(40, cfg.rimY, cfg.hw, cfg.h) +
             speckles(40, cfg.rimY, cfg.hw, cfg.h, cfg.spots) +
             (cfg.stemSpot ? spot(cfg.stemSpot[0], cfg.stemSpot[1], cfg.stemSpot[2], 1) : '');
    }

    return [
      shroom({
        gr: [9, 2.4, 0.10], rimY: 118, hw: 9.4, h: 9.6, tw: 3.4, bw: 4.6,
        spots: [[-0.2, 0.5, 0.26, 1], [0.42, 0.24, 0.17, 0]],
      }),
      shroom({
        gr: [12, 3.0, 0.12], rimY: 106, hw: 15.5, h: 15.4, tw: 4, bw: 6.6,
        spots: [[-0.24, 0.46, 0.26, 1], [0.46, 0.62, 0.16, 0], [0.62, 0.2, 0.13, 1]],
      }),
      shroom({
        gr: [15, 3.6, 0.14], rimY: 92, hw: 23.5, h: 22.8, tw: 5, bw: 9.6,
        spots: [[-0.24, 0.47, 0.27, 1], [0.48, 0.6, 0.17, 0], [0.14, 0.84, 0.1, 1], [-0.76, 0.21, 0.13, 0]],
      }),
      shroom({
        gr: [19, 4.4, 0.16], rimY: 78, hw: 32, h: 30, tw: 6, bw: 13,
        spots: [[-0.22, 0.48, 0.28, 1], [0.5, 0.62, 0.17, 0], [0.13, 0.85, 0.1, 1],
                [-0.78, 0.22, 0.14, 0], [0.8, 0.2, 0.11, 1]],
        stemSpot: [45.5, 107, 3.4],
      }),
    ];
  }()),
};


// ============================================
// Plant skins
// ============================================
// A skin never redraws a plant. The art in PLANT_SVG_DATA above is
// authored once per species with every colour exposed as a CSS
// custom property (--c-leaf, --c-petal, --c-bark, …), each falling
// back to that plant's original colour. So a skin is only data:
//
//   vars    Token → colour. Whatever a skin leaves out keeps the
//           original colour, so a three-line skin is perfectly valid
//           and a broken/partial skin can never render an invisible
//           plant.
//   defs    Optional <linearGradient>/<radialGradient>/<pattern>
//           markup. A CSS variable is allowed to hold 'url(#id)',
//           which is how a skin swaps a flat fill for a gradient or
//           a texture without touching a single path. Give every id
//           a 'sk-<skinid>-' prefix so two skins can never collide.
//   extras  Optional small elements layered on top of the base art,
//           keyed by stage index, in the same "0 0 80 130" space.
//           Either a markup string or a function that receives that
//           stage's anchors (see PLANT_ANCHORS) so the same extra
//           can be written once and dropped on any species.
//   swatch  Three colours for the picker's little colour pip.
//
// Adding a new look means appending one object to the list for that
// species. No new art, no changes to any rendering code.
//
// Token reference, per species:
//   education    seed seed-dark stem stem-dark leaf leaf-dark bark
//                bark-dark canopy canopy-dark
//   exercise     seed seed-line stem leaf-light leaf leaf-dark petal
//                petal-dark disc disc-dark disc-seed
//   mindfulness  petal-outer(-light) petal-mid(-light)
//                petal-inner(-light) center center-dark leaf-light
//                leaf leaf-dark pad pad-dark
//   sleep        bud bud-shade bud-hilite stem stem-light
//   chores       culm-light culm culm-mid node node-dark leaf-light
//                leaf leaf-dark
//   finance      leaf leaf-mid leaf-dark outline sheen bloom
//   misc         cap-light cap cap-dark spot gill stem-light
//                stem stem-dark
// Every species also has --c-shadow for the ground shadow.
// ============================================

var SKIN_DEFAULT_ID = 'classic';

// Landmarks on each plant, per stage, in the art's own coordinate
// space: `canopy` is the middle of the leafy/flowering mass, `top`
// is roughly its highest point, `base` is where it meets the ground.
// Skin extras position themselves from these instead of hard-coding
// coordinates, so one extra works across every species and stage.
var PLANT_ANCHORS = {
  education: [
    { canopy: [40, 112], top: [40,  96], base: [40, 121] },
    { canopy: [40,  98], top: [40,  88], base: [40, 121] },
    { canopy: [40,  48], top: [40,  38], base: [40, 121] },
    { canopy: [40,  36], top: [40,  15], base: [40, 121] },
  ],
  exercise: [
    { canopy: [40, 113], top: [40, 106], base: [40, 121] },
    { canopy: [40,  93], top: [40,  87], base: [40, 121] },
    { canopy: [40,  76], top: [40,  54], base: [40, 121] },
    { canopy: [40,  58], top: [40,  27], base: [40, 121] },
  ],
  mindfulness: [
    { canopy: [40, 114], top: [40, 108], base: [40, 120] },
    { canopy: [40, 104], top: [40,  96], base: [40, 120] },
    { canopy: [40,  84], top: [40,  70], base: [40, 120] },
    { canopy: [40,  64], top: [40,  40], base: [40, 120] },
  ],
  sleep: [
    { canopy: [40, 107], top: [40, 100], base: [40, 121] },
    { canopy: [40,  92], top: [40,  82], base: [40, 121] },
    { canopy: [40,  76], top: [40,  63], base: [40, 121] },
    { canopy: [40,  50], top: [40,  25], base: [40, 121] },
  ],
  chores: [
    { canopy: [40, 110], top: [40, 100], base: [40, 121] },
    { canopy: [40,  96], top: [40,  76], base: [40, 121] },
    { canopy: [40,  80], top: [40,  48], base: [40, 121] },
    { canopy: [40,  62], top: [40,  22], base: [40, 121] },
  ],
  finance: [
    { canopy: [40, 113], top: [40, 108], base: [40, 121] },
    { canopy: [40,  94], top: [40,  72], base: [40, 121] },
    { canopy: [40,  88], top: [40,  62], base: [40, 121] },
    { canopy: [40,  66], top: [40,  30], base: [40, 121] },
  ],
  misc: [
    { canopy: [40, 113], top: [40, 108], base: [40, 121] },
    { canopy: [40,  98], top: [40,  91], base: [40, 121] },
    { canopy: [40,  81], top: [40,  69], base: [40, 121] },
    { canopy: [40,  63], top: [40,  48], base: [40, 121] },
  ],
};

function getPlantAnchors(catId, stageIndex) {
  var set = PLANT_ANCHORS[catId] || PLANT_ANCHORS.misc;
  return set[Math.max(0, Math.min(stageIndex, set.length - 1))];
}


// ---- Reusable bits for writing extras ----------------------------

function skinDot(x, y, r, colour, opacity) {
  return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r +
         '" fill="' + colour + '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/>';
}

// Four-point star — reads as a glint at any size.
function skinSparkle(x, y, r, colour, opacity) {
  var i = r * 0.28;
  return '<path d="M' + x + ',' + (y - r) +
         ' C' + x + ',' + (y - i) + ' ' + (x + i) + ',' + y + ' ' + (x + r) + ',' + y +
         ' C' + (x + i) + ',' + y + ' ' + x + ',' + (y + i) + ' ' + x + ',' + (y + r) +
         ' C' + x + ',' + (y + i) + ' ' + (x - i) + ',' + y + ' ' + (x - r) + ',' + y +
         ' C' + (x - i) + ',' + y + ' ' + x + ',' + (y - i) + ' ' + x + ',' + (y - r) + ' Z"' +
         ' fill="' + colour + '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/>';
}

// A single drifting leaf, used by the autumn skin.
function skinLeafMote(x, y, rot, s, colour, opacity) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + s + ')">' +
         '<path d="M0,0 C3.4,-1.6 5.6,-4.4 5.6,-7 C5.6,-9.6 3.4,-10.4 0,-8.6' +
         ' C-3.4,-10.4 -5.6,-9.6 -5.6,-7 C-5.6,-4.4 -3.4,-1.6 0,0 Z"' +
         ' fill="' + colour + '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/></g>';
}

// A flat ripple ring on the waterline, used by the lotus skin.
function skinRipple(x, y, rx, colour, opacity, width) {
  return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + (rx * 0.30).toFixed(1) +
         '" fill="none" stroke="' + colour + '" stroke-width="' + (width || 0.7) +
         '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/>';
}


// ---- The skins ---------------------------------------------------

var PLANT_SKINS = {

  education: [
    {
      id: 'classic',
      name: 'Heartwood',
      note: 'The oak as first grown.',
      swatch: ['hsl(61,45%,55%)', 'hsl(58,38%,42%)', 'hsl(9,33%,32%)'],
      vars: {},
    },
    {
      id: 'emberfall',
      name: 'Emberfall',
      note: 'Late-autumn canopy, always mid-drop.',
      swatch: ['#F0A93E', '#C2552A', '#5B3A2C'],
      defs:
        '<linearGradient id="sk-emberfall-canopy" x1="0" y1="0" x2="0.25" y2="1">' +
          '<stop offset="0" stop-color="#F5B84A"/>' +
          '<stop offset="0.55" stop-color="#E08A34"/>' +
          '<stop offset="1" stop-color="#C4552A"/>' +
        '</linearGradient>',
      vars: {
        '--c-canopy':      'url(#sk-emberfall-canopy)',
        '--c-canopy-dark': '#A8401F',
        '--c-bark':        '#6B4536',
        '--c-bark-dark':   '#46281F',
        '--c-leaf':        '#E4A455',
        '--c-leaf-dark':   '#BB6B2E',
        '--c-stem':        '#7A5235',
        '--c-stem-dark':   '#4E3221',
        '--c-seed':        '#DBA25D',
        '--c-seed-dark':   '#AF7335',
        '--c-shadow':      'rgba(58,22,6,0.20)',
      },
      extras: {
        2: function (a) {
          return skinLeafMote(a.canopy[0] - 15, a.canopy[1] + 14, -28, 0.5, '#D2622B', 0.85) +
                 skinLeafMote(a.canopy[0] + 16, a.canopy[1] + 22, 34, 0.42, '#E0873A', 0.7);
        },
        3: function (a) {
          return skinLeafMote(a.canopy[0] - 22, a.canopy[1] + 26, -24, 0.62, '#D2622B', 0.85) +
                 skinLeafMote(a.canopy[0] + 20, a.canopy[1] + 38, 40, 0.52, '#E0873A', 0.72) +
                 skinLeafMote(a.canopy[0] + 8,  a.canopy[1] + 56, -12, 0.44, '#C24C25', 0.6);
        },
      },
    },
  ],

  exercise: [
    {
      id: 'classic',
      name: 'Daybreak',
      note: 'The sunflower as first grown.',
      swatch: ['#F2B84B', '#E8A020', '#5C3A1A'],
      vars: {},
    },
    {
      id: 'moonpetal',
      name: 'Moonpetal',
      note: 'A night-blooming sunflower, silver instead of gold.',
      swatch: ['#F4F1FF', '#9FB4DE', '#2E3560'],
      defs:
        '<linearGradient id="sk-moonpetal-petal" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#B9C6EC"/>' +
          '<stop offset="1" stop-color="#FBF9FF"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal':      'url(#sk-moonpetal-petal)',
        '--c-petal-dark': '#9FB4DE',
        '--c-disc':       '#2E3560',
        '--c-disc-dark':  '#1B1F3C',
        '--c-disc-seed':  '#7A87C4',
        '--c-leaf-light': '#6E9C8E',
        '--c-leaf':       '#4E8377',
        '--c-leaf-dark':  '#3B6A62',
        '--c-stem':       '#3F6A5F',
        '--c-seed':       '#B9C3E8',
        '--c-seed-line':  '#6E7BB8',
        '--c-shadow':     'rgba(18,20,58,0.22)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 7, a.canopy[1] - 5, 1.6, '#EDE9FF', 0.75);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 16, a.canopy[1] - 12, 2.2, '#EDE9FF', 0.8) +
                 skinSparkle(a.canopy[0] + 14, a.canopy[1] - 20, 1.7, '#EDE9FF', 0.6) +
                 skinDot(a.canopy[0] + 19, a.canopy[1] + 2, 0.9, '#EDE9FF', 0.5);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 22, a.canopy[1] - 16, 2.8, '#EDE9FF', 0.85) +
                 skinSparkle(a.canopy[0] + 20, a.canopy[1] - 26, 2.1, '#EDE9FF', 0.65) +
                 skinSparkle(a.canopy[0] + 5,  a.canopy[1] - 38, 1.6, '#EDE9FF', 0.5) +
                 skinDot(a.canopy[0] - 26, a.canopy[1] + 6, 1.1, '#EDE9FF', 0.45);
        },
      },
    },
  ],

  mindfulness: [
    {
      id: 'classic',
      name: 'Dawn Lotus',
      note: 'The lotus as first grown.',
      swatch: ['#FAD1D8', '#E28D9B', '#DA4E65'],
      vars: {},
    },
    {
      id: 'inkandgold',
      name: 'Ink & Gold',
      note: 'Ivory petals over lacquer-dark pads.',
      swatch: ['#FFFDF6', '#C9A24F', '#1E3A33'],
      defs:
        '<linearGradient id="sk-inkandgold-inner" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#8C6326"/>' +
          '<stop offset="1" stop-color="#D9B369"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal-outer-light': '#FFFDF6',
        '--c-petal-outer':       '#F3E9D2',
        '--c-petal-mid-light':   '#E9DAB6',
        '--c-petal-mid':         '#D6BE8A',
        '--c-petal-inner-light': '#C8A45E',
        '--c-petal-inner':       'url(#sk-inkandgold-inner)',
        '--c-center':            '#FFF0B8',
        '--c-center-dark':       '#DFB94F',
        '--c-pad':               '#25453C',
        '--c-pad-dark':          '#15292A',
        '--c-leaf-light':        '#4A7A66',
        '--c-leaf':              '#2F5A4C',
        '--c-leaf-dark':         '#1E4034',
        '--c-shadow':            'rgba(8,28,26,0.34)',
      },
      extras: {
        2: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 19, '#C9A24F', 0.35) +
                 skinRipple(a.base[0], a.base[1] + 1.5, 24, '#C9A24F', 0.18);
        },
        3: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 24, '#C9A24F', 0.38) +
                 skinRipple(a.base[0], a.base[1] + 2, 30, '#C9A24F', 0.20) +
                 skinSparkle(a.canopy[0] + 1, a.canopy[1] - 6, 2.0, '#FFF0B8', 0.7);
        },
      },
    },
  ],

  sleep: [
    {
      id: 'classic',
      name: 'Dusk Lavender',
      note: 'The lavender as first grown.',
      swatch: ['#F1EBFB', '#D9CDF5', '#BCA8E6'],
      vars: {},
    },
    {
      id: 'honeydusk',
      name: 'Honeydusk',
      note: 'Warm amber buds on dusty olive stems.',
      swatch: ['#FFF3DC', '#F2CE8E', '#A8B27A'],
      defs:
        '<linearGradient id="sk-honeydusk-bud" x1="0" y1="1" x2="0.3" y2="0">' +
          '<stop offset="0" stop-color="#E8B96A"/>' +
          '<stop offset="1" stop-color="#FBE1AE"/>' +
        '</linearGradient>',
      vars: {
        '--c-bud':        'url(#sk-honeydusk-bud)',
        '--c-bud-shade':  '#DDA95C',
        '--c-bud-hilite': '#FFF6E4',
        '--c-stem':       '#94A06A',
        '--c-stem-light': '#BFC895',
        '--c-shadow':     'rgba(70,52,10,0.16)',
      },
      extras: {
        2: function (a) {
          return skinDot(a.canopy[0] - 11, a.canopy[1] - 4, 0.9, '#FFE9BE', 0.75) +
                 skinDot(a.canopy[0] + 12, a.canopy[1] + 6, 0.7, '#FFE9BE', 0.6);
        },
        3: function (a) {
          return skinDot(a.canopy[0] - 14, a.canopy[1] - 10, 1.1, '#FFE9BE', 0.8) +
                 skinDot(a.canopy[0] + 15, a.canopy[1] + 4, 0.9, '#FFE9BE', 0.62) +
                 skinDot(a.canopy[0] + 6,  a.canopy[1] - 22, 0.8, '#FFE9BE', 0.5);
        },
      },
    },
  ],

  chores: [
    {
      id: 'classic',
      name: 'Green Culm',
      note: 'The bamboo as first grown.',
      swatch: ['#C6E4A2', '#93C86E', '#B79A6A'],
      vars: {},
    },
    {
      id: 'kurotake',
      name: 'Kurotake',
      note: 'Black bamboo with jade leaves.',
      swatch: ['#4A4A46', '#232322', '#5FA37E'],
      defs:
        '<linearGradient id="sk-kurotake-culm" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#22221F"/>' +
          '<stop offset="0.55" stop-color="#494945"/>' +
          '<stop offset="1" stop-color="#2A2A27"/>' +
        '</linearGradient>',
      vars: {
        '--c-culm-light': '#55554F',
        '--c-culm':       'url(#sk-kurotake-culm)',
        '--c-culm-mid':   '#33332F',
        '--c-node':       '#1A1A18',
        '--c-node-dark':  '#0E0E0D',
        '--c-leaf-light': '#7FBF9A',
        '--c-leaf':       '#5FA37E',
        '--c-leaf-dark':  '#3F7A62',
        '--c-shadow':     'rgba(0,0,0,0.24)',
      },
      extras: {
        2: function (a) {
          return skinDot(a.canopy[0] - 9, a.canopy[1] + 10, 0.8, '#C6A25A', 0.55) +
                 skinDot(a.canopy[0] + 8, a.canopy[1] + 20, 0.7, '#C6A25A', 0.4);
        },
        3: function (a) {
          return skinDot(a.canopy[0] - 13, a.canopy[1] + 12, 1.0, '#C6A25A', 0.6) +
                 skinDot(a.canopy[0] + 12, a.canopy[1] + 26, 0.85, '#C6A25A', 0.45) +
                 skinDot(a.canopy[0] + 2,  a.canopy[1] - 10, 0.75, '#C6A25A', 0.35);
        },
      },
    },
  ],

  finance: [
    {
      id: 'classic',
      name: 'Field Clover',
      note: 'The clover as first grown.',
      swatch: ['#5C8267', '#274F3C', '#0F291E'],
      vars: {},
    },
    {
      id: 'wildfrost',
      name: 'Wildfrost',
      note: 'Frozen mid-morning, edges still rimed.',
      swatch: ['#DCEEF4', '#8FBCCB', '#39586B'],
      defs:
        '<linearGradient id="sk-wildfrost-leaf" x1="0" y1="1" x2="0.4" y2="0">' +
          '<stop offset="0" stop-color="#7FAABB"/>' +
          '<stop offset="1" stop-color="#CDE7F0"/>' +
        '</linearGradient>',
      vars: {
        '--c-leaf':      'url(#sk-wildfrost-leaf)',
        '--c-leaf-mid':  '#7FA9BA',
        '--c-leaf-dark': '#547E93',
        '--c-outline':   '#2E4A5C',
        '--c-sheen':     '#EAF6FA',
        '--c-bloom':     '#FFFFFF',
        '--c-shadow':    'rgba(28,58,78,0.18)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 9, a.canopy[1] - 12, 1.5, '#FFFFFF', 0.7);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 14, a.canopy[1] - 14, 2.0, '#FFFFFF', 0.75) +
                 skinSparkle(a.canopy[0] + 13, a.canopy[1] - 4, 1.5, '#FFFFFF', 0.55);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 19, a.canopy[1] - 16, 2.5, '#FFFFFF', 0.8) +
                 skinSparkle(a.canopy[0] + 18, a.canopy[1] - 6, 1.8, '#FFFFFF', 0.6) +
                 skinSparkle(a.canopy[0] + 3,  a.canopy[1] - 30, 1.5, '#FFFFFF', 0.45);
        },
      },
    },
  ],

  misc: [
    {
      id: 'classic',
      name: 'Coral Cap',
      note: 'The mushroom as first grown.',
      swatch: ['#E4715E', '#C4574A', '#F7E9DE'],
      vars: {},
    },
  ],
};


// ---- Skin lookup + application -----------------------------------

function getSkinsFor(catId) {
  return PLANT_SKINS[catId] || PLANT_SKINS.misc;
}

// Always returns a real skin: an unknown or removed skin id falls
// back to that species' first entry rather than rendering nothing.
function getSkin(catId, skinId) {
  var list = getSkinsFor(catId);
  var found = null;
  list.forEach(function (s) { if (s.id === skinId) found = s; });
  return found || list[0];
}

function getTaskSkinId(task) {
  return (task && task.skinId) || SKIN_DEFAULT_ID;
}

// Gradients and patterns live once in a hidden sprite in the page,
// not inside each plant's <svg>. Two plants can then reference the
// same gradient, and the crossfade between growth stages — which has
// two copies of the art on screen at once — can't produce duplicate
// element ids.
var injectedSkinDefs = {};

function ensureSkinDefs(catId, skin) {
  if (!skin || !skin.defs) return;
  var key = catId + ':' + skin.id;
  if (injectedSkinDefs[key]) return;

  var sprite = document.getElementById('skinDefsSprite');
  if (!sprite) return;
  var defs = sprite.querySelector('defs');
  if (!defs) return;

  // insertAdjacentHTML parses in SVG context here, which createElement
  // would not.
  defs.insertAdjacentHTML('beforeend', skin.defs);
  injectedSkinDefs[key] = true;
}

function skinStyleString(skin) {
  if (!skin || !skin.vars) return '';
  var out = '';
  Object.keys(skin.vars).forEach(function (token) {
    out += token + ':' + skin.vars[token] + ';';
  });
  return out;
}

function skinExtrasFor(catId, skin, stageIndex) {
  if (!skin || !skin.extras) return '';
  var extra = skin.extras[stageIndex];
  if (!extra) return '';
  if (typeof extra === 'function') {
    return extra(getPlantAnchors(catId, stageIndex)) || '';
  }
  return extra;
}



// ============================================
// Plant height system (shown on hover, in meters)
// ============================================
// Height now tracks exactly what's on screen: it's derived straight
// from a plant's actual rendered "scale" — the same number driving
// the --plant-scale CSS var (growth stage size, any Daily/Long-Term
// flourish, AND the depth-based foreground/background multiplier).
// Every species' art shares the same 80x130 SVG canvas, so a single
// shared conversion constant means two plants at the same scale are
// reported as the same height, and whichever plant visibly reaches
// higher on screen always reads as the taller one — no more a young,
// close-up Clover being labeled shorter than a small, distant Bamboo
// just because of a fixed per-species range.
var PLANT_BASE_HEIGHT_M = 1.6; // height, in meters, of a plant at scale = 1

function computeHeightMeters(scale) {
  return Math.max(0, scale || 0) * PLANT_BASE_HEIGHT_M;
}

// Formats to a short, readable string — no more than 2 decimal
// places, and drops to cm-style precision for very short plants so
// it never just reads "0.0 m".
function formatHeightMeters(meters) {
  if (meters < 0.1) return meters.toFixed(2) + ' m';
  return meters.toFixed(1) + ' m';
}


// ============================================
// Plant positions in the garden scene — perspective depth
// ============================================
// Every task can be placed at any free (x, y) point in the garden —
// there's no fixed depth row to snap to. Two internal "slots" groups
// still exist purely so freshly-added, never-dragged plants spread
// out across the width instead of stacking in the middle (see
// assignPermanentPositions below) — they don't affect depth.
//
// Depth perception: a plant's y position (bottomPct — how far up
// the scene it sits) continuously drives two things: how big it
// renders (further up/back = smaller, further down/front = bigger)
// and its stacking order (further-down/front plants paint on top of
// further-up/back ones), via computeDepthScale/computeDepthZ below.
// ============================================

// Deterministic pseudo-random value in [0, 1) for a given integer
// seed. Same input always produces the same output — this is what
// makes the automatic-slot assignment stable across renders/reloads
// instead of re-shuffling every time the garden re-renders.
function hashSeed(n) {
  var x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

// Used only to spread never-dragged plants into one of two
// interleaved slot groups (see phaseOffset in computePlantLayout)
// so they don't all land in a perfectly even single-file line.
var SLOT_GROUPS = {
  a: { centerMin: 16, centerMax: 84, phaseOffset: 0   },
  b: { centerMin: 16, centerMax: 84, phaseOffset: 0.5 },
};
var DEFAULT_BOTTOM_PCT = 40;
var PLANT_Z_INDEX      = 3;

// Depth-perception tuning. bottomPct's visible range is clamped to
// [DEPTH_BOTTOM_MIN, DEPTH_BOTTOM_MAX] by clampBottomPct() below.
// DEFAULT_BOTTOM_PCT is treated as the "neutral" depth (scale 1x,
// matching how auto-placed plants have always looked) — dragging a
// plant further down toward DEPTH_BOTTOM_MIN (foreground) scales it
// up toward DEPTH_MAX_SCALE, and further up toward DEPTH_BOTTOM_MAX
// (background) scales it down toward DEPTH_MIN_SCALE.
var DEPTH_BOTTOM_MIN = 4;
var DEPTH_BOTTOM_MAX = 92;
var DEPTH_MIN_SCALE  = 0.6;  // furthest back
var DEPTH_MAX_SCALE  = 1.4;  // furthest front

// Bigger/closer plants should always paint over smaller/further ones
// — a simple painter's-algorithm z-index derived straight from
// bottomPct, so stacking order always matches the size cue instead
// of depending on task order or manual z-index bookkeeping.
function computeDepthScale(bottomPct) {
  var clamped = Math.max(DEPTH_BOTTOM_MIN, Math.min(DEPTH_BOTTOM_MAX, bottomPct));
  if (clamped <= DEFAULT_BOTTOM_PCT) {
    var tNear = (DEFAULT_BOTTOM_PCT - clamped) / (DEFAULT_BOTTOM_PCT - DEPTH_BOTTOM_MIN);
    return 1 + (DEPTH_MAX_SCALE - 1) * tNear;
  }
  var tFar = (clamped - DEFAULT_BOTTOM_PCT) / (DEPTH_BOTTOM_MAX - DEFAULT_BOTTOM_PCT);
  return 1 - (1 - DEPTH_MIN_SCALE) * tFar;
}

function computeDepthZ(bottomPct) {
  var clamped = Math.max(DEPTH_BOTTOM_MIN, Math.min(DEPTH_BOTTOM_MAX, bottomPct));
  // Lower bottomPct (further down/toward the viewer) → higher z-index.
  return PLANT_Z_INDEX + Math.round((DEPTH_BOTTOM_MAX - clamped) * 5);
}

function getTaskSlotGroup(taskId) {
  var seed = hashSeed(taskId);
  return seed < 0.5 ? 'a' : 'b';
}

// A task with a manually-dragged position stores posX and posY
// (each 0–100, as a left%/bottom% pair) directly on the task,
// bypassing the automatic slot layout below entirely — this is a
// free (x, y) point, not a snap to any row or band.
function hasCustomPosition(task) {
  return typeof task.posX === 'number' && typeof task.posY === 'number';
}

// Keeps a plant's title — a fixed 130px-wide tag centered right below
// it — fully on-screen. A flat percentage clamp either wastes width
// on a wide desktop or still lets labels clip off a narrow phone, so
// instead the safe margin is computed in real pixels against the
// current viewport width: plants can spread across almost the entire
// page on a wide screen, while narrower screens pull the edges in
// just enough to keep every title readable.
function clampCenterPct(pct) {
  var trackW      = (gardenTrackEl && gardenTrackEl.getBoundingClientRect().width) ||
                     ((typeof window !== 'undefined' && window.innerWidth * 3) || 2400);
  var labelHalfPx = 68; // half of .plant-label-tag's 130px width, plus a small buffer
  var marginPct   = Math.min(30, (labelHalfPx / trackW) * 100);
  return Math.max(marginPct, Math.min(100 - marginPct, pct));
}

// Keeps a dragged plant's base from landing above the top of the
// scene or below the visible grass — a free y placement, just kept
// within a sane visible range.
function clampBottomPct(pct) {
  return Math.max(4, Math.min(92, pct));
}

function computePlantLayout(task, indexInGroup, groupTotal) {
  var group = getTaskSlotGroup(task.id);
  var cfg   = SLOT_GROUPS[group];
  var range = cfg.centerMax - cfg.centerMin;

  var basePct;
  if (groupTotal <= 1) {
    basePct = cfg.centerMin + range / 2;
  } else {
    // Evenly spaced slots across the width, then group "b"'s slots
    // are nudged by half a slot (phaseOffset: 0.5) so its plants fall
    // into the gaps of group "a"'s plants instead of lining up
    // directly on top of them.
    var slot = range / groupTotal;
    basePct = cfg.centerMin + slot * (indexInGroup + 0.5) + slot * (cfg.phaseOffset || 0);
  }

  // Small stable jitter (from a second, independent hash) so plants
  // don't line up in a perfectly even row.
  var jitterSeed  = hashSeed(task.id * 7 + 3);
  var jitterRange = range / Math.max(groupTotal, 1) * 0.35;
  var centerPct   = clampCenterPct(basePct + (jitterSeed - 0.5) * jitterRange);

  return {
    center:      centerPct + '%',
    bottomPct:   DEFAULT_BOTTOM_PCT,
    depthScale:  computeDepthScale(DEFAULT_BOTTOM_PCT),
    z:           computeDepthZ(DEFAULT_BOTTOM_PCT),
  };
}

// Permanently assigns an auto-computed posX/posY to every task that
// doesn't already have one (i.e. hasn't been manually dragged). This
// is what makes plant positions stable: instead of recomputing an
// undragged plant's slot every render based on how many OTHER
// undragged plants currently exist (which shifts every remaining
// plant's slot the moment one of them gets dragged out of that
// pool), each plant's automatic position is computed exactly once,
// written onto the task like a manual placement, and never touched
// again — dragging one plant can no longer move any other plant.
// Returns true if any task was newly assigned (so callers know to
// persist the change).
function assignPermanentPositions() {
  var assignedAny = false;
  var slotGroups = { a: [], b: [] };

  tasks.forEach(function (task) {
    if (!hasCustomPosition(task)) {
      slotGroups[getTaskSlotGroup(task.id)].push(task);
    }
  });

  Object.keys(slotGroups).forEach(function (group) {
    var list = slotGroups[group];
    list.forEach(function (task, idx) {
      var layout   = computePlantLayout(task, idx, list.length);
      task.posX    = parseFloat(layout.center);
      task.posY    = layout.bottomPct;
      assignedAny  = true;
    });
  });

  return assignedAny;
}

// Layout for a manually-placed plant — its left%/bottom% come
// straight from the saved (x, y) override, and its size + stacking
// order are derived from that same y so plants dropped further down
// (toward the viewer) look and paint bigger/closer than ones dropped
// further up (toward the horizon).
function computeCustomLayout(task) {
  var bottomPct = clampBottomPct(task.posY);
  return {
    center:      clampCenterPct(task.posX) + '%',
    bottomPct:   bottomPct,
    depthScale:  computeDepthScale(bottomPct),
    z:           computeDepthZ(bottomPct),
  };
}


// ============================================
// Ground texture — grass blade clumps
//
// The scrollable garden track was otherwise a flat green plane, so
// swiping left/right gave no visual feedback that the view was
// actually moving. These clumps live INSIDE #gardenSceneTrack (the
// element that actually scrolls), scattered across its full 300%
// width, so they visibly slide past as you swipe — unlike the fixed
// sky/lawn backdrop behind everything, which never moves.
//
// Deterministic (hashSeed-based) so the field looks the same on
// every render/reload instead of re-shuffling. Blade height and tint
// are derived from the same depth math as the plants (computeDepthScale/
// lerpColor, both already defined above) so clumps nearer the "front"
// of the garden render bigger and more saturated than ones further
// toward the horizon — reinforcing the same depth cue the plants use.
// ============================================

var GRASS_PALETTE = ['#3a6020', '#4a7a30', '#537d33', '#5a9035', '#487526', '#6aab45', '#436b2c'];
var GRASS_TIP_LIGHT = '#cfe8a0';
// The track is 3x the viewport width, so this total is split evenly
// across those 3 "screens" — 45 total works out to ~15 clumps visible
// in any single field of view at a time, matching GRASS_PER_SCREEN.
var GRASS_PER_SCREEN  = 15;
var GRASS_CLUMP_COUNT = GRASS_PER_SCREEN * 3;

function buildGrassClump(xPct, yPct, seedBase) {
  var wrap = document.createElement('div');
  wrap.className = 'grass-clump';
  wrap.style.left = xPct + '%';
  wrap.style.bottom = yPct + '%';

  // Reuse the plants' own depth scale so clumps shrink/lighten
  // toward the back of the garden the same way plants do.
  var depthScale = computeDepthScale(yPct);
  var bladeCount = 3;

  for (var b = 0; b < bladeCount; b++) {
    var s = seedBase + b * 2.3;
    var heightPx  = (9 + hashSeed(s) * 11) * depthScale;
    var widthPx   = 3 + hashSeed(s + 0.7) * 2.5;
    var rotDeg    = (hashSeed(s + 1.3) - 0.5) * 46;
    var offsetX   = (hashSeed(s + 2.1) - 0.5) * 14;
    var colorIdx  = Math.floor(hashSeed(s + 3.4) * GRASS_PALETTE.length);
    var baseColor = GRASS_PALETTE[colorIdx];
    var tipColor  = lerpColor(baseColor, GRASS_TIP_LIGHT, 0.35);

    var blade = document.createElement('div');
    blade.className = 'grass-blade';
    blade.style.left      = offsetX + 'px';
    blade.style.width     = widthPx + 'px';
    blade.style.height    = Math.max(5, heightPx) + 'px';
    blade.style.background = 'linear-gradient(to top, ' + baseColor + ', ' + tipColor + ')';
    blade.style.transform  = 'translateX(-50%) rotate(' + rotDeg + 'deg)';
    blade.style.opacity    = (0.65 + hashSeed(s + 4.2) * 0.3).toFixed(2);
    wrap.appendChild(blade);
  }

  return wrap;
}

// ============================================
// Garden fence — DOM elements inside the scrollable track
// ============================================
// Previously the fence lived in the fixed #gardenBackdrop, so it
// never moved when the garden was panned. Rendering it here instead,
// as a direct child of #gardenSceneTrack (same as the grass field
// above), means it scrolls together with the plants and grass. See
// .garden-fence-strip / .garden-fence-shadow in style.css for the
// picket shading and ground-connecting shadow.
function renderFence(track) {
  var fence = document.createElement('div');
  fence.className = 'garden-fence-strip';
  track.appendChild(fence);

  var shadow = document.createElement('div');
  shadow.className = 'garden-fence-shadow';
  track.appendChild(shadow);
}

function renderGrassField(track) {
  var field = document.createElement('div');
  field.className = 'grass-tuft-field';

  // Stratified placement: the track is divided into GRASS_CLUMP_COUNT
  // equal-width cells (one clump per cell), and each clump is jittered
  // to a random spot WITHIN its own cell. This keeps clumps spread
  // out evenly across the whole track — unlike pure random x/y, which
  // can easily leave empty gaps in one area and a dense bunch in
  // another purely by chance.
  var cellWidth = 100 / GRASS_CLUMP_COUNT;

  for (var i = 0; i < GRASS_CLUMP_COUNT; i++) {
    var seed = i * 9.173;
    var xPct = i * cellWidth + hashSeed(seed) * cellWidth;
    var yPct = 6 + hashSeed(seed + 0.5) * 76; // keep off the very top/bottom edges of the plot
    field.appendChild(buildGrassClump(xPct, yPct, seed * 3.7));
  }

  track.appendChild(field);
}


// ============================================
// Daily-progress ring at the plant's base
// ============================================
function buildProgressRing(comp) {
  if (comp.total === 0 || comp.percent === 0) return '';

  var r             = 14;
  var cx            = 40;
  var cy            = 119;
  var circumference = 2 * Math.PI * r;
  var progress      = (comp.percent / 100) * circumference;
  var color         = comp.percent === 100
    ? '#F2B84B'
    : 'rgba(242,184,75,0.6)';
  var strokeW       = comp.percent === 100 ? 3 : 2;

  var sparkles = '';
  if (comp.percent === 100) {
    sparkles =
      '<line x1="40" y1="100" x2="40" y2="104" stroke="#F2B84B" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="51" y1="103" x2="49.5" y2="107" stroke="#F2B84B" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="29" y1="103" x2="30.5" y2="107" stroke="#F2B84B" stroke-width="2" stroke-linecap="round"/>';
  }

  return (
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none"' +
    ' stroke="' + color + '" stroke-width="' + strokeW + '"' +
    ' stroke-dasharray="' + progress + ' ' + (circumference - progress) + '"' +
    ' transform="rotate(-90,' + cx + ',' + cy + ')"' +
    ' stroke-linecap="round"/>' +
    sparkles
  );
}


// ============================================
// Build one plant's SVG markup
// (No progress ring — each garden section uses its own label instead)
// ============================================
function getPlantSVG(catId, stageIndex, skinId, width) {
  var data  = PLANT_SVG_DATA[catId] || PLANT_SVG_DATA.misc;
  var stage = Math.max(0, Math.min(stageIndex, data.length - 1));
  var body  = data[stage];

  // The skin only supplies CSS variables (and optionally a few extra
  // elements) — the base art below is the same string either way.
  var skin = getSkin(catId, skinId || SKIN_DEFAULT_ID);
  ensureSkinDefs(catId, skin);

  var w = width || 120;
  var h = Math.round(w * 195 / 120);

  return (
    '<svg viewBox="0 0 80 130" xmlns="http://www.w3.org/2000/svg"' +
    ' width="' + w + '" height="' + h + '"' +
    ' style="overflow:visible;display:block;' + skinStyleString(skin) + '">' +
    body +
    skinExtrasFor(catId, skin, stage) +
    '</svg>'
  );
}


// ============================================
// Garden sub-nav toggle
// ============================================
function switchGardenTab(tabId) {
  currentGardenTab = tabId;
  document.querySelectorAll('#gardenSubnav .cat-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.gardenTab === tabId);
  });
  if (authReady) renderGarden();
}


// ============================================
// Rendering the garden scene
// ============================================

// Remembers which art stage each task was last rendered at, so we can
// detect "just crossed a milestone" and crossfade into the new stage
// instead of just popping to it. Session-only (not persisted) — on a
// fresh page load a plant just appears at its correct current stage.
var plantStageMemory = {};

// Builds the (possibly crossfading) SVG art for one plant. If the
// task's stage hasn't changed since last render, this is just the
// current stage's art. If it HAS changed (a milestone was just
// crossed), it briefly overlays the old and new stage art and
// crossfades between them via CSS transition.
function buildPlantVisual(task, cat, stageIdx) {
  var container = document.createElement('div');
  container.className = 'plant-stage-crossfade';

  var skinId = getTaskSkinId(task);

  var prevStage = plantStageMemory.hasOwnProperty(task.id)
    ? plantStageMemory[task.id]
    : stageIdx;

  if (prevStage === stageIdx) {
    var layer = document.createElement('div');
    layer.className = 'plant-stage-layer';
    layer.style.opacity = '1';
    layer.innerHTML = getPlantSVG(cat.id, stageIdx, skinId);
    container.appendChild(layer);
    plantStageMemory[task.id] = stageIdx;
    return container;
  }

  // Stage just changed — crossfade the old art out and the new art in.
  var oldLayer = document.createElement('div');
  oldLayer.className = 'plant-stage-layer';
  oldLayer.innerHTML = getPlantSVG(cat.id, prevStage, skinId);
  oldLayer.style.opacity = '1';

  var newLayer = document.createElement('div');
  newLayer.className = 'plant-stage-layer';
  newLayer.innerHTML = getPlantSVG(cat.id, stageIdx, skinId);
  newLayer.style.opacity = '0';

  container.appendChild(oldLayer);
  container.appendChild(newLayer);

  // Flip opacities on the next frame so the browser registers the
  // starting state first, then animates the transition via CSS.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      oldLayer.style.opacity = '0';
      newLayer.style.opacity = '1';
    });
  });

  // Lock in the new stage once the crossfade finishes so later
  // renders don't keep re-triggering it.
  setTimeout(function () {
    plantStageMemory[task.id] = stageIdx;
  }, 900);

  return container;
}

// Centers the garden scene's horizontal scroll position on its full
// (3x-viewport-wide) track. Deferred a frame so it runs after the
// browser has laid out this render's plants and recalculated
// scrollWidth — reading it synchronously right after an innerHTML
// swap can still reflect the previous render's width.
function centerGardenScroll() {
  requestAnimationFrame(function () {
    if (!gardenSceneEl) return;
    gardenSceneEl.scrollLeft = (gardenSceneEl.scrollWidth - gardenSceneEl.clientWidth) / 2;
  });
}

function renderGarden() {
  if (!gardenSceneEl || !gardenTrackEl) return;
  gardenTrackEl.innerHTML = '';

  var shouldCenterScroll = pendingGardenScrollCenter;
  pendingGardenScrollCenter = false;

  // Ground texture and fence first, so they sit behind every plant
  // appended below (both live inside the scrollable track now, so
  // they pan together with the plants — see renderFence() above).
  renderGrassField(gardenTrackEl);
  renderFence(gardenTrackEl);

  var emptyMsgEl = document.getElementById('gardenEmptyMsg');

  if (tasks.length === 0) {
    if (emptyMsgEl) emptyMsgEl.classList.remove('hidden');
    // Nothing to scroll to yet — keep the message centered in view.
    gardenSceneEl.scrollLeft = 0;
    return;
  }
  if (emptyMsgEl) emptyMsgEl.classList.add('hidden');

  // Highest available art stage index — same length across every
  // category's PLANT_SVG_DATA array (4 stages: 0–3).
  var maxStageIdx = PLANT_SVG_DATA.misc.length - 1;

  // Bucket auto-positioned (never-dragged) tasks into their slot
  // group once per render. Each task's group is a stable hash of its
  // id, so this grouping (and therefore each task's position) stays
  // consistent render to render. Manually-placed (dragged) tasks are
  // excluded here — they don't participate in the auto grid at all,
  // so they don't shift where other plants' slots fall.
  var slotGroups = { a: [], b: [] };
  tasks.forEach(function (task) {
    if (hasCustomPosition(task)) return;
    slotGroups[getTaskSlotGroup(task.id)].push(task);
  });

  tasks.forEach(function (task, i) {
    var cat = getCategoryById(task.categoryId);
    var layout;
    if (hasCustomPosition(task)) {
      layout = computeCustomLayout(task);
    } else {
      var group        = getTaskSlotGroup(task.id);
      var groupTasks   = slotGroups[group];
      var indexInGroup = groupTasks.indexOf(task);
      layout           = computePlantLayout(task, indexInGroup, groupTasks.length);
    }

    var totalGrowthDays = Math.max(0, task.totalGrowthDays || 0);
    var streak          = Math.max(0, task.streak || 0);

    var stageIdx, scale, subLabel;

    if (currentGardenTab === 'daily') {
      // Daily Garden: what today's plant looks like right now.
      // Baseline fullness tracks the *current streak* — a long
      // unbroken run already looks lush before today's box is even
      // checked — then it blooms out fully the moment today is done.
      var streakStage = getStageIndexForDays(streak);
      var streakScale = computeScaleForDays(streak);

      stageIdx = task.completed ? maxStageIdx   : streakStage;
      scale    = task.completed ? streakScale * 1.35 : streakScale;

      subLabel = (task.completed ? 'Done today ✓' : 'Not done yet') +
        (streak > 0 ? ' · 🔥 ' + streak + ' day streak' : '');
    } else {
      // Long-Term Garden: permanent size from lifetime completed
      // days (never shrinks), with a bit of extra flourish layered
      // on top while a streak is currently alive.
      stageIdx = getStageIndexForDays(totalGrowthDays);
      var momentum = 1 + Math.min(streak, 60) * 0.004; // up to +24% at a 60-day streak
      scale = computeScaleForDays(totalGrowthDays) * momentum;

      var streakPart = streak > 0 ? ' · 🔥 ' + streak + ' day streak' : '';
      subLabel = totalGrowthDays + ' days grown' + streakPart;
    }

    // Depth multiplier stacks with the growth-based scale — a fully
    // grown far-row plant is still smaller than a fully grown
    // near-row plant, and vice versa a young near-row plant can still
    // be bigger on screen than an old far-row one.
    var growthOnlyScale = scale;
    scale = scale * layout.depthScale;

    // Height reflects the plant's actual GROWTH only — the growth-
    // stage size plus any Daily/Long-Term flourish — and deliberately
    // excludes the depth (foreground/background) multiplier. Depth is
    // just a perspective illusion from where the plant happens to be
    // placed in the garden; dragging it front-to-back doesn't change
    // the plant itself, so it must not change its reported height.
    var heightMeters = computeHeightMeters(growthOnlyScale);

    // Ground-anchored wrapper — position only, never scales.
    var wrap = document.createElement('div');
    wrap.className = 'garden-plant';
    wrap.style.left = layout.center;
    wrap.style.zIndex = layout.z;
    // Set on the wrap (not the inner .plant-visual) so both the
    // wrap's ground-sink offset and .plant-visual's own scale — which
    // inherits this custom property — can read the same value.
    wrap.style.setProperty('--plant-scale', scale.toFixed(3));
    wrap.style.setProperty('--plant-depth-bottom', layout.bottomPct + '%');
    // Stashed so the drag handler can recompute total scale live as
    // the plant is dragged between the far/near bands, without
    // having to redo the daily/long-term growth math mid-drag.
    wrap.dataset.growthScale = growthOnlyScale.toFixed(4);
    wrap.dataset.taskId      = task.id;
    wrap.setAttribute(
      'title',
      task.text + ' · ' + cat.name + ' (' + cat.species + ') · ' +
      totalGrowthDays + ' days grown' + (streak > 0 ? ' · 🔥 ' + streak + ' day streak' : '') +
      ' · press and hold to move'
    );

    // Scaling visual — grows from a fixed point near the ground.
    var visual = document.createElement('div');
    visual.className = 'plant-visual';

    visual.appendChild(buildPlantVisual(task, cat, stageIdx));
    wrap.appendChild(visual);

    // Height tooltip — hidden by default, revealed on hover via CSS
    // (see .plant-height-tag / :hover rules in style.css). Sits
    // outside .plant-visual so it doesn't get scaled along with the
    // art itself.
    var heightTag = document.createElement('div');
    heightTag.className = 'plant-height-tag';
    heightTag.textContent = formatHeightMeters(heightMeters);
    wrap.appendChild(heightTag);

    // Label — fixed size, sits below the plant at ground level.
    var labelEl = document.createElement('div');
    labelEl.className = 'plant-label-tag';
    labelEl.innerHTML =
      '<span class="plant-label-name">' + escapeHtml(task.text) + '</span>' +
      '<span class="plant-label-streak">' + subLabel + '</span>';
    wrap.appendChild(labelEl);

    setupPlantDrag(wrap, task.id);

    gardenTrackEl.appendChild(wrap);
  });

  if (shouldCenterScroll) centerGardenScroll();
}

// Escapes a task's free-text text before it's inserted via innerHTML
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


// ============================================
// Drag-to-place: press and hold a plant to pick it up, drag it
// anywhere in the garden, and drop it. While held, the far/near
// depth-band strips light up so you can see where you're placing it
// (and switch rows by dragging up/down). Letting go without having
// moved resets that plant back to its automatic position.
// ============================================

var LONG_PRESS_MS      = 50; // hold this long before a drag begins
var DRAG_CANCEL_DIST_PX = 8;   // finger/mouse wobble tolerance before the hold is armed

var activePlantDrag = null; // { taskId, wrap, moved, pendingX, pendingY }

function setupPlantDrag(wrap, taskId) {
  wrap.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return; // left-click / primary touch only

    var startX = e.clientX;
    var startY = e.clientY;
    var pointerId = e.pointerId;
    var armed = false;

    var timer = setTimeout(function () {
      armed = true;
      beginPlantDrag(taskId, wrap, pointerId);
    }, LONG_PRESS_MS);

    function onMove(ev) {
      if (armed) return; // once dragging has begun, onPlantDragMove takes over
      var dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (dist > DRAG_CANCEL_DIST_PX) cleanup();
    }
    function onUp() { cleanup(); }
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Double-click/double-tap picks the plant up immediately — no
  // holding required. It follows the pointer freely and the next
  // click anywhere drops it in place.
  wrap.addEventListener('dblclick', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (activePlantDrag) return; // something's already being carried
    beginPlantDrag(taskId, wrap, null, true);
  });

  // A plant is meant to be pressed-and-held, not dragged natively —
  // this stops touch scrolling/selection/callout menus from
  // hijacking the long-press gesture.
  wrap.style.touchAction = 'none';
  wrap.style.userSelect  = 'none';
  wrap.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

function beginPlantDrag(taskId, wrap, pointerId, floating) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task || !gardenSceneEl) return;

  activePlantDrag = {
    taskId:   taskId,
    wrap:     wrap,
    moved:    false,
    floating: !!floating,
    pendingX: (typeof task.posX === 'number') ? task.posX : (parseFloat(wrap.style.left) || 50),
    pendingY: (typeof task.posY === 'number') ? task.posY : DEFAULT_BOTTOM_PCT,
  };

  wrap.classList.add('dragging');
  wrap.style.zIndex = 9990;

  document.addEventListener('pointermove', onPlantDragMove);

  if (floating) {
    // Picked up via double-click — the mouse button isn't held down,
    // so there's no pointerup to end on. Instead, follow the pointer
    // on plain movement and finalize on the next click anywhere.
    document.addEventListener('click', onPlantDragEnd, { capture: true, once: true });
  } else {
    try { wrap.setPointerCapture(pointerId); } catch (e) {}
    document.addEventListener('pointerup', onPlantDragEnd);
    document.addEventListener('pointercancel', onPlantDragEnd);
  }
}

function onPlantDragMove(e) {
  if (!activePlantDrag || !gardenTrackEl) return;
  activePlantDrag.moved = true;

  var rect = gardenTrackEl.getBoundingClientRect();
  // Free placement: track the pointer directly, anywhere across the
  // (scrollable, 3x-wide) track — no row/band to snap to.
  var xPct = clampCenterPct(((e.clientX - rect.left) / rect.width) * 100);
  var yPct = ((e.clientY - rect.top) / rect.height) * 100;
  var bottomPct = clampBottomPct(100 - yPct);

  activePlantDrag.pendingX = xPct;
  activePlantDrag.pendingY = bottomPct;

  var wrap = activePlantDrag.wrap;
  var growthScale = parseFloat(wrap.dataset.growthScale || '1');
  var totalScale  = growthScale * computeDepthScale(bottomPct);

  wrap.style.left = xPct + '%';
  wrap.style.setProperty('--plant-depth-bottom', bottomPct + '%');
  wrap.style.setProperty('--plant-scale', totalScale.toFixed(3));
}

function onPlantDragEnd(e) {
  if (e && e.type === 'click') {
    // This click is the "drop" for a floating carry, not a real
    // click on whatever happens to be underneath — don't let it
    // also trigger that element's own click behavior.
    e.preventDefault();
    e.stopPropagation();
  }

  document.removeEventListener('pointermove', onPlantDragMove);
  document.removeEventListener('pointerup', onPlantDragEnd);
  document.removeEventListener('pointercancel', onPlantDragEnd);
  document.removeEventListener('click', onPlantDragEnd, { capture: true });

  if (!activePlantDrag) return;

  var drag = activePlantDrag;
  activePlantDrag = null;

  drag.wrap.classList.remove('dragging');

  var task = tasks.find(function (t) { return t.id === drag.taskId; });
  if (!task) { renderGarden(); return; }

  if (drag.moved) {
    // Dropped somewhere new — lock in the free (x, y) position.
    task.posX = drag.pendingX;
    task.posY = drag.pendingY;
  }
  // else: released without moving (a tap, or a press-and-hold let go
  // in place) — leave the plant's position exactly as it was. No
  // reset to the automatic spot.

  saveData();
  render();
}


// ============================================
// Stats page — yearly heatmaps + summary metric cards
//
// Two view modes, switched via #statsViewSelect:
//  - Overall Garden Overview: a 371-day (53-week) heatmap where each
//    day's intensity is the % of all current tasks completed that
//    day, plus garden-wide summary cards.
//  - Individual Plant View: the same grid for one selected task,
//    binary (completed / not), plus that task's own summary cards.
//
// Data source: each task's own `history` map (see toggleTask()),
// recording every calendar day it was actually checked off. Days
// before this field existed have no entry and simply render as
// "0% / not completed" — there's no way to recover completions that
// predate the field.
// ============================================

// ---- Date helpers ----

function formatDateStr(d) {
  var yyyy = d.getFullYear();
  var mm   = String(d.getMonth() + 1).padStart(2, '0');
  var dd   = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function getDateNDaysAgo(n) {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return formatDateStr(d);
}

// Builds a GitHub-style grid: an array of weeks, each an array of 7
// date strings (Sun–Sat), covering the last ~53 weeks up through
// today. The very first week is aligned back to the preceding Sunday
// so columns line up as real calendar weeks; the last week is padded
// with nulls past today so it's always exactly 7 cells.
function buildYearGrid() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var totalDays = 371; // 53 weeks
  var start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay()); // back up to Sunday

  var allDates = [];
  var cur = new Date(start);
  while (cur <= today) {
    allDates.push(formatDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }

  var weeks = [];
  for (var i = 0; i < allDates.length; i += 7) {
    var week = allDates.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// ---- Overall (all-tasks) day stats ----

// "Total active tasks" is simplified to the current task count for
// every date, since the app doesn't track how many tasks existed on
// any given past day — see the module note above.
function computeOverallDayStats(dateStr) {
  var total     = tasks.length;
  var completed = 0;
  tasks.forEach(function (t) {
    if (t.history && t.history[dateStr]) completed++;
  });
  var percent = total > 0 ? (completed / total) * 100 : 0;
  return { completed: completed, total: total, percent: percent };
}

function heatStageForPercent(percent) {
  if (percent <= 0)  return 0;
  if (percent <= 33) return 1;
  if (percent <= 66) return 2;
  return 3;
}

// ---- Shared grid renderer ----

// cellInfoFn(dateStr) -> { stage: 0-3, data: <anything> }
// tooltipFn(dateStr, info) -> string shown on hover
function renderHeatmapGrid(containerEl, weeks, cellInfoFn, tooltipFn) {
  containerEl.innerHTML = '';
  var grid = document.createElement('div');
  grid.className = 'heatmap-grid';

  weeks.forEach(function (week) {
    var col = document.createElement('div');
    col.className = 'heatmap-week';
    week.forEach(function (dateStr) {
      var cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      if (!dateStr) {
        cell.classList.add('heatmap-cell-empty');
      } else {
        var info = cellInfoFn(dateStr);
        cell.classList.add('heat-stage-' + info.stage);
        cell.dataset.tooltip = tooltipFn(dateStr, info);
      }
      col.appendChild(cell);
    });
    grid.appendChild(col);
  });

  containerEl.appendChild(grid);
}

// Hooks up hover tooltips for a heatmap container once — uses event
// delegation so it keeps working after renderHeatmapGrid() replaces
// the container's children on every re-render.
function initHeatmapTooltips(containerEl) {
  if (!containerEl || !heatmapTooltipEl) return;
  containerEl.addEventListener('mouseover', function (e) {
    var cell = e.target.closest('.heatmap-cell');
    if (!cell || !cell.dataset.tooltip) return;
    heatmapTooltipEl.textContent = cell.dataset.tooltip;
    heatmapTooltipEl.classList.remove('hidden');
  });
  containerEl.addEventListener('mousemove', function (e) {
    if (heatmapTooltipEl.classList.contains('hidden')) return;
    heatmapTooltipEl.style.left = (e.clientX + 14) + 'px';
    heatmapTooltipEl.style.top  = (e.clientY + 14) + 'px';
  });
  containerEl.addEventListener('mouseout', function (e) {
    if (!e.target.closest('.heatmap-cell')) return;
    heatmapTooltipEl.classList.add('hidden');
  });
}

function renderOverallHeatmap() {
  var container = document.getElementById('statsOverallHeatmap');
  if (!container) return;
  var weeks = buildYearGrid();

  renderHeatmapGrid(
    container,
    weeks,
    function (dateStr) {
      var d = computeOverallDayStats(dateStr);
      return { stage: heatStageForPercent(d.percent), data: d };
    },
    function (dateStr, info) {
      var d = info.data;
      return dateStr + ': ' + Math.round(d.percent) + '% of tasks completed (' +
        d.completed + '/' + d.total + ' tasks)';
    }
  );
}

function renderIndividualHeatmap(taskId) {
  var container = document.getElementById('statsIndividualHeatmap');
  var titleEl   = document.getElementById('statsIndividualHeatmapTitle');
  if (!container) return;

  var task = tasks.find(function (t) { return t.id === taskId; });

  if (titleEl) {
    titleEl.textContent = task
      ? (getCategoryById(task.categoryId).emoji + ' ' + task.text + ' — Yearly Activity')
      : 'Yearly Activity';
  }

  if (!task) {
    container.innerHTML = '<p class="empty-state">No task selected.</p>';
    return;
  }

  var hist  = task.history || {};
  var weeks = buildYearGrid();

  renderHeatmapGrid(
    container,
    weeks,
    function (dateStr) {
      var done = !!hist[dateStr];
      return { stage: done ? 3 : 0, data: { done: done } };
    },
    function (dateStr, info) {
      return dateStr + ': ' + (info.data.done ? 'Completed' : 'Not Completed');
    }
  );
}

// ---- Summary metric cards ----

function computeOverallStats() {
  var maxGrowthTask    = null;
  var allTimeMaxStreak = 0;
  var currentMaxStreak = 0;
  var weeklyGrowth     = 0;
  var monthlyGrowth    = 0;

  var last7  = []; for (var i = 0; i < 7;  i++) last7.push(getDateNDaysAgo(i));
  var last30 = []; for (var j = 0; j < 30; j++) last30.push(getDateNDaysAgo(j));

  tasks.forEach(function (t) {
    var totalGrowthDays = t.totalGrowthDays || 0;
    if (!maxGrowthTask || totalGrowthDays > (maxGrowthTask.totalGrowthDays || 0)) {
      maxGrowthTask = t;
    }
    allTimeMaxStreak = Math.max(allTimeMaxStreak, t.maxStreak || 0, t.streak || 0);
    currentMaxStreak = Math.max(currentMaxStreak, t.streak || 0);

    var hist = t.history || {};
    last7.forEach(function (d)  { if (hist[d]) weeklyGrowth++; });
    last30.forEach(function (d) { if (hist[d]) monthlyGrowth++; });
  });

  return {
    maxGrowthTask:    maxGrowthTask,
    allTimeMaxStreak: allTimeMaxStreak,
    currentMaxStreak: currentMaxStreak,
    weeklyGrowth:     weeklyGrowth,
    monthlyGrowth:    monthlyGrowth,
  };
}

function computeIndividualStats(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return null;

  var cat              = getCategoryById(task.categoryId);
  var totalGrowthDays  = task.totalGrowthDays || 0;
  var stageIdx         = getStageIndexForDays(totalGrowthDays);
  var scale            = computeScaleForDays(totalGrowthDays);
  var heightMeters     = computeHeightMeters(scale);
  var streak           = task.streak || 0;
  var maxStreak         = Math.max(task.maxStreak || 0, streak);

  var last7  = []; for (var i = 0; i < 7;  i++) last7.push(getDateNDaysAgo(i));
  var last30 = []; for (var j = 0; j < 30; j++) last30.push(getDateNDaysAgo(j));
  var hist   = task.history || {};

  return {
    task:            task,
    cat:             cat,
    stageIdx:        stageIdx,
    heightMeters:    heightMeters,
    streak:          streak,
    maxStreak:       maxStreak,
    weekCompletions:  last7.filter(function (d) { return hist[d]; }).length,
    monthCompletions: last30.filter(function (d) { return hist[d]; }).length,
  };
}

function statCardHtml(emoji, label, value, sub) {
  return (
    '<div class="stat-card">' +
      '<div class="stat-card-emoji">' + emoji + '</div>' +
      '<div class="stat-card-body">' +
        '<div class="stat-card-label">' + escapeHtml(label) + '</div>' +
        '<div class="stat-card-value">' + escapeHtml(value) + '</div>' +
        (sub ? '<div class="stat-card-sub">' + escapeHtml(sub) + '</div>' : '') +
      '</div>' +
    '</div>'
  );
}

function renderOverallCards() {
  var container = document.getElementById('statsOverallCards');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks yet — add one on the Tasks page to see your stats here.</p>';
    return;
  }

  var s      = computeOverallStats();
  var maxCat = s.maxGrowthTask ? getCategoryById(s.maxGrowthTask.categoryId) : null;

  container.innerHTML =
    statCardHtml(
      maxCat ? maxCat.emoji : '🌳',
      'Max Plant',
      maxCat ? s.maxGrowthTask.text : '—',
      maxCat ? ((s.maxGrowthTask.totalGrowthDays || 0) + ' days grown · ' + maxCat.species) : ''
    ) +
    statCardHtml('🏆', 'All-Time Max Streak',    s.allTimeMaxStreak + ' day' + (s.allTimeMaxStreak === 1 ? '' : 's'), '') +
    statCardHtml('🔥', 'Current Highest Streak', s.currentMaxStreak + ' day' + (s.currentMaxStreak === 1 ? '' : 's'), '') +
    statCardHtml('📅', 'Weekly Growth',          s.weeklyGrowth + ' completion' + (s.weeklyGrowth === 1 ? '' : 's'), 'last 7 days') +
    statCardHtml('📈', 'Monthly Growth',         s.monthlyGrowth + ' completion' + (s.monthlyGrowth === 1 ? '' : 's'), 'last 30 days');
}

function renderIndividualCards(taskId) {
  var container = document.getElementById('statsIndividualCards');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks yet — add one on the Tasks page to see your stats here.</p>';
    return;
  }

  var s = computeIndividualStats(taskId);
  if (!s) {
    container.innerHTML = '<p class="empty-state">No task selected.</p>';
    return;
  }

  container.innerHTML =
    statCardHtml(
      s.cat.emoji,
      'Current Stage & Height',
      'Stage ' + s.stageIdx + ' · ' + formatHeightMeters(s.heightMeters),
      s.cat.species + ' · ' + (s.task.totalGrowthDays || 0) + ' days grown'
    ) +
    statCardHtml('🔥', 'Current Streak',    s.streak + ' day' + (s.streak === 1 ? '' : 's'), '') +
    statCardHtml('🏆', 'Max Streak',        s.maxStreak + ' day' + (s.maxStreak === 1 ? '' : 's'), '') +
    statCardHtml('📅', 'Growth This Week',  s.weekCompletions + ' completion' + (s.weekCompletions === 1 ? '' : 's'), 'last 7 days') +
    statCardHtml('📈', 'Growth This Month', s.monthCompletions + ' completion' + (s.monthCompletions === 1 ? '' : 's'), 'last 30 days');
}

// ---- View mode wiring ----

// Rebuilds the single stats dropdown: "Overall" plus one entry per
// plant. Replaces the old two-dropdown (view mode + task) setup —
// picking a plant directly switches into Individual Plant View for
// that plant, no separate selector needed. Keeps the previous
// selection if it's still valid, otherwise falls back to Overall.
function populateStatsViewSelect() {
  var sel = document.getElementById('statsViewSelect');
  if (!sel) return;

  var prevValue = sel.value;
  sel.innerHTML = '';

  var overallOpt = document.createElement('option');
  overallOpt.value = 'overall';
  overallOpt.textContent = '🌻 Overall Garden Overview';
  sel.appendChild(overallOpt);

  tasks.forEach(function (t) {
    var cat = getCategoryById(t.categoryId);
    var opt = document.createElement('option');
    opt.value = String(t.id);
    opt.textContent = cat.emoji + ' ' + t.text;
    sel.appendChild(opt);
  });

  var validValues = ['overall'].concat(tasks.map(function (t) { return String(t.id); }));
  sel.value = (validValues.indexOf(prevValue) !== -1) ? prevValue : 'overall';
}

function renderStatsView() {
  var viewSelEl        = document.getElementById('statsViewSelect');
  var overallViewEl    = document.getElementById('statsOverallView');
  var individualViewEl = document.getElementById('statsIndividualView');
  var value = viewSelEl ? viewSelEl.value : 'overall';

  if (value !== 'overall') {
    var taskId = parseInt(value, 10);

    if (overallViewEl)    overallViewEl.classList.add('hidden');
    if (individualViewEl) individualViewEl.classList.remove('hidden');

    renderIndividualHeatmap(taskId);
    renderIndividualCards(taskId);
  } else {
    if (overallViewEl)    overallViewEl.classList.remove('hidden');
    if (individualViewEl) individualViewEl.classList.add('hidden');

    renderOverallHeatmap();
    renderOverallCards();
  }
}

// ============================================
// Profile identity header (Stats page)
// ============================================
// Garden level/badge — derived from LIFETIME growth days summed
// across every plant the user has ever grown, so it reflects total
// gardening effort rather than any single plant's progress.
var GARDEN_LEVELS = [
  { min: 0,   label: 'Level 1 — Seedling Starter' },
  { min: 10,  label: 'Level 2 — Sprout Novice' },
  { min: 30,  label: 'Level 3 — Growing Gardener' },
  { min: 75,  label: 'Level 4 — Bloom Keeper' },
  { min: 150, label: 'Level 5 — Flourishing Grower' },
  { min: 300, label: 'Level 6 — Master Gardener' },
];

function computeGardenLevel(lifetimeGrowthDays) {
  var current = GARDEN_LEVELS[0];
  GARDEN_LEVELS.forEach(function (lvl) {
    if (lifetimeGrowthDays >= lvl.min) current = lvl;
  });
  return current.label;
}

function renderProfileHeader() {
  if (!profileHeaderEl) return;

  var profile = currentUserProfile;

  var lifetimeGrowthDays = 0;
  var longestStreak      = 0;
  tasks.forEach(function (t) {
    lifetimeGrowthDays += (t.totalGrowthDays || 0);
    longestStreak = Math.max(longestStreak, t.maxStreak || 0, t.streak || 0);
  });
  var totalActivePlants = tasks.length;
  var levelLabel = computeGardenLevel(lifetimeGrowthDays);

  var avatarHtml = (!profile.isAnonymous && profile.photoURL)
    ? '<img class="profile-avatar-img" src="' + profile.photoURL + '" alt="" />'
    : '<div class="profile-avatar-fallback">' + (profile.isAnonymous ? '\uD83C\uDF31' : '\uD83C\uDF3B') + '</div>';

  var nameText  = profile.isAnonymous ? 'Guest Gardener' : (profile.displayName || 'Gardener');
  var emailText = profile.isAnonymous ? 'Not signed in — sign in to save your garden to an account' : (profile.email || '');

  var actionHtml = profile.isAnonymous
    ? '<button id="profileActionBtn" class="profile-action-btn" type="button">Sign in with Google</button>'
    : '<button id="profileActionBtn" class="profile-action-btn is-signout" type="button">Sign Out</button>';

  profileHeaderEl.innerHTML =
    '<div class="profile-header-top">' +
      avatarHtml +
      '<div class="profile-id-block">' +
        '<div class="profile-name">' + escapeHtml(nameText) + '</div>' +
        '<div class="profile-email">' + escapeHtml(emailText) + '</div>' +
        '<span class="profile-badge">' + escapeHtml(levelLabel) + '</span>' +
      '</div>' +
      actionHtml +
    '</div>' +
    '<div class="profile-quick-stats">' +
      '<div class="profile-quick-stat">' +
        '<div class="profile-quick-stat-value">' + longestStreak + '</div>' +
        '<div class="profile-quick-stat-label">Longest Streak</div>' +
      '</div>' +
      '<div class="profile-quick-stat">' +
        '<div class="profile-quick-stat-value">' + totalActivePlants + '</div>' +
        '<div class="profile-quick-stat-label">Active Plants</div>' +
      '</div>' +
      '<div class="profile-quick-stat">' +
        '<div class="profile-quick-stat-value">' + lifetimeGrowthDays + '</div>' +
        '<div class="profile-quick-stat-label">Lifetime Growth Days</div>' +
      '</div>' +
    '</div>';

  var actionBtn = document.getElementById('profileActionBtn');
  if (actionBtn) {
    actionBtn.addEventListener('click', function () {
      if (profile.isAnonymous) {
        openAuthModal();
      } else {
        signOutUser();
      }
    });
  }
}

function renderStatsPage() {
  populateStatsViewSelect();
  renderStatsView();
  renderProfileHeader();
}

// Wire the dropdowns once — renderStatsView() itself is what redraws
// the page content each time either selection changes.
var statsViewSelectEl = document.getElementById('statsViewSelect');
if (statsViewSelectEl) statsViewSelectEl.addEventListener('change', renderStatsView);

// Tooltip hookup — done once; both containers get their children
// replaced on every render, but delegation means this still works.
initHeatmapTooltips(document.getElementById('statsOverallHeatmap'));
initHeatmapTooltips(document.getElementById('statsIndividualHeatmap'));


// ============================================
// Main render — called after every state change
// ============================================
function render() {
  renderTaskList();
  renderGarden();
  renderDevPanel();
  if (currentPage === 'stats' && authReady) renderStatsPage();
  if (currentPage === 'greenhouse' && authReady) renderGreenhouse();
}


// ============================================
// Sky background — real-time time-of-day display
// ============================================

function hexToRgb(hex) {
  var match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function lerpColor(hexA, hexB, t) {
  var a = hexToRgb(hexA);
  var b = hexToRgb(hexB);
  return (
    'rgb(' +
    Math.round(a.r + (b.r - a.r) * t) + ',' +
    Math.round(a.g + (b.g - a.g) * t) + ',' +
    Math.round(a.b + (b.b - a.b) * t) +
    ')'
  );
}

function updateSky() {
  var now         = new Date();
  var timeDecimal = now.getHours() + now.getMinutes() / 60;

  var prev = SKY_KEY_FRAMES[0];
  var next = SKY_KEY_FRAMES[SKY_KEY_FRAMES.length - 1];
  for (var i = 0; i < SKY_KEY_FRAMES.length - 1; i++) {
    if (timeDecimal >= SKY_KEY_FRAMES[i].hour &&
        timeDecimal <  SKY_KEY_FRAMES[i + 1].hour) {
      prev = SKY_KEY_FRAMES[i];
      next = SKY_KEY_FRAMES[i + 1];
      break;
    }
  }
  var t        = (timeDecimal - prev.hour) / (next.hour - prev.hour);
  var topColor = lerpColor(prev.top,    next.top,    t);
  var botColor = lerpColor(prev.bottom, next.bottom, t);
  skyEl.style.background =
    'linear-gradient(180deg, ' + topColor + ' 0%, ' + botColor + ' 100%)';

  var isDay         = timeDecimal >= 7 && timeDecimal < 19;
  skyBodyEl.textContent = isDay ? '☀️' : '🌙';

  // Toggle ambient-detail visibility based on time of day
  skyEl.classList.toggle('sky-day',   isDay);
  skyEl.classList.toggle('sky-night', !isDay);

  // Garden page ground (fence + lawn) — the sky itself is now the
  // shared #sky element above, so this just keeps the ground's
  // night-dimming in sync with real time.
  if (gardenBackdropEl) gardenBackdropEl.classList.toggle('gb-night', !isDay);
  if (gardenSceneEl)    gardenSceneEl.classList.toggle('scene-night', !isDay);

  var arcProgress;
  if (isDay) {
    arcProgress = (timeDecimal - 7) / 12;
  } else {
    var hoursPast19 = timeDecimal >= 19
      ? timeDecimal - 19
      : timeDecimal + 5;
    arcProgress = hoursPast19 / 12;
  }
  arcProgress = Math.max(0, Math.min(1, arcProgress));

  var leftPct  = 8 + arcProgress * 80;
  var arcHeight = Math.sin(arcProgress * Math.PI);
  var topPct    = 5 + (1 - arcHeight) * 35;

  skyBodyEl.style.left = leftPct + '%';
  skyBodyEl.style.top  = topPct  + '%';
}

updateSky();
setInterval(updateSky, 60000);


// ============================================
// Watch for a live midnight rollover
// ============================================
// applyDayBoundaries() otherwise only runs once, when the Firestore
// snapshot first loads — if the tab is left open across midnight,
// today's checkboxes and streak resets wouldn't apply until the next
// reload. Poll alongside the sky update so it takes effect live.
function checkDayRollover() {
  if (!currentUserId) return;
  if (applyDayBoundaries()) {
    saveData();
    render();
  }
}
setInterval(checkDayRollover, 60000);


// ============================================
// Keep plant positions correct across resizes
// ============================================
// computePlantLayout() sizes its label-clipping safety margin off
// window.innerWidth, so a real viewport resize (rotating a phone,
// resizing a browser window) can change what a safe position is.
// Debounced so a drag-resize doesn't re-render on every pixel.
var gardenResizeTimer = null;
window.addEventListener('resize', function () {
  if (currentPage !== 'garden' || !authReady) return;
  clearTimeout(gardenResizeTimer);
  gardenResizeTimer = setTimeout(function () { renderGarden(); }, 150);
});


// ============================================
// Developer mode — editable growth inspector
//
// Lets you punch in (or nudge, or jump to a milestone) a task's
// streak and totalGrowthDays directly, so you can watch the garden
// respond immediately instead of waiting real days for a plant to
// grow. Streak/total-days edits here are PREVIEW ONLY — they update
// local state and re-render the garden, but deliberately skip
// saveData(), so a page reload always restores your real saved
// progress. The "done today" checkbox is the one real exception: it
// calls the same toggleTask() used on the Tasks page, so it behaves
// identically and does save.
// ============================================

let devModeEnabled = false;
try { devModeEnabled = localStorage.getItem('disciplant_devmode') === '1'; } catch (e) {}

const devToggleBtn      = document.getElementById('devModeToggle');
const devPanelEl         = document.getElementById('devPanel');
const devPanelBody       = document.getElementById('devPanelBody');
const devPanelClose      = document.getElementById('devPanelClose');
const devActionRollover  = document.getElementById('devActionRollover');
const devActionLog       = document.getElementById('devActionLog');
const devActionCopy      = document.getElementById('devActionCopy');

function addDaysToDateString(dateStr, delta) {
  var d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  var yyyy = d.getFullYear();
  var mm   = String(d.getMonth() + 1).padStart(2, '0');
  var dd   = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function setDevMode(on) {
  devModeEnabled = on;
  try { localStorage.setItem('disciplant_devmode', on ? '1' : '0'); } catch (e) {}
  if (devPanelEl)   devPanelEl.classList.toggle('hidden', !on);
  if (devToggleBtn) devToggleBtn.classList.toggle('active', on);
  if (on) renderDevPanel();
}

function devFlashButton(btn, tempText, restoreText, ms) {
  if (!btn) return;
  btn.textContent = tempText;
  setTimeout(function () { btn.textContent = restoreText; }, ms || 1200);
}

function getDevTaskId(el) {
  var row = el.closest('[data-task-id]');
  return row ? parseInt(row.getAttribute('data-task-id'), 10) : null;
}

// Builds the full editable panel body: a short summary line, then
// one card per task with live-computed Daily and Long-Term stage +
// scale, so the numbers you're editing and their visual effect are
// right next to each other.
function renderDevPanel() {
  if (!devModeEnabled || !devPanelBody) return;

  var maxStageIdx = PLANT_SVG_DATA.misc.length - 1;

  var summaryHtml =
    '<div class="dev-summary">' +
      '<span>' + currentGardenTab + ' garden</span><span>·</span>' +
      '<span>' + tasks.length + ' task' + (tasks.length === 1 ? '' : 's') + '</span><span>·</span>' +
      '<span>' + getTodayString() + '</span>' +
    '</div>' +
    '<p class="dev-note">Streak and total-days fields below are preview only — they update the garden live but aren\'t saved, so reloading restores your real progress. "Done today" is real and does save.</p>';

  var rowsHtml = tasks.map(function (t) {
    var cat            = getCategoryById(t.categoryId);
    var streak          = Math.max(0, t.streak || 0);
    var totalGrowthDays = Math.max(0, t.totalGrowthDays || 0);

    var dailyStreakStage = getStageIndexForDays(streak);
    var dailyStreakScale = computeScaleForDays(streak);
    var dailyStageIdx    = t.completed ? maxStageIdx : dailyStreakStage;
    var dailyScale       = t.completed ? (dailyStreakScale * 1.35) : dailyStreakScale;

    var ltStageIdx = getStageIndexForDays(totalGrowthDays);
    var momentum   = 1 + Math.min(streak, 60) * 0.004;
    var ltScale    = computeScaleForDays(totalGrowthDays) * momentum;

    var milestoneBtns = STAGE_MILESTONES.map(function (m) {
      return '<button type="button" class="dev-quick-btn" data-dev-action="set" ' +
        'data-dev-field="totalGrowthDays" data-dev-value="' + m + '">' + m + 'd</button>';
    }).join('');

    return (
      '<div class="dev-task-row" data-task-id="' + t.id + '">' +
        '<div class="dev-task-row-head">' +
          '<span class="dev-task-title">' + cat.emoji + ' ' + escapeHtml(t.text) + '</span>' +
          '<label class="dev-task-done">' +
            '<input type="checkbox" data-dev-field="completed"' + (t.completed ? ' checked' : '') + ' /> done today' +
          '</label>' +
        '</div>' +

        '<div class="dev-field-group">' +
          '<span class="dev-field-label">Streak 🔥</span>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="dec" data-dev-field="streak" data-dev-step="1">−1</button>' +
          '<input type="number" class="dev-number-input" data-dev-field="streak" min="0" value="' + streak + '" />' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="streak" data-dev-step="1">+1</button>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="streak" data-dev-step="7">+7</button>' +
        '</div>' +

        '<div class="dev-field-group">' +
          '<span class="dev-field-label">Total days 🌱</span>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="dec" data-dev-field="totalGrowthDays" data-dev-step="1">−1</button>' +
          '<input type="number" class="dev-number-input" data-dev-field="totalGrowthDays" min="0" value="' + totalGrowthDays + '" />' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="totalGrowthDays" data-dev-step="1">+1</button>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="totalGrowthDays" data-dev-step="7">+7</button>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="totalGrowthDays" data-dev-step="30">+30</button>' +
        '</div>' +

        '<div class="dev-field-group dev-milestones">' +
          '<span class="dev-field-label">Jump to stage</span>' +
          milestoneBtns +
        '</div>' +

        '<div class="dev-task-readout">' +
          'Daily: stage ' + dailyStageIdx + ' · ' + dailyScale.toFixed(2) + 'x' +
          ' &nbsp;|&nbsp; Long-term: stage ' + ltStageIdx + ' · ' + ltScale.toFixed(2) + 'x' +
        '</div>' +
      '</div>'
    );
  }).join('');

  devPanelBody.innerHTML = summaryHtml +
    (rowsHtml || '<p class="dev-empty">No tasks yet — add one on the Tasks page to see it here.</p>');
}

if (devToggleBtn) {
  devToggleBtn.addEventListener('click', function () { setDevMode(!devModeEnabled); });
}
if (devPanelClose) {
  devPanelClose.addEventListener('click', function () { setDevMode(false); });
}

// Ctrl/Cmd + Shift + D also toggles the panel.
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    setDevMode(!devModeEnabled);
  }
});

// Quick +/-/jump buttons — click applies immediately.
if (devPanelBody) {
  devPanelBody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dev-action]');
    if (!btn) return;

    var field = btn.getAttribute('data-dev-field');
    if (field !== 'streak' && field !== 'totalGrowthDays') return;

    var taskId = getDevTaskId(btn);
    var task   = tasks.find(function (t) { return t.id === taskId; });
    if (!task) return;

    var action  = btn.getAttribute('data-dev-action');
    var current = Math.max(0, task[field] || 0);
    var next;

    if (action === 'set') {
      next = parseInt(btn.getAttribute('data-dev-value'), 10) || 0;
    } else {
      var step = parseInt(btn.getAttribute('data-dev-step'), 10) || 1;
      next = action === 'inc' ? current + step : Math.max(0, current - step);
    }

    task[field] = next;
    render(); // updates the garden AND rebuilds this panel — preview only, not saved
  });

  // Typed number-field edits — applied on change (blur / Enter), so
  // the panel doesn't rebuild itself out from under you mid-keystroke.
  devPanelBody.addEventListener('change', function (e) {
    var target = e.target;
    if (!target.matches('[data-dev-field]')) return;

    var taskId = getDevTaskId(target);
    var task   = tasks.find(function (t) { return t.id === taskId; });
    if (!task) return;

    var field = target.getAttribute('data-dev-field');

    if (field === 'completed') {
      toggleTask(taskId, target.checked); // real toggle — same as the Tasks page, does save
      return;
    }

    if (field === 'streak' || field === 'totalGrowthDays') {
      var val = Math.max(0, parseInt(target.value, 10) || 0);
      task[field] = val;
      render();
    }
  });
}

if (devActionRollover) {
  devActionRollover.addEventListener('click', function () {
    // Backdates lastResetDate by one day and runs the same boundary
    // logic a real midnight rollover uses — any task not currently
    // checked off will have its streak reset to 0 and get unchecked,
    // exactly like missing a real day would.
    lastResetDate = addDaysToDateString(getTodayString(), -1);
    checkDayRollover();
    devFlashButton(devActionRollover, 'Rolled ✓', 'Simulate day rollover', 1200);
  });
}

if (devActionLog) {
  devActionLog.addEventListener('click', function () {
    console.log('DISCIPLANT dev state:', {
      tasks: tasks, lastResetDate: lastResetDate, currentUserId: currentUserId,
      currentPage: currentPage, currentGardenTab: currentGardenTab,
    });
    console.table(tasks);
    devFlashButton(devActionLog, 'Logged ✓', 'Log to console', 1200);
  });
}

if (devActionCopy) {
  devActionCopy.addEventListener('click', function () {
    var payload = JSON.stringify({ tasks: tasks, lastResetDate: lastResetDate }, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload)
        .then(function () { devFlashButton(devActionCopy, 'Copied ✓', 'Copy state JSON', 1200); })
        .catch(function (err) { console.error('DISCIPLANT: copy failed:', err); });
    } else {
      console.log(payload);
    }
  });
}

// Reflect whatever was stored from a previous session.
setDevMode(devModeEnabled);


// ============================================
// Greenhouse — the plant skin page
// ============================================
// Every task is a plant, and every plant gets a card here. Tapping a
// card unfolds a skin section directly beneath it — full width of the
// grid — with one tile per skin available to that plant's species.
// Choosing a tile repaints the card AND the plant standing out in the
// garden, because both read the same task.skinId.
//
// This replaces the old per-row picker modal on the Tasks page; the
// pip button on a task row is now just a shortcut that jumps here.
// ============================================

var greenhouseGridEl  = document.getElementById('greenhouseGrid');
var greenhouseEmptyEl = document.getElementById('greenhouseEmpty');

// Which plant's skin section is currently unfolded (null = none).
var greenhouseOpenTaskId = null;

// Set for exactly one render when a card is freshly opened, so the
// section scrolls itself into view then — but never on the re-render
// that follows picking a skin, which would yank the page around.
var greenhouseScrollPending = false;

// Skins are always previewed fully grown — at seed stage almost every
// skin looks the same, which makes for a useless choice.
var SKIN_PREVIEW_STAGE = 3;

// The three-colour chip used on task rows, plant cards and skin tiles.
function skinPipHtml(skin) {
  var s = (skin && skin.swatch) || ['#8FBF7F', '#5C8267', '#274F3C'];
  return '<span class="skin-pip" style="background:linear-gradient(135deg,' +
         s[0] + ' 0 33%,' + s[1] + ' 33% 66%,' + s[2] + ' 66% 100%)"></span>';
}

function skinCountLabel(n) {
  return n + (n === 1 ? ' skin' : ' skins');
}


// ---- Opening / closing a plant's skin section --------------------

function toggleGreenhousePlant(taskId) {
  if (greenhouseOpenTaskId === taskId) {
    greenhouseOpenTaskId = null;          // tapping an open card closes it
  } else {
    greenhouseOpenTaskId    = taskId;
    greenhouseScrollPending = true;
  }
  renderGreenhouse();
}

function closeGreenhousePlant() {
  greenhouseOpenTaskId = null;
  renderGreenhouse();
}

// Used by the pip shortcut on the Tasks page: jump to the Greenhouse
// with this plant's skins already open.
function openPlantSkins(taskId) {
  greenhouseOpenTaskId    = taskId;
  greenhouseScrollPending = true;
  navigateTo('greenhouse');
}

function setTaskSkin(taskId, skinId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;
  task.skinId = skinId;
  saveData();
  // One render repaints the card here, the pip on the Tasks page and
  // the plant out in the garden — they all read task.skinId.
  render();
}


// ---- The skin section that unfolds under a card ------------------

function buildSkinDrawer(task, cat) {
  var drawer       = document.createElement('div');
  drawer.className = 'skin-drawer';
  drawer.id        = 'skin-drawer-' + task.id;

  var skins   = getSkinsFor(task.categoryId);
  // Compare against the *resolved* skin so the tile for the default is
  // still shown as selected when a task carries an unknown id.
  var current = getSkin(task.categoryId, getTaskSkinId(task)).id;

  var tiles = skins.map(function (skin) {
    var selected = (skin.id === current);
    return (
      '<button type="button" class="skin-tile' + (selected ? ' selected' : '') + '"' +
        ' data-skin-id="' + skin.id + '"' +
        ' aria-pressed="' + (selected ? 'true' : 'false') + '">' +
        '<span class="skin-tile-art">' +
          getPlantSVG(task.categoryId, SKIN_PREVIEW_STAGE, skin.id, 74) +
        '</span>' +
        '<span class="skin-tile-name">' + skinPipHtml(skin) +
          escapeHtml(skin.name) + '</span>' +
        '<span class="skin-tile-note">' + escapeHtml(skin.note || '') + '</span>' +
      '</button>'
    );
  }).join('');

  drawer.innerHTML =
    '<div class="skin-drawer-head">' +
      '<div class="skin-drawer-heading">' +
        '<h3 class="skin-drawer-title">' + escapeHtml(task.text) + '</h3>' +
        '<p class="skin-drawer-subtitle">' + cat.emoji + ' ' + escapeHtml(cat.species) +
          ' \u00b7 ' + skinCountLabel(skins.length) + ' \u00b7 shown at full growth</p>' +
      '</div>' +
      '<button type="button" class="skin-drawer-close" aria-label="Close skins">\u2715</button>' +
    '</div>' +
    '<div class="skin-grid">' + tiles + '</div>';

  drawer.querySelectorAll('.skin-tile').forEach(function (tile) {
    tile.addEventListener('click', function () {
      setTaskSkin(task.id, tile.getAttribute('data-skin-id'));
    });
  });

  var closeBtn = drawer.querySelector('.skin-drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeGreenhousePlant);

  return drawer;
}


// ---- The page ----------------------------------------------------

function renderGreenhouse() {
  if (!greenhouseGridEl) return;

  // A task can be removed on the Tasks page while its skin section is
  // open here — don't leave a dangling id behind.
  if (greenhouseOpenTaskId !== null &&
      !tasks.some(function (t) { return t.id === greenhouseOpenTaskId; })) {
    greenhouseOpenTaskId = null;
  }

  greenhouseGridEl.innerHTML = '';
  if (greenhouseEmptyEl) greenhouseEmptyEl.classList.toggle('hidden', tasks.length > 0);

  tasks.forEach(function (task) {
    var cat  = getCategoryById(task.categoryId);
    var skin = getSkin(task.categoryId, getTaskSkinId(task));
    var open = (task.id === greenhouseOpenTaskId);

    var card              = document.createElement('button');
    card.type             = 'button';
    card.className        = 'plant-card' + (open ? ' open' : '');
    card.dataset.category = task.categoryId;
    card.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.setAttribute('aria-controls', 'skin-drawer-' + task.id);
    card.title = 'Change how this ' + cat.species + ' looks';

    card.innerHTML =
      '<span class="plant-card-art">' +
        getPlantSVG(task.categoryId, SKIN_PREVIEW_STAGE, skin.id, 84) +
      '</span>' +
      '<span class="plant-card-name">' + escapeHtml(task.text) + '</span>' +
      '<span class="plant-card-species">' + cat.emoji + ' ' +
        escapeHtml(cat.species) + '</span>' +
      '<span class="plant-card-skin">' + skinPipHtml(skin) +
        escapeHtml(skin.name) + '</span>';

    (function (id) {
      card.addEventListener('click', function () { toggleGreenhousePlant(id); });
    }(task.id));

    greenhouseGridEl.appendChild(card);

    // The section spans the full grid width, so it always lands on its
    // own row directly beneath the card that opened it.
    if (open) greenhouseGridEl.appendChild(buildSkinDrawer(task, cat));
  });

  if (greenhouseScrollPending && greenhouseOpenTaskId !== null) {
    greenhouseScrollPending = false;
    var openDrawer = document.getElementById('skin-drawer-' + greenhouseOpenTaskId);
    if (openDrawer && openDrawer.scrollIntoView) {
      requestAnimationFrame(function () {
        openDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }
}

// Escape closes an open skin section.
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && currentPage === 'greenhouse' && greenhouseOpenTaskId !== null) {
    closeGreenhousePlant();
  }
});