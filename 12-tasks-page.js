// ============================================
// 12: TASKS PAGE - the checklist, rebuilt
// Part of DISCIPLANT.
// Loaded as a plain global script (no modules), AFTER 01-05, because
// it calls getPlantSVG (04), escapeHtml (04), skinPipHtml and
// openPlantSkins (05), and the task-model helpers in 01.
//
// WHAT THIS FILE REPLACED
// The old page was a plot of category cards, a shared add-form and one
// flat <ul> of checkbox rows per tab. It could show exactly one thing
// about a task - whether it was ticked today - and there was nowhere
// for anything else to go.
//
// The shape now is: a header that answers "what is left today", one
// add form, a category strip that filters, and a set of SECTIONS
// rather than tabs. Every row opens a detail sheet, and the sheet is
// where the task model actually lives: type, schedule, subtasks,
// notes, due date, category, skin, delete.
//
// WHAT IS DELIBERATELY NOT HERE
// Nothing in this file touches the growth curve. Ticking a habit still
// costs exactly one call to toggleTask() in 02 and grows the plant by
// exactly one day. Effort logging, partial credit from subtasks and
// per-habit weight all change what a completion is WORTH, and none of
// them are wired up yet - see the notes in 01-app-core.js on the task
// model for which fields are reserved for them.
// ============================================


// ============================================
// Page state
//
// None of this is persisted. It is which view you were looking at,
// not anything about your garden, so it costs no write and is allowed
// to reset on reload.
// ============================================
var tpScope      = 'today';   // 'today' | 'all'
var tpCategory   = 'all';     // 'all' | a category id
var tpOpenTaskId = null;      // which task's detail sheet is open
var tpConfirmDelete = false;  // two-step delete inside the sheet


// ============================================
// Plant art cache
//
// getPlantSVG() builds a string and ensureSkinDefs() injects a <defs>
// block the first time a skin is seen. Both are cheap once and silly
// on every render, and a row's artwork only depends on four things,
// so key on exactly those. Cleared by nothing: the set of possible
// keys is species x stage x skin x size, which is small and bounded.
// ============================================
var tpArtCache = {};

function tpPlantArt(catId, days, skinId, size) {
  if (typeof getPlantSVG !== 'function') return '';
  var stage = (typeof getStageIndexForDays === 'function')
    ? getStageIndexForDays(days)
    : 0;
  var key = catId + ':' + stage + ':' + (skinId || '') + ':' + size;
  if (!tpArtCache[key]) tpArtCache[key] = getPlantSVG(catId, stage, skinId, size);
  return tpArtCache[key];
}

function tpTaskArt(task, size) {
  var skinId = (typeof getTaskSkinId === 'function') ? getTaskSkinId(task) : null;
  return tpPlantArt(task.categoryId, task.totalGrowthDays || 0, skinId, size);
}


// ============================================
// Small formatting helpers
// ============================================
var TP_DAY_NAMES   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var TP_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'YYYY-MM-DD' -> 'Fri 5 Sep'. Parsed in UTC to match every other
// date function in the app; see the note above dayOfYear() in 01.
function tpFormatDate(dateStr) {
  var p = String(dateStr).split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return TP_DAY_NAMES[d.getUTCDay()].slice(0, 3) + ' ' +
         d.getUTCDate() + ' ' + TP_MONTH_NAMES[d.getUTCMonth()];
}

// The same date said the way a person would say it when it is close.
function tpRelativeDate(dateStr) {
  var gap = dayGap(getTodayString(), dateStr);
  if (gap === 0)  return 'today';
  if (gap === 1)  return 'tomorrow';
  if (gap === -1) return 'yesterday';
  if (gap > 1 && gap < 7) return TP_DAY_NAMES[dayOfWeek(dateStr)];
  return tpFormatDate(dateStr);
}

function tpPlural(n, one, many) {
  return n + ' ' + (n === 1 ? one : many);
}

// The long form of a task's schedule, for the sheet.
function tpScheduleLabel(task) {
  var s = task.schedule;
  if (!isCustomSchedule(task)) return 'Every day';
  if (s === SCHEDULE_WEEKDAYS) return 'School days';
  if (s === SCHEDULE_WEEKENDS) return 'Weekends';
  var out = [];
  for (var i = 0; i < 7; i++) {
    if (s.charAt(i) === '1') out.push(TP_DAY_NAMES[i].slice(0, 3));
  }
  return out.join(' ');
}


// ============================================
// Building the page shell
//
// Runs once, at parse time. Everything inside it is static markup or a
// listener; nothing here reads `tasks`, which has not arrived yet.
// ============================================
var tpHeaderEl    = document.getElementById('tpHeader');
var tpPlotEl      = document.getElementById('tpPlot');
var tpScopeEl     = document.getElementById('tpScope');
var tpSectionsEl  = document.getElementById('tpSections');
var tpAddFormEl   = document.getElementById('tpAddForm');
var tpAddInputEl  = document.getElementById('tpAddInput');
var tpAddKindEl   = document.getElementById('tpAddKind');
var tpAddCatEl    = document.getElementById('tpAddCategory');
var tpAddDueEl    = document.getElementById('tpAddDue');
var tpSheetEl     = document.getElementById('taskSheet');
var tpSheetBodyEl = document.getElementById('taskSheetBody');
var tpAskEl       = document.getElementById('effortAsk');
var tpAskBodyEl   = document.getElementById('effortAskBody');

var tpAddKind = 'habit';

// Category options on the add form.
if (tpAddCatEl) {
  CATEGORIES.forEach(function (cat) {
    var opt = document.createElement('option');
    opt.value       = cat.id;
    opt.textContent = cat.name;
    tpAddCatEl.appendChild(opt);
  });
  tpAddCatEl.value = 'misc';
}

// Scope switch: what the sections below are showing.
if (tpScopeEl) {
  tpScopeEl.innerHTML =
    '<button type="button" class="tp-seg-btn" data-scope="today">Today</button>' +
    '<button type="button" class="tp-seg-btn" data-scope="all">Everything</button>';
  tpScopeEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-scope]');
    if (!btn) return;
    tpScope = btn.getAttribute('data-scope');
    renderTaskList();
  });
}

// Type switch on the add form. Assignments get a due-date field; the
// field is hidden rather than removed so its value survives a toggle.
if (tpAddKindEl) {
  tpAddKindEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-kind]');
    if (!btn) return;
    tpAddKind = btn.getAttribute('data-kind');
    tpAddKindEl.querySelectorAll('[data-kind]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-kind') === tpAddKind);
    });
    if (tpAddDueEl) tpAddDueEl.classList.toggle('hidden', tpAddKind !== 'once');
    if (tpAddInputEl) {
      tpAddInputEl.placeholder = tpAddKind === 'once'
        ? 'e.g. Finish the lab report'
        : 'e.g. Read for 20 min';
    }
  });
}

// The category strip. One card per species, plus an "everything" card.
// It is a FILTER now rather than a set of tabs - the sections below do
// the grouping, so the strip only has to answer "which plot".
function tpBuildPlot() {
  if (!tpPlotEl) return;
  tpPlotEl.innerHTML = '';

  var allCard       = document.createElement('button');
  allCard.type      = 'button';
  allCard.className = 'tp-plot-card tp-plot-card-all active';
  allCard.dataset.cat = 'all';
  allCard.innerHTML =
    '<span class="tp-plot-name">All plots</span>' +
    '<span class="tp-plot-count" id="tp-count-all"></span>';
  tpPlotEl.appendChild(allCard);

  CATEGORIES.forEach(function (cat) {
    var card       = document.createElement('button');
    card.type      = 'button';
    card.className = 'tp-plot-card';
    card.dataset.cat = cat.id;
    card.innerHTML =
      '<span class="tp-plot-art" id="tp-art-' + cat.id + '"></span>' +
      '<span class="tp-plot-name">' + cat.name + '</span>' +
      '<span class="tp-plot-count" id="tp-count-' + cat.id + '"></span>';
    tpPlotEl.appendChild(card);
  });

  tpPlotEl.addEventListener('click', function (e) {
    var card = e.target.closest('[data-cat]');
    if (!card) return;
    tpCategory = card.getAttribute('data-cat');
    if (tpAddCatEl && tpCategory !== 'all') tpAddCatEl.value = tpCategory;
    renderTaskList();
  });
}

tpBuildPlot();


// ============================================
// Adding a task
//
// One form for both types. The type switch decides which fields are
// read, so an assignment and a habit are the same two keystrokes apart
// rather than living behind different flows.
// ============================================
if (tpAddFormEl) {
  tpAddFormEl.addEventListener('submit', function (event) {
    event.preventDefault();
    var text = (tpAddInputEl ? tpAddInputEl.value : '').trim().slice(0, TASK_TEXT_MAX);
    if (text === '') return;

    var catId = (tpAddCatEl && tpAddCatEl.value) || 'misc';
    var due   = (tpAddKind === 'once' && tpAddDueEl && tpAddDueEl.value)
      ? tpAddDueEl.value
      : null;

    var task = makeTask(nextId, text, catId);
    task.kind = tpAddKind;
    task.due  = due;
    tasks.push(task);
    nextId++;

    if (tpAddInputEl) tpAddInputEl.value = '';
    if (tpAddDueEl)   tpAddDueEl.value   = '';

    assignPermanentPositions();
    saveData();
    render();

    // Straight into the sheet on the thing just planted.
    //
    // The form takes a name and a type and nothing else, which is
    // deliberate - two keystrokes to plant something. But a habit
    // with no schedule is a habit due every day, and an assignment
    // with no date is one with no deadline, and both of those are
    // decisions made by default rather than on purpose. The sheet is
    // the only place they can be made, so the add lands on it rather
    // than leaving a row you have to notice and go back to.
    tpOpenSheet(task.id);
  });
}


// ============================================
// Which tasks belong in which section
//
// The rules are all in one place on purpose. Every section is a filter
// over the same array, so a task can never be in two of them and can
// never be in none.
// ============================================
function tpVisibleTasks() {
  return tasks.filter(function (t) {
    return tpCategory === 'all' || t.categoryId === tpCategory;
  });
}

// Assignments sort by due date, undated last. Habits sort by the plant
// that is furthest along, so the garden's elders sit at the top — and
// anything the user has placed by hand sits above both, in the order
// they placed it.
//
// The comparator itself lives in 01 (compareTasks), because the
// reordering operations need to ask what order a list is currently in,
// and a second copy here would be a second answer waiting to diverge.
function tpSortAssignments(list) {
  return list.slice().sort(compareTasks);
}

function tpSortHabits(list) {
  return list.slice().sort(compareTasks);
}

// Which column a section belongs in:
//
//   'a'     habits, left
//   'b'     assignments, right
//   'full'  spans both, and always sits below them
//
// WHY THE SPLIT IS BY KIND rather than by anything else. The two are
// read at different moments and for different reasons: habits are a
// list you work down every day and never finish, assignments are a
// queue you are trying to empty. Stacked, the queue was buried under
// the routine and you had to scroll past today's habits to find out
// what was due. Side by side, both are answerable at a glance, and
// the page stops being twice as tall as it needs to be.
//
// Every section is a filter over the same array, so a task can never
// be in two of them and can never be in none.
function tpBuildSections() {
  var today   = getTodayString();
  var visible = tpVisibleTasks();
  var habits  = visible.filter(function (t) { return t.kind !== 'once'; });
  var onces   = visible.filter(function (t) { return t.kind === 'once'; });
  var out     = [];

  if (tpScope === 'today') {
    var dueHabits = [], offSchedule = [], doneHabits = [];
    habits.forEach(function (t) {
      if (t.completed)             { doneHabits.push(t);  return; }
      if (isScheduledOn(t, today)) { dueHabits.push(t);   return; }
      offSchedule.push(t);
    });

    var dueOnce = [], laterOnce = [], doneOnce = [];
    onces.forEach(function (t) {
      // Only TODAY's finishes belong on a page called Today. An
      // assignment handed in three weeks ago is history, and it has a
      // home under Everything.
      if (t.completed)              { if (t.doneAt === today) doneOnce.push(t); return; }
      if (!t.due || t.due <= today) { dueOnce.push(t);   return; }
      laterOnce.push(t);
    });

    out.push({
      col:   'a',
      title: 'Habits today',
      list:  tpSortHabits(dueHabits),
      empty: habits.length ? 'Every habit is ticked.' : 'No habits yet.',
    });
    if (offSchedule.length) {
      out.push({
        col:   'a',
        title: 'Not today',
        note:  'These keep their streaks. A day they are not scheduled for cannot be missed.',
        list:  tpSortHabits(offSchedule),
        muted: true,
      });
    }

    out.push({
      col:   'b',
      title: 'Assignments',
      list:  tpSortAssignments(dueOnce),
      empty: onces.length
        ? 'Nothing due.'
        : 'Nothing due. Add one above and switch the type to Assignment.',
    });
    if (laterOnce.length) {
      out.push({
        col:   'b',
        title: 'Coming up',
        list:  tpSortAssignments(laterOnce),
        muted: true,
      });
    }

    if (doneHabits.length || doneOnce.length) {
      out.push({
        col:   'full',
        title: 'Done today',
        list:  tpSortHabits(doneHabits).concat(tpSortAssignments(doneOnce)),
        muted: true,
      });
    }
    return out;
  }

  // scope === 'all'
  out.push({
    col:   'a',
    title: 'Habits',
    list:  tpSortHabits(habits),
    empty: 'No habits in this plot yet.',
  });

  out.push({
    col:   'b',
    title: 'Assignments',
    list:  tpSortAssignments(onces.filter(function (t) { return !t.completed; })),
    empty: 'Nothing open in this plot.',
  });

  var finished = onces.filter(function (t) { return t.completed; });
  if (finished.length) {
    out.push({
      col:   'full',
      title: 'Finished',
      note:  'Done and kept. These plants stay in the garden.',
      list:  tpSortAssignments(finished),
      muted: true,
    });
  }
  return out;
}

