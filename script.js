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

  // The universal time-of-day sky/hills scene is swapped out for a
  // dedicated, static garden-yard backdrop while on the Garden page,
  // and swapped back for Home/Tasks.
  if (skyEl)            skyEl.classList.toggle('hidden', page === 'garden');
  if (gardenBackdropEl) gardenBackdropEl.classList.toggle('hidden', page !== 'garden');

  if (page === 'garden') {
    if (loadingState) loadingState.classList.toggle('hidden', authReady);
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
    tasks.forEach(function (task) {
      if (task.completed) {
        task.completed = false;
        changed = true;
      }
    });
    lastResetDate = today;
    changed = true;
  }

  tasks.forEach(function (task) {
    if (task.lastCleanDate && task.lastCleanDate !== today) {
      var gap = dayGap(task.lastCleanDate, today);
      if (gap > 1 && task.streak > 0) {
        task.streak = 0;
        changed     = true;
      }
    }
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
            };
          });
          lastResetDate = data.lastResetDate || null;
        } else {
          tasks         = [];
          lastResetDate = null;
        }

        nextId = getNextId(tasks);

        var anyChanged = applyDayBoundaries();
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
  });
  nextId++;
  taskInput.value = '';
  saveData();
  render();
});


// ============================================
// Toggling a task's completed state
// ============================================
function toggleTask(taskId, newChecked) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;

  var today = getTodayString();
  task.completed = newChecked;

  if (newChecked) {
    // Completing the task today grows both streak and size —
    // but only once per calendar day (no double-counting).
    if (task.lastCleanDate !== today) {
      task.prevLastCleanDate = task.lastCleanDate || null;
      task.lastCleanDate     = today;
      task.streak            = (task.streak || 0) + 1;
      task.totalGrowthDays   = (task.totalGrowthDays || 0) + 1;
    }
  } else {
    // Unchecking today's completion undoes TODAY's credit for both
    // streak and size. This only fires if today is the day that was
    // just credited (lastCleanDate === today) — once the calendar
    // day rolls over, applyDayBoundaries() locks that day in and
    // this branch can no longer touch it, so past days are never
    // retroactively undone, only the box you just checked.
    if (task.lastCleanDate === today) {
      task.streak            = Math.max(0, (task.streak || 0) - 1);
      task.totalGrowthDays   = Math.max(0, (task.totalGrowthDays || 0) - 1);
      task.lastCleanDate     = task.prevLastCleanDate || null;
      task.prevLastCleanDate = null;
    }
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
    '<ellipse cx="40" cy="122" rx="11" ry="3" fill="rgba(0,0,0,0.14)"/>' +
    '<ellipse cx="40" cy="114" rx="5.5" ry="7" fill="#C8A464"/>' +
    '<ellipse cx="40" cy="107" rx="7" ry="3.5" fill="#8B6B4E"/>' +
    '<rect x="38.5" y="103" width="3" height="5" rx="1.5" fill="#5C4030"/>',

    // Stage 1: Seedling, two round leaves
    '<ellipse cx="40" cy="122" rx="14" ry="3.5" fill="rgba(0,0,0,0.14)"/>' +
    '<rect x="39" y="96" width="2" height="26" rx="1" fill="#5C7A3E"/>' +
    '<ellipse cx="29" cy="95" rx="11" ry="5" fill="#8FBF7F" transform="rotate(-22,29,95)"/>' +
    '<ellipse cx="51" cy="92" rx="11" ry="5" fill="#6AAF75" transform="rotate(22,51,92)"/>',

    // Stage 2: Young oak with small canopy
    '<ellipse cx="40" cy="122" rx="20" ry="5" fill="rgba(0,0,0,0.15)"/>' +
    '<rect x="37.5" y="78" width="5" height="44" rx="2.5" fill="#7A5C3E"/>' +
    '<line x1="40" y1="87" x2="22" y2="74" stroke="#7A5C3E" stroke-width="4.5" stroke-linecap="round"/>' +
    '<line x1="40" y1="83" x2="58" y2="72" stroke="#7A5C3E" stroke-width="4.5" stroke-linecap="round"/>' +
    '<circle cx="22" cy="70" r="14" fill="#3A6B4A"/>' +
    '<circle cx="58" cy="67" r="14" fill="#4A8B5A"/>' +
    '<circle cx="40" cy="63" r="17" fill="#3A6B4A"/>' +
    '<circle cx="37" cy="56" r="7" fill="rgba(120,210,120,0.22)"/>',

    // Stage 3: Full spreading oak
    '<ellipse cx="40" cy="122" rx="28" ry="6" fill="rgba(0,0,0,0.2)"/>' +
    '<rect x="34.5" y="60" width="11" height="62" rx="4" fill="#7A5C3E"/>' +
    '<line x1="37" y1="72" x2="37.5" y2="108" stroke="#5C4030" stroke-width="1.5" stroke-dasharray="3,5"/>' +
    '<line x1="38" y1="74" x2="12" y2="58" stroke="#7A5C3E" stroke-width="8" stroke-linecap="round"/>' +
    '<line x1="42" y1="70" x2="68" y2="54" stroke="#7A5C3E" stroke-width="8" stroke-linecap="round"/>' +
    '<circle cx="40" cy="47" r="20" fill="#2E5A3A"/>' +
    '<circle cx="18" cy="55" r="18" fill="#3A6B4A"/>' +
    '<circle cx="62" cy="51" r="18" fill="#3A6B4A"/>' +
    '<circle cx="40" cy="32" r="17" fill="#3A6B4A"/>' +
    '<circle cx="40" cy="48" r="15" fill="#4A8B5A"/>' +
    '<circle cx="35" cy="33" r="8" fill="rgba(140,220,140,0.2)"/>'
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
  mindfulness: [
    // Stage 0: Seed on a small lily pad
    '<ellipse cx="40" cy="121" rx="14" ry="4" fill="rgba(40,100,50,0.3)"/>' +
    '<ellipse cx="40" cy="119" rx="12" ry="4.5" fill="#3A7A4A"/>' +
    '<ellipse cx="40" cy="117" rx="11" ry="3.5" fill="#4A9A5A"/>' +
    '<ellipse cx="40" cy="112" rx="5.5" ry="6" fill="#9878D0"/>' +
    '<ellipse cx="40" cy="108" rx="3.5" ry="4" fill="#7858B0"/>',

    // Stage 1: Pad with bud and stem
    '<ellipse cx="40" cy="121" rx="17" ry="4.5" fill="rgba(40,100,50,0.28)"/>' +
    '<ellipse cx="40" cy="119" rx="15" ry="5" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="117" rx="13.5" ry="4" fill="#3A8A4A"/>' +
    '<rect x="39" y="103" width="2" height="16" rx="1" fill="#3A7A4A"/>' +
    '<ellipse cx="40" cy="99" rx="5.5" ry="7" fill="#C090E0"/>' +
    '<ellipse cx="40" cy="96" rx="3.5" ry="5" fill="#9870C8"/>',

    // Stage 2: Half-open lotus
    '<ellipse cx="40" cy="121" rx="20" ry="5" fill="rgba(40,100,50,0.3)"/>' +
    '<ellipse cx="40" cy="119" rx="18" ry="5.5" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="117" rx="16" ry="4.5" fill="#3A8A4A"/>' +
    '<ellipse cx="26" cy="120" rx="9" ry="3" fill="#3A7A4A"/>' +
    '<ellipse cx="54" cy="120" rx="9" ry="3" fill="#4A9A5A"/>' +
    '<rect x="39" y="89" width="2" height="30" rx="1" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="82" rx="6.5" ry="13" fill="#C8A0E8"/>' +
    '<ellipse cx="27" cy="87" rx="6" ry="13" fill="#B890D8" transform="rotate(-28,27,87)"/>' +
    '<ellipse cx="53" cy="87" rx="6" ry="13" fill="#B890D8" transform="rotate(28,53,87)"/>' +
    '<ellipse cx="40" cy="82" rx="4.5" ry="9" fill="#DEB8F8"/>' +
    '<circle cx="40" cy="80" r="5.5" fill="#F5E8A8"/>',

    // Stage 3: Full open lotus
    '<ellipse cx="40" cy="121" rx="24" ry="5.5" fill="rgba(40,100,50,0.32)"/>' +
    '<ellipse cx="40" cy="119" rx="22" ry="6" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="117" rx="20" ry="5" fill="#3A8A4A"/>' +
    '<ellipse cx="22" cy="120" rx="11" ry="3.5" fill="#3A7A4A"/>' +
    '<ellipse cx="58" cy="120" rx="11" ry="3.5" fill="#4A9A5A"/>' +
    '<rect x="39" y="76" width="2" height="44" rx="1" fill="#2A6A3A"/>' +
    '<ellipse cx="40" cy="70" rx="7.5" ry="15" fill="#A878C8"/>' +
    '<ellipse cx="23" cy="78" rx="7" ry="15" fill="#9068B8" transform="rotate(-38,23,78)"/>' +
    '<ellipse cx="57" cy="78" rx="7" ry="15" fill="#9068B8" transform="rotate(38,57,78)"/>' +
    '<ellipse cx="14" cy="93" rx="7" ry="13" fill="#8058A8" transform="rotate(-66,14,93)"/>' +
    '<ellipse cx="66" cy="93" rx="7" ry="13" fill="#8058A8" transform="rotate(66,66,93)"/>' +
    '<ellipse cx="40" cy="66" rx="5.5" ry="11" fill="#C898E0"/>' +
    '<ellipse cx="29" cy="72" rx="5" ry="10" fill="#BE90DA" transform="rotate(-28,29,72)"/>' +
    '<ellipse cx="51" cy="72" rx="5" ry="10" fill="#BE90DA" transform="rotate(28,51,72)"/>' +
    '<circle cx="40" cy="66" r="8" fill="#F8E890"/>' +
    '<circle cx="40" cy="66" r="5" fill="#F0D060"/>' +
    '<circle cx="38" cy="64" r="1.5" fill="#D4A820"/>' +
    '<circle cx="42" cy="64" r="1.5" fill="#D4A820"/>'
  ],

  // ---- LAVENDER (Sleep) ----
  sleep: [
    // Stage 0: Tiny seed mound
    '<ellipse cx="40" cy="121" rx="10" ry="3" fill="rgba(0,0,0,0.12)"/>' +
    '<ellipse cx="40" cy="116" rx="5" ry="5.5" fill="#A0A0D8"/>' +
    '<ellipse cx="40" cy="112" rx="3.5" ry="4" fill="#8080C0"/>',

    // Stage 1: Single stem + leaves + small spike
    '<ellipse cx="40" cy="122" rx="13" ry="3.5" fill="rgba(0,0,0,0.12)"/>' +
    '<rect x="39.5" y="93" width="1.5" height="29" rx="0.75" fill="#6A8A50"/>' +
    '<ellipse cx="32" cy="107" rx="8" ry="3.5" fill="#7A9A60" transform="rotate(-15,32,107)"/>' +
    '<ellipse cx="48" cy="103" rx="8" ry="3.5" fill="#8FAF70" transform="rotate(15,48,103)"/>' +
    '<rect x="39" y="85" width="2" height="12" rx="1" fill="#7878C8"/>' +
    '<ellipse cx="40" cy="84" rx="4.5" ry="6" fill="#9090D8"/>' +
    '<ellipse cx="40" cy="80" rx="3" ry="4.5" fill="#A8A8E8"/>',

    // Stage 2: Multi-stem small bush
    '<ellipse cx="40" cy="122" rx="19" ry="4.5" fill="rgba(0,0,0,0.14)"/>' +
    '<rect x="35" y="84" width="1.5" height="38" rx="0.75" fill="#6A8A50"/>' +
    '<rect x="40" y="79" width="1.5" height="43" rx="0.75" fill="#6A8A50"/>' +
    '<rect x="45" y="85" width="1.5" height="37" rx="0.75" fill="#6A8A50"/>' +
    '<ellipse cx="27" cy="100" rx="10" ry="4" fill="#7A9A60" transform="rotate(-15,27,100)"/>' +
    '<ellipse cx="53" cy="97" rx="10" ry="4" fill="#8FAF70" transform="rotate(15,53,97)"/>' +
    '<rect x="34" y="70" width="2" height="16" rx="1" fill="#7878C8"/>' +
    '<ellipse cx="35" cy="69" rx="5" ry="8" fill="#9090D8"/>' +
    '<rect x="39.5" y="63" width="2" height="20" rx="1" fill="#8080C8"/>' +
    '<ellipse cx="40.5" cy="62" rx="5.5" ry="9" fill="#9898E0"/>' +
    '<rect x="44.5" y="71" width="2" height="16" rx="1" fill="#7878C8"/>' +
    '<ellipse cx="45.5" cy="70" rx="5" ry="8" fill="#8888D0"/>' +
    '<ellipse cx="35" cy="62" rx="3.5" ry="5.5" fill="#B0B0F0"/>' +
    '<ellipse cx="40.5" cy="54" rx="4" ry="6" fill="#B8B8F8"/>' +
    '<ellipse cx="45.5" cy="63" rx="3.5" ry="5.5" fill="#B0B0F0"/>',

    // Stage 3: Full lavender bush
    '<ellipse cx="40" cy="122" rx="28" ry="5.5" fill="rgba(0,0,0,0.18)"/>' +
    '<rect x="24" y="87" width="1.5" height="35" rx="0.75" fill="#5A7A40"/>' +
    '<rect x="30" y="80" width="1.5" height="42" rx="0.75" fill="#5A7A40"/>' +
    '<rect x="36" y="75" width="1.5" height="47" rx="0.75" fill="#6A8A50"/>' +
    '<rect x="43" y="73" width="1.5" height="49" rx="0.75" fill="#6A8A50"/>' +
    '<rect x="49" y="78" width="1.5" height="44" rx="0.75" fill="#5A7A40"/>' +
    '<rect x="55" y="85" width="1.5" height="37" rx="0.75" fill="#5A7A40"/>' +
    '<ellipse cx="17" cy="100" rx="12" ry="4.5" fill="#6A9050" transform="rotate(-15,17,100)"/>' +
    '<ellipse cx="63" cy="98" rx="12" ry="4.5" fill="#7AA060" transform="rotate(15,63,98)"/>' +
    '<ellipse cx="33" cy="96" rx="10" ry="4" fill="#7A9A60" transform="rotate(-10,33,96)"/>' +
    '<ellipse cx="50" cy="94" rx="10" ry="4" fill="#8AAF70" transform="rotate(10,50,94)"/>' +
    '<rect x="23.5" y="66" width="2" height="23" rx="1" fill="#6868B8"/>' +
    '<ellipse cx="24.5" cy="65" rx="5" ry="9" fill="#8888C8"/>' +
    '<rect x="29.5" y="57" width="2" height="27" rx="1" fill="#7070C0"/>' +
    '<ellipse cx="30.5" cy="56" rx="5.5" ry="10" fill="#9090D8"/>' +
    '<rect x="36" y="51" width="2" height="29" rx="1" fill="#7878C8"/>' +
    '<ellipse cx="37" cy="50" rx="6" ry="11" fill="#9898E0"/>' +
    '<rect x="43" y="49" width="2" height="29" rx="1" fill="#7878C8"/>' +
    '<ellipse cx="44" cy="48" rx="6" ry="11" fill="#9898E0"/>' +
    '<rect x="50" y="55" width="2" height="27" rx="1" fill="#7070C0"/>' +
    '<ellipse cx="51" cy="54" rx="5.5" ry="10" fill="#9090D8"/>' +
    '<rect x="56" y="64" width="2" height="23" rx="1" fill="#6868B8"/>' +
    '<ellipse cx="57" cy="63" rx="5" ry="9" fill="#8888C8"/>' +
    '<ellipse cx="37" cy="40" rx="4" ry="7" fill="#B8B8F8"/>' +
    '<ellipse cx="44" cy="38" rx="4.5" ry="7.5" fill="#C0C0FF"/>' +
    '<ellipse cx="30.5" cy="47" rx="3.5" ry="6" fill="#B0B0F0"/>' +
    '<ellipse cx="51" cy="45" rx="3.5" ry="6" fill="#B0B0F0"/>'
  ],

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

  // ---- CLOVER (Misc) ----
  misc: [
    // Stage 0: Tiny seed
    '<ellipse cx="40" cy="121" rx="8" ry="2.5" fill="rgba(0,0,0,0.11)"/>' +
    '<ellipse cx="40" cy="115" rx="4.5" ry="6" fill="#B8D870"/>' +
    '<ellipse cx="40" cy="111" rx="3" ry="4" fill="#98C050"/>',

    // Stage 1: Single three-leaf clover
    '<ellipse cx="40" cy="122" rx="13" ry="3.5" fill="rgba(0,0,0,0.12)"/>' +
    '<rect x="39.5" y="98" width="1.5" height="24" rx="0.75" fill="#5A8A40"/>' +
    '<circle cx="33" cy="94" r="8.5" fill="#6ABF50"/>' +
    '<circle cx="47" cy="94" r="8.5" fill="#7AD060"/>' +
    '<circle cx="40" cy="85" r="8.5" fill="#6ABF50"/>' +
    '<line x1="33" y1="94" x2="33" y2="88" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>' +
    '<line x1="47" y1="94" x2="47" y2="88" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>' +
    '<line x1="40" y1="85" x2="40" y2="79" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>',

    // Stage 2: Clover patch with small flowers
    '<ellipse cx="40" cy="122" rx="22" ry="5" fill="rgba(0,0,0,0.13)"/>' +
    '<rect x="31" y="92" width="1.5" height="30" rx="0.75" fill="#5A8A40"/>' +
    '<rect x="40" y="88" width="1.5" height="34" rx="0.75" fill="#5A8A40"/>' +
    '<rect x="49" y="93" width="1.5" height="29" rx="0.75" fill="#5A8A40"/>' +
    '<circle cx="24" cy="88" r="8.5" fill="#6ABF50"/>' +
    '<circle cx="33" cy="88" r="8.5" fill="#7AD060"/>' +
    '<circle cx="28.5" cy="79" r="8.5" fill="#6ABF50"/>' +
    '<circle cx="34" cy="82" r="8.5" fill="#7AD060"/>' +
    '<circle cx="46" cy="82" r="8.5" fill="#6ABF50"/>' +
    '<circle cx="40" cy="73" r="9" fill="#7AD060"/>' +
    '<circle cx="47" cy="88" r="8.5" fill="#6ABF50"/>' +
    '<circle cx="56" cy="88" r="8.5" fill="#7AD060"/>' +
    '<circle cx="51.5" cy="79" r="8.5" fill="#6ABF50"/>' +
    '<circle cx="40" cy="68" r="5" fill="#E888A8"/>' +
    '<circle cx="26" cy="72" r="4" fill="#E888A8"/>' +
    '<circle cx="54" cy="72" r="4" fill="#D878A0"/>' +
    '<circle cx="40" cy="68" r="2.5" fill="#FFF0F5"/>' +
    '<circle cx="26" cy="72" r="2" fill="#FFF0F5"/>' +
    '<circle cx="54" cy="72" r="2" fill="#FFF0F5"/>',

    // Stage 3: Lucky four-leaf clover centrepiece
    '<ellipse cx="40" cy="122" rx="27" ry="6" fill="rgba(0,0,0,0.15)"/>' +
    '<rect x="26" y="85" width="1.5" height="37" rx="0.75" fill="#4A7A30"/>' +
    '<rect x="34" y="80" width="1.5" height="42" rx="0.75" fill="#5A8A40"/>' +
    '<rect x="45" y="78" width="1.5" height="44" rx="0.75" fill="#5A8A40"/>' +
    '<rect x="54" y="83" width="1.5" height="39" rx="0.75" fill="#4A7A30"/>' +
    '<circle cx="16" cy="80" r="9.5" fill="#6ABF50"/>' +
    '<circle cx="27" cy="80" r="9.5" fill="#7AD060"/>' +
    '<circle cx="21.5" cy="70" r="9.5" fill="#6ABF50"/>' +
    '<circle cx="21.5" cy="90" r="9" fill="#7AD060"/>' +
    '<circle cx="31" cy="69" r="10.5" fill="#7AD060"/>' +
    '<circle cx="49" cy="69" r="10.5" fill="#6ABF50"/>' +
    '<circle cx="40" cy="60" r="10.5" fill="#7AD060"/>' +
    '<circle cx="40" cy="78" r="10.5" fill="#6ABF50"/>' +
    '<circle cx="40" cy="69" r="4.5" fill="#9AE070"/>' +
    '<circle cx="53" cy="80" r="9.5" fill="#6ABF50"/>' +
    '<circle cx="64" cy="80" r="9.5" fill="#7AD060"/>' +
    '<circle cx="58.5" cy="70" r="9.5" fill="#6ABF50"/>' +
    '<circle cx="58.5" cy="90" r="9" fill="#7AD060"/>' +
    '<circle cx="21" cy="58" r="6.5" fill="#E878A0"/>' +
    '<circle cx="40" cy="50" r="7.5" fill="#F090B8"/>' +
    '<circle cx="59" cy="56" r="6.5" fill="#E878A0"/>' +
    '<circle cx="21" cy="58" r="3.5" fill="#FFF0F5"/>' +
    '<circle cx="40" cy="50" r="4" fill="#FFF0F5"/>' +
    '<circle cx="59" cy="56" r="3.5" fill="#FFF0F5"/>'
  ]
};


