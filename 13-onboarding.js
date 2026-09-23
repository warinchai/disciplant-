// ============================================
// 13: ONBOARDING - the first plant (H1)
// Part of DISCIPLANT.
// Loaded as a plain global script (no modules), AFTER 12-tasks-page.js.
// Calls makeTask, histGet, getTodayString, growthEarnedToday and
// getCategoryById (01), toggleTask and saveData (02), getPlantSVG,
// escapeHtml, assignPermanentPositions, playGrowthFlourish and the
// growth toggle state (04), and render (05).
//
// WHAT THIS IS FOR
// A brand new account opened the Garden onto bare lawn and one line of
// text. For an app whose whole pitch is a plant growing, that is the
// worst first screen it could have. This file puts a plant in the
// ground in one tap, then walks through the daily loop once, on the
// real garden rather than in a tutorial:
//
//   pick   the plot is empty. Six starter habits, one per plot, each
//          shown as the plant it grows into, plus a box for your own
//          with the same type and plot choices the Tasks page has.
//   tick   it is planted. "Did you do it today?"
//   grow   it is ticked. Press Show today's growth and watch it.
//
// THE STAGE IS DERIVED, NOT STORED. onboardStage() reads it off the
// garden every time it is asked: an empty plot is 'pick' whoever you
// are, and the other two only apply to the plant planted from here in
// this session. So there is no new Firestore field, no new read, no
// new write beyond the one save that planting a task always costs, and
// no localStorage either. A reload part-way through simply drops the
// walkthrough, and the ordinary garden carries on from there - which
// is what it would have done anyway.
//
// The same starters show on the Tasks page's empty state, because that
// is the other place a new account can land with nothing planted.
// ============================================


// ============================================
// The starters
//
// One per plot. Miscellaneous is left out on purpose: it is where
// "write your own" lands, so it is already on the card as the box
// underneath these.
//
// Short and concrete on purpose, and only six. These are a way to get
// a plant in the ground in one tap, not a list of ideas to read - the
// old per-plot suggestion lists were cut for reading as filler, and
// anything longer here would earn the same verdict.
// ============================================
var ONBOARD_STARTERS = [
  { cat: 'education',   text: 'Read 10 pages' },
  { cat: 'exercise',    text: 'Walk for 20 minutes' },
  { cat: 'mindfulness', text: 'Sit still for 5 minutes' },
  { cat: 'sleep',       text: 'In bed by 11' },
  { cat: 'chores',      text: 'Make the bed' },
  { cat: 'finance',     text: 'Write down what I spent' },
];

// Every starter is drawn at its LAST art stage. The plant you get is a
// seed, and a row of six identical seeds would be a very dull choice
// to make - so the card shows what each one becomes instead.
var ONBOARD_ART_STAGE = STAGE_MILESTONES.length - 1;

// Built once per species. The card can repaint several times in a
// session and the drawings never change.
var onboardArtCache = {};

function onboardStarterArt(catId) {
  if (!onboardArtCache[catId]) {
    onboardArtCache[catId] = getPlantSVG(catId, ONBOARD_ART_STAGE, SKIN_DEFAULT_ID, 40);
  }
  return onboardArtCache[catId];
}


// ============================================
// Which stage are we at
// ============================================

// The plant this session's walkthrough is about. Set by planting from
// a starter or the box, cleared by "Not yet", "Got it", or the growth
// being shown. Never saved.
var onboardPlantedId = null;

function findOnboardTask() {
  if (onboardPlantedId === null) return null;
  return tasks.find(function (t) { return t.id === onboardPlantedId; }) || null;
}

// 'pick' | 'tick' | 'grow' | 'none'.
//
// Mostly a pure read. The one thing it changes is forgetting the
// planted id once the walkthrough is over or the plant is gone, so
// that hiding today's growth again later, or deleting and replanting,
// does not bring an old step back.
function onboardStage() {
  // Before the garden has loaded, an empty task list means "not
  // arrived yet", not "nothing planted". Asking then would flash the
  // picker at someone with a full garden.
  if (!authReady) return 'none';
  if (!tasks.length) return 'pick';

  var task = findOnboardTask();
  if (!task) {
    onboardPlantedId = null;
    return 'none';
  }

  // history rather than task.completed, for the same reason
  // growthEarnedToday() gives in 01: it is the record of today.
  if (!histGet(task.history, getTodayString())) return 'tick';

  // Ticked, and the day it earned is being held back by the growth
  // toggle - so there is something to press and watch. If the toggle
  // is already showing growth (it remembers its position per browser)
  // the plant grew in plain sight and the loop has been seen.
  if (!dailyGrowthShown && growthEarnedToday(task) > 0) return 'grow';

  onboardPlantedId = null;
  return 'none';
}

// Asked by 04 in the two places that used to fill an empty plot on
// their own - the toolbar note and the message out in the scene. While
// the picker is up it covers both, and two empty-state messages on top
// of each other read as neither.
function isOnboardingCoveringEmptyPlot() {
  return onboardStage() === 'pick';
}