// ============================================
// A single row
// ============================================

// The grey line under a task's name. Everything on it is derived, so
// it costs nothing to store and cannot go stale.
function tpRowMeta(task) {
  var bits = [];
  var today = getTodayString();

  if (task.kind === 'once') {
    // Only a non-default rating earns a chip. "Small" on every row
    // would be a column of the word Small.
    var imp = normalizeImpact(task.impact);
    if (imp !== TASK_IMPACT_DEFAULT) {
      var rung = TASK_IMPACTS.filter(function (o) { return o.value === imp; })[0];
      if (rung) bits.push({ text: rung.label });
    }
    if (task.completed && task.doneAt) {
      bits.push({ text: 'Done ' + tpRelativeDate(task.doneAt) });
    } else if (task.due) {
      var gap = dayGap(today, task.due);
      if (gap < 0)       bits.push({ text: 'Overdue ' + tpPlural(-gap, 'day', 'days'), tone: 'late' });
      else if (gap === 0) bits.push({ text: 'Due today', tone: 'now' });
      else                bits.push({ text: 'Due ' + tpRelativeDate(task.due) });
    } else {
      bits.push({ text: 'No due date' });
    }
  } else {
    if (task.streak > 0) {
      bits.push({ text: tpPlural(task.streak, 'day', 'days') + ' running', tone: 'streak' });
    }
    if (isCustomSchedule(task)) bits.push({ text: tpScheduleLabel(task) });
    if (!task.streak && task.totalGrowthDays) {
      bits.push({ text: formatGrowthPoints(task.totalGrowthDays) + ' days grown' });
    }
  }

  var subs = task.subtasks || [];
  if (subs.length) {
    var done = subs.filter(function (s) { return s.done; }).length;
    bits.push({ text: done + '/' + subs.length + ' steps', tone: done === subs.length ? 'streak' : '' });
  }

  if (tpCategory === 'all') {
    bits.push({ text: getCategoryById(task.categoryId).name, tone: 'cat' });
  }

  return bits;
}

// The task the effort dialog is asking about, or null.
//
// Only ever one at a time, and it is set by TICKING rather than by
// anything the dialog itself does - so the question always belongs to
// the tick that just happened, and ticking anything else replaces it.
var tpAskId = null;

// Called from every path that can tick a task: the row checkbox, and
// the sheet's own step list when the last step ticks the parent for
// you. Unticking closes it, because there is no longer a day to
// describe.
function tpNoteTick(taskId, nowCompleted) {
  tpAskId = nowCompleted ? taskId : null;
}

function tpCloseAsk() {
  tpAskId = null;
  tpRenderAsk();
}

// The dialog. Rebuilt from scratch on every render, like the sheet,
// and its own visibility is derived from tpAskId rather than toggled
// by hand - so there is exactly one thing to get right and every tick
// path gets it for free.
function tpRenderAsk() {
  if (!tpAskEl || !tpAskBodyEl) return;

  var task = tpAskId === null ? null : tasks.find(function (t) {
    return t.id === tpAskId;
  });

  // The question only stands while the day it asks about is still
  // ticked. Unticking from anywhere, or a rollover, closes it - there
  // is no day left to describe.
  if (task && !histGet(task.history, getTodayString())) task = null;

  if (!task) {
    tpAskId = null;
    tpAskEl.classList.add('hidden');
    tpAskEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tp-ask-open');
    return;
  }

  var effort = taskEffortToday(task);

  tpAskBodyEl.innerHTML =
    '<div class="tp-ask-art" aria-hidden="true">' + tpTaskArt(task, 74) + '</div>' +
    '<p class="tp-ask-name">' + escapeHtml(task.text) + '</p>' +
    '<h2 class="tp-ask-q">How was it?</h2>' +
    '<div class="tp-ask-opts">' +
      EFFORT_LEVELS.slice(1).map(function (lvl) {
        return '<button type="button" class="tp-ask-opt' +
          (lvl.value === effort ? ' active' : '') + '" ' +
          'data-act="askeffort" data-value="' + lvl.value + '" ' +
          'aria-pressed="' + (lvl.value === effort ? 'true' : 'false') + '">' +
          '<span class="tp-ask-opt-label">' + escapeHtml(lvl.label) + '</span>' +
          '<span class="tp-ask-opt-hint">' + escapeHtml(lvl.hint) + '</span>' +
          '</button>';
      }).join('') +
    '</div>' +
    '<button type="button" class="tp-ask-skip" data-act="askclose">Skip</button>';

  tpAskEl.classList.remove('hidden');
  tpAskEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('tp-ask-open');
}