// ============================================
// Plant positions in the garden scene — perspective depth
// ============================================
// Every task gets a stable "depth row" (far / mid / near), assigned
// once via a deterministic hash of the task's id — so a task always
// lands in the same row for as long as it exists, but which row it
// lands in looks arbitrary rather than tied to creation order. Far
// plants sit higher up and smaller, near plants sit lower and larger,
// each row also using less/more of the available width so the far
// row reads as narrower/further away. This scale multiplier stacks
// with (not replaces) the growth-based scale from computeScaleForDays.
// ============================================

// Deterministic pseudo-random value in [0, 1) for a given integer
// seed. Same input always produces the same output — this is what
// makes the depth-row assignment stable across renders/reloads
// instead of re-shuffling every time the garden re-renders.
function hashSeed(n) {
  var x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

var DEPTH_BANDS = {
  far:  { scale: 0.55, bottomPct: 77, leftMin: 38, leftMax: 62, z: 2 },
  mid:  { scale: 0.78, bottomPct: 50, leftMin: 28, leftMax: 72, z: 3 },
  near: { scale: 1.00, bottomPct: 25, leftMin: 18, leftMax: 82, z: 4 },
};

function getTaskDepthBand(taskId) {
  var seed = hashSeed(taskId);
  if (seed < 1 / 3) return 'far';
  if (seed < 2 / 3) return 'mid';
  return 'near';
}

function computePlantLayout(task, indexInBand, bandTotal) {
  var band = getTaskDepthBand(task.id);
  var cfg  = DEPTH_BANDS[band];

  var basePct = bandTotal <= 1
    ? (cfg.leftMin + cfg.leftMax) / 2
    : cfg.leftMin + (cfg.leftMax - cfg.leftMin) * (indexInBand / (bandTotal - 1));

  // Small stable jitter (from a second, independent hash) so plants
  // within the same row don't line up in a perfectly even row.
  var jitterSeed  = hashSeed(task.id * 7 + 3);
  var jitterRange = (cfg.leftMax - cfg.leftMin) / Math.max(bandTotal, 1) * 0.35;
  var leftPct     = basePct + (jitterSeed - 0.5) * jitterRange;
  leftPct         = Math.max(12, Math.min(88, leftPct));

  return {
    left:        leftPct + '%',
    bottomPct:   cfg.bottomPct,
    depthScale:  cfg.scale,
    z:           cfg.z,
    band:        band,
  };
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

function renderGarden() {
  if (!gardenSceneEl) return;
  gardenSceneEl.innerHTML = '';

  if (tasks.length === 0) {
    var emptyMsg       = document.createElement('p');
    emptyMsg.className = 'garden-empty-msg';
    emptyMsg.textContent = '🌱 Your garden is empty — add a task to plant your first seed.';
    gardenSceneEl.appendChild(emptyMsg);
    return;
  }

  // Highest available art stage index — same length across every
  // category's PLANT_SVG_DATA array (4 stages: 0–3).
  var maxStageIdx = PLANT_SVG_DATA.misc.length - 1;

  // Bucket tasks into depth rows once per render. Each task's band is
  // a stable hash of its id, so this grouping (and therefore each
  // task's position within its row) stays consistent render to
  // render — it just needs to be computed here so indexInBand/
  // bandTotal reflect the *current* set of tasks in that row.
  var depthGroups = { far: [], mid: [], near: [] };
  tasks.forEach(function (task) {
    depthGroups[getTaskDepthBand(task.id)].push(task);
  });

  tasks.forEach(function (task, i) {
    var cat        = getCategoryById(task.categoryId);
    var band        = getTaskDepthBand(task.id);
    var bandTasks   = depthGroups[band];
    var indexInBand = bandTasks.indexOf(task);
    var layout      = computePlantLayout(task, indexInBand, bandTasks.length);

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
    scale = scale * layout.depthScale;

    // Ground-anchored wrapper — position only, never scales.
    var wrap = document.createElement('div');
    wrap.className = 'garden-plant';
    wrap.style.left = layout.left;
    wrap.style.zIndex = layout.z;
    // Set on the wrap (not the inner .plant-visual) so both the
    // wrap's ground-sink offset and .plant-visual's own scale — which
    // inherits this custom property — can read the same value.
    wrap.style.setProperty('--plant-scale', scale.toFixed(3));
    wrap.style.setProperty('--plant-depth-bottom', layout.bottomPct + '%');
    wrap.setAttribute(
      'title',
      task.text + ' · ' + cat.name + ' (' + cat.species + ') · ' +
      totalGrowthDays + ' days grown' + (streak > 0 ? ' · 🔥 ' + streak + ' day streak' : '')
    );

    // Scaling visual — grows from a fixed point near the ground.
    var visual = document.createElement('div');
    visual.className = 'plant-visual';

    visual.appendChild(buildPlantVisual(task, cat, stageIdx));
    wrap.appendChild(visual);

    // Label — fixed size, sits below the plant at ground level.
    var labelEl = document.createElement('div');
    labelEl.className = 'plant-label-tag';
    labelEl.innerHTML =
      '<span class="plant-label-name">' + escapeHtml(task.text) + '</span>' +
      '<span class="plant-label-streak">' + subLabel + '</span>';
    wrap.appendChild(labelEl);

    gardenSceneEl.appendChild(wrap);
  });
}

// Escapes a task's free-text text before it's inserted via innerHTML
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
    // Backdates lastResetDate only (real per-task dates are left
    // alone), so this exercises the "uncheck everything for a new
    // day" half of applyDayBoundaries() without also force-breaking
    // streaks, which is a separate scenario.
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