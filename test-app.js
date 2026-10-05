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
               '05-stats-app.js', '06-friends.js', '07-friend-garden.js', '12-tasks-page.js', '13-onboarding.js',
               '14-guides.js', '10-account-data.js'];
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
console.log('\n--- manual ordering ---');

run(`
  tasks = [];
  nextId = 1;
  var a = makeTask(1, 'Alpha', 'education');   a.totalGrowthDays = 10;
  var b = makeTask(2, 'Bravo', 'exercise');    b.totalGrowthDays = 30;
  var c = makeTask(3, 'Charlie', 'chores');    c.totalGrowthDays = 20;
  tasks = [a, b, c];
`);

const names = (code) => run(code + ".map(function (t) { return t.text; })");

check('habits sort by growth while nothing is placed by hand',
  names('tasksOfKindSorted("habit")'),
  ['Bravo', 'Charlie', 'Alpha']);

check('nothing carries an order yet', run('hasAnyManualOrder("habit")'), false);

// Alpha is last by growth. One nudge should not be needed three times
// to get it to the top — but one nudge should move it exactly one place.
run('moveTaskBy(1, -1);');
check('a nudge moves one place, not to the end',
  names('tasksOfKindSorted("habit")'),
  ['Bravo', 'Alpha', 'Charlie']);

check('and the whole kind is renumbered densely from zero',
  run('tasksOfKindSorted("habit").map(function (t) { return t.order; })'),
  [0, 1, 2]);

run('moveTaskBy(1, -1);');
check('a second nudge reaches the top',
  names('tasksOfKindSorted("habit")'),
  ['Alpha', 'Bravo', 'Charlie']);

check('nudging past the top does nothing', run('moveTaskBy(1, -1)'), false);
check('and the order is unchanged',
  names('tasksOfKindSorted("habit")'),
  ['Alpha', 'Bravo', 'Charlie']);

check('nudging past the bottom does nothing too', run('moveTaskBy(3, 1)'), false);

// The point of the hybrid: a placed task outranks growth, an unplaced
// one still sorts by it.
run(`
  tasks.forEach(function (t) { t.order = null; });
  tasks.find(function (t) { return t.text === 'Alpha'; }).order = 0;
`);
check('one placed task takes the top, the rest sort themselves below',
  names('tasksOfKindSorted("habit")'),
  ['Alpha', 'Bravo', 'Charlie']);

check('clearing hands the list back to the automatic sort',
  [run('clearManualOrder("habit")'), names('tasksOfKindSorted("habit")')],
  [true, ['Bravo', 'Charlie', 'Alpha']]);

check('clearing again reports nothing to do', run('clearManualOrder("habit")'), false);

console.log('\n--- ordering keeps the two kinds apart ---');

run(`
  tasks = [];
  var h1 = makeTask(1, 'Habit one', 'education');   h1.totalGrowthDays = 5;
  var h2 = makeTask(2, 'Habit two', 'exercise');    h2.totalGrowthDays = 9;
  var o1 = makeTask(3, 'Essay', 'education');       setTaskKind(o1, 'once'); o1.due = '2026-01-10';
  var o2 = makeTask(4, 'Report', 'education');      setTaskKind(o2, 'once'); o2.due = '2026-01-05';
  tasks = [h1, h2, o1, o2];
`);

check('assignments sort by due date', names('tasksOfKindSorted("once")'), ['Report', 'Essay']);

run('moveTaskBy(1, -1);');   // reorder the habits
check('reordering habits leaves assignments untouched',
  run('tasksOfKindSorted("once").every(function (t) { return t.order === null; })'),
  true);

console.log('\n--- committing a section after a drag ---');

// The case that makes applySectionOrder() non-trivial: a section is a
// FILTER, so committing one must not move the tasks that were not in it.
run(`
  tasks = [];
  var a = makeTask(1, 'A', 'education');  a.totalGrowthDays = 50;
  var b = makeTask(2, 'B', 'exercise');   b.totalGrowthDays = 40; b.completed = true;
  var c = makeTask(3, 'C', 'chores');     c.totalGrowthDays = 30;
  var d = makeTask(4, 'D', 'misc');       d.totalGrowthDays = 20; d.completed = true;
  var e = makeTask(5, 'E', 'mindfulness'); e.totalGrowthDays = 10;
  tasks = [a, b, c, d, e];
`);

check('the full habit sequence starts by growth',
  names('tasksOfKindSorted("habit")'),
  ['A', 'B', 'C', 'D', 'E']);

// The undone rows (A, C, E) occupy slots 0, 2 and 4. Dragging E above
// A within that section must refill only those three slots.
check('a section commit reports success', run('applySectionOrder([5, 3, 1])'), true);

check('the dragged section takes its new order in its own slots',
  names('tasksOfKindSorted("habit")'),
  ['E', 'B', 'C', 'D', 'A']);

check('done rows never moved', run('tasks.find(function(t){return t.text==="B";}).order'), 1);

check('a one-row section is not a reorder', run('applySectionOrder([1])'), false);
check('an empty commit is not a reorder', run('applySectionOrder([])'), false);
check('unknown ids are ignored, so a stale DOM cannot corrupt the order',
  run('applySectionOrder([999, 998])'), false);

console.log('\n--- the order field survives a save ---');

check('a placed task writes its order',
  run('buildCleanTasks().find(function (t) { return t.id === 5; }).order'),
  0);

run(`
  tasks.forEach(function (t) { t.order = null; });
`);
check('a garden nobody has reordered writes no order field at all',
  run('buildCleanTasks().some(function (t) { return "order" in t; })'),
  false);

check('a nonsense stored order normalizes to automatic',
  [run('normalizeOrder("x")'), run('normalizeOrder(-1)'), run('normalizeOrder(1e9)'), run('normalizeOrder(3)')],
  [null, null, null, 3]);

// =====================================================================
// =====================================================================
console.log('\n--- H1: onboarding ---');

// Fresh garden. tpAskId is reset because the rendering tests above
// ticked a row, and a stale id matching the plant planted below would
// open the effort dialog on its own.
run(`
  tasks = [];
  nextId = 1;
  onboardPlantedId = null;
  tpAskId = null;
  dailyGrowthShown = false;
  currentPage = 'garden';
  render();
`);
const ob = () => $('gardenOnboard');

check('an empty plot is at the pick stage', run('onboardStage()'), 'pick');
check('the garden card is showing', ob().classList.contains('hidden'), false);
check('it offers six starters', ob().querySelectorAll('[data-ob-starter]').length, 6);
check('each starter shows its plant', ob().querySelectorAll('.ob-starter-art svg').length, 6);
check('the toolbar note steps aside for it', $('gardenToolbarNote').classList.contains('hidden'), true);
check('and so does the empty-plot message', $('gardenEmptyMsg').classList.contains('hidden'), true);

run('authReady = false;');
check('before the garden loads there is no walkthrough', run('onboardStage()'), 'none');
run('authReady = true;');

// One tap from the garden card.
ob().querySelector('[data-ob-starter="1"]').click();
check('one tap plants something', run('tasks.length'), 1);
check('a habit', run('tasks[0].kind'), 'habit');
check('in the plot the starter named', run('tasks[0].categoryId'), run('ONBOARD_STARTERS[1].cat'));
check('with the starter text', run('tasks[0].text'), run('ONBOARD_STARTERS[1].text'));
check('as a seed', run('tasks[0].totalGrowthDays'), 0);
check('the plant is standing in the garden',
  !!$('gardenSceneTrack').querySelector('.garden-plant[data-task-id="1"]'), true);
check('the card moves on to asking about today', run('onboardStage()'), 'tick');
check('and names the species',
  ob().textContent.indexOf(run('getCategoryById(tasks[0].categoryId).species')) > -1, true);

ob().querySelector('[data-ob-act="tick"]').click();
check('yes ticks it', run('tasks[0].completed'), true);
check('and grows it a day', run('tasks[0].totalGrowthDays'), 1);
check('the first tick does not open the effort question',
  $('effortAsk').classList.contains('hidden'), true);
check('the day is held back for the reveal', run('onboardStage()'), 'grow');
check('and the grow button has it ready', run('getGrownTodayTasks().length'), 1);

run('dailyGrowthShown = true; updateGardenGrowUI();');
check('showing the growth ends the walkthrough', run('onboardStage()'), 'none');
check('and the card goes away', ob().classList.contains('hidden'), true);
run('dailyGrowthShown = false; updateGardenGrowUI();');
check('hiding it again does not bring the card back', run('onboardStage()'), 'none');

// "Not yet" leaves the plant alone and closes the card.
run('tasks = []; nextId = 1; render();');
ob().querySelector('[data-ob-starter="0"]').click();
ob().querySelector('[data-ob-act="later"]').click();
check('not yet leaves it unticked', run('tasks[0].completed'), false);
check('and closes the card', ob().classList.contains('hidden'), true);

// Your own habit, through the box.
function submitOwn(value) {
  ob().querySelector('[data-ob-form] input').value = value;
  ob().querySelector('[data-ob-form]').dispatchEvent(
    new win.Event('submit', { bubbles: true, cancelable: true }));
}
run('tasks = []; nextId = 1; render();');
submitOwn('   ');
check('a blank box plants nothing', run('tasks.length'), 0);
submitOwn('  Stretch  ');
check('your own habit is planted, trimmed', run('tasks.length && tasks[0].text'), 'Stretch');
check('in Miscellaneous', run('tasks[0].categoryId'), 'misc');
check('as a habit, by default', run('tasks[0].kind'), 'habit');

// Your own can pick its type and its plant, like the Tasks page form.
run('tasks = []; nextId = 1; render();');
check('the box offers a type switch', ob().querySelectorAll('[data-ob-kind]').length, 2);
check('and a plant for every plot', ob().querySelectorAll('[data-ob-cat] option').length,
  run('CATEGORIES.length'));
ob().querySelector('[data-ob-kind="once"]').click();
check('the switch moves', ob().querySelector('[data-ob-kind="once"]').getAttribute('aria-pressed'), 'true');
check('and lets go of the other', ob().querySelector('[data-ob-kind="habit"]').classList.contains('active'), false);
ob().querySelector('[data-ob-cat]').value = 'sleep';
submitOwn('Hand in the essay');
check('an assignment can be planted first', run('tasks[0].kind'), 'once');
check('in the plot chosen', run('tasks[0].categoryId'), 'sleep');
check('the card asks whether it is done rather than about today',
  ob().textContent.indexOf('already done') > -1, true);
ob().querySelector('[data-ob-act="tick"]').click();
check('ticking it finishes it', run('tasks[0].completed && tasks[0].doneAt === getTodayString()'), true);
check('and the walkthrough moves on the same way', run('onboardStage()'), 'grow');

// A planted starter saves exactly like a plant from the add form. On a
// fresh plot: tasks[0] above is a ticked assignment, not a starter.
run('tasks = []; nextId = 1; onboardPlantedId = null; render();');
ob().querySelector('[data-ob-starter="0"]').click();
check('it writes the same fields as any new habit',
  run('Object.keys(buildCleanTasks()[0]).sort().join(",")'),
  run('Object.keys((function () { var t = makeTask(1, "x", "misc"); tasks = [t]; return buildCleanTasks()[0]; }())).sort().join(",")'));

// And an assignment from the box saves like one from the add form.
run('tasks = []; nextId = 1; onboardPlantedId = null; render();');
ob().querySelector('[data-ob-kind="once"]').click();
submitOwn('Essay');
check('it writes the same fields as any new assignment',
  run('Object.keys(buildCleanTasks()[0]).sort().join(",")'),
  run('Object.keys((function () { var t = makeTask(1, "x", "misc"); setTaskKind(t, "once"); tasks = [t]; return buildCleanTasks()[0]; }())).sort().join(",")'));

// The Tasks page's empty state offers the same starters.
run("tasks = []; nextId = 1; onboardPlantedId = null; tpScope = 'today'; currentPage = 'tasks'; render();");
check('the empty tasks page offers the starters too',
  $('tpSections').querySelectorAll('[data-ob-starter]').length, 6);
$('tpSections').querySelector('[data-ob-starter="4"]').click();
check('planting from there works the same', run('tasks.length'), 1);
check('the list shows it straight away', $('tpSections').querySelectorAll('.tp-row').length, 1);
check('and the garden picks the walkthrough up', run('onboardStage()'), 'tick');
check('a garden with plants in it never shows the picker',
  run('onboardPlantedId = null; onboardStage()'), 'none');

// The Today / Everything switch lights the one that is chosen.
run("tasks = []; nextId = 1; tpScope = 'today'; renderTaskList();");
const scopeOn = () => Array.from($('tpScope').querySelectorAll('.tp-seg-btn.active')).map(b => b.getAttribute('data-scope'));
check('Today is lit to begin with', scopeOn(), ['today']);
$('tpScope').querySelector('[data-scope="all"]').click();
check('choosing Everything lights Everything, and only it', scopeOn(), ['all']);
check('and tells a screen reader', $('tpScope').querySelector('[data-scope="all"]').getAttribute('aria-pressed'), 'true');
$('tpScope').querySelector('[data-scope="today"]').click();
check('choosing Today moves it back', scopeOn(), ['today']);

// =====================================================================
console.log('\n--- guides ---');

// Content fits the task model, so nothing is cut or reset on plant.
check('every category has a guide',
  run('CATEGORIES.every(function (c) { return !!CATEGORY_GUIDES[c.id]; })'), true);
check('suggestion ids are unique across all guides', run(`
  var seen = {}, dup = false;
  Object.keys(CATEGORY_GUIDES).forEach(function (k) {
    CATEGORY_GUIDES[k].suggestions.forEach(function (s) {
      if (seen[s.id]) dup = true; seen[s.id] = true;
    });
  });
  dup;
`), false);
check('every suggestion fits the length caps and a valid shape', run(`
  var bad = [];
  Object.keys(CATEGORY_GUIDES).forEach(function (k) {
    CATEGORY_GUIDES[k].suggestions.forEach(function (s) {
      if (s.text.length > TASK_TEXT_MAX) bad.push(s.id + ' text');
      (s.subtasks || []).forEach(function (t) { if (t.length > SUBTASK_TEXT_MAX) bad.push(s.id + ' step'); });
      if (s.kind === 'habit' && s.schedule !== null && normalizeSchedule(s.schedule) !== s.schedule) bad.push(s.id + ' schedule');
      if (s.kind === 'once' && normalizeImpact(s.impact) !== s.impact) bad.push(s.id + ' impact');
      if (['start', 'level', 'once'].indexOf(s.tier) === -1) bad.push(s.id + ' tier');
      if ((s.tier === 'once') !== (s.kind === 'once')) bad.push(s.id + ' tier/kind');
    });
  });
  bad;
`), []);

run(`tasks = []; nextId = 1; tpCategory = 'all'; renderTaskList();`);
check('tasks page links to the guide front page',
  $('tpGuideLink').textContent.indexOf("Grower's Guide") !== -1, true);
run(`tpCategory = 'sleep'; renderTaskList();`);
check('a single plot links to its own guide',
  $('tpGuideLink').textContent.indexOf('How to grow Sleep') !== -1, true);

run(`navigateTo('guide');`);
check('guide page is shown',        $('page-guide').classList.contains('hidden'), false);
check('tasks page is hidden',       $('page-tasks').classList.contains('hidden'), true);
check('front page lists seven categories',
  $('guideContent').querySelectorAll('.guide-card').length, 7);
check('front page hash',            win.location.hash, '#guide');

run(`navigateTo('guide', { guideCat: 'education' });`);
check('category guide hash',        win.location.hash, '#guide/education');
check('category guide renders its sections',
  $('guideContent').textContent.indexOf('How to actually do it') !== -1, true);
check('every education suggestion has a plant button',
  $('guideContent').querySelectorAll('[data-guide-plant]').length,
  run('CATEGORY_GUIDES.education.suggestions.length'));

win.location.hash = '#guide/nonsense';
check('an unknown category in the hash falls back to the front page',
  run('parseNavHash()'), { page: 'guide', guideCat: null });
win.location.hash = '#guide/finance';
check('a known category in the hash is read',
  run('parseNavHash()'), { page: 'guide', guideCat: 'finance' });
win.location.hash = '#guide/education';

// Plant a habit with a schedule and steps.
$('guideContent').querySelector('[data-guide-plant="edu-self-quiz"]').click();
check('planting adds one task',     run('tasks.length'), 1);
check('planted in the right plot',  run('tasks[0].categoryId'), 'education');
check('planted as a habit',         run('tasks[0].kind'), 'habit');
check('with its Saturday schedule', run('tasks[0].schedule'), '0000001');
check('with its three steps',       run('tasks[0].subtasks.map(function (s) { return s.id + ":" + s.done; })'),
  ['1:false', '2:false', '3:false']);
check('nextId moved on',            run('nextId'), 2);
check('lands on the tasks page',    run('currentPage'), 'tasks');
check('filtered to that plot',      run('tpCategory'), 'education');
check('with the new task open',     run('tpOpenTaskId'), 1);
run('tpCloseSheet();');

// Plant an assignment.
run(`navigateTo('guide', { guideCat: 'education' });`);
$('guideContent').querySelector('[data-guide-plant="edu-exam-plan"]').click();
check('assignment kind',            run('tasks[1].kind'), 'once');
check('assignment impact',          run('tasks[1].impact'), 3);
check('assignment has no schedule', run('tasks[1].schedule'), null);
run('tpCloseSheet();');

// Planted suggestions can't be planted twice.
run(`navigateTo('guide', { guideCat: 'education' });`);
check('planted suggestions show as planted',
  $('guideContent').querySelectorAll('.guide-planted').length, 2);
check('and lose their button',
  $('guideContent').querySelector('[data-guide-plant="edu-self-quiz"]'), null);
run(`guidePlant('education', 'edu-self-quiz');`);
check('planting again directly is a no-op', run('tasks.length'), 2);

// Back to that plot's tasks from the guide.
$('guideContent').querySelector('[data-guide-back]').click();
check('crumb goes back to tasks',   run('currentPage'), 'tasks');
check('on that plot',               run('tpCategory'), 'education');
check('guide lights its own plank', run(`
  navigateTo('guide');
  var p = document.querySelector('.nav-plank.current');
  p ? p.dataset.page : null;
`), 'guide');

// =====================================================================
console.log('\n--- the menu ---');

check('the menu runs in order of importance',
  Array.from(win.document.querySelectorAll('#navDrawer .nav-plank')).map(p => p.textContent.trim()),
  ['Home', 'Garden', 'Tasks', "Grower's Guide", 'Friends', 'Rewards', 'Greenhouse', 'Stats', 'About', 'Our Mission']);
run(`navigateTo('stats'); setHomeAboutOpen(false);`);
win.document.querySelector('#navDrawer [data-nav="about"]').click();
check('About goes Home', run('currentPage'), 'home');
check('and opens the About panel', $('homeAbout').classList.contains('hidden'), false);
check('without lighting up as a page', run(`document.querySelectorAll('.nav-plank.current').length`), 1);
check('Our Mission links to the story page',
  win.document.querySelector('#navDrawer a.nav-plank').getAttribute('href'), '/story');
run('setHomeAboutOpen(false);');

console.log('');
if (fail.length) {
  console.log(fail.length + ' FAILURE(S):\n');
  fail.forEach(f => console.log('  - ' + f + '\n'));
  process.exit(1);
}
console.log('all checks passed');
// pretendToBeVisual keeps a requestAnimationFrame loop alive, so the
// process would otherwise never exit - and piped output never flushes.
process.exit(0);
