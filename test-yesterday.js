// Yesterday (17-yesterday.js): logging a habit that was done but not
// ticked - who it is offered to, what fixing it does to growth, streak,
// history and Dew, re-rating it, undoing it, and the card and sheet.
// Same jsdom + Firebase-stub harness as test-wallet.js.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://disciplant.com/' });
const win = dom.window;
const noop = () => {};
const thenable = { then: (f) => { f && f({}); return thenable; }, catch: () => thenable };
function docStub() {
  return { set: () => thenable, update: () => thenable, get: () => thenable,
           onSnapshot: () => noop, collection: () => collStub(), delete: () => thenable };
}
function collStub() { return { doc: docStub, where: () => collStub(), get: () => thenable, onSnapshot: () => noop }; }
win.firebase = {
  apps: [], app: () => ({ options: { authDomain: 'disciplant.com' } }), initializeApp: noop,
  auth: Object.assign(() => ({ onAuthStateChanged: () => noop, signInAnonymously: () => thenable,
    signOut: () => thenable, getRedirectResult: () => thenable, onIdTokenChanged: () => noop,
    setPersistence: () => thenable, currentUser: null }),
    { GoogleAuthProvider: function () { this.setCustomParameters = noop; } }),
  firestore: Object.assign(() => ({ collection: collStub, doc: docStub,
    batch: () => ({ set: noop, update: noop, delete: noop, commit: () => thenable }) }),
    { FieldValue: { serverTimestamp: () => 'TS', increment: (n) => n, delete: () => 'DEL', arrayUnion: noop, arrayRemove: noop },
      Timestamp: { now: () => ({ toMillis: () => Date.now() }) } }),
};
win.gtag = noop; win.dataLayer = [];
function runScript(code, label) {
  const el = win.document.createElement('script');
  el.textContent = code;
  const errs = [];
  win.addEventListener('error', (e) => errs.push(e.message), { once: true });
  win.document.body.appendChild(el);
  if (errs.length) { console.log('ERROR in ' + label + ': ' + errs[0]); process.exit(1); }
}
runScript('var db = firebase.firestore(); var auth = firebase.auth();', 'config');
for (const f of ['01-app-core.js', '02-auth-tasks.js', '03-plant-art.js', '04-garden-scene.js',
                 '05-stats-app.js', '06-friends.js', '07-friend-garden.js', '12-tasks-page.js',
                 '13-onboarding.js', '14-guides.js', '10-account-data.js', '15-wallet.js',
                 '16-rewards.js', '17-yesterday.js']) runScript(fs.readFileSync(f, 'utf8'), f);

const run = (c) => win.eval(c);
const $ = (id) => win.document.getElementById(id);
const fail = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fail.push(`${label}\n     got:      ${JSON.stringify(actual)}\n     expected: ${JSON.stringify(expected)}`);
  console.log((ok ? '  ok   ' : '  FAIL ') + label);
}
run('saveData = function () {};');
run('assignPermanentPositions = function () { return false; };');
run('authReady = true;');
run('try { localStorage.clear(); } catch (e) {}');

// A daily habit created `age` days ago and ticked on each day in
// `ticked` (offsets from today: -2 is the day before yesterday), with
// the streak as the midnight rollover would have left it.
function habit(id, ticked, opts) {
  opts = opts || {};
  return `
    (function () {
      var T = getTodayString();
      var h = makeTask(${id}, 'Habit ${id}', 'exercise');
      h.createdAt = shiftDate(T, -${opts.age === undefined ? 30 : opts.age});
      ${JSON.stringify(ticked)}.forEach(function (d) {
        histSet(h.history, shiftDate(T, d), true);
        h.totalGrowthDays += 1;
      });
      h.maxGrowthDays = h.totalGrowthDays;
      h.streak    = ${opts.streak || 0};
      h.maxStreak = ${opts.maxStreak || 0};
      ${opts.schedule ? `h.schedule = '${opts.schedule}';` : ''}
      tasks.push(h);
    })();`;
}
function reset() {
  run('tasks = []; nextId = 10; wallet = dewEmptyWallet(); lastResetDate = getTodayString(); ' +
      'tpScope = "today"; tpCategory = "all"; currentPage = "tasks"; ' +
      'try { localStorage.removeItem(YD_HIDE_KEY); } catch (e) {}');
}
const Y = 'shiftDate(getTodayString(), -1)';
const card = () => $('ydCard');

console.log('\n--- who it is offered to ---');
reset();
run(habit(1, [-5, -4, -3, -2], { maxStreak: 4 }));
check('a daily habit missed yesterday can be fixed', run('ydCanFix(tasks[0])'), true);
check('and the streak it would come back to is 5', run(`ydStreakFromHistory(tasks[0], ${Y})`), 5);

