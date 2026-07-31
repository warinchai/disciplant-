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
//    category subpages). All show/hide via JS, no reload.
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
    name:        'Chores & Finance',
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
    id:          'misc',
    name:        'Misc',
    species:     'Clover',
    emoji:       '✨',
    dailyStages: ['🌱', '🌿', '🍀'],
    streakStages: [
      { min: 0,  emoji: '🌱' },
      { min: 3,  emoji: '🌿' },
      { min: 14, emoji: '☘️' },
      { min: 60, emoji: '🍀' },
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
      'Track today\'s spending',
      'Do a load of laundry',
      'Plan tomorrow\'s schedule',
      'Check your budget or pay a bill',
    ],
  },
  misc: {
    lore: 'The four-leaf clover stands for luck and adaptability — for everything that matters but doesn\'t fit neatly into a single category.',
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

  // Scroll the destination page back to top
  if (page === 'tasks'  && pageTasksEl)  pageTasksEl.scrollTop  = 0;
  if (page === 'garden' && pageGardenEl) pageGardenEl.scrollTop = 0;
  if (page === 'home'   && pageHomeEl)   pageHomeEl.scrollTop   = 0;
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
document.getElementById('tasks-nav-home').addEventListener('click',   function () { navigateTo('home');   });
document.getElementById('tasks-nav-garden').addEventListener('click', function () { navigateTo('garden'); });

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
// Step 1: Sign the visitor in anonymously
// ============================================
auth.signInAnonymously().catch(function (error) {
  console.error('Sign-in failed:', error);
});

// ============================================
// Step 2: Listen to this user's data in real time
// ============================================
auth.onAuthStateChanged(function (user) {
  if (!user) return;
  if (currentUserId === user.uid && unsubscribeSnapshot) return;

  currentUserId = user.uid;
  console.log('Signed in as:', currentUserId);

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
              completed:         t.completed           || false,
              streak:            t.streak              || 0,
              lastCleanDate:     t.lastCleanDate        || null,
              prevLastCleanDate: t.prevLastCleanDate    || null,
              totalGrowthDays:    t.totalGrowthDays       || 0,
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
      completed:         t.completed,
      streak:            t.streak || 0,
      lastCleanDate:     t.lastCleanDate || null,
      prevLastCleanDate: t.prevLastCleanDate || null,
      totalGrowthDays:    t.totalGrowthDays || 0,
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
    completed:         false,
    streak:            0,
    lastCleanDate:     null,
    prevLastCleanDate: null,
    totalGrowthDays:    0,
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

  if (newChecked && !wasCompleted) {
    // Fresh completion — grow both streak and size, once.
    task.streak          = (task.streak || 0) + 1;
    task.totalGrowthDays = (task.totalGrowthDays || 0) + 1;
  } else if (!newChecked && wasCompleted) {
    // Undoing a completion — reverse today's credit for both.
    task.streak          = Math.max(0, (task.streak || 0) - 1);
    task.totalGrowthDays = Math.max(0, (task.totalGrowthDays || 0) - 1);
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
    '<path d="M29,122 C29,120.4 33.9,119 40,119 C46.1,119 51,120.4 51,122 C51,123.6 46.1,125 40,125 C33.9,125 29,123.6 29,122 Z" fill="rgba(0,0,0,0.14)"/><path d="M40,107 C36.5,107 34.5,110.2 34.5,114 C34.5,117.9 36.5,121 40,121 C43.5,121 45.5,117.9 45.5,114 C45.5,110.2 43.5,107 40,107 Z" fill="hsl(35,38%,68%)"/><path d="M40,107 C37,107 34.5,109.8 34.5,113 L40,113.4 Z" fill="hsl(35,38%,56%)"/><path d="M33,107 C33,104.8 36.1,103.5 40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 C36.1,110.5 33,109.2 33,107 Z" fill="hsl(20,30%,45%)"/><path d="M40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 Z" fill="hsl(20,30%,35%)"/><path d="M38.7,99 C38.7,97.6 39.2,96.5 40,96.5 C40.8,96.5 41.3,97.6 41.3,99 L41.3,104 L38.7,104 Z" fill="hsl(20,30%,35%)"/>',

    // Stage 1: Seedling, two round leaves
    '<path d="M26,122 C26,120.1 32.3,118.5 40,118.5 C47.7,118.5 54,120.1 54,122 C54,123.9 47.7,125.5 40,125.5 C32.3,125.5 26,123.9 26,122 Z" fill="rgba(0,0,0,0.14)"/><path d="M39,122 C38.8,113 39,104 39.6,96 C39.7,95 40.3,95 40.4,96 C41,104 41.2,113 41,122 Z" fill="hsl(20,30%,45%)"/><path d="M40.4,96 C41,104 41.2,113 41,122 L40.2,122 C40.4,113 40.2,104 39.9,96 Z" fill="hsl(20,30%,35%)"/><g transform="translate(29,95) rotate(-22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" fill="hsl(145,25%,58%)"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" fill="hsl(145,25%,46%)"/></g><g transform="translate(51,92) rotate(22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" fill="hsl(145,25%,55%)"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" fill="hsl(145,25%,43%)"/></g>',

    // Stage 2: Young oak — bezier canopy cluster, split-shaded trunk & branches
    '<path d="M22,122 C22,119.5 30,117.5 40,117.5 C50,117.5 58,119.5 58,122 C58,124.5 50,126.5 40,126.5 C30,126.5 22,124.5 22,122 Z" fill="rgba(0,0,0,0.15)"/><path d="M40,50.2 C38.8,61.2 37.0,94.0 35.6,118 L40,118 Z" fill="hsl(8,30%,42%)"/><path d="M40,50.2 C41.2,61.2 43.0,94.0 44.4,118 L40,118 Z" fill="hsl(9,33%,32%)"/><path d="M40,38.47 C40.67,40.22 44.67,45.91 44,49 C43.33,52.09 36.17,54.33 36,57 C35.83,59.67 42.33,61.44 43,65 C43.67,68.56 40.5,76.11 40,78.33 C39.58,78.51 39.13,78.65 38.7,78.72 C38.26,78.78 37.81,78.79 37.38,78.72 C36.95,78.66 36.52,78.51 36.12,78.32 C35.72,78.13 35.34,77.86 34.97,77.57 C34.61,77.29 34.28,76.94 33.96,76.6 C33.63,76.27 33.34,75.9 33.04,75.57 C32.75,75.24 32.47,74.91 32.18,74.62 C31.88,74.34 31.59,74.08 31.28,73.87 C30.96,73.65 30.63,73.48 30.27,73.33 C29.91,73.18 29.53,73.08 29.13,72.97 C28.73,72.86 28.29,72.78 27.87,72.67 C27.44,72.55 26.99,72.45 26.58,72.3 C26.16,72.14 25.74,71.97 25.37,71.74 C25,71.51 24.65,71.25 24.37,70.93 C24.08,70.62 23.84,70.26 23.67,69.87 C23.49,69.48 23.38,69.04 23.3,68.6 C23.23,68.15 23.23,67.68 23.24,67.22 C23.25,66.76 23.31,66.28 23.36,65.83 C23.4,65.38 23.48,64.94 23.52,64.53 C23.55,64.11 23.59,63.71 23.58,63.34 C23.56,62.96 23.51,62.61 23.42,62.26 C23.33,61.91 23.19,61.58 23.03,61.24 C22.87,60.9 22.66,60.57 22.45,60.22 C22.25,59.87 22.01,59.51 21.81,59.14 C21.61,58.77 21.4,58.39 21.27,58 C21.13,57.61 21.01,57.2 20.98,56.8 C20.94,56.4 20.96,55.99 21.05,55.61 C21.14,55.22 21.31,54.83 21.52,54.47 C21.73,54.12 22.01,53.77 22.31,53.46 C22.61,53.14 22.97,52.85 23.32,52.58 C23.66,52.3 24.03,52.06 24.36,51.81 C24.7,51.56 25.03,51.33 25.3,51.08 C25.58,50.84 25.83,50.6 26.04,50.32 C26.24,50.05 26.4,49.77 26.53,49.45 C26.67,49.14 26.75,48.8 26.84,48.44 C26.93,48.08 26.98,47.69 27.07,47.3 C27.16,46.92 27.23,46.51 27.35,46.12 C27.47,45.74 27.62,45.36 27.8,45.01 C27.98,44.66 28.2,44.32 28.45,44.04 C28.7,43.75 29,43.5 29.31,43.29 C29.63,43.08 29.99,42.93 30.35,42.8 C30.72,42.68 31.11,42.6 31.5,42.54 C31.88,42.47 32.28,42.45 32.66,42.4 C33.04,42.36 33.41,42.33 33.77,42.26 C34.13,42.2 34.47,42.12 34.8,42 C35.13,41.88 35.45,41.72 35.77,41.52 C36.09,41.33 36.4,41.09 36.72,40.83 C37.05,40.58 37.38,40.27 37.73,39.99 C38.07,39.71 38.43,39.4 38.81,39.15 C39.19,38.89 39.59,38.64 40,38.47 Z" fill="hsl(61,45%,55%)"/><path d="M40,38.47 C40.41,38.29 40.83,38.16 41.25,38.11 C41.67,38.07 42.1,38.09 42.5,38.19 C42.91,38.3 43.31,38.49 43.68,38.73 C44.04,38.97 44.39,39.3 44.71,39.64 C45.03,39.99 45.32,40.4 45.59,40.8 C45.86,41.19 46.09,41.63 46.33,42.01 C46.57,42.4 46.77,42.79 47,43.12 C47.23,43.44 47.45,43.74 47.7,43.99 C47.96,44.23 48.22,44.42 48.52,44.58 C48.81,44.74 49.14,44.84 49.49,44.94 C49.84,45.04 50.22,45.09 50.61,45.17 C51.01,45.25 51.43,45.3 51.83,45.4 C52.24,45.5 52.66,45.6 53.04,45.76 C53.41,45.92 53.77,46.12 54.06,46.37 C54.36,46.61 54.61,46.91 54.81,47.24 C55.01,47.57 55.15,47.94 55.25,48.32 C55.35,48.7 55.39,49.12 55.41,49.53 C55.44,49.93 55.41,50.35 55.41,50.75 C55.41,51.15 55.37,51.54 55.39,51.91 C55.4,52.28 55.41,52.63 55.48,52.97 C55.55,53.31 55.66,53.62 55.81,53.94 C55.96,54.26 56.16,54.56 56.38,54.88 C56.6,55.19 56.88,55.5 57.15,55.83 C57.42,56.17 57.73,56.51 57.99,56.87 C58.25,57.23 58.53,57.61 58.73,58 C58.94,58.39 59.12,58.8 59.22,59.21 C59.32,59.62 59.37,60.04 59.35,60.44 C59.32,60.85 59.22,61.26 59.07,61.64 C58.92,62.02 58.7,62.39 58.46,62.74 C58.22,63.09 57.91,63.41 57.62,63.73 C57.34,64.04 57.01,64.33 56.73,64.62 C56.45,64.92 56.16,65.2 55.93,65.5 C55.69,65.79 55.48,66.09 55.31,66.42 C55.15,66.75 55.02,67.09 54.92,67.47 C54.81,67.84 54.75,68.24 54.68,68.67 C54.61,69.09 54.57,69.55 54.5,70 C54.43,70.45 54.36,70.93 54.24,71.38 C54.12,71.82 53.99,72.28 53.79,72.68 C53.59,73.09 53.35,73.48 53.07,73.8 C52.78,74.12 52.44,74.4 52.07,74.62 C51.71,74.84 51.29,75 50.86,75.11 C50.43,75.23 49.97,75.28 49.52,75.32 C49.07,75.35 48.6,75.34 48.16,75.34 C47.71,75.34 47.27,75.31 46.86,75.32 C46.44,75.33 46.04,75.34 45.65,75.4 C45.27,75.46 44.91,75.56 44.54,75.69 C44.18,75.83 43.83,76.01 43.48,76.22 C43.12,76.42 42.76,76.68 42.39,76.92 C42.02,77.17 41.64,77.45 41.24,77.68 C40.84,77.92 40.42,78.16 40,78.33 C40.5,76.11 43.67,68.56 43,65 C42.33,61.44 35.83,59.67 36,57 C36.17,54.33 43.33,52.09 44,49 C44.67,45.91 40.67,40.22 40,38.47 Z" fill="hsl(58,38%,42%)"/><path d="M40,68 C39,67.17 35.75,64.54 34,63 C32.25,61.46 30.24,59.45 29.49,58.73" fill="none" stroke="hsl(9,33%,32%)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40,68 C41,67 44.13,63.4 46,62 C47.87,60.6 50.34,59.98 51.2,59.57" fill="none" stroke="hsl(9,33%,32%)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',

    // Stage 3: Full spreading oak — layered bezier canopy cloud-cluster with
    // split-shaded (light/shadow sage) lobes, and a tapering split-shaded
    // trunk that forks into a visible branch skeleton reaching into the crown
    '<path d="M17,122 C17,119 27,117 40,117 C53,117 63,119 63,122 C63,125 53,127 40,127 C27,127 17,125 17,122 Z" fill="rgba(0,0,0,0.16)"/><path d="M40,31.9 C38.4,47.9 35.5,88.0 33.4,118 L40,118 Z" fill="hsl(8,30%,40%)"/><path d="M40,31.9 C41.6,47.9 44.5,88.0 46.6,118 L40,118 Z" fill="hsl(9,33%,30%)"/><path d="M40,15.16 C40.83,17.63 45.83,25.53 45,30 C44.17,34.47 35.17,38 35,42 C34.83,46 43.67,50.67 44,54 C44.33,57.33 37.67,58.89 37,62 C36.33,65.11 39.5,70.88 40,72.66 C39.5,72.4 39.02,72.12 38.54,71.9 C38.06,71.69 37.6,71.5 37.12,71.39 C36.65,71.27 36.18,71.2 35.69,71.19 C35.21,71.17 34.71,71.23 34.2,71.3 C33.68,71.38 33.15,71.51 32.6,71.63 C32.05,71.75 31.47,71.9 30.9,72 C30.33,72.11 29.73,72.21 29.16,72.24 C28.59,72.26 28.01,72.25 27.46,72.16 C26.92,72.06 26.39,71.89 25.91,71.65 C25.43,71.41 24.98,71.08 24.59,70.7 C24.19,70.32 23.84,69.85 23.53,69.36 C23.22,68.87 22.97,68.31 22.74,67.76 C22.5,67.22 22.32,66.63 22.12,66.08 C21.93,65.53 21.77,64.97 21.57,64.47 C21.38,63.96 21.19,63.48 20.95,63.05 C20.72,62.62 20.46,62.23 20.15,61.87 C19.84,61.52 19.49,61.22 19.1,60.93 C18.71,60.64 18.26,60.39 17.81,60.12 C17.35,59.86 16.85,59.62 16.37,59.34 C15.89,59.07 15.39,58.79 14.94,58.47 C14.49,58.15 14.04,57.8 13.68,57.41 C13.31,57.02 12.99,56.59 12.75,56.13 C12.52,55.67 12.35,55.16 12.27,54.65 C12.19,54.13 12.19,53.57 12.25,53.02 C12.31,52.46 12.46,51.89 12.63,51.33 C12.8,50.78 13.04,50.22 13.26,49.68 C13.48,49.15 13.74,48.63 13.95,48.13 C14.16,47.62 14.37,47.15 14.52,46.68 C14.66,46.21 14.77,45.77 14.8,45.32 C14.84,44.87 14.82,44.44 14.75,44 C14.68,43.56 14.54,43.12 14.38,42.66 C14.23,42.2 14.01,41.73 13.83,41.25 C13.64,40.77 13.41,40.27 13.25,39.76 C13.09,39.26 12.93,38.74 12.86,38.23 C12.79,37.72 12.76,37.21 12.82,36.72 C12.88,36.23 13.01,35.74 13.23,35.3 C13.44,34.86 13.74,34.44 14.09,34.05 C14.44,33.67 14.88,33.33 15.33,33.02 C15.78,32.7 16.3,32.43 16.79,32.18 C17.29,31.92 17.82,31.7 18.3,31.47 C18.78,31.24 19.26,31.04 19.67,30.8 C20.09,30.56 20.47,30.33 20.8,30.05 C21.12,29.77 21.39,29.47 21.62,29.12 C21.86,28.77 22.03,28.39 22.2,27.97 C22.36,27.55 22.48,27.09 22.61,26.61 C22.75,26.14 22.85,25.62 22.99,25.11 C23.13,24.6 23.27,24.06 23.45,23.57 C23.64,23.07 23.85,22.57 24.12,22.14 C24.38,21.71 24.69,21.3 25.04,20.97 C25.39,20.64 25.8,20.36 26.23,20.14 C26.65,19.93 27.13,19.79 27.61,19.68 C28.09,19.58 28.6,19.54 29.1,19.51 C29.6,19.48 30.11,19.51 30.6,19.51 C31.09,19.5 31.57,19.53 32.04,19.5 C32.5,19.47 32.95,19.43 33.39,19.32 C33.83,19.22 34.24,19.08 34.66,18.88 C35.08,18.68 35.48,18.43 35.9,18.14 C36.32,17.85 36.74,17.51 37.18,17.17 C37.62,16.83 38.07,16.44 38.54,16.11 C39.01,15.77 39.5,15.42 40,15.16 Z" fill="hsl(61,45%,53%)"/><path d="M40,15.16 C40.5,14.9 41.03,14.66 41.54,14.52 C42.06,14.39 42.6,14.32 43.12,14.35 C43.63,14.38 44.15,14.51 44.64,14.73 C45.12,14.94 45.6,15.26 46.03,15.62 C46.47,15.99 46.87,16.46 47.25,16.93 C47.63,17.41 47.97,17.95 48.3,18.47 C48.62,18.98 48.91,19.53 49.21,20.02 C49.5,20.51 49.77,20.99 50.07,21.39 C50.36,21.8 50.65,22.16 50.98,22.46 C51.3,22.76 51.64,22.99 52.02,23.18 C52.4,23.36 52.82,23.48 53.26,23.58 C53.7,23.69 54.18,23.74 54.67,23.8 C55.16,23.87 55.69,23.91 56.2,23.99 C56.71,24.08 57.24,24.16 57.73,24.31 C58.22,24.45 58.71,24.62 59.14,24.86 C59.56,25.1 59.96,25.39 60.28,25.74 C60.6,26.09 60.86,26.5 61.06,26.94 C61.27,27.38 61.4,27.88 61.5,28.38 C61.6,28.88 61.63,29.42 61.66,29.93 C61.7,30.45 61.68,30.98 61.7,31.47 C61.72,31.96 61.73,32.45 61.79,32.9 C61.85,33.35 61.93,33.77 62.08,34.17 C62.23,34.57 62.43,34.93 62.68,35.29 C62.94,35.65 63.26,35.99 63.61,36.33 C63.96,36.67 64.38,37 64.79,37.36 C65.2,37.71 65.66,38.07 66.08,38.46 C66.5,38.84 66.93,39.25 67.29,39.68 C67.65,40.11 67.98,40.56 68.22,41.03 C68.46,41.5 68.64,42 68.73,42.49 C68.82,42.99 68.82,43.5 68.75,44 C68.68,44.5 68.51,45 68.31,45.48 C68.11,45.97 67.82,46.44 67.53,46.89 C67.24,47.35 66.9,47.78 66.59,48.21 C66.28,48.64 65.95,49.04 65.68,49.46 C65.41,49.87 65.16,50.27 64.98,50.69 C64.8,51.11 64.66,51.54 64.58,51.99 C64.5,52.44 64.49,52.91 64.5,53.41 C64.52,53.9 64.59,54.43 64.66,54.98 C64.73,55.53 64.84,56.11 64.91,56.69 C64.97,57.27 65.05,57.88 65.06,58.47 C65.07,59.06 65.06,59.66 64.96,60.21 C64.86,60.76 64.71,61.3 64.48,61.79 C64.25,62.27 63.95,62.72 63.59,63.1 C63.23,63.49 62.79,63.82 62.33,64.1 C61.86,64.38 61.33,64.6 60.8,64.8 C60.27,64.99 59.69,65.13 59.15,65.27 C58.61,65.41 58.05,65.51 57.53,65.65 C57.02,65.79 56.52,65.92 56.06,66.1 C55.59,66.28 55.17,66.48 54.77,66.74 C54.37,67 54.01,67.31 53.66,67.67 C53.31,68.02 53,68.44 52.67,68.87 C52.35,69.31 52.04,69.8 51.7,70.28 C51.36,70.75 51.02,71.27 50.64,71.73 C50.27,72.18 49.87,72.65 49.43,73.03 C49,73.42 48.53,73.77 48.04,74.02 C47.55,74.27 47.03,74.46 46.5,74.56 C45.96,74.65 45.4,74.66 44.85,74.6 C44.29,74.54 43.72,74.39 43.17,74.2 C42.62,74.02 42.07,73.75 41.55,73.49 C41.02,73.23 40.5,72.92 40,72.66 C39.5,70.88 36.33,65.11 37,62 C37.67,58.89 44.33,57.33 44,54 C43.67,50.67 34.83,46 35,42 C35.17,38 44.17,34.47 45,30 C45.83,25.53 40.83,17.63 40,15.16 Z" fill="hsl(58,38%,40%)"/><path d="M40,62 C38.33,61.17 32.52,59.91 30,57 C27.48,54.09 25.75,46.61 24.89,44.53" fill="none" stroke="hsl(9,33%,30%)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M40,62 C41.67,61 47.25,58.71 50,56 C52.75,53.29 55.43,47.45 56.52,45.74" fill="none" stroke="hsl(9,33%,30%)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'
  ],

  // ---- SUNFLOWER (Exercise) ----
  exercise: [
    // Stage 0: Single seed
    '<ellipse cx="40" cy="121" rx="9" ry="2.5" fill="rgba(0,0,0,0.12)"/>' +
    '<ellipse cx="40" cy="113" rx="5" ry="7" fill="#C8A030"/>' +
    '<line x1="38" y1="109" x2="42" y2="109" stroke="#908018" stroke-width="1.5"/>' +
    '<line x1="37" y1="112" x2="43" y2="112" stroke="#908018" stroke-width="1.5"/>' +
    '<line x1="37" y1="115" x2="43" y2="115" stroke="#908018" stroke-width="1.5"/>',

    // Stage 1: Sprout with leaves and small bud
    '<ellipse cx="40" cy="122" rx="13" ry="3.5" fill="rgba(0,0,0,0.14)"/>' +
    '<rect x="39" y="95" width="2" height="27" rx="1" fill="#6A9A30"/>' +
    '<ellipse cx="28" cy="103" rx="12" ry="5" fill="#8FBF7F" transform="rotate(-28,28,103)"/>' +
    '<ellipse cx="52" cy="99" rx="12" ry="5" fill="#7ABF50" transform="rotate(28,52,99)"/>' +
    '<circle cx="40" cy="93" r="5.5" fill="#F5C840"/>' +
    '<circle cx="40" cy="93" r="3" fill="#D4A010"/>',

    // Stage 2: Blooming sunflower
    '<ellipse cx="40" cy="122" rx="15" ry="4" fill="rgba(0,0,0,0.15)"/>' +
    '<rect x="39" y="80" width="2" height="42" rx="1" fill="#5A8830"/>' +
    '<ellipse cx="26" cy="96" rx="14" ry="5.5" fill="#7ABF50" transform="rotate(-25,26,96)"/>' +
    '<ellipse cx="54" cy="91" rx="14" ry="5.5" fill="#8FBF7F" transform="rotate(25,54,91)"/>' +
    '<g transform="translate(40,76)">' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#F2B84B" transform="rotate(0)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#E8A020" transform="rotate(45)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#F2B84B" transform="rotate(90)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#E8A020" transform="rotate(135)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#F2B84B" transform="rotate(180)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#E8A020" transform="rotate(225)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#F2B84B" transform="rotate(270)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" fill="#E8A020" transform="rotate(315)"/>' +
    '<circle cx="0" cy="0" r="10" fill="#5C3A1A"/>' +
    '<circle cx="0" cy="0" r="6.5" fill="#3C2210"/>' +
    '</g>',

    // Stage 3: Tall full sunflower
    '<ellipse cx="40" cy="122" rx="16" ry="4.5" fill="rgba(0,0,0,0.16)"/>' +
    '<rect x="38.5" y="66" width="3" height="56" rx="1.5" fill="#4A7820"/>' +
    '<ellipse cx="22" cy="88" rx="17" ry="6.5" fill="#6AAF40" transform="rotate(-22,22,88)"/>' +
    '<ellipse cx="58" cy="82" rx="17" ry="6.5" fill="#7ABF50" transform="rotate(22,58,82)"/>' +
    '<g transform="translate(40,58)">' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#F2B84B" transform="rotate(0)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#E8A010" transform="rotate(45)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#F2B84B" transform="rotate(90)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#E8A010" transform="rotate(135)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#F2B84B" transform="rotate(180)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#E8A010" transform="rotate(225)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#F2B84B" transform="rotate(270)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" fill="#E8A010" transform="rotate(315)"/>' +
    '<circle cx="0" cy="0" r="14" fill="#5C3A1A"/>' +
    '<circle cx="0" cy="0" r="10" fill="#3C2210"/>' +
    '<circle cx="-4" cy="-3" r="2.5" fill="#704820"/>' +
    '<circle cx="4" cy="-2" r="2.5" fill="#704820"/>' +
    '<circle cx="0" cy="5" r="2.5" fill="#704820"/>' +
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
    '<ellipse cx="40" cy="121" rx="14" ry="4" fill="rgba(40,100,50,0.3)"/>' +
    '<ellipse cx="40" cy="119" rx="12" ry="4.5" fill="#3A7A4A"/>' +
    '<ellipse cx="40" cy="117" rx="11" ry="3.5" fill="#4A9A5A"/>' +
    '<path d="M40.0,118.0 C36.4,114.4 36.7,108.2 40.0,105.0 L40.0,118.0 Z" fill="#F5BCC6"/>' +
    '<path d="M40.0,118.0 C43.6,114.4 43.3,108.2 40.0,105.0 L40.0,118.0 Z" fill="#FAD1D8"/>',

    // Stage 1: Pad with stem + closed bud (3 tight, upright petal tips)
    '<ellipse cx="40" cy="121" rx="17" ry="4.5" fill="rgba(40,100,50,0.28)"/>' +
    '<ellipse cx="40" cy="119" rx="15" ry="5" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="117" rx="13.5" ry="4" fill="#3A8A4A"/>' +
    '<rect x="39" y="103" width="2" height="16" rx="1" fill="#3A7A4A"/>' +
    '<path d="M40.0,103.0 C34.8,98.6 33.7,89.0 36.9,83.2 L40.0,103.0 Z" fill="#F5BCC6"/>' +
    '<path d="M40.0,103.0 C43.5,97.2 41.7,87.7 36.9,83.2 L40.0,103.0 Z" fill="#FAD1D8"/>' +
    '<path d="M40.0,103.0 C35.6,97.8 36.0,88.2 40.0,83.0 L40.0,103.0 Z" fill="#F5BCC6"/>' +
    '<path d="M40.0,103.0 C44.4,97.8 44.0,88.2 40.0,83.0 L40.0,103.0 Z" fill="#FAD1D8"/>' +
    '<path d="M40.0,103.0 C36.5,97.2 38.3,87.7 43.1,83.2 L40.0,103.0 Z" fill="#F5BCC6"/>' +
    '<path d="M40.0,103.0 C45.2,98.6 46.3,89.0 43.1,83.2 L40.0,103.0 Z" fill="#FAD1D8"/>',

    // Stage 2: Half-open lotus -- 2 back petals + 3 front petals + carpel,
    // same shading pairs the full bloom uses (mid pink / light pink)
    '<ellipse cx="40" cy="121" rx="20" ry="5" fill="rgba(40,100,50,0.3)"/>' +
    '<ellipse cx="40" cy="119" rx="18" ry="5.5" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="117" rx="16" ry="4.5" fill="#3A8A4A"/>' +
    '<ellipse cx="26" cy="120" rx="9" ry="3" fill="#3A7A4A"/>' +
    '<ellipse cx="54" cy="120" rx="9" ry="3" fill="#4A9A5A"/>' +
    '<rect x="39" y="89" width="2" height="30" rx="1" fill="#2A6A3A"/>' +
    '<path d="M40.0,89.0 C30.5,82.4 24.5,67.7 26.6,58.9 L40.0,89.0 Z" fill="#E28D9B"/>' +
    '<path d="M40.0,89.0 C41.5,77.5 34.6,63.2 26.6,58.9 L40.0,89.0 Z" fill="#EEA0AD"/>' +
    '<path d="M40.0,89.0 C38.5,77.5 45.4,63.2 53.4,58.9 L40.0,89.0 Z" fill="#E28D9B"/>' +
    '<path d="M40.0,89.0 C49.5,82.4 55.5,67.7 53.4,58.9 L40.0,89.0 Z" fill="#EEA0AD"/>' +
    '<path d="M40.0,89.0 C33.5,82.6 31.4,69.8 34.8,62.5 L40.0,89.0 Z" fill="#F5BCC6"/>' +
    '<path d="M40.0,89.0 C43.7,80.6 40.8,67.9 34.8,62.5 L40.0,89.0 Z" fill="#FAD1D8"/>' +
    '<path d="M40.0,89.0 C34.8,81.4 35.2,68.5 40.0,62.0 L40.0,89.0 Z" fill="#F5BCC6"/>' +
    '<path d="M40.0,89.0 C45.2,81.4 44.8,68.5 40.0,62.0 L40.0,89.0 Z" fill="#FAD1D8"/>' +
    '<path d="M40.0,89.0 C36.3,80.6 39.2,67.9 45.2,62.5 L40.0,89.0 Z" fill="#F5BCC6"/>' +
    '<path d="M40.0,89.0 C46.5,82.6 48.6,69.8 45.2,62.5 L40.0,89.0 Z" fill="#FAD1D8"/>' +
    '<ellipse cx="40" cy="83" rx="5" ry="3.8" fill="#E8D27A"/>' +
    '<circle cx="40" cy="82" r="2.2" fill="#D9C05C"/>',

    // Stage 3: Full open lotus -- 3 clean layers (3 back / 4 middle /
    // 4 front = 11 petals total), each a sharp-tipped vesica split into
    // a light/dark half, fanned from one shared base joint so petals
    // stay clearly separated instead of bleeding together. Own stem +
    // 2 leaves, pink/green palette (no purple).
    '<ellipse cx="40" cy="121" rx="24" ry="5.5" fill="rgba(40,100,50,0.32)"/>' +
    '<ellipse cx="40" cy="119" rx="22" ry="6" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="117" rx="20" ry="5" fill="#3A8A4A"/>' +
    '<ellipse cx="22" cy="120" rx="11" ry="3.5" fill="#3A7A4A"/>' +
    '<ellipse cx="58" cy="120" rx="11" ry="3.5" fill="#4A9A5A"/>' +
    '<g transform="translate(8.5,36) scale(0.21)">' +
    '<path d="M158.6,273.9 C180.8,235.9 234.0,226.3 263.8,249.6 L158.6,273.9 Z" fill="#40965D"/>' +
    '<path d="M158.6,273.9 C195.2,298.3 247.3,283.6 263.8,249.6 L158.6,273.9 Z" fill="#64B47F"/>' +
    '<path d="M166.5,330.7 C139.8,357.8 93.9,354.0 74.6,327.5 L166.5,330.7 Z" fill="#87C59B"/>' +
    '<path d="M166.5,330.7 C141.8,301.9 95.7,302.5 74.6,327.5 L166.5,330.7 Z" fill="#64B47F"/>' +
    '<path d="M150.0,213.0 C160.6,223.9 173.9,323.5 178.5,416.0 L150.0,213.0 Z" fill="#40965D"/>' +
    '<path d="M150.0,213.0 C142.8,226.4 157.5,325.8 178.5,416.0 L150.0,213.0 Z" fill="#64B47F"/>' +
    '<path d="M150.0,213.0 C87.4,172.6 44.9,93.5 52.5,44.1 L150.0,213.0 Z" fill="#DA4E65"/>' +
    '<path d="M150.0,213.0 C146.3,138.6 99.1,62.3 52.5,44.1 L150.0,213.0 Z" fill="#D77585"/>' +
    '<path d="M150.0,213.0 C116.0,146.7 118.7,57.0 150.0,18.0 L150.0,213.0 Z" fill="#DA4E65"/>' +
    '<path d="M150.0,213.0 C184.0,146.7 181.3,57.0 150.0,18.0 L150.0,213.0 Z" fill="#D77585"/>' +
    '<path d="M150.0,213.0 C153.7,138.6 200.9,62.3 247.5,44.1 L150.0,213.0 Z" fill="#DA4E65"/>' +
    '<path d="M150.0,213.0 C212.6,172.6 255.1,93.5 247.5,44.1 L150.0,213.0 Z" fill="#D77585"/>' +
    '<path d="M150.0,213.0 C83.4,210.3 22.9,164.4 14.8,118.4 L150.0,213.0 Z" fill="#E28D9B"/>' +
    '<path d="M150.0,213.0 C124.7,151.3 60.9,110.2 14.8,118.4 L150.0,213.0 Z" fill="#EEA0AD"/>' +
    '<path d="M150.0,213.0 C98.4,170.8 77.7,97.7 99.0,56.1 L150.0,213.0 Z" fill="#E28D9B"/>' +
    '<path d="M150.0,213.0 C166.9,148.5 140.7,77.2 99.0,56.1 L150.0,213.0 Z" fill="#EEA0AD"/>' +
    '<path d="M150.0,213.0 C133.1,148.5 159.3,77.2 201.0,56.1 L150.0,213.0 Z" fill="#E28D9B"/>' +
    '<path d="M150.0,213.0 C201.6,170.8 222.3,97.7 201.0,56.1 L150.0,213.0 Z" fill="#EEA0AD"/>' +
    '<path d="M150.0,213.0 C175.3,151.3 239.1,110.2 285.2,118.4 L150.0,213.0 Z" fill="#E28D9B"/>' +
    '<path d="M150.0,213.0 C216.6,210.3 277.1,164.4 285.2,118.4 L150.0,213.0 Z" fill="#EEA0AD"/>' +
    '<path d="M150.0,213.0 C100.2,201.2 68.3,156.3 73.0,114.5 L150.0,213.0 Z" fill="#F5BCC6"/>' +
    '<path d="M150.0,213.0 C150.6,161.8 114.7,120.0 73.0,114.5 L150.0,213.0 Z" fill="#FAD1D8"/>' +
    '<path d="M150.0,213.0 C149.4,161.8 185.3,120.0 227.0,114.5 L150.0,213.0 Z" fill="#F5BCC6"/>' +
    '<path d="M150.0,213.0 C199.8,201.2 231.7,156.3 227.0,114.5 L150.0,213.0 Z" fill="#FAD1D8"/>' +
    '</g>'
  ],

  // ---- LAVENDER (Sleep) — soft pastel redesign ----
  // Rebuilt to match the rest of the garden's flat-fill illustration
  // style: solid pastel shapes only, zero strokes/outlines anywhere.
  // Each bud is a two-tone ellipse pair (light pastel body + slightly
  // deeper pastel shadow half) with a small translucent highlight,
  // built by budShape()/budPair()/budTriplet() below. Buds are
  // clustered in overlapping pairs/triplets radiating from a single
  // central stem, densest at the top, so the flower spike itself
  // reads as one plush, full-bodied head rather than isolated dots
  // on a line — and by the final stage that head dominates the
  // plant's overall silhouette.
  sleep: (function () {
    var LAV_MAIN    = '#D9CDF5';
    var LAV_SHADOW  = '#BCA8E6';
    var LAV_HILITE  = '#F1EBFB';
    var SAGE        = '#CDEBD9';
    var SAGE_SHADOW = '#ACD8BC';

    function budShape(cx, cy, rot, s, mainC, shadowC, hiliteC) {
      return (
        '<g transform="translate(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ') rotate(' + rot + ') scale(' + s + ')">' +
        '<ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="' + mainC + '"/>' +
        '<ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="' + shadowC + '"/>' +
        '<ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="' + hiliteC + '" opacity="0.55"/>' +
        '</g>'
      );
    }
    function budPair(cx, cy, spread, s, mainC, shadowC, hiliteC) {
      return budShape(cx - spread, cy, -25, s, mainC, shadowC, hiliteC) +
             budShape(cx + spread, cy, 25, s, mainC, shadowC, hiliteC);
    }
    function budTriplet(cx, cy, spread, s, mainC, shadowC, hiliteC) {
      return budShape(cx - spread, cy, -28, s * 0.92, mainC, shadowC, hiliteC) +
             budShape(cx, cy + 2, 0, s, mainC, shadowC, hiliteC) +
             budShape(cx + spread, cy, 28, s * 0.92, mainC, shadowC, hiliteC);
    }

    return [
      // Stage 0: seed with a single small emerging bud pair
      '<ellipse cx="40" cy="122" rx="9" ry="2.4" fill="rgba(0,0,0,0.08)"/><rect x="39" y="109" width="2.2" height="13" rx="1.1" fill="#ACD8BC"/><ellipse cx="40" cy="109" rx="3.2" ry="2.2" fill="#CDEBD9"/><g transform="translate(37.60,104.00) rotate(-25) scale(0.55)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(42.40,104.00) rotate(25) scale(0.55)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g>',

      // Stage 1: young spike, two layered pairs plus a tip bud
      '<ellipse cx="40" cy="122" rx="12" ry="3" fill="rgba(0,0,0,0.10)"/><rect x="39" y="92" width="2.3" height="30" rx="1.15" fill="#ACD8BC"/><ellipse cx="33.5" cy="110" rx="6.5" ry="2.4" fill="#CDEBD9" transform="rotate(-20,33.5,110)"/><ellipse cx="46.5" cy="108" rx="6.5" ry="2.4" fill="#CDEBD9" transform="rotate(20,46.5,108)"/><g transform="translate(37.40,96.00) rotate(-25) scale(0.62)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(42.60,96.00) rotate(25) scale(0.62)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(37.30,90.00) rotate(-25) scale(0.68)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(42.70,90.00) rotate(25) scale(0.68)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,84.00) rotate(0) scale(0.55)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g>',

      // Stage 2: fuller spike, alternating pairs/triplets
      '<ellipse cx="40" cy="122" rx="16" ry="3.6" fill="rgba(0,0,0,0.12)"/><rect x="38.8" y="70" width="2.6" height="52" rx="1.3" fill="#ACD8BC"/><ellipse cx="30" cy="104" rx="8.5" ry="3" fill="#CDEBD9" transform="rotate(-24,30,104)"/><ellipse cx="50" cy="100" rx="8.5" ry="3" fill="#CDEBD9" transform="rotate(24,50,100)"/><ellipse cx="34" cy="92" rx="7" ry="2.6" fill="#ACD8BC" transform="rotate(-16,34,92)"/><ellipse cx="46" cy="90" rx="7" ry="2.6" fill="#ACD8BC" transform="rotate(16,46,90)"/><g transform="translate(37.20,92.00) rotate(-25) scale(0.7)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(42.80,92.00) rotate(25) scale(0.7)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(36.60,85.00) rotate(-28) scale(0.6900000000000001)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,87.00) rotate(0) scale(0.75)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.40,85.00) rotate(28) scale(0.6900000000000001)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(37.20,78.00) rotate(-25) scale(0.78)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(42.80,78.00) rotate(25) scale(0.78)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(36.80,71.00) rotate(-28) scale(0.6624)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,73.00) rotate(0) scale(0.72)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.20,71.00) rotate(28) scale(0.6624)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,65.00) rotate(0) scale(0.55)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g>',

      // Stage 3: full plant — dense tapering spike, flower head
      // dominates the plant's overall height
      '<ellipse cx="40" cy="122" rx="21" ry="4.6" fill="rgba(0,0,0,0.14)"/><rect x="38.6" y="40" width="2.9" height="82" rx="1.45" fill="#ACD8BC"/><ellipse cx="26" cy="98" rx="10.5" ry="3.6" fill="#CDEBD9" transform="rotate(-26,26,98)"/><ellipse cx="54" cy="93" rx="10.5" ry="3.6" fill="#CDEBD9" transform="rotate(26,54,93)"/><ellipse cx="30" cy="82" rx="8.5" ry="3" fill="#ACD8BC" transform="rotate(-18,30,82)"/><ellipse cx="50" cy="79" rx="8.5" ry="3" fill="#ACD8BC" transform="rotate(18,50,79)"/><g transform="translate(36.60,96.00) rotate(-25) scale(0.85)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.40,96.00) rotate(25) scale(0.85)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(36.00,89.00) rotate(-28) scale(0.8096)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,91.00) rotate(0) scale(0.88)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(44.00,89.00) rotate(28) scale(0.8096)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(36.40,82.00) rotate(-25) scale(0.9)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.60,82.00) rotate(25) scale(0.9)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(36.20,75.00) rotate(-28) scale(0.782)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,77.00) rotate(0) scale(0.85)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.80,75.00) rotate(28) scale(0.782)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(36.80,68.00) rotate(-25) scale(0.8)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.20,68.00) rotate(25) scale(0.8)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(36.60,61.00) rotate(-28) scale(0.6900000000000001)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,63.00) rotate(0) scale(0.75)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.40,61.00) rotate(28) scale(0.6900000000000001)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(37.20,54.00) rotate(-25) scale(0.68)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(42.80,54.00) rotate(25) scale(0.68)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(37.00,47.00) rotate(-28) scale(0.5704)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,49.00) rotate(0) scale(0.62)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(43.00,47.00) rotate(28) scale(0.5704)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(37.60,40.00) rotate(-25) scale(0.55)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(42.40,40.00) rotate(25) scale(0.55)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,33.00) rotate(0) scale(0.5)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g><g transform="translate(40.00,27.00) rotate(0) scale(0.4)"><ellipse cx="-1.1" cy="0" rx="3.6" ry="6.6" fill="#D9CDF5"/><ellipse cx="1.4" cy="0.5" rx="3.0" ry="6.0" fill="#BCA8E6"/><ellipse cx="-2.2" cy="-2.6" rx="1.3" ry="2.4" fill="#F1EBFB" opacity="0.55"/></g>'
    ];
  }()),

  // ---- BAMBOO (Chores) ----
  chores: [
    // Stage 0: Young node emerging
    '<ellipse cx="40" cy="121" rx="10" ry="2.5" fill="rgba(0,0,0,0.12)"/>' +
    '<rect x="36" y="108" width="8" height="13" rx="4" fill="#8FAF50"/>' +
    '<rect x="35.5" y="105" width="9" height="4" rx="0" fill="#6A8830"/>' +
    '<rect x="36" y="112" width="8" height="2.5" rx="0" fill="#6A8830"/>',

    // Stage 1: Single bamboo shoot with leaves
    '<ellipse cx="40" cy="122" rx="12" ry="3" fill="rgba(0,0,0,0.12)"/>' +
    '<rect x="36.5" y="82" width="7" height="40" rx="3.5" fill="#7A9840"/>' +
    '<rect x="36.5" y="106" width="7" height="3.5" rx="0" fill="#5A7828"/>' +
    '<rect x="36.5" y="93" width="7" height="3.5" rx="0" fill="#5A7828"/>' +
    '<ellipse cx="28" cy="80" rx="11" ry="4" fill="#8FBF50" transform="rotate(-30,28,80)"/>' +
    '<ellipse cx="52" cy="76" rx="11" ry="4" fill="#7AAF40" transform="rotate(30,52,76)"/>',

    // Stage 2: Two stalks with leaves
    '<ellipse cx="40" cy="122" rx="18" ry="4" fill="rgba(0,0,0,0.14)"/>' +
    '<rect x="28" y="72" width="7" height="50" rx="3.5" fill="#6A8830"/>' +
    '<rect x="28" y="106" width="7" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="28" y="90" width="7" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="28" y="78" width="7" height="3" rx="0" fill="#4A6820"/>' +
    '<rect x="45" y="78" width="7" height="44" rx="3.5" fill="#7A9840"/>' +
    '<rect x="45" y="110" width="7" height="3.5" rx="0" fill="#5A7828"/>' +
    '<rect x="45" y="94" width="7" height="3.5" rx="0" fill="#5A7828"/>' +
    '<rect x="45" y="82" width="7" height="3" rx="0" fill="#5A7828"/>' +
    '<ellipse cx="17" cy="69" rx="14" ry="4.5" fill="#8FBF50" transform="rotate(-30,17,69)"/>' +
    '<ellipse cx="38" cy="65" rx="13" ry="4" fill="#7AAF40" transform="rotate(25,38,65)"/>' +
    '<ellipse cx="40" cy="74" rx="13" ry="4" fill="#8FBF50" transform="rotate(-22,40,74)"/>' +
    '<ellipse cx="60" cy="70" rx="14" ry="4.5" fill="#7AAF40" transform="rotate(22,60,70)"/>',

    // Stage 3: Three tall stalks
    '<ellipse cx="40" cy="122" rx="24" ry="5.5" fill="rgba(0,0,0,0.17)"/>' +
    '<rect x="20" y="55" width="7.5" height="67" rx="3.75" fill="#6A8830"/>' +
    '<rect x="20" y="105" width="7.5" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="20" y="86" width="7.5" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="20" y="68" width="7.5" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="36.5" y="40" width="7.5" height="82" rx="3.75" fill="#7A9840"/>' +
    '<rect x="36.5" y="106" width="7.5" height="3.5" rx="0" fill="#5A7828"/>' +
    '<rect x="36.5" y="86" width="7.5" height="3.5" rx="0" fill="#5A7828"/>' +
    '<rect x="36.5" y="66" width="7.5" height="3.5" rx="0" fill="#5A7828"/>' +
    '<rect x="36.5" y="47" width="7.5" height="3.5" rx="0" fill="#5A7828"/>' +
    '<rect x="53" y="50" width="7.5" height="72" rx="3.75" fill="#6A8830"/>' +
    '<rect x="53" y="105" width="7.5" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="53" y="86" width="7.5" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="53" y="66" width="7.5" height="3.5" rx="0" fill="#4A6820"/>' +
    '<rect x="53" y="54" width="7.5" height="3.5" rx="0" fill="#4A6820"/>' +
    '<ellipse cx="8" cy="52" rx="16" ry="5" fill="#8FBF50" transform="rotate(-32,8,52)"/>' +
    '<ellipse cx="30" cy="48" rx="15" ry="4.5" fill="#7AAF40" transform="rotate(24,30,48)"/>' +
    '<ellipse cx="24" cy="38" rx="15" ry="4.5" fill="#9AC860" transform="rotate(-18,24,38)"/>' +
    '<ellipse cx="44" cy="36" rx="16" ry="5" fill="#8FBF50" transform="rotate(-22,44,36)"/>' +
    '<ellipse cx="62" cy="42" rx="16" ry="5" fill="#7AAF40" transform="rotate(18,62,42)"/>' +
    '<ellipse cx="34" cy="65" rx="13" ry="4" fill="#7AAF40" transform="rotate(32,34,65)"/>' +
    '<ellipse cx="58" cy="62" rx="13" ry="4" fill="#8FBF50" transform="rotate(-28,58,62)"/>' +
    '<ellipse cx="44" cy="52" rx="14" ry="4.5" fill="#9AC860" transform="rotate(26,44,52)"/>'
  ],

  // ---- CLOVER (Misc) — pointed-heart leaflets, no circle "blobbiness" ----
  // Each leaflet is a single closed heart path (tip toward the hub, notch at
  // the outer tip) instead of overlapping circles, so the clover actually
  // comes to a point at each lobe. Two half-heart fills (split down the
  // center) give the two-tone shading; a duplicated, slightly offset dark
  // copy underneath adds a soft cast shadow instead of a flat outline.
  // Palette: #0F291E (deep shade) · #274F3C / #3E6B54 / #5C8267 (mid greens)
  // #8A9A86 (soft highlight) · #E5A93C (ochre accent) · #F5F0EB (cream vein line)
  misc: [
    // Stage 0: seed — two-tone capsule, no vein/accent clutter
    '<ellipse cx="40" cy="121" rx="8" ry="2.5" fill="rgba(0,0,0,0.11)"/>' +
    '<ellipse cx="40" cy="115" rx="4.6" ry="6.2" fill="#0F291E"/>' +
    '<ellipse cx="38.6" cy="113.6" rx="2.5" ry="4.3" fill="#3E6B54" opacity="0.88"/>',

    // Stage 1: single sprouting heart-leaflet, tilted off-axis — one plant,
    // one stem, one leaflet.
    '<ellipse cx="39" cy="122" rx="12" ry="3.2" fill="rgba(0,0,0,0.12)"/>' +
    '<path d="M40,122 C39.3,112 39.7,101 41.4,94" stroke="#0F291E" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(41.4,94) rotate(-10) scale(0.72)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" fill="#0F291E" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#5C8267"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" fill="#8A9A86" opacity="0.3"/>' +
    '</g>',

    // Stage 2: three-leaflet clover — a SINGLE stem rising to one hub point,
    // with all three leaflets fanning out from that same hub, so it still
    // reads as one plant (not three separate sprouts growing side by side).
    '<ellipse cx="40" cy="122" rx="20" ry="4.6" fill="rgba(0,0,0,0.14)"/>' +
    '<path d="M40,122 C39.6,110 39.8,98 40,88" stroke="#0F291E" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(40,88) rotate(-16) scale(0.74)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" fill="#0F291E" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#5C8267"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" fill="#8A9A86" opacity="0.3"/>' +
    '</g>' +
    '<g transform="translate(40,88) rotate(6) scale(0.9)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" fill="#0F291E" opacity="0.42"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#3E6B54"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<ellipse cx="-5.5" cy="-16" rx="5.8" ry="9.2" fill="#8A9A86" opacity="0.28"/>' +
    '</g>' +
    '<g transform="translate(40,88) rotate(20) scale(0.68)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" fill="#0F291E" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#5C8267"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" fill="#8A9A86" opacity="0.3"/>' +
    '</g>' +
    '<circle cx="25" cy="70" r="0.8" fill="#F5F0EB" opacity="0.08"/>' +
    '<circle cx="55" cy="66" r="0.9" fill="#F5F0EB" opacity="0.08"/>',

    // Stage 3: full lucky four-leaf clover — one stem to one hub, four
    // pointed hearts fanning around it at off-angle rotations and scales
    // so no two lobes are identical. Still a single plant.
    '<ellipse cx="40" cy="122" rx="27" ry="6" fill="rgba(0,0,0,0.17)"/>' +
    '<path d="M40,122 C39.2,105 39.6,86 40,68" stroke="#0F291E" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(40,66) rotate(-6) scale(1.14)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" fill="#0F291E" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#5C8267"/>' +
      '<ellipse cx="5.8" cy="-16.5" rx="6.4" ry="10" fill="#8A9A86" opacity="0.34"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(89) scale(0.96)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" fill="#0F291E" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#3E6B54"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<ellipse cx="-5.6" cy="-16.5" rx="6.2" ry="9.7" fill="#8A9A86" opacity="0.3"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(182) scale(1.04)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" fill="#0F291E" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#5C8267"/>' +
      '<ellipse cx="5.6" cy="-16.5" rx="6.3" ry="9.7" fill="#8A9A86" opacity="0.32"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(273) scale(1.09)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" fill="#0F291E" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" fill="#3E6B54"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" fill="#274F3C"/>' +
      '<ellipse cx="-5.9" cy="-16.5" rx="6.6" ry="10.2" fill="#8A9A86" opacity="0.35"/>' +
    '</g>' +
    '<circle cx="22" cy="80" r="0.8" fill="#F5F0EB" opacity="0.07"/>' +
    '<circle cx="58" cy="78" r="0.9" fill="#F5F0EB" opacity="0.07"/>' +
    '<circle cx="40" cy="45" r="0.8" fill="#F5F0EB" opacity="0.08"/>'
  ]
};


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
function getPlantSVG(catId, stageIndex) {
  var data = PLANT_SVG_DATA[catId] || PLANT_SVG_DATA.misc;
  var body = data[Math.min(stageIndex, data.length - 1)];

  return (
    '<svg viewBox="0 0 80 130" xmlns="http://www.w3.org/2000/svg"' +
    ' width="120" height="195" style="overflow:visible;display:block;">' +
    body +
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

  var prevStage = plantStageMemory.hasOwnProperty(task.id)
    ? plantStageMemory[task.id]
    : stageIdx;

  if (prevStage === stageIdx) {
    var layer = document.createElement('div');
    layer.className = 'plant-stage-layer';
    layer.style.opacity = '1';
    layer.innerHTML = getPlantSVG(cat.id, stageIdx);
    container.appendChild(layer);
    plantStageMemory[task.id] = stageIdx;
    return container;
  }

  // Stage just changed — crossfade the old art out and the new art in.
  var oldLayer = document.createElement('div');
  oldLayer.className = 'plant-stage-layer';
  oldLayer.innerHTML = getPlantSVG(cat.id, prevStage);
  oldLayer.style.opacity = '1';

  var newLayer = document.createElement('div');
  newLayer.className = 'plant-stage-layer';
  newLayer.innerHTML = getPlantSVG(cat.id, stageIdx);
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

    // Height reflects the plant's actual on-screen size right now —
    // `scale` at this point already includes the growth-stage size,
    // any Daily/Long-Term flourish, AND the depth (foreground/
    // background) multiplier, i.e. exactly what's driving how tall
    // the plant's sprite currently renders.
    var heightMeters = computeHeightMeters(scale);

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
// Main render — called after every state change
// ============================================
function render() {
  renderTaskList();
  renderGarden();
  renderDevPanel();
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