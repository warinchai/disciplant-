// Boots index.html in jsdom with Firebase stubbed out, then drives the
// tasks page and the stats page the way a person would.
const fs = require('fs');
const { JSDOM } = require('jsdom');

// Strip every script tag; we inject the local files ourselves, in
// order, after installing a Firebase stub.
const html = fs.readFileSync('index.html', 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, '');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://disciplant.com/' });
const win = dom.window;

const noop = () => {};
const thenable = { then: (f) => { f && f({}); return thenable; }, catch: () => thenable };
function docStub() {
  return {
    set: () => thenable, update: () => thenable, get: () => thenable,
    onSnapshot: () => noop, collection: () => collStub(), delete: () => thenable,
  };
}
function collStub() {
  return { doc: docStub, where: () => collStub(), get: () => thenable, onSnapshot: () => noop };
}
win.firebase = {
  apps: [],
  app: () => ({ options: { authDomain: 'disciplant.com' } }),
  initializeApp: noop,
  auth: Object.assign(() => ({
    onAuthStateChanged: () => noop,
    signInAnonymously: () => thenable,
    signOut: () => thenable,
    getRedirectResult: () => thenable,
    onIdTokenChanged: () => noop,
    setPersistence: () => thenable,
    currentUser: null,
  }), { GoogleAuthProvider: function () { this.setCustomParameters = noop; } }),
  firestore: Object.assign(() => ({
    collection: collStub, doc: docStub,
    batch: () => ({ set: noop, update: noop, delete: noop, commit: () => thenable }),
  }), {
    FieldValue: { serverTimestamp: () => 'TS', increment: (n) => n, delete: () => 'DEL', arrayUnion: noop, arrayRemove: noop },
    Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
  }),
};
win.gtag = noop;
win.dataLayer = [];

function runScript(code, label) {
  const el = win.document.createElement('script');
  el.textContent = code;
  const errs = [];
  win.addEventListener('error', (e) => errs.push(e.message), { once: true });
  win.document.body.appendChild(el);
  if (errs.length) { console.log('ERROR in ' + label + ': ' + errs[0]); process.exit(1); }
}

// Stand-in for firebase-config.js.
runScript('var db = firebase.firestore(); var auth = firebase.auth();', 'config');

const files = ['01-app-core.js', '02-auth-tasks.js', '03-plant-art.js', '04-garden-scene.js',
               '05-stats-app.js', '06-friends.js', '07-friend-garden.js', '12-tasks-page.js',
               '10-account-data.js'];
for (const f of files) runScript(fs.readFileSync(f, 'utf8'), f);
console.log('all files loaded, no throw');

// ---- Helpers -------------------------------------------------
const $ = (id) => win.document.getElementById(id);
const run = (code) => win.eval(code);
const fail = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fail.push(`${label}\n     got:      ${JSON.stringify(actual)}\n     expected: ${JSON.stringify(expected)}`);
  console.log((ok ? '  ok   ' : '  FAIL ') + label);
}

// Make saves no-ops so nothing tries to reach Firestore.
run('saveData = function () {};');
run('assignPermanentPositions = function () { return false; };');
run('authReady = true;');

const D = (n) => run(`shiftDate(getTodayString(), ${n})`);

// =====================================================================
console.log('\n--- task model ---');

run(`
  tasks = [];
  nextId = 1;
  var daily = makeTask(1, 'Read 20 min', 'education');
  var school = makeTask(2, 'Practice piano', 'mindfulness');
  setTaskSchedule(school, SCHEDULE_WEEKDAYS);
  var essay = makeTask(3, 'Finish lab report', 'education');
  setTaskKind(essay, 'once');
  tasks = [daily, school, essay];
  nextId = 4;
`);

check('daily habit has no stored schedule', run('tasks[0].schedule'), null);
check('school habit stores a mask',         run('tasks[1].schedule'), '0111110');
check('assignment kind',                    run('tasks[2].kind'), 'once');

// isScheduledOn across a known week. 2026-08-30 is a Sunday.
check('school habit: Sunday not scheduled', run("isScheduledOn(tasks[1], '2026-08-30')"), false);
check('school habit: Monday scheduled',     run("isScheduledOn(tasks[1], '2026-08-31')"), true);
check('school habit: Saturday not',         run("isScheduledOn(tasks[1], '2026-09-05')"), false);
check('daily habit: Sunday scheduled',      run("isScheduledOn(tasks[0], '2026-08-30')"), true);
check('assignment never scheduled',         run("isScheduledOn(tasks[2], '2026-08-31')"), false);

// All days off falls back to daily.
run(`
  var t = makeTask(99, 'x', 'misc');
  for (var i = 0; i < 7; i++) toggleTaskScheduleDay(t, i);
  var allOffResult = t.schedule;
`);
check('turning off every day falls back to daily', run('allOffResult'), null);

// =====================================================================
console.log('\n--- toggling ---');

run(`toggleTask(1, true);`);
check('habit tick: streak',  run('tasks[0].streak'), 1);
check('habit tick: growth',  run('tasks[0].totalGrowthDays'), 1);
check('habit tick: history', run('histGet(tasks[0].history, getTodayString())'), true);

run(`toggleTask(1, false);`);
check('habit untick reverses streak', run('tasks[0].streak'), 0);
check('habit untick reverses growth', run('tasks[0].totalGrowthDays'), 0);

run(`toggleTask(3, true);`);
check('assignment tick: no streak', run('tasks[2].streak'), 0);
check('assignment tick: growth',    run('tasks[2].totalGrowthDays'), 1);
check('assignment tick: doneAt',    run('tasks[2].doneAt'), run('getTodayString()'));

// Same-day untick is reversible.
run(`toggleTask(3, false);`);
check('assignment same-day untick reverses growth', run('tasks[2].totalGrowthDays'), 0);
check('assignment same-day untick clears doneAt',   run('tasks[2].doneAt'), null);

// An assignment finished on an EARLIER day keeps its growth when reopened.
run(`
  toggleTask(3, true);
  tasks[2].doneAt = shiftDate(getTodayString(), -4);
  toggleTask(3, false);
`);
check('assignment reopened later keeps its growth day', run('tasks[2].totalGrowthDays'), 1);
check('assignment reopened later is open',              run('tasks[2].completed'), false);

// =====================================================================
console.log('\n--- subtasks ---');

run(`
  tasks = [makeTask(1, 'Study for chem', 'education')];
  addSubtask(tasks[0], 'review notes');
  addSubtask(tasks[0], 'practice set');
`);
check('two steps', run('tasks[0].subtasks.length'), 2);

run(`toggleSubtask(tasks[0], 1);`);
check('one step done does not complete parent', run('tasks[0].completed'), false);

run(`toggleSubtask(tasks[0], 2);`);
check('all steps done completes parent', run('tasks[0].completed'), true);
check('parent grew exactly once',       run('tasks[0].totalGrowthDays'), 1);

run(`toggleSubtask(tasks[0], 2);`);
check('unticking a step reopens parent', run('tasks[0].completed'), false);
check('growth came back off',            run('tasks[0].totalGrowthDays'), 0);

// Hand-ticked parent must not be unticked by toggling a step.
run(`
  tasks = [makeTask(1, 'Hand ticked', 'misc')];
  addSubtask(tasks[0], 'a');
  addSubtask(tasks[0], 'b');
  toggleTask(1, true);
  toggleSubtask(tasks[0], 1);
`);
check('hand-ticked parent survives a step toggle', run('tasks[0].completed'), true);

// =====================================================================
console.log('\n--- day boundary ---');

// A school-days habit ticked on Friday must survive the weekend.
// Pin "today" to Monday 2026-09-07 by overriding getTodayString.
function withToday(dateStr, code) {
  return run(`
    (function () {
      var real = getTodayString;
      getTodayString = function () { return '${dateStr}'; };
      try { return (function () { ${code} }()); }
      finally { getTodayString = real; }
    }())
  `);
}

check('weekend does not break a school-days streak',
  withToday('2026-09-07', `
    tasks = [makeTask(1, 'Piano', 'mindfulness')];
    setTaskSchedule(tasks[0], SCHEDULE_WEEKDAYS);
    tasks[0].streak = 12;
    tasks[0].completed = true;
    histSet(tasks[0].history, '2026-09-04', true);   // Friday
    lastResetDate = '2026-09-04';
    applyDayBoundaries();
    return tasks[0].streak;
  `), 12);

check('a missed weekday does break it',
  withToday('2026-09-09', `
    tasks = [makeTask(1, 'Piano', 'mindfulness')];
    setTaskSchedule(tasks[0], SCHEDULE_WEEKDAYS);
    tasks[0].streak = 12;
    tasks[0].completed = true;
    histSet(tasks[0].history, '2026-09-07', true);   // Monday done
    lastResetDate = '2026-09-07';                     // Tuesday missed
    applyDayBoundaries();
    return tasks[0].streak;
  `), 0);

check('a daily habit still breaks on one missed day',
  withToday('2026-09-09', `
    tasks = [makeTask(1, 'Read', 'education')];
    tasks[0].streak = 5;
    tasks[0].completed = false;
    lastResetDate = '2026-09-08';
    applyDayBoundaries();
    return tasks[0].streak;
  `), 0);

check('assignments are untouched by rollover',
  withToday('2026-09-20', `
    tasks = [makeTask(1, 'Lab report', 'education')];
    setTaskKind(tasks[0], 'once');
    tasks[0].completed = true;
    tasks[0].doneAt = '2026-09-04';
    lastResetDate = '2026-09-04';
    applyDayBoundaries();
    return [tasks[0].completed, tasks[0].doneAt];
  `), [true, '2026-09-04']);

check('steps come back unticked overnight',
  withToday('2026-09-09', `
    tasks = [makeTask(1, 'Study', 'education')];
    addSubtask(tasks[0], 'a');
    tasks[0].subtasks[0].done = true;
    lastResetDate = '2026-09-08';
    applyDayBoundaries();
    return tasks[0].subtasks[0].done;
  `), false);

// =====================================================================
console.log('\n--- B5: heatmap denominator ---');

check('weekend is "nothing due" for a school-days garden',
  run(`
    tasks = [makeTask(1, 'Piano', 'mindfulness')];
    setTaskSchedule(tasks[0], SCHEDULE_WEEKDAYS);
    tasks[0].createdAt = '2026-01-01';
    computeOverallDayStats('2026-09-05').total;   // Saturday
  `), 0);

check('weekday counts',
  run("computeOverallDayStats('2026-09-07').total"), 1);

check('days before createdAt count nothing',
  run("computeOverallDayStats('2025-06-02').total"), 0);

check('a bonus completion on an unscheduled day still counts',
  run(`
    histSet(tasks[0].history, '2026-09-05', true);
    var d = computeOverallDayStats('2026-09-05');
    [d.completed, d.total];
  `), [1, 1]);

check('an assignment shows up on the day it was finished',
  run(`
    tasks = [makeTask(1, 'Lab report', 'education')];
    setTaskKind(tasks[0], 'once');
    tasks[0].createdAt = '2026-09-01';
    tasks[0].doneAt = '2026-09-03';
    histSet(tasks[0].history, '2026-09-03', true);
    var a = computeOverallDayStats('2026-09-03');
    var b = computeOverallDayStats('2026-09-04');
    [a.completed, a.total, b.total];
  `), [1, 1, 0]);

check('adding a habit today does not dilute last year',
  run(`
    tasks = [makeTask(1, 'Old', 'education'), makeTask(2, 'Brand new', 'exercise')];
    tasks[0].createdAt = '2026-01-01';
    histSet(tasks[0].history, '2026-03-02', true);
    tasks[1].createdAt = getTodayString();
    var d = computeOverallDayStats('2026-03-02');
    [d.completed, d.total, Math.round(d.percent)];
  `), [1, 1, 100]);

check('window tally counts scheduled days, not calendar days',
  run(`
    tasks = [makeTask(1, 'Piano', 'mindfulness')];
    setTaskSchedule(tasks[0], SCHEDULE_WEEKDAYS);
    tasks[0].createdAt = '2020-01-01';
    var dates = []; for (var i = 0; i < 7; i++) dates.push(getDateNDaysAgo(i));
    var t = tallyWindow(tasks, dates);
    t.due;
  `), 5);

// =====================================================================
console.log('\n--- rendering ---');

run(`
  tasks = [];
  nextId = 1;
  var a = makeTask(1, 'Read 20 min', 'education');
  var b = makeTask(2, 'Piano', 'mindfulness');
  setTaskSchedule(b, SCHEDULE_WEEKDAYS);
  var c = makeTask(3, 'Lab report', 'education');
  setTaskKind(c, 'once');
  c.due = shiftDate(getTodayString(), 2);
  addSubtask(a, 'chapter one');
  tasks = [a, b, c];
  nextId = 4;
  currentPage = 'tasks';
  render();
`);

const sections = $('tpSections');
check('sections rendered', sections.querySelectorAll('.tp-row').length > 0, true);
check('two columns emitted', sections.querySelectorAll('.tp-col').length, 2);

// Habits go left, assignments go right, and neither leaks.
const colA = sections.querySelectorAll('.tp-col')[0];
const colB = sections.querySelectorAll('.tp-col')[1];
check('habits column holds only habits',
  colA.querySelectorAll('.tp-row.is-once').length, 0);
check('assignments column holds only assignments',
  colB.querySelectorAll('.tp-row').length === colB.querySelectorAll('.tp-row.is-once').length, true);
check('the assignment landed on the right', colB.querySelectorAll('.tp-row').length, 1);

// An empty side still renders, so the layout does not jump when the
// first assignment is added.
run("tasks = tasks.filter(function (t) { return t.kind !== 'once'; }); render();");
check('empty assignments column keeps its place',
  $('tpSections').querySelectorAll('.tp-col')[1].querySelectorAll('.tp-empty').length, 1);

// A finished assignment from an earlier day must not sit under Today.
run(`
  var old = makeTask(9, 'Old essay', 'education');
  setTaskKind(old, 'once');
  old.completed = true;
  old.doneAt = shiftDate(getTodayString(), -20);
  tasks.push(old);
  tpScope = 'today';
  render();
`);
check('an old finish is not in Today',
  $('tpSections').querySelectorAll('.tp-row[data-id="9"]').length, 0);
run("tpScope = 'all'; render();");
check('but it is under Everything',
  $('tpSections').querySelectorAll('.tp-row[data-id="9"]').length, 1);
run("tpScope = 'today'; tasks = tasks.filter(function (t) { return t.id !== 9; }); render();");
check('header shows a progress bar', !!$('tpHeader').querySelector('.tp-progress i'), true);

// The header ratio: finishing anything must move it forwards.
function headerLine() { return $('tpHeader').querySelector('.tp-header-line').textContent.trim(); }
function headerPct()  { return $('tpHeader').querySelector('.tp-progress i').style.width; }

run(`
  tasks = [];
  var h = makeTask(1, 'Read', 'education');
  var a = makeTask(2, 'Essay', 'education');
  setTaskKind(a, 'once');
  tasks = [h, a];
  currentPage = 'tasks';
  render();
`);
check('nothing done yet', headerLine(), '0 of 2 done');
check('bar empty',        headerPct(), '0%');

run('toggleTask(2, true);');   // finish the assignment
check('finishing an assignment advances the ratio', headerLine(), '1 of 2 done');
check('bar moved',                                 headerPct(), '50%');

run('toggleTask(1, true);');   // and the habit
check('everything cleared', headerLine(), 'All clear.');
check('bar full',           headerPct(), '100%');

// An assignment finished on an earlier day is not on today's plate.
run(`
  tasks = [makeTask(1, 'Read', 'education')];
  var old = makeTask(2, 'Old essay', 'education');
  setTaskKind(old, 'once');
  old.completed = true;
  old.doneAt = shiftDate(getTodayString(), -20);
  tasks.push(old);
  render();
`);
check('an old finish stays out of today\'s ratio', headerLine(), '0 of 1 done');

// Put the fixture back for the tests below, which expect the three
// tasks and the one step set up at the top of this section.
run(`
  tasks = [];
  nextId = 1;
  var a = makeTask(1, 'Read 20 min', 'education');
  var b = makeTask(2, 'Piano', 'mindfulness');
  setTaskSchedule(b, SCHEDULE_WEEKDAYS);
  var c = makeTask(3, 'Lab report', 'education');
  setTaskKind(c, 'once');
  c.due = shiftDate(getTodayString(), 2);
  addSubtask(a, 'chapter one');
  tasks = [a, b, c];
  nextId = 4;
  render();
`);

check('plot strip built', $('tpPlot').querySelectorAll('[data-cat]').length, 8);
check('plant art on rows', sections.querySelectorAll('.tp-row-art svg').length > 0, true);

// Open the sheet on the first row.
sections.querySelector('.tp-row [data-act="open"]').click();
check('sheet opens', $('taskSheet').classList.contains('hidden'), false);
check('sheet has day toggles', $('taskSheetBody').querySelectorAll('.tp-day').length, 7);
check('sheet shows the step', $('taskSheetBody').querySelectorAll('.tp-sub').length, 1);

// Tick a day off in the sheet.
const before = run('tasks[0].schedule');
$('taskSheetBody').querySelector('[data-act="day"][data-value="0"]').click();
check('clicking a day writes a mask', run('tasks[0].schedule'), '0111111');

// Switch type in the sheet.
$('taskSheetBody').querySelector('[data-act="kind"][data-value="once"]').click();
check('switching to assignment clears the schedule', run('tasks[0].schedule'), null);
check('switching to assignment sets kind',           run('tasks[0].kind'), 'once');

// Close, then tick a row.
$('taskSheetClose').click();
check('sheet closes', $('taskSheet').classList.contains('hidden'), true);

const row = $('tpSections').querySelector('.tp-row [data-act="toggle"]');
row.click();
check('a row tick grew something', run('tasks.some(function (t) { return t.totalGrowthDays > 0; })'), true);

// Stats page.
run("currentPage = 'stats'; renderStatsPage();");
const overall = $('statsOverallHeatmap');
check('overall heatmap drew cells', overall.querySelectorAll('.heatmap-cell').length, 378);
check('overall heatmap has off cells', overall.querySelectorAll('.heat-stage-off').length > 0, true);
check('overall cards drew', $('statsOverallCards').querySelectorAll('.stat-card').length, 5);

// Individual view.
run(`
  tasks = [makeTask(1, 'Piano', 'mindfulness')];
  setTaskSchedule(tasks[0], SCHEDULE_WEEKDAYS);
  tasks[0].createdAt = '2020-01-01';
  renderIndividualHeatmap(1);
  renderIndividualCards(1);
`);
const indiv = $('statsIndividualHeatmap');
check('individual heatmap marks unscheduled days',
  indiv.querySelectorAll('.heat-stage-off').length > 90, true);

// Save payload shape.
run(`
  tasks = [makeTask(1, 'Plain daily', 'education')];
  var plain = buildCleanTasks()[0];
  var plainKeys = Object.keys(plain).sort().join(',');
`);
check('a plain habit writes exactly one new field (createdAt)',
  run('plainKeys'),
  ('categoryId,completed,history,id,lastCleanDate,maxGrowthDays,maxStreak,posX,posY,' +
   'prevLastCleanDate,skinId,streak,text,totalGrowthDays,createdAt')
    .split(',').sort().join(','));

// An existing garden has no createdAt. The normalizer infers one from
// the first completed day, and the next save banks it - so the
// inference happens once, not on every stats render.
check('an old task infers createdAt from its history',
  run(`
    var raw = { id: 7, text: 'Old habit', categoryId: 'education',
                history: { '2026': '00100' }, totalGrowthDays: 1 };
    normalizeDateString(raw.createdAt) || firstCompletedDate(migrateHistory(raw.history));
  `), '2026-01-03');

run(`
  setTaskSchedule(tasks[0], SCHEDULE_WEEKDAYS);
  addSubtask(tasks[0], 'step');
  tasks[0].notes = 'hi';
  var richKeys = Object.keys(buildCleanTasks()[0]).sort().join(',');
`);
check('a configured habit writes them',
  run("richKeys.indexOf('schedule') > -1 && richKeys.indexOf('subtasks') > -1 && richKeys.indexOf('notes') > -1"),
  true);

// =====================================================================
console.log('\n--- C4/C5: growth over time ---');

// A series must END on the plant's real day count, and must not go
// below zero however far back it is asked to look.
run(`
  tasks = [makeTask(1, 'Read', 'education')];
  tasks[0].totalGrowthDays = 40;
  for (var i = 0; i < 5; i++) histSet(tasks[0].history, shiftDate(getTodayString(), -i), true);
`);
check('series ends on the stored total',
  run('buildGrowthSeries(tasks[0], 30).slice(-1)[0].days'), 40);
check('series steps back one per completed day',
  run('buildGrowthSeries(tasks[0], 30).slice(-6)[0].days'), 35);
check('growth before history shows as a flat baseline',
  run('buildGrowthSeries(tasks[0], 30)[0].days'), 35);
check('series never goes negative',
  run(`
    var t = makeTask(2, 'New', 'misc');
    t.totalGrowthDays = 2;
    histSet(t.history, shiftDate(getTodayString(), 0), true);
    histSet(t.history, shiftDate(getTodayString(), -1), true);
    buildGrowthSeries(t, 30).every(function (p) { return p.days >= 0; });
  `), true);

// The height delta on the tag.
check('recentGrowthDays counts the window',
  run('recentGrowthDays(tasks[0], 7, true)'), 5);
check('recentGrowthDays can exclude today',
  run('recentGrowthDays(tasks[0], 7, false)'), 4);
check('a week of growth is a positive height gain',
  run('computeHeightGainMeters(tasks[0], 40) > 0'), true);
check('no completions means no gain',
  run(`
    var t = makeTask(3, 'Dormant', 'misc');
    t.totalGrowthDays = 40;
    computeHeightGainMeters(t, 40);
  `), 0);
check('the tag omits the gain line when there is none',
  run(`
    var t = makeTask(4, 'Dormant', 'misc');
    t.totalGrowthDays = 40;
    heightTagHtml(t, 40).indexOf('plant-height-gain') === -1;
  `), true);
check('the tag shows the gain line when there is one',
  run("heightTagHtml(tasks[0], 40).indexOf('plant-height-gain') > -1"), true);

// The charts render.
run(`
  tasks = [makeTask(1, 'Read', 'education'), makeTask(2, 'Piano', 'mindfulness')];
  tasks[0].totalGrowthDays = 40;
  tasks[1].totalGrowthDays = 12;
  for (var i = 0; i < 20; i++) {
    if (i % 2 === 0) histSet(tasks[0].history, shiftDate(getTodayString(), -i), true);
  }
  currentPage = 'stats';
  renderStatsPage();
`);
const growth = $('statsOverallGrowth');
check('overall growth chart drew', !!growth.querySelector('svg.growth-chart'), true);
check('it has a line',             !!growth.querySelector('path.growth-line'), true);
check('and a range switch',        growth.querySelectorAll('.growth-range-btn').length, 3);
check('gain reads as an increase', growth.querySelector('.growth-gain').textContent.trim().charAt(0), '+');

// Changing the range re-renders.
growth.querySelector('.growth-range-btn[data-range="30"]').click();
check('range switch takes effect', run('statsGrowthRange'), 30);
check('chart redrew', !!$('statsOverallGrowth').querySelector('svg.growth-chart'), true);

run("renderIndividualGrowth(1);");
check('individual growth chart drew',
  !!$('statsIndividualGrowth').querySelector('svg.growth-chart'), true);
check('individual chart is in metres or centimetres',
  /cm|m$/.test($('statsIndividualGrowth').querySelector('.growth-ylabel').textContent), true);

// A garden that has not grown says so rather than showing a fake line.
run(`
  tasks = [makeTask(1, 'Untouched', 'misc')];
  renderOverallGrowth();
`);
check('a flat garden reads "no growth"',
  $('statsOverallGrowth').querySelector('.growth-gain').textContent.trim(), 'no growth');

// =====================================================================
console.log('\n--- C3: growth points ---');

// The migration claim, stated as a test: an ordinary habit moves the
// number by exactly one, exactly as it did when the field counted days.
run(`
  tasks = [makeTask(1, 'Read 20 min', 'education')];
  nextId = 2;
  toggleTask(1, true);
`);
check('a habit tick is still worth one', run('tasks[0].totalGrowthDays'), 1);
check('and unticking still returns to zero',
  run('toggleTask(1, false); tasks[0].totalGrowthDays'), 0);

// The two clamps are different functions and the difference matters.
check('growth keeps a fraction',       run('clampGrowthPoints(3.5)'), 3.5);
check('growth rounds off float drift', run('clampGrowthPoints(0.1 + 0.2)'), 0.3);
check('growth rejects junk',           run('clampGrowthPoints("nonsense")'), 0);
check('growth rejects negatives',      run('clampGrowthPoints(-4)'), 0);
check('growth honours the ceiling',    run('clampGrowthPoints(1e18)'), 1000);
check('a streak is whole days only',   run('clampStreak(3.9)'), 3);
check('a streak rejects junk',         run('clampStreak(NaN)'), 0);

// Habits ignore impact even when a document carries one, which is what
// keeps per-habit weight (A5) an unshipped decision rather than an
// accident of this change.
check('a habit is always worth one',
  run('taskGrowthWeight({ kind: "habit", impact: 14 })'), 1);
check('an assignment is worth its rating',
  run('taskGrowthWeight({ kind: "once", impact: 7 })'), 7);
check('an unrated assignment is worth one',
  run('taskGrowthWeight({ kind: "once" })'), 1);
check('an off-list rating falls back rather than clamping',
  run('normalizeImpact(9)'), 1);

// A rated assignment grows by its rating and gives all of it back.
run(`
  tasks = [makeTask(1, 'Lab report', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  setTaskImpact(tasks[0], 7);
  toggleTask(1, true);
`);
check('a Large assignment is worth a week', run('tasks[0].totalGrowthDays'), 7);
check('and takes the whole week back',
  run('toggleTask(1, false); tasks[0].totalGrowthDays'), 0);

// Re-rating while the tick is still reversible moves the plant by the
// DIFFERENCE. Without this, ticking at 1 and unticking at 14 would
// leave free growth behind.
run(`
  tasks = [makeTask(1, 'Essay', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  toggleTask(1, true);
  setTaskImpact(tasks[0], 14);
`);
check('re-rating a fresh tick resizes the plant', run('tasks[0].totalGrowthDays'), 14);
check('and unticking returns to zero, not to minus thirteen',
  run('toggleTask(1, false); tasks[0].totalGrowthDays'), 0);

// Banked growth is never reopened by a dropdown - the same rule the
// day boundary already enforces.
run(`
  tasks = [makeTask(1, 'Old essay', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  toggleTask(1, true);
  tasks[0].doneAt = shiftDate(getTodayString(), -9);
  setTaskImpact(tasks[0], 14);
`);
check('re-rating a finished assignment does not resize it',
  run('tasks[0].totalGrowthDays'), 1);

// growthEarnedToday reads history, not the completed flag. This is the
// assignment bug: a one-off finished last week is permanently
// `completed`, and the old test hid a day it never earned today.
run(`
  tasks = [makeTask(1, 'Finished last week', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  tasks[0].completed = true;
  tasks[0].doneAt = shiftDate(getTodayString(), -7);
  tasks[0].totalGrowthDays = 7;
  histSet(tasks[0].history, shiftDate(getTodayString(), -7), true);
`);
check('an old finish earned nothing today', run('growthEarnedToday(tasks[0])'), 0);
check('so hiding today\'s growth leaves it alone',
  run('dailyGrowthShown = false; getDailyDisplayDays(tasks[0])'), 7);
check('and it is not in the grow animation',
  run('getGrownTodayTasks().length'), 0);

// The series walks back by what a completion is worth, not by one.
run(`
  tasks = [makeTask(1, 'Big one', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  setTaskImpact(tasks[0], 7);
  toggleTask(1, true);
`);
check('the series ends on the total',
  run('buildGrowthSeries(tasks[0], 5).slice(-1)[0].days'), 7);
check('and steps back by the rating, to zero',
  run('buildGrowthSeries(tasks[0], 5)[0].days'), 0);

// Points print as days, because one point IS one day.
check('a whole total prints whole',   run('formatGrowthPoints(7)'), '7');
check('a fraction gets one decimal',  run('formatGrowthPoints(3.25)'), '3.3');
check('drift still prints whole',     run('formatGrowthPoints(6.999)'), '7');

// The save payload: a plain habit is unchanged, an unrated assignment
// is unchanged, and only a real rating costs a field.
run(`
  tasks = [makeTask(1, 'Plain daily', 'education')];
  var plainKeys2 = Object.keys(buildCleanTasks()[0]).sort().join(',');
`);
check('a plain habit still writes no impact field',
  run('plainKeys2.indexOf("impact")'), -1);
run(`
  tasks = [makeTask(1, 'Unrated', 'education')];
  setTaskKind(tasks[0], 'once');
  var unratedKeys = Object.keys(buildCleanTasks()[0]).sort().join(',');
  tasks = [makeTask(2, 'Rated', 'education')];
  setTaskKind(tasks[0], 'once');
  setTaskImpact(tasks[0], 3);
  var ratedClean = buildCleanTasks()[0];
`);
check('an unrated assignment writes no impact field',
  run('unratedKeys.indexOf("impact")'), -1);
check('a rated one does', run('ratedClean.impact'), 3);

// =====================================================================
console.log('\n--- A4: partial credit from steps ---');

// A task with no steps is worth its full weight - which is every task
// in every existing garden, so this change moves nothing.
check('no steps means full credit',
  run('taskCompletionAward(makeTask(1, "Plain", "misc"))'), 1);

run(`
  tasks = [makeTask(1, 'Tidy room', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'Desk');
  addSubtask(tasks[0], 'Floor');
  addSubtask(tasks[0], 'Shelf');
`);
check('three steps, none done, is worth one of them',
  run('taskCompletionAward(tasks[0])'), 0.333);
run('tasks[0].subtasks[0].done = true;');
check('one of three is a third', run('taskCompletionAward(tasks[0])'), 0.333);
run('tasks[0].subtasks[1].done = true;');
check('two of three is two thirds', run('taskCompletionAward(tasks[0])'), 0.667);
run('tasks[0].subtasks[2].done = true;');
check('all three is full credit', run('taskCompletionAward(tasks[0])'), 1);

// Ticking the parent by hand with steps outstanding pays the fraction.
run(`
  tasks = [makeTask(1, 'Tidy room', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'Desk');
  addSubtask(tasks[0], 'Floor');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
`);
check('a half-done task grows half a day', run('tasks[0].totalGrowthDays'), 0.5);
check('and it still counts as done today', run('histGet(tasks[0].history, getTodayString())'), true);
check('and unticking gives back exactly that',
  run('toggleTask(1, false); tasks[0].totalGrowthDays'), 0);

// THE DRIFT CASE. Tick at one of three, tick a second step, then
// untick the task. Without retuneAward the refund would hand back two
// thirds having paid out one third.
run(`
  tasks = [makeTask(1, 'Essay', 'education')];
  nextId = 2;
  addSubtask(tasks[0], 'Outline');
  addSubtask(tasks[0], 'Draft');
  addSubtask(tasks[0], 'Edit');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
`);
check('ticked at one of three', run('tasks[0].totalGrowthDays'), 0.333);
run('toggleSubtask(tasks[0], 2);');
check('a step done afterwards grows it further', run('tasks[0].totalGrowthDays'), 0.667);
check('the parent is still ticked', run('tasks[0].completed'), true);
run('toggleTask(1, false);');
check('and the refund returns to zero, not to minus a third',
  run('tasks[0].totalGrowthDays'), 0);

// Ticking the LAST step ticks the task at full credit, and unticking
// one afterwards has to unwind cleanly through the same path.
run(`
  tasks = [makeTask(1, 'Chores', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'A');
  addSubtask(tasks[0], 'B');
  toggleSubtask(tasks[0], 1);
  toggleSubtask(tasks[0], 2);
`);
check('the last step ticks the task', run('tasks[0].completed'), true);
check('at full credit', run('tasks[0].totalGrowthDays'), 1);
run('toggleSubtask(tasks[0], 2);');
check('unticking a step unticks the task', run('tasks[0].completed'), false);
check('and takes all the growth back', run('tasks[0].totalGrowthDays'), 0);

// Adding a step to a finished task reopens it and must not strand a
// fraction behind.
run(`
  tasks = [makeTask(1, 'Chores', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'A');
  toggleSubtask(tasks[0], 1);
`);
check('one step done, task ticked, full credit', run('tasks[0].totalGrowthDays'), 1);
run('addSubtask(tasks[0], "B");');
check('adding a step reopens it', run('tasks[0].completed'), false);
check('and strands nothing', run('tasks[0].totalGrowthDays'), 0);

// Removing the outstanding step should put it back where it was.
run(`
  tasks = [makeTask(1, 'Chores', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'A');
  addSubtask(tasks[0], 'B');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
`);
check('half credit banked', run('tasks[0].totalGrowthDays'), 0.5);
run('removeSubtask(tasks[0], 2);');
check('removing the undone step tops it up to full', run('tasks[0].totalGrowthDays'), 1);

// Partial credit multiplies the impact rating rather than replacing it.
run(`
  tasks = [makeTask(1, 'Lab report', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  setTaskImpact(tasks[0], 7);
  addSubtask(tasks[0], 'Method');
  addSubtask(tasks[0], 'Results');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
`);
check('half of a Large assignment is three and a half',
  run('tasks[0].totalGrowthDays'), 3.5);
check('and it prints with one decimal',
  run('formatGrowthPoints(tasks[0].totalGrowthDays)'), '3.5');
run('setTaskImpact(tasks[0], 14);');
check('re-rating scales the partial award too', run('tasks[0].totalGrowthDays'), 7);
check('and unticking clears it', run('toggleTask(1, false); tasks[0].totalGrowthDays'), 0);

// Banked growth stays banked. A finished-earlier assignment does not
// resize when its checklist is edited.
run(`
  tasks = [makeTask(1, 'Old report', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  addSubtask(tasks[0], 'A');
  addSubtask(tasks[0], 'B');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
  tasks[0].doneAt = shiftDate(getTodayString(), -4);
`);
check('banked at half', run('tasks[0].totalGrowthDays'), 0.5);
run('toggleSubtask(tasks[0], 2);');
check('a later step change does not reopen banked growth',
  run('tasks[0].totalGrowthDays'), 0.5);

// The overnight untick of steps must not move growth either - the day
// boundary banks it, and clearing the checklist is not a refund.
run(`
  tasks = [makeTask(1, 'Nightly', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'A');
  addSubtask(tasks[0], 'B');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
  lastResetDate = shiftDate(getTodayString(), -1);
  applyDayBoundaries();
`);
check('rollover keeps yesterday\'s partial growth', run('tasks[0].totalGrowthDays'), 0.5);
check('and clears the steps', run('tasks[0].subtasks[0].done'), false);

// The series walks back by the award, so a partial day steps by a
// partial amount.
run(`
  tasks = [makeTask(1, 'Half', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'A');
  addSubtask(tasks[0], 'B');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
`);
check('series ends on the partial total',
  run('buildGrowthSeries(tasks[0], 4).slice(-1)[0].days'), 0.5);
check('and steps back to zero by a half',
  run('buildGrowthSeries(tasks[0], 4)[0].days'), 0);

// =====================================================================
console.log('\n--- C1: effort in the packed history ---');

// The whole migration claim: every row ever written holds '1', and
// '1' still means a completed day at the ordinary rate.
check('an old row still reads as done',
  run('histGet({ "2026": "0010" }, "2026-01-03")'), true);
check('and reads as Steady',
  run('histLevel({ "2026": "0010" }, "2026-01-03")'), 1);
check('a zero is still not done',
  run('histGet({ "2026": "0010" }, "2026-01-01")'), false);
check('and has no effort at all',
  run('histLevel({ "2026": "0010" }, "2026-01-01")'), 0);
check('past the end of a trimmed row is not done',
  run('histGet({ "2026": "001" }, "2026-06-01")'), false);

// Any non-zero digit is a completed day.
check('a hard day is done',    run('histGet({ "2026": "0020" }, "2026-01-03")'), true);
check('at level two',          run('histLevel({ "2026": "0020" }, "2026-01-03")'), 2);
check('an all-out day is done', run('histGet({ "2026": "0030" }, "2026-01-03")'), true);
check('at level three',        run('histLevel({ "2026": "0030" }, "2026-01-03")'), 3);

// An unreadable character is a completed day at an unknown effort,
// which reads as Steady - never as "not done", which would erase a
// day from the heatmap.
check('an unknown digit is still a completed day',
  run('histGet({ "2026": "0090" }, "2026-01-03")'), true);
check('and falls back to Steady',
  run('histLevel({ "2026": "0090" }, "2026-01-03")'), 1);
check('migration normalises it',
  run('migrateHistory({ "2026": "0090" })["2026"]'), '001');
check('and a non-digit too',
  run('migrateHistory({ "2026": "00x0" })["2026"]'), '001');

// histSet takes a boolean or a level, and true still means Steady.
run('var h = {}; histSet(h, "2026-01-03", true);');
check('true writes a Steady day', run('h["2026"]'), '001');
run('histSet(h, "2026-01-03", 3);');
check('a level writes that digit', run('h["2026"]'), '003');
run('histSet(h, "2026-01-03", false);');
check('false clears it and trims the row', run('h["2026"]'), undefined);

// The date readers ignore the effort digit entirely.
check('every non-zero day is exported',
  run('histDates({ "2026": "1230" })'),
  ['2026-01-01', '2026-01-02', '2026-01-03']);
check('the first completed day skips a hard start',
  run('firstCompletedDate({ "2026": "0002" })'), '2026-01-04');

console.log('\n--- C2: effort affects growth ---');

check('Steady is the plain rate', run('effortMultiplier(1)'), 1);
check('Hard is half again',       run('effortMultiplier(2)'), 1.5);
check('All out is double',        run('effortMultiplier(3)'), 2);
check('junk reads as Steady',     run('effortMultiplier("nonsense")'), 1);

// A fresh tick is always Steady - there is no slot to read until the
// box goes on.
run(`
  tasks = [makeTask(1, 'Run', 'exercise')];
  nextId = 2;
  toggleTask(1, true);
`);
check('a fresh tick is worth one', run('tasks[0].totalGrowthDays'), 1);
check('and logs as Steady', run('taskEffortToday(tasks[0])'), 1);

run('setTaskEffort(tasks[0], 2);');
check('calling it hard regrows it to one and a half',
  run('tasks[0].totalGrowthDays'), 1.5);
check('and the history records the level',
  run('histLevel(tasks[0].history, getTodayString())'), 2);
run('setTaskEffort(tasks[0], 3);');
check('all out doubles it', run('tasks[0].totalGrowthDays'), 2);
run('setTaskEffort(tasks[0], 1);');
check('and dialling it back returns to one', run('tasks[0].totalGrowthDays'), 1);

// Unticking after logging effort gives back exactly what was paid.
run('setTaskEffort(tasks[0], 3); toggleTask(1, false);');
check('unticking a hard day returns to zero', run('tasks[0].totalGrowthDays'), 0);
check('and clears the day from history',
  run('histGet(tasks[0].history, getTodayString())'), false);

// Effort has nothing to log against on a day that was not done.
run(`
  tasks = [makeTask(1, 'Untouched', 'misc')];
  nextId = 2;
  setTaskEffort(tasks[0], 3);
`);
check('effort on an unticked task does nothing',
  run('tasks[0].totalGrowthDays'), 0);
check('and writes no history', run('histGet(tasks[0].history, getTodayString())'), false);

// Effort multiplies the impact rating and the checklist ratio, rather
// than replacing either.
run(`
  tasks = [makeTask(1, 'Lab report', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  setTaskImpact(tasks[0], 7);
  addSubtask(tasks[0], 'Method');
  addSubtask(tasks[0], 'Results');
  toggleSubtask(tasks[0], 1);
  toggleTask(1, true);
`);
check('half a Large assignment is three and a half',
  run('tasks[0].totalGrowthDays'), 3.5);
run('setTaskEffort(tasks[0], 2);');
check('and a hard one is five and a quarter',
  run('tasks[0].totalGrowthDays'), 5.25);
run('toggleSubtask(tasks[0], 2);');
check('finishing the steps scales the hard rate too',
  run('tasks[0].totalGrowthDays'), 10.5);
run('toggleTask(1, false);');
check('and it all comes back off', run('tasks[0].totalGrowthDays'), 0);

// Yesterday's effort survives the rollover and keeps its growth.
run(`
  tasks = [makeTask(1, 'Nightly', 'chores')];
  nextId = 2;
  toggleTask(1, true);
  setTaskEffort(tasks[0], 3);
  lastResetDate = shiftDate(getTodayString(), -1);
  applyDayBoundaries();
`);
check('a hard day banks double', run('tasks[0].totalGrowthDays'), 2);
check('and the box comes back unticked', run('tasks[0].completed'), false);

// The series and the delta read each day's own effort, so a window of
// mixed days is not just a count times one number.
run(`
  tasks = [makeTask(1, 'Mixed', 'exercise')];
  nextId = 2;
  tasks[0].history = {};
  histSet(tasks[0].history, shiftDate(getTodayString(), -2), 1);
  histSet(tasks[0].history, shiftDate(getTodayString(), -1), 2);
  histSet(tasks[0].history, getTodayString(), 3);
  tasks[0].totalGrowthDays = 4.5;
`);
check('a steady, a hard and an all-out day sum to four and a half',
  run('recentGrowthPoints(tasks[0], 7, true)'), 4.5);
check('excluding today drops the all-out day',
  run('recentGrowthPoints(tasks[0], 7, false)'), 2.5);
check('the series ends on the stored total',
  run('buildGrowthSeries(tasks[0], 4).slice(-1)[0].days'), 4.5);
check('and walks back through each day\'s own effort',
  run('buildGrowthSeries(tasks[0], 4).map(function (p) { return p.days; })'),
  [0, 1, 2.5, 4.5]);

// =====================================================================
console.log('');
if (fail.length) {
  console.log(fail.length + ' FAILURE(S):\n');
  fail.forEach(f => console.log('  - ' + f + '\n'));
  process.exit(1);
}
console.log('all checks passed');