reset();
run(habit(1, [-1]));
check('not if yesterday was ticked', run('ydCanFix(tasks[0])'), false);

reset();
run(habit(1, [], { age: 0 }));
check('not for a habit planted today', run('ydCanFix(tasks[0])'), false);

reset();
run(habit(1, [], { age: 1 }));
check('but yes for one planted yesterday', run('ydCanFix(tasks[0])'), true);

reset();
run(`(function () { var a = makeTask(1, 'Essay', 'education'); setTaskKind(a, 'once');
      a.createdAt = shiftDate(getTodayString(), -5); tasks.push(a); })();`);
check('not for an assignment', run('ydCanFix(tasks[0])'), false);

reset();
// A schedule with only yesterday's weekday switched OFF.
run(`var ydOff = '1111111'.split(''); ydOff[dayOfWeek(${Y})] = '0'; ydOff = ydOff.join('');`);
run(habit(1, [], { schedule: run('ydOff') }));
check('not when yesterday was not on its schedule', run('ydCanFix(tasks[0])'), false);

reset();
run(habit(1, []));
run('lastResetDate = shiftDate(getTodayString(), -1);');
check('not before today\'s rollover has run', run('ydCanFix(tasks[0])'), false);

// Dew per habit tick, read from 15 so retuning it changes no check.
const TICK = run('DEW_HABIT_TICK');

console.log('\n--- fixing it ---');
reset();
run(habit(1, [-5, -4, -3, -2], { maxStreak: 4 }));
run('ydFix(1, EFFORT_DEFAULT);');
check('yesterday is in the history', run(`histLevel(tasks[0].history, ${Y})`), 1);
check('the plant grows one day', run('tasks[0].totalGrowthDays'), 5);
check('the streak comes back', run('tasks[0].streak'), 5);
check('and best streak follows it', run('tasks[0].maxStreak'), 5);
check('it is marked as logged today', run('tasks[0].lateOn === getTodayString()'), true);
check('it can no longer be fixed again', run('ydCanFix(tasks[0])'), false);
check('fixing twice does nothing', run('ydFix(1, EFFORT_DEFAULT)'), false);
check('it pays the habit tick in Dew', run('wallet.bal'), TICK);
check('against today\'s habit cap', run('wallet.htoday'), TICK);
check('today is untouched', run('histGet(tasks[0].history, getTodayString())'), false);
check('and so is the tick box', run('tasks[0].completed'), false);

console.log('\n--- effort ---');
run('ydSetEffort(1, 3);');
check('All out is stored for yesterday', run(`histLevel(tasks[0].history, ${Y})`), 3);
check('and grows it to double', run('tasks[0].totalGrowthDays'), 6);
run('ydSetEffort(1, 2);');
check('Hard brings it to one and a half', run('tasks[0].totalGrowthDays'), 5.5);
check('the streak does not move', run('tasks[0].streak'), 5);

console.log('\n--- undo ---');
run('ydUndo(1);');
check('yesterday is gone again', run(`histGet(tasks[0].history, ${Y})`), false);
check('so is the growth, effort and all', run('tasks[0].totalGrowthDays'), 4);
check('the streak is back to what midnight left', run('tasks[0].streak'), 0);
check('best streak keeps its high-water mark', run('tasks[0].maxStreak'), 5);
check('the mark is cleared', run('tasks[0].lateOn'), null);
check('the Dew is refunded', run('wallet.bal'), 0);
check('and the cap room given back', run('wallet.htoday'), 0);
check('it can be fixed again', run('ydCanFix(tasks[0])'), true);

console.log('\n--- with today already ticked ---');
reset();
run(habit(1, [-4, -3, -2]));
run('toggleTask(1, true);');
check('today alone is a streak of 1', run('tasks[0].streak'), 1);
run('ydFix(1, EFFORT_DEFAULT);');
check('fixing yesterday joins the two runs', run('tasks[0].streak'), 5);
check('both ticks paid', run('wallet.bal'), 2 * TICK);
run('ydUndo(1);');
check('undo splits them again', run('tasks[0].streak'), 1);
check('and today is still ticked', run('tasks[0].completed && histGet(tasks[0].history, getTodayString())'), true);

console.log('\n--- banked after today ---');
reset();
run(habit(1, [-3, -2]));
run('ydFix(1, EFFORT_DEFAULT);');
run('tasks[0].lateOn = shiftDate(getTodayString(), -1);');
check('a fix from an earlier day is not undoable', run('ydUndo(1)'), false);
check('and not re-ratable', run('ydSetEffort(1, 3)'), false);
check('the day stays', run(`histGet(tasks[0].history, ${Y})`), true);

console.log('\n--- streak milestones ---');
reset();
run(habit(1, [-7, -6, -5, -4, -3, -2], { maxStreak: 6 }));
run('ydFix(1, EFFORT_DEFAULT);');
check('reaching 7 days pays the milestone too', run('wallet.bal'), TICK + 3);
run('ydUndo(1);');
check('undo refunds only the tick', run('wallet.bal'), 3);
run('ydFix(1, EFFORT_DEFAULT);');
check('and the milestone never pays twice', run('wallet.bal'), TICK + 3);

console.log('\n--- saving ---');
reset();
run(habit(1, [-2]));
check('an ordinary habit writes no lateOn', run('"lateOn" in buildCleanTasks()[0]'), false);
run('ydFix(1, EFFORT_DEFAULT);');
check('a fixed one writes it today', run('buildCleanTasks()[0].lateOn === getTodayString()'), true);
run('tasks[0].lateOn = shiftDate(getTodayString(), -1);');
check('a stale one is dropped', run('"lateOn" in buildCleanTasks()[0]'), false);
run('tasks[0].lateOn = getTodayString();');
check('the Dew it paid rides on the wallet', run('JSON.stringify(dewWalletPayload().ly.p)'), JSON.stringify({ 1: TICK }));
run('wallet = dewNormalizeWallet(JSON.parse(JSON.stringify(dewWalletPayload())));');
check('and survives a reload', run('wallet.ly.p["1"]'), TICK);
run('ydUndo(1);');
check('so undo after a reload still refunds', run('wallet.bal'), 0);
check('an old ledger is not loaded',
  run('dewNormalizeWallet({ ly: { d: shiftDate(getTodayString(), -1), p: { "1": 1 } } }).ly.d'), null);

console.log('\n--- the card ---');
reset();
run(habit(1, [-3, -2]));
run(habit(2, [-1]));
run('render();');
check('it shows on the Tasks page', !!card().querySelector('.yd-card'), true);
check('below the sections, so today comes first', card().previousElementSibling === $('tpSections'), true);
check('listing only the habit that missed yesterday', card().querySelectorAll('.yd-row').length, 1);
check('with what it brings the streak back to',
  card().querySelector('.yd-row-meta').textContent, 'Brings your streak back to 3 days');
card().querySelector('[data-yd-act="fix"]').click();
check('its button fixes it', run('tasks[0].streak'), 3);
check('the row now asks how it was', !!card().querySelector('[data-yd-act="effort"]'), true);
check('Steady is selected', card().querySelector('.yd-effort .active').textContent, 'Steady');
check('there is no Hide while Undo is on it', card().querySelector('[data-yd-act="hide"]'), null);
card().querySelector('[data-yd-act="effort"][data-yd-value="3"]').click();
check('effort buttons re-rate it', run(`histLevel(tasks[0].history, ${Y})`), 3);
card().querySelector('[data-yd-act="undo"]').click();
check('Undo undoes it', run(`histGet(tasks[0].history, ${Y})`), false);
check('and offers it again', !!card().querySelector('[data-yd-act="fix"]'), true);

card().querySelector('[data-yd-act="hide"]').click();
check('Hide puts the card away', card().innerHTML, '');
run('render();');
check('for the rest of the day', card().innerHTML, '');

reset();
run(habit(1, [-2]));
run('tpCategory = "education"; render();');
check('it follows the plot filter', card().innerHTML, '');
run('tpCategory = "all"; render();');
check('and comes back on All plots', card().querySelectorAll('.yd-row').length, 1);

reset();
run('render();');
check('nothing to fix, no card', card().innerHTML, '');

console.log('\n--- the detail sheet ---');
reset();
run(habit(1, [-2]));
run('render(); tpOpenSheet(1);');
check('an eligible habit has a Yesterday row', !!$('taskSheetBody').querySelector('.yd-field'), true);
$('taskSheetBody').querySelector('[data-yd-act="fix"]').click();
check('which fixes it', run(`histGet(tasks[0].history, ${Y})`), true);
check('and then offers Undo there too', !!$('taskSheetBody').querySelector('[data-yd-act="undo"]'), true);
check('the sheet\'s streak chip updates',
  $('taskSheetBody').querySelector('.tp-stat b').textContent, '2');
run('tpCloseSheet();');

reset();
run(habit(1, [-1]));
run('render(); tpOpenSheet(1);');
check('a habit ticked yesterday has none', $('taskSheetBody').querySelector('.yd-field'), null);
run('tpCloseSheet();');

console.log(fail.length ? `\n${fail.length} FAILURE(S):\n` + fail.join('\n') : '\nall passed');
process.exit(fail.length ? 1 : 0);