// One delegated listener, attached once. The dialog covers the page
// while it is open, so nothing behind it can be clicked and there is
// no need to stand the question down anywhere else.
if (tpAskEl) {
  tpAskEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');

    // Backdrop, or the Skip link: the tick stands and today keeps the
    // Steady it was already written with.
    if (!btn) {
      if (e.target.closest('.tp-ask-backdrop')) tpCloseAsk();
      return;
    }

    var act = btn.getAttribute('data-act');
    if (act === 'askclose') { tpCloseAsk(); return; }

    if (act === 'askeffort') {
      var task = tasks.find(function (t) { return t.id === tpAskId; });
      setTaskEffort(task, parseInt(btn.getAttribute('data-value'), 10));
      // Answering closes it. The question has been asked and answered,
      // and leaving it up would turn a prompt into furniture.
      tpAskId = null;
      saveData();
      render();
    }
  });
}

function tpRowHtml(task) {
  var metaHtml = tpRowMeta(task).map(function (b) {
    return '<span class="tp-meta' + (b.tone ? ' tp-meta-' + b.tone : '') + '">' +
           escapeHtml(b.text) + '</span>';
  }).join('');

  var subs = task.subtasks || [];
  var barHtml = '';
  if (subs.length) {
    var pct = Math.round(subs.filter(function (s) { return s.done; }).length / subs.length * 100);
    barHtml = '<span class="tp-row-bar"><i style="width:' + pct + '%"></i></span>';
  }

  return (
    '<li class="tp-row' + (task.completed ? ' is-done' : '') +
        (task.kind === 'once' ? ' is-once' : '') + '" data-id="' + task.id + '">' +
      '<button type="button" class="tp-check" data-act="toggle" ' +
        'aria-pressed="' + (task.completed ? 'true' : 'false') + '" ' +
        'aria-label="' + (task.completed ? 'Mark not done' : 'Mark done') + '">' +
        '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">' +
        '<path d="M3 8.5 L6.5 12 L13 4" fill="none" stroke="currentColor" ' +
        'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<button type="button" class="tp-row-main" data-act="open">' +
        '<span class="tp-row-title">' + escapeHtml(task.text) + '</span>' +
        (metaHtml ? '<span class="tp-row-metas">' + metaHtml + '</span>' : '') +
        barHtml +
      '</button>' +
      '<span class="tp-row-art" aria-hidden="true">' + tpTaskArt(task, 26) + '</span>' +
      // Not a [data-act] button: the delegated click listener below
      // opens the sheet for anything it does not recognise, and a grip
      // that opened the sheet every time you finished dragging would be
      // unusable. It is driven by pointerdown instead, and the click
      // that follows a drag is swallowed.
      '<button type="button" class="tp-grip" data-grip="1" tabindex="-1" ' +
        'aria-hidden="true" title="Drag to reorder">' +
        '<svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true">' +
        '<circle cx="2.5" cy="4" r="1.2"/><circle cx="7.5" cy="4" r="1.2"/>' +
        '<circle cx="2.5" cy="8" r="1.2"/><circle cx="7.5" cy="8" r="1.2"/>' +
        '<circle cx="2.5" cy="12" r="1.2"/><circle cx="7.5" cy="12" r="1.2"/>' +
        '</svg>' +
      '</button>' +
    '</li>'
  );
}


// ============================================
// Rendering the whole page
//
// Called from render() in 05 after every state change, from any page.
// It is all string building plus one innerHTML assignment per region,
// with the plant art cached, so running it while the tasks page is
// hidden costs little enough not to need a dirty flag.
// ============================================
function renderTaskList() {
  tpRenderScope();
  tpRenderHeader();
  tpRenderPlot();
  // 14 loads after this file.
  if (typeof tpRenderGuideLink === 'function') tpRenderGuideLink();
  tpRenderSections();
  tpRenderSheet();
  tpRenderAsk();
}

// The highlight on the Today / Everything switch follows tpScope on
// every render. It used to be set once at parse time and never again,
// so choosing Everything left Today lit.
function tpRenderScope() {
  if (!tpScopeEl) return;
  tpScopeEl.querySelectorAll('[data-scope]').forEach(function (b) {
    var on = b.getAttribute('data-scope') === tpScope;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function tpRenderHeader() {
  if (!tpHeaderEl) return;

  var today = getTodayString();
  var due = 0, done = 0, late = 0;

  // WHAT COUNTS AS TODAY'S PLATE. Both kinds go into `due` and both
  // can move into `done`, so finishing anything advances the bar.
  //
  // This is worth stating because it was wrong once and the failure
  // was silent: assignments used to leave the count entirely when
  // ticked, rather than moving from one side of the fraction to the
  // other. Ticking one took it out of the denominator and put nothing
  // in the numerator, so a garden with one habit and one assignment
  // went from '0 of 2' to '0 of 1' - you did the work and the number
  // went backwards.
  tasks.forEach(function (t) {
    if (t.kind === 'once') {
      if (t.completed) {
        // Only a finish from TODAY belongs in today's ratio. One from
        // three weeks ago is history and is not on the plate.
        if (t.doneAt === today) { due++; done++; }
        return;
      }
      if (t.due && t.due < today) { late++; due++; return; }
      if (!t.due || t.due <= today) due++;
      return;
    }
    // A habit is on the plate on the days its schedule names, ticked
    // or not - that is the whole point of the denominator.
    if (!isScheduledOn(t, today)) return;
    due++;
    if (t.completed) done++;
  });

  var pct = due ? Math.round(done / due * 100) : 0;
  var p = String(today).split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));

  var line;
  if (!tasks.length)      line = 'Nothing planted yet.';
  else if (!due)          line = 'Nothing scheduled today.';
  else if (done >= due)   line = 'All clear.';
  else                    line = done + ' of ' + due + ' done';

  tpHeaderEl.innerHTML =
    '<div class="tp-header-top">' +
      '<span class="tp-header-day">' + TP_DAY_NAMES[d.getUTCDay()] + '</span>' +
      '<span class="tp-header-date">' + d.getUTCDate() + ' ' + TP_MONTH_NAMES[d.getUTCMonth()] + '</span>' +
    '</div>' +
    '<div class="tp-header-line">' + escapeHtml(line) +
      (late ? '<span class="tp-header-late">' + tpPlural(late, 'overdue', 'overdue') + '</span>' : '') +
    '</div>' +
    '<div class="tp-progress"><i style="width:' + pct + '%"></i></div>';
}

function tpRenderPlot() {
  if (!tpPlotEl) return;

  tpPlotEl.querySelectorAll('[data-cat]').forEach(function (card) {
    card.classList.toggle('active', card.getAttribute('data-cat') === tpCategory);
  });

  var allCount = document.getElementById('tp-count-all');
  if (allCount) {
    allCount.textContent = tasks.length ? tpPlural(tasks.length, 'plant', 'plants') : 'empty';
  }

  CATEGORIES.forEach(function (cat) {
    var mine = tasks.filter(function (t) { return t.categoryId === cat.id; });

    var countEl = document.getElementById('tp-count-' + cat.id);
    if (countEl) countEl.textContent = mine.length ? String(mine.length) : '-';

    // The card wears this plot's furthest-along plant, so the strip
    // reads as a garden rather than a row of identical seeds.
    var lead = null;
    mine.forEach(function (t) {
      if (!lead || (t.totalGrowthDays || 0) > (lead.totalGrowthDays || 0)) lead = t;
    });

    var artEl = document.getElementById('tp-art-' + cat.id);
    if (artEl) {
      var skinId = (lead && typeof getTaskSkinId === 'function') ? getTaskSkinId(lead) : null;
      var stamp  = (lead ? lead.totalGrowthDays : 0) + ':' + (skinId || '');
      if (artEl.dataset.stamp !== stamp) {
        artEl.innerHTML = tpPlantArt(cat.id, lead ? lead.totalGrowthDays : 0, skinId, 42);
        artEl.dataset.stamp = stamp;
      }
    }
  });
}

function tpRenderSections() {
  if (!tpSectionsEl) return;

  if (!tasks.length) {
    tpSectionsEl.innerHTML =
      '<div class="tp-section"><p class="tp-empty">' +
      'Nothing planted yet. Write one thing above - a habit you want to keep, ' +
      'or an assignment you need off your mind - and it becomes a plant.' +
      '</p>' +
      // The same one-tap starters an empty garden offers (H1). Guarded
      // because 13-onboarding.js loads after this file.
      (typeof onboardStarterHtml === 'function' ? onboardStarterHtml() : '') +
      '</div>';
    return;
  }

  var sections = tpBuildSections();

  function sectionHtml(sec) {
    if (!sec.list.length && !sec.empty) return '';
    return (
      '<section class="tp-section' + (sec.muted ? ' is-muted' : '') + '">' +
        '<h3 class="tp-section-title">' + escapeHtml(sec.title) +
          '<span class="tp-section-count">' + sec.list.length + '</span>' +
        '</h3>' +
        (sec.note ? '<p class="tp-section-note">' + escapeHtml(sec.note) + '</p>' : '') +
        (sec.list.length
          ? '<ul class="tp-list">' + sec.list.map(tpRowHtml).join('') + '</ul>'
          : '<p class="tp-empty">' + escapeHtml(sec.empty) + '</p>') +
      '</section>'
    );
  }

  function column(which) {
    return sections
      .filter(function (sec) { return sec.col === which; })
      .map(sectionHtml).join('');
  }

  // The two columns are always emitted, even when one of them holds
  // nothing but an empty state. Collapsing to a single column when a
  // garden has no assignments would move every habit sideways the
  // first time one was added, and would hide the fact that
  // assignments exist at all from anyone who has not tried them.
  // Below the breakpoint in the stylesheet this stacks anyway.
  tpSectionsEl.innerHTML =
    '<div class="tp-cols">' +
      '<div class="tp-col">' + column('a') + '</div>' +
      '<div class="tp-col">' + column('b') + '</div>' +
    '</div>' +
    column('full');
}

// One delegated listener for every row on the page, attached once.
if (tpSectionsEl) {
  tpSectionsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var row = btn.closest('[data-id]');
    if (!row) return;
    var id = parseInt(row.getAttribute('data-id'), 10);

    var act = btn.getAttribute('data-act');

    if (act === 'toggle') {
      var task = tasks.find(function (t) { return t.id === id; });
      var next = !(task && task.completed);
      tpNoteTick(id, next);
      toggleTask(id, next);
      return;
    }

    tpOpenSheet(id);
  });
}



// ============================================
// Reordering by drag
//
// Pointer events rather than HTML5 drag-and-drop, for the same reason
// the garden uses them: HTML5 dragging does not exist on touch, and
// this list is read on a phone more than anywhere else.
//
// The drag moves the <li> in the DOM as you go, so the row you are
// holding is always where you are holding it. Nothing is committed
// until you let go, and what gets committed is simply the order the
// list ended up in — see applySectionOrder() in 01.
// ============================================
var tpDrag = null;

function tpBeginDrag(li, pointerId) {
  var ul = li.parentElement;
  if (!ul || ul.children.length < 2) return;

  tpDrag = { li: li, ul: ul, moved: false };
  li.classList.add('is-dragging');
  document.body.classList.add('tp-dragging');

  try { li.setPointerCapture(pointerId); } catch (e) {}
  document.addEventListener('pointermove', tpDragMove);
  document.addEventListener('pointerup', tpDragEnd);
  document.addEventListener('pointercancel', tpDragEnd);
}

function tpDragMove(e) {
  if (!tpDrag) return;
  tpDrag.moved = true;

  // Whatever row is under the pointer, provided it is a sibling in
  // the same list. Dragging out of the section does nothing rather
  // than something surprising: the sections mean different things
  // ("Not today" is not a place you can put a habit), so a drop
  // across them would be claiming an edit the user did not make.
  var under = document.elementFromPoint(e.clientX, e.clientY);
  var row   = under && under.closest ? under.closest('.tp-row') : null;
  if (!row || row === tpDrag.li || row.parentElement !== tpDrag.ul) return;

  // Past the midpoint means the pointer has committed to the far
  // side of that row. Without the midpoint test the two rows swap
  // back and forth on every pixel of movement along their shared edge.
  var box   = row.getBoundingClientRect();
  var after = e.clientY > (box.top + box.height / 2);
  tpDrag.ul.insertBefore(tpDrag.li, after ? row.nextSibling : row);
}

function tpDragEnd() {
  document.removeEventListener('pointermove', tpDragMove);
  document.removeEventListener('pointerup', tpDragEnd);
  document.removeEventListener('pointercancel', tpDragEnd);
  if (!tpDrag) return;

  var drag = tpDrag;
  tpDrag = null;
  drag.li.classList.remove('is-dragging');
  document.body.classList.remove('tp-dragging');

  if (!drag.moved) return;

  var ids = Array.prototype.map.call(drag.ul.children, function (el) {
    return parseInt(el.getAttribute('data-id'), 10);
  }).filter(function (n) { return !isNaN(n); });

  if (applySectionOrder(ids)) {
    saveData();
    render();
  }
}

// A drag ends in a click on whatever was under the pointer. Swallow
// it, or letting go of a row opens that row's sheet.
if (tpSectionsEl) {
  tpSectionsEl.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    var grip = e.target.closest ? e.target.closest('[data-grip]') : null;
    if (!grip) return;
    var li = grip.closest('.tp-row');
    if (!li) return;
    e.preventDefault();
    tpBeginDrag(li, e.pointerId);
  });

  tpSectionsEl.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-grip]')) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}


// ============================================
// The detail sheet
//
// One task, everything about it. This is the whole reason the page was
// rebuilt: there was previously no surface a schedule or a subtask
// could live on.
// ============================================
function tpOpenSheet(taskId) {
  tpOpenTaskId    = taskId;
  tpConfirmDelete = false;
  tpRenderSheet();
  if (tpSheetEl) {
    tpSheetEl.classList.remove('hidden');
    tpSheetEl.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('tp-sheet-open');
}

function tpCloseSheet() {
  tpOpenTaskId    = null;
  tpConfirmDelete = false;
  if (tpSheetEl) {
    tpSheetEl.classList.add('hidden');
    tpSheetEl.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('tp-sheet-open');
}

function tpOpenTask() {
  if (tpOpenTaskId === null) return null;
  return tasks.find(function (t) { return t.id === tpOpenTaskId; }) || null;
}

function tpStatChip(label, value) {
  return '<span class="tp-stat"><b>' + value + '</b>' + escapeHtml(label) + '</span>';
}

function tpRenderSheet() {
  if (!tpSheetBodyEl) return;
  var task = tpOpenTask();
  if (!task) {
    if (tpOpenTaskId !== null) tpCloseSheet();
    return;
  }

  var cat    = getCategoryById(task.categoryId);
  var isOnce = task.kind === 'once';
  var subs   = task.subtasks || [];

  // ---- Hero: the plant, the name, what it is ----
  var html =
    '<div class="tp-sheet-hero">' +
      '<div class="tp-sheet-art">' + tpTaskArt(task, 64) + '</div>' +
      '<div class="tp-sheet-heading">' +
        '<input class="tp-sheet-title" type="text" data-field="text" ' +
          'maxlength="' + TASK_TEXT_MAX + '" value="' + escapeHtml(task.text) + '" ' +
          'aria-label="Task name" />' +
        '<p class="tp-sheet-species">' + escapeHtml(cat.species) + ' &middot; ' +
          escapeHtml(cat.name) + '</p>' +
      '</div>' +
    '</div>';

  // ---- Stats. Growth is the same number it always was. ----
  html += '<div class="tp-stats">';
  if (isOnce) {
    html += tpStatChip('days grown', formatGrowthPoints(task.totalGrowthDays));
    html += tpStatChip(task.completed ? 'finished' : 'open', task.completed ? 'yes' : 'no');
  } else {
    html += tpStatChip('day streak', task.streak || 0);
    html += tpStatChip('best streak', task.maxStreak || 0);
    html += tpStatChip('days grown', formatGrowthPoints(task.totalGrowthDays));
  }
  html += '</div>';

  // ---- Type ----
  html +=
    '<div class="tp-field">' +
      '<label class="tp-label">Type</label>' +
      '<div class="tp-seg" data-group="kind">' +
        '<button type="button" class="tp-seg-btn' + (isOnce ? '' : ' active') + '" ' +
          'data-act="kind" data-value="habit">Habit</button>' +
        '<button type="button" class="tp-seg-btn' + (isOnce ? ' active' : '') + '" ' +
          'data-act="kind" data-value="once">Assignment</button>' +
      '</div>' +
      '<p class="tp-hint">' + (isOnce
        ? 'Done once and finished. It does not reset overnight and it never breaks a streak.'
        : 'Repeats on its schedule. Every day you tick it, the plant grows.') +
      '</p>' +
    '</div>';

  // ---- Schedule (habits) or due date (assignments) ----
  if (isOnce) {
    var impact = normalizeImpact(task.impact);
    var locked = !!task.completed && !!task.doneAt && task.doneAt !== getTodayString();
    html +=
      '<div class="tp-field">' +
        '<label class="tp-label" for="tpSheetDue">Due</label>' +
        '<input class="tp-input" id="tpSheetDue" type="date" data-field="due" ' +
          'value="' + (task.due || '') + '" />' +
      '</div>' +

      // Reuses .tp-seg / .tp-seg-btn, the same control the type and
      // schedule presets already use - four rungs is exactly what
      // that component is shaped for, and it needs no new CSS.
      '<div class="tp-field">' +
        '<label class="tp-label">Impact</label>' +
        '<div class="tp-seg" data-group="impact">' +
          TASK_IMPACTS.map(function (opt) {
            return '<button type="button" class="tp-seg-btn' +
              (opt.value === impact ? ' active' : '') + '" ' +
              'data-act="impact" data-value="' + opt.value + '" ' +
              'aria-pressed="' + (opt.value === impact ? 'true' : 'false') + '">' +
              escapeHtml(opt.label) + '</button>';
          }).join('') +
        '</div>' +
        '<p class="tp-hint">' + (locked
          ? 'Worth ' + tpPlural(impact, 'day', 'days') + ' of growth. This one is ' +
            'already finished, so changing this renames the work rather than ' +
            'resizing the plant - banked growth is never taken back.'
          : 'How much work this is. Finishing it grows the plant by ' +
            tpPlural(impact, 'day', 'days') + ', where a day is one tick of an ' +
            'ordinary habit.' +
            (subs.length && !subtasksAllDone(task)
              ? ' Its steps are not all done, so ticking it now is worth ' +
                formatGrowthPoints(taskCompletionAward(task)) + '.'
              : '')) +
        '</p>' +
      '</div>';
  } else {
    var s = task.schedule;
    html +=
      '<div class="tp-field">' +
        '<label class="tp-label">Schedule</label>' +
        '<div class="tp-seg" data-group="preset">' +
          '<button type="button" class="tp-seg-btn' + (!isCustomSchedule(task) ? ' active' : '') + '" ' +
            'data-act="preset" data-value="daily">Every day</button>' +
          '<button type="button" class="tp-seg-btn' + (s === SCHEDULE_WEEKDAYS ? ' active' : '') + '" ' +
            'data-act="preset" data-value="weekdays">School days</button>' +
          '<button type="button" class="tp-seg-btn' + (s === SCHEDULE_WEEKENDS ? ' active' : '') + '" ' +
            'data-act="preset" data-value="weekends">Weekends</button>' +
        '</div>' +
        '<div class="tp-days">' +
          TP_DAY_NAMES.map(function (name, i) {
            var on = isScheduledOnDayIndex(task, i);
            return '<button type="button" class="tp-day' + (on ? ' active' : '') + '" ' +
              'data-act="day" data-value="' + i + '" ' +
              'aria-pressed="' + (on ? 'true' : 'false') + '" ' +
              'aria-label="' + name + '">' + name.charAt(0) + '</button>';
          }).join('') +
        '</div>' +
        '<p class="tp-hint">Days this habit is not scheduled for cannot break the streak.</p>' +
      '</div>';
  }

  // ---- Subtasks ----
  var subDone = subs.filter(function (x) { return x.done; }).length;
  html +=
    '<div class="tp-field">' +
      '<label class="tp-label">Steps' +
        (subs.length ? '<span class="tp-label-count">' + subDone + '/' + subs.length + '</span>' : '') +
      '</label>' +
      (subs.length
        ? '<ul class="tp-subs">' + subs.map(function (st) {
            return '<li class="tp-sub' + (st.done ? ' is-done' : '') + '">' +
              '<button type="button" class="tp-check tp-check-sm" data-act="subtoggle" ' +
                'data-value="' + st.id + '" aria-pressed="' + (st.done ? 'true' : 'false') + '" ' +
                'aria-label="' + (st.done ? 'Mark step not done' : 'Mark step done') + '">' +
                '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">' +
                '<path d="M3 8.5 L6.5 12 L13 4" fill="none" stroke="currentColor" ' +
                'stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '</button>' +
              '<span class="tp-sub-text">' + escapeHtml(st.text) + '</span>' +
              '<button type="button" class="tp-sub-x" data-act="subremove" data-value="' + st.id + '" ' +
                'aria-label="Remove step">' +
                '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">' +
                '<path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" stroke-width="2.4" ' +
                'stroke-linecap="round" fill="none"/></svg>' +
              '</button>' +
            '</li>';
          }).join('') + '</ul>'
        : '') +
      (subs.length < SUBTASK_MAX
        ? '<div class="tp-sub-add">' +
            '<input class="tp-input" type="text" id="tpSubInput" ' +
              'maxlength="' + SUBTASK_TEXT_MAX + '" placeholder="Break it into a step" />' +
            '<button type="button" class="tp-btn-sm" data-act="subadd">Add</button>' +
          '</div>'
        : '<p class="tp-hint">That is as many steps as one task can hold.</p>') +
      (subs.length
        ? '<p class="tp-hint">Ticking every step ticks the task itself. ' +
            (subDone >= subs.length
              ? 'That is full credit: ' +
                formatGrowthPoints(taskCompletionAward(task)) + ' days of growth.'
              : 'Ticking the task now, with ' + subDone + ' of ' + subs.length +
                ' done, grows it by ' +
                formatGrowthPoints(taskCompletionAward(task)) + ' instead of ' +
                formatGrowthPoints(taskGrowthWeight(task)) + '.') +
          '</p>'
        : '') +
    '</div>';

  // ---- Effort (only once today has actually been ticked) ----
  if (histGet(task.history, getTodayString())) {
    var effort = taskEffortToday(task);
    html +=
      '<div class="tp-field">' +
        '<label class="tp-label">How was today</label>' +
        '<div class="tp-seg" data-group="effort">' +
          EFFORT_LEVELS.slice(1).map(function (lvl) {
            return '<button type="button" class="tp-seg-btn' +
              (lvl.value === effort ? ' active' : '') + '" ' +
              'data-act="effort" data-value="' + lvl.value + '" ' +
              'aria-pressed="' + (lvl.value === effort ? 'true' : 'false') + '">' +
              escapeHtml(lvl.label) + '</button>';
          }).join('') +
        '</div>' +
        '<p class="tp-hint">' +
          escapeHtml(getEffortLevel(effort).hint) + '. ' +
          (effort === EFFORT_DEFAULT
            ? 'A harder day is worth more growth. Nothing here ever makes a day ' +
              'worth less, so there is no reason not to be honest about it.'
            : 'Today grew ' + formatGrowthPoints(taskCompletionAward(task)) +
              ' instead of ' + formatGrowthPoints(taskBaseAward(task)) + '.') +
        '</p>' +
      '</div>';
  }

  // ---- Notes ----
  html +=
    '<div class="tp-field">' +
      '<label class="tp-label" for="tpSheetNotes">Notes</label>' +
      '<textarea class="tp-input tp-textarea" id="tpSheetNotes" data-field="notes" rows="3" ' +
        'maxlength="' + NOTE_MAX + '" placeholder="Anything you want to remember about it">' +
        escapeHtml(task.notes || '') +
      '</textarea>' +
    '</div>';

  // ---- Plot + skin ----
  html +=
    '<div class="tp-field tp-field-split">' +
      '<div>' +
        '<label class="tp-label" for="tpSheetCat">Plot</label>' +
        '<select class="tp-input" id="tpSheetCat" data-field="categoryId">' +
          CATEGORIES.map(function (c) {
            return '<option value="' + c.id + '"' +
              (c.id === task.categoryId ? ' selected' : '') + '>' +
              escapeHtml(c.name) + ' &middot; ' + escapeHtml(c.species) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label class="tp-label">Look</label>' +
        '<button type="button" class="tp-btn-skin" data-act="skin">' +
          (typeof skinPipHtml === 'function'
            ? skinPipHtml(getSkin(task.categoryId, getTaskSkinId(task)))
            : '') +
          '<span>Change skin</span>' +
        '</button>' +
      '</div>' +
    '</div>';

  // ---- Position in the list ----
  //
  // The keyboard-reachable half of reordering. The grip on the row is
  // pointer-only by nature, so without these the feature would exist
  // for mice and thumbs and nobody else.
  var posKind  = taskOrderKind(task);
  var posSeq   = tasksOfKindSorted(posKind);
  var posIndex = posSeq.map(function (t) { return t.id; }).indexOf(task.id);
  if (posSeq.length > 1) {
    html +=
      '<div class="tp-field">' +
        '<label class="tp-label">Position</label>' +
        '<div class="tp-order-row">' +
          '<button type="button" class="tp-btn-nudge" data-act="move-up"' +
            (posIndex <= 0 ? ' disabled' : '') + ' aria-label="Move up">&uarr;</button>' +
          '<button type="button" class="tp-btn-nudge" data-act="move-down"' +
            (posIndex < 0 || posIndex >= posSeq.length - 1 ? ' disabled' : '') +
            ' aria-label="Move down">&darr;</button>' +
          '<span class="tp-order-at">' + (posIndex + 1) + ' of ' + posSeq.length + '</span>' +
          (hasAnyManualOrder(posKind)
            ? '<button type="button" class="tp-btn-quiet" data-act="order-auto">Back to automatic</button>'
            : '') +
        '</div>' +
        '<p class="tp-hint tp-hint-quiet">' +
          (hasAnyManualOrder(posKind)
            ? 'Placed by hand. Everything unplaced sorts itself underneath.'
            : (posKind === 'once'
                ? 'Sorting by due date. Moving this pins it to the top.'
                : 'Sorting by how far along the plant is. Moving this pins it to the top.')) +
        '</p>' +
      '</div>';
  }

  // ---- Provenance + delete ----
  if (task.createdAt) {
    html += '<p class="tp-hint tp-hint-quiet">Planted ' + tpFormatDate(task.createdAt) + '.</p>';
  }
  html +=
    '<div class="tp-sheet-foot">' +
      '<button type="button" class="tp-btn-danger' + (tpConfirmDelete ? ' is-armed' : '') + '" ' +
        'data-act="delete">' +
        (tpConfirmDelete ? 'Yes, dig it up' : 'Remove this plant') +
      '</button>' +
      (tpConfirmDelete
        ? '<p class="tp-hint tp-hint-warn">The plant, its streak and its history go with it. ' +
          'There is no undo.</p>'
        : '') +
    '</div>';

  tpSheetBodyEl.innerHTML = html;
}


// ============================================
// Sheet interactions
//
// Delegated, because the body is rebuilt on every render. Everything
// that changes stored data goes through setTaskField() or one of the
// subtask helpers in 01, then saves once.
// ============================================
if (tpSheetBodyEl) {
  tpSheetBodyEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var task = tpOpenTask();
    if (!task) return;

    var act = btn.getAttribute('data-act');
    var val = btn.getAttribute('data-value');

    if (act === 'kind') {
      setTaskKind(task, val);
    } else if (act === 'impact') {
      setTaskImpact(task, parseInt(val, 10));
    } else if (act === 'effort') {
      setTaskEffort(task, parseInt(val, 10));
    } else if (act === 'preset') {
      setTaskSchedule(task,
        val === 'weekdays' ? SCHEDULE_WEEKDAYS :
        val === 'weekends' ? SCHEDULE_WEEKENDS : null);
    } else if (act === 'day') {
      toggleTaskScheduleDay(task, parseInt(val, 10));
    } else if (act === 'subadd') {
      var input = document.getElementById('tpSubInput');
      if (!input || !input.value.trim()) return;
      addSubtask(task, input.value);
      input.value = '';
    } else if (act === 'subtoggle') {
      var wasDone = task.completed;
      toggleSubtask(task, parseInt(val, 10));
      // Ticking the last step ticks the task, which is a tick like any
      // other and gets asked the same question - waiting on the list
      // behind the sheet.
      if (task.completed !== wasDone) tpNoteTick(task.id, task.completed);
    } else if (act === 'subremove') {
      removeSubtask(task, parseInt(val, 10));
    } else if (act === 'skin') {
      tpCloseSheet();
      if (typeof openPlantSkins === 'function') openPlantSkins(task.id);
      return;
    } else if (act === 'move-up' || act === 'move-down') {
      // Nothing to save if the task is already at the end it was
      // asked to move toward. The buttons are disabled in that state
      // anyway; this is the belt to that braces.
      if (!moveTaskBy(task.id, act === 'move-up' ? -1 : 1)) return;
    } else if (act === 'order-auto') {
      if (!clearManualOrder(taskOrderKind(task))) return;
    } else if (act === 'delete') {
      if (!tpConfirmDelete) {
        tpConfirmDelete = true;
        tpRenderSheet();
        return;
      }
      tpCloseSheet();
      removeTask(task.id);
      return;
    } else {
      return;
    }

    saveData();
    render();
  });

  // Enter in the step field adds the step rather than submitting
  // anything - the sheet is not inside a form, but muscle memory is.
  tpSheetBodyEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.id !== 'tpSubInput') return;
    e.preventDefault();
    var task = tpOpenTask();
    if (!task || !e.target.value.trim()) return;
    addSubtask(task, e.target.value);
    e.target.value = '';
    saveData();
    render();
  });

  // Text, date, textarea and select all commit on change, which is
  // blur or Enter. Nothing saves per keystroke.
  tpSheetBodyEl.addEventListener('change', function (e) {
    var field = e.target.getAttribute && e.target.getAttribute('data-field');
    if (!field) return;
    var task = tpOpenTask();
    if (!task) return;
    setTaskField(task, field, e.target.value);
    saveData();
    render();
  });
}

if (tpSheetEl) {
  tpSheetEl.addEventListener('click', function (e) {
    if (e.target.closest('#taskSheetClose') || e.target.closest('.tp-sheet-backdrop')) {
      tpCloseSheet();
    }
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;

  // Topmost first. The dialog can sit over the sheet, and one Escape
  // should close one thing.
  if (tpAskEl && !tpAskEl.classList.contains('hidden')) { tpCloseAsk(); return; }

  if (!tpSheetEl || tpSheetEl.classList.contains('hidden')) return;
  tpCloseSheet();
});