// ============================================
// Planting
// ============================================
// kind is 'habit' or 'once', the same two types the Tasks page's add
// form offers. Anything else is a habit, which is what the starters
// always are.
function plantOnboardingHabit(text, catId, kind) {
  if (!authReady) return null;

  var clean = String(text || '').trim().slice(0, TASK_TEXT_MAX);
  if (!clean) return null;

  // Same rule setTaskField() applies to a plot change: an id with no
  // artwork behind it would draw a fallback forever.
  var known = CATEGORIES.some(function (c) { return c.id === catId; });

  var task = makeTask(nextId, clean, known ? catId : 'misc');
  // Through setTaskKind rather than a bare assignment, so an
  // assignment gets exactly the fields the Tasks page would give it.
  if (kind === 'once') setTaskKind(task, 'once');
  tasks.push(task);
  nextId++;
  onboardPlantedId = task.id;

  assignPermanentPositions();

  // The plot is three screens wide. Scroll it back to the middle, where
  // a first plant lands, so the planting is something you actually see
  // happen rather than something you have to go looking for.
  if (currentPage === 'garden') pendingGardenScrollCenter = true;

  saveData();
  render();

  // The same light and sparks the growth toggle uses. A light, not a
  // bounce, for the reason given on playGrowthFlourish in 04.
  if (currentPage === 'garden' && gardenTrackEl && typeof playGrowthFlourish === 'function') {
    var wrap = gardenTrackEl.querySelector('.garden-plant[data-task-id="' + task.id + '"]');
    if (wrap) playGrowthFlourish(wrap);
  }

  return task;
}


// ============================================
// Markup
// ============================================

// The starter buttons. Shared by the garden card and the Tasks page,
// so the two can never offer different things.
function onboardStarterButtonsHtml() {
  return ONBOARD_STARTERS.map(function (s, i) {
    var cat = getCategoryById(s.cat);
    return (
      '<button type="button" class="ob-starter" data-ob-starter="' + i + '" ' +
        'aria-label="Plant ' + escapeHtml(s.text) + ', a ' + escapeHtml(cat.species) + '">' +
        '<span class="ob-starter-art" aria-hidden="true">' + onboardStarterArt(s.cat) + '</span>' +
        '<span class="ob-starter-text">' + escapeHtml(s.text) + '</span>' +
        '<span class="ob-starter-species" aria-hidden="true">' + escapeHtml(cat.species) + '</span>' +
      '</button>'
    );
  }).join('');
}

// The Tasks page's empty state. No box for your own here - the page's
// own add form is right above it.
function onboardStarterHtml() {
  return (
    '<p class="ob-lead">Or start with one of these</p>' +
    '<div class="ob-starters ob-starters-wide">' + onboardStarterButtonsHtml() + '</div>'
  );
}

