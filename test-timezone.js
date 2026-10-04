// Timezones (I1): getTodayString() never goes backwards. Flying west
// holds the day instead of re-opening it; a big jump back is a clock
// fix and is trusted; flying east to skip a day is offered by 17.
// Same jsdom + Firebase-stub harness as test-yesterday.js.
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

// The device clock, under test control. Everything in the app reads
// the date through localDateString(), so this is the whole switch.
run('var fakeLocal = null; var realLocalDateString = localDateString; ' +
    'localDateString = function () { return fakeLocal || realLocalDateString(); };');
const D = (n) => run(`shiftDate(realLocalDateString(), ${n})`);
const setLocal = (d) => run(`fakeLocal = ${JSON.stringify(d)};`);

console.log('\n--- an ordinary day ---');
reset();
setLocal(D(0));
check('today is the device date', run('getTodayString()'), D(0));
run('lastResetDate = ' + JSON.stringify(D(-1)) + ';');
check('a garden that last rolled yesterday is on today', run('getTodayString()'), D(0));

console.log('\n--- flying west: the date falls back a day ---');
reset();
setLocal(D(0));
run(habit(1, [-3, -2, -1], { streak: 3, maxStreak: 3 }));
run('lastResetDate = getTodayString(); toggleTask(1, true);');
check('ticked at home: streak 4', run('tasks[0].streak'), 4);
const grownAtHome = run('tasks[0].totalGrowthDays');
const dewAtHome = run('wallet.bal');

setLocal(D(-1));   // landed in London, where it is still yesterday
check('today is held at the later day', run('getTodayString()'), D(0));
check('the rollover sees nothing to do', run('applyDayBoundaries()'), false);
check('the habit stays ticked', run('tasks[0].completed'), true);
check('so it cannot be ticked a second time', run('tasks[0].streak'), 4);
run('toggleTask(1, true);');
check('ticking again pays nothing more', run('tasks[0].totalGrowthDays'), grownAtHome);
check('and no more Dew', run('wallet.bal'), dewAtHome);
check('the Stats heatmap ends on the same day',
  run('var w = buildYearGrid(); var last = null; w.forEach(function (wk) { wk.forEach(function (d) { if (d) last = d; }); }); last'), D(0));
check('and its "last 7 days" starts there', run('getDateNDaysAgo(0)'), D(0));

setLocal(D(0));    // London catches up to the day the garden is on
check('when the local date catches up, it is the same day', run('getTodayString()'), D(0));
check('still no rollover', run('applyDayBoundaries()'), false);
check('still ticked', run('tasks[0].completed'), true);

setLocal(D(1));    // the next real day
check('the next day rolls over normally', run('getTodayString()'), D(1));
run('applyDayBoundaries();');
check('the habit comes up unticked', run('tasks[0].completed'), false);
check('and its streak survived the flight', run('tasks[0].streak'), 4);

console.log('\n--- a clock put right, not a flight ---');
reset();
run('lastResetDate = ' + JSON.stringify(D(10)) + ';');   // phone was set 10 days ahead once
setLocal(D(0));
check('a jump back of more than 2 days trusts the device', run('getTodayString()'), D(0));
run(habit(1, [-1], { streak: 1, maxStreak: 1 }));
run('applyDayBoundaries();');
check('and the next rollover brings the garden back to the real date', run('lastResetDate'), D(0));
check('without breaking the streak', run('tasks[0].streak'), 1);

reset();
run('lastResetDate = ' + JSON.stringify(D(2)) + ';');
setLocal(D(0));
check('two days back is still held (the widest timezone gap)', run('getTodayString()'), D(2));
run('lastResetDate = ' + JSON.stringify(D(3)) + ';');
check('three is not', run('getTodayString()'), D(0));

console.log('\n--- flying east: a calendar day is skipped ---');
reset();
setLocal(D(0));
run(habit(1, [-4, -3, -2], { streak: 3, maxStreak: 3 }));
run('lastResetDate = ' + JSON.stringify(D(-2)) + ';');
run('applyDayBoundaries();');
check('the skipped day breaks the streak, like any missed day', run('tasks[0].streak'), 0);
check('but "Forgot to tick yesterday?" offers it', run('ydCanFix(tasks[0])'), true);
run('ydFix(1, EFFORT_DEFAULT);');
check('and logging it brings the streak back', run('tasks[0].streak'), 4);

run('fakeLocal = null;');
console.log(fail.length ? `\n${fail.length} FAILURE(S):\n` + fail.join('\n') : '\nall passed');
process.exit(fail.length ? 1 : 0);