// Your own: the name, and then the same two choices the Tasks page's
// add form offers - what kind of task it is, and which plot (and so
// which plant) it grows in. Defaults are the add form's too: a habit,
// in Miscellaneous.
//
// The type switch is a pair of real buttons carrying aria-pressed, not
// radio inputs, to match the .tp-seg control it is styled as. They are
// type="button" so pressing one never submits the form.
function onboardPickHtml() {
  return (
    '<h2 class="ob-title">Plant your first habit</h2>' +
    '<p class="ob-line">Pick one, or write your own. It grows on every day you do it.</p>' +
    '<div class="ob-starters">' + onboardStarterButtonsHtml() + '</div>' +
    '<form class="ob-own" data-ob-form="1" autocomplete="off">' +
      '<div class="ob-own-main">' +
        '<input class="tp-input" type="text" maxlength="' + TASK_TEXT_MAX + '" ' +
          'placeholder="Or write your own" aria-label="Your own habit" />' +
        '<button type="submit" class="ob-btn ob-btn-go">Plant it</button>' +
      '</div>' +
      '<div class="ob-own-opts">' +
        '<div class="tp-seg" role="group" aria-label="Task type">' +
          '<button type="button" class="tp-seg-btn active" data-ob-kind="habit" aria-pressed="true">Habit</button>' +
          '<button type="button" class="tp-seg-btn" data-ob-kind="once" aria-pressed="false">Assignment</button>' +
        '</div>' +
        '<select class="tp-select" data-ob-cat="1" aria-label="Which plant">' +
          CATEGORIES.map(function (c) {
            return '<option value="' + c.id + '"' + (c.id === 'misc' ? ' selected' : '') + '>' +
              escapeHtml(c.species) + ' &middot; ' + escapeHtml(c.name) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
    '</form>'
  );
}

// A habit is asked about today; an assignment is asked whether it is
// already finished, because that is the only thing ticking one means.
function onboardTickHtml(task) {
  var species = getCategoryById(task.categoryId).species;
  var isOnce  = task.kind === 'once';
  return (
    '<h2 class="ob-title">Your ' + escapeHtml(species) + ' is in the ground</h2>' +
    '<p class="ob-line">' + (isOnce ? 'Is it already done?' : 'Did you do it today?') + '</p>' +
    '<div class="ob-actions">' +
      '<button type="button" class="ob-btn ob-btn-go" data-ob-act="tick">Yes, tick it</button>' +
      '<button type="button" class="ob-btn ob-btn-quiet" data-ob-act="later">Not yet</button>' +
    '</div>' +
    '<p class="ob-note">' + (isOnce
      ? 'You can tick it from Tasks when it is done, and set a due date there.'
      : 'You can tick it from Tasks any time today.') + '</p>'
  );
}

function onboardGrowHtml() {
  return (
    '<h2 class="ob-title">A day of growth is waiting</h2>' +
    '<p class="ob-line">Press Show today’s growth above and watch it. ' +
      'That is the whole loop: do it, tick it, watch it grow.</p>' +
    '<div class="ob-actions">' +
      '<button type="button" class="ob-btn ob-btn-quiet" data-ob-act="done">Got it</button>' +
    '</div>'
  );
}


// ============================================
// The garden card
//
// Called from updateGardenGrowUI() in 04, which already runs on every
// garden render AND on every press of the growth toggle - the two
// moments the stage can change.
//
// Only rewrites itself when the stage changes. Rebuilding on every
// render would throw away whatever someone was half-way through typing
// into the box whenever a snapshot landed.
// ============================================
var gardenOnboardEl = document.getElementById('gardenOnboard');

function renderGardenOnboarding() {
  if (!gardenOnboardEl) return;

  // Edit mode is for moving plants. The card has nothing to say there.
  var stage = gardenEditMode ? 'none' : onboardStage();
  var key   = stage === 'pick' || stage === 'none' ? stage : stage + ':' + onboardPlantedId;
  if (gardenOnboardEl.dataset.stage === key) return;
  gardenOnboardEl.dataset.stage = key;

  if (stage === 'none') {
    gardenOnboardEl.classList.add('hidden');
    gardenOnboardEl.innerHTML = '';
    return;
  }

  // Was the keyboard inside the card? The button just pressed is about
  // to be replaced, and focus would otherwise drop to the document.
  var hadFocus = gardenOnboardEl.contains(document.activeElement);

  if (stage === 'pick')      gardenOnboardEl.innerHTML = onboardPickHtml();
  else if (stage === 'tick') gardenOnboardEl.innerHTML = onboardTickHtml(findOnboardTask());
  else                       gardenOnboardEl.innerHTML = onboardGrowHtml();

  gardenOnboardEl.classList.remove('hidden');

  if (hadFocus) {
    var first = gardenOnboardEl.querySelector('[data-ob-act], [data-ob-starter]');
    if (first) first.focus();
  }
}


// ============================================
// Interaction
//
// Delegated from the document, once, because the starters live in two
// hosts that are both rebuilt from scratch: the garden card above and
// the Tasks page sections in 12. Neither host's own listener claims
// these clicks - 12 only acts on [data-act], and these carry their own
// attributes.
// ============================================
document.addEventListener('click', function (e) {
  if (!e.target.closest) return;

  var starter = e.target.closest('[data-ob-starter]');
  if (starter) {
    var s = ONBOARD_STARTERS[parseInt(starter.getAttribute('data-ob-starter'), 10)];
    if (s) plantOnboardingHabit(s.text, s.cat);
    return;
  }

  // The Habit / Assignment switch on your own. State lives on the
  // buttons themselves: the card is only rebuilt when the stage
  // changes, so the choice survives any render in between.
  var kindBtn = e.target.closest('[data-ob-kind]');
  if (kindBtn) {
    var group = kindBtn.parentNode;
    Array.prototype.forEach.call(group.querySelectorAll('[data-ob-kind]'), function (b) {
      var on = b === kindBtn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    return;
  }

  var btn = e.target.closest('[data-ob-act]');
  if (!btn) return;
  var act = btn.getAttribute('data-ob-act');

  if (act === 'tick') {
    var task = findOnboardTask();
    // toggleTask saves and renders, and the render moves the card on.
    // The effort question is deliberately not asked here: the first
    // tick is Steady, and a second dialog on top of a first run is one
    // interruption too many.
    if (task && !task.completed) toggleTask(task.id, true);
    return;
  }

  if (act === 'later' || act === 'done') {
    onboardPlantedId = null;
    renderGardenOnboarding();
  }
});

document.addEventListener('submit', function (e) {
  var form = e.target;
  if (!form || !form.getAttribute || !form.getAttribute('data-ob-form')) return;
  e.preventDefault();

  var input   = form.querySelector('input');
  var catEl   = form.querySelector('[data-ob-cat]');
  var kindEl  = form.querySelector('[data-ob-kind].active');
  plantOnboardingHabit(
    input ? input.value : '',
    catEl ? catEl.value : 'misc',
    kindEl ? kindEl.getAttribute('data-ob-kind') : 'habit'
  );
});
