// Rewards (16-rewards.js): Morning dew, the quest boards, lifelong
// badges, the wallet round-trip and the page itself.
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
                 '16-rewards.js']) runScript(fs.readFileSync(f, 'utf8'), f);

const run = (c) => win.eval(c);
const fail = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fail.push(`${label}\n     got:      ${JSON.stringify(actual)}\n     expected: ${JSON.stringify(expected)}`);
  console.log((ok ? '  ok   ' : '  FAIL ') + label);
}
run('saveData = function () {};');
run('assignPermanentPositions = function () { return false; };');
run('authReady = true;');

const T = 'getTodayString()';
function reset() { run('tasks = []; nextId = 1; wallet = dewEmptyWallet(); myFriendUids = [];'); }
function habit(id, cat) { return `tasks.push(makeTask(${id}, 'H${id}', '${cat || 'education'}'));`; }
const status = (tier, id) => `rwStatus("${tier}", rwFind("${tier}", "${id}"), rwContext())`;

console.log('\n--- morning dew ---');
reset();
check('nothing to collect in an empty garden', run('rwReadyCount()'), 0);
check('closed until something is ticked', run('rwMorning(rwContext()).open'), false);
check('collecting while closed does nothing', run('rwCollectMorning()'), false);
run(habit(1) + 'toggleTask(1, true);');
check('a tick opens it at step 1', run('JSON.stringify(rwMorning(rwContext()))'),
      JSON.stringify({ step: 1, dew: 2, collected: false, open: true }));
let b0 = run('wallet.bal');
check('collecting pays step 1', run('rwCollectMorning(); wallet.bal - ' + b0), 2);
check('and only once a day', run('rwCollectMorning()'), false);
check('it is recorded', run(`[wallet.rw.mday === ${T}, wallet.rw.mrun]`), [true, 1]);

run(`wallet.rw.mday = shiftDate(${T}, -1); wallet.rw.mrun = 6;`);
check('day 7 of a run pays the full jar', run('rwMorning(rwContext()).dew'), 10);
run(`wallet.rw.mday = shiftDate(${T}, -1); wallet.rw.mrun = 7;`);
check('after day 7 the ladder starts over', run('rwMorning(rwContext()).step'), 1);
run(`wallet.rw.mday = shiftDate(${T}, -2); wallet.rw.mrun = 4;`);
check('a missed day starts it over too', run('rwMorning(rwContext()).step'), 1);

console.log('\n--- daily quests ---');
reset();
run(habit(1) + habit(2) + habit(3) + 'toggleTask(1, true); toggleTask(2, true);');
check('two ticks are not three', run(status('day', 'd3') + '.done'), false);
check('collecting early does nothing', run('rwCollect("day", "d3")'), false);
run('toggleTask(3, true);');
b0 = run('wallet.bal');
check('three ticks collect +3', run(`rwCollect("day", "d3"); wallet.bal - ${b0}`), 3);
check('and only once', run('rwCollect("day", "d3")'), false);
check('every habit due today done: Clean sweep', run(status('day', 'dall') + '.done'), true);
run('toggleTask(3, false);');
check('a collected quest stays collected after an untick', run(status('day', 'd3') + '.collected'), true);
check('Clean sweep is no longer met', run(status('day', 'dall') + '.done'), false);

reset();
run(habit(1) + `tasks[0].schedule = '0000000';`);
check('no habit due today means no Clean sweep', run('rwContext().dayAllHabits'), false);
run(`histSet(tasks[0].history, ${T}, 3);`);
check('an All out tick counts for Push through', run('rwContext().dayHard'), true);

console.log('\n--- periods roll over ---');
reset();
run(`wallet.rw = rwEmpty(); wallet.rw.d = shiftDate(${T}, -1); wallet.rw.dc = ['d3'];`);
check('a new day empties the daily list', run('rwState().dc.length'), 0);
run(`wallet.rw.w = '2000-01-03'; wallet.rw.wc = ['w5']; wallet.rw.m = '2000-01'; wallet.rw.mc = ['m20'];`);
check('a new week and month empty theirs', run('[rwState().wc.length, rwState().mc.length]'), [0, 0]);
check('weeks start on Monday', run(`dayOfWeek(rwWeekStart(${T}))`), 1);

console.log('\n--- weekly and monthly, read from history ---');
reset();
run(habit(1) + habit(2));
run(`(function () {
  var mon = rwWeekStart(${T});
  for (var d = mon; d <= ${T}; d = shiftDate(d, 1)) { histSet(tasks[0].history, d, true); histSet(tasks[1].history, d, true); }
})();`);
const days = run(`rwDates(rwWeekStart(${T}), ${T}).length`);
check('days this week are counted', run('rwContext().weekDays'), days);
check('ticks this week are counted', run('rwContext().weekTicks'), days * 2);
check('lifetime ticks come off every row', run('rwContext().lifeTicks'), days * 2);
run(`(function () { var a = makeTask(9, 'Essay', 'education'); setTaskKind(a, 'once'); a.doneAt = ${T}; a.completed = true; tasks.push(a); })();`);
check('assignments finished this week', run('rwContext().weekAssign'), 1);

console.log('\n--- lifelong badges ---');
reset();
run(habit(1) + 'toggleTask(1, true);');
b0 = run('wallet.bal');
check('First drop pays 5', run(`rwCollect("life", "first"); wallet.bal - ${b0}`), 5);
check('once ever', run('rwCollect("life", "first")'), false);
run(`CATEGORIES.forEach(function (c, i) { tasks.push(makeTask(100 + i, c.id, c.id)); });`);
check('a plant in every plot', run(status('life', 'cats') + '.done'), true);
run('myFriendUids = ["x"];');
check('a friend counts', run(status('life', 'friend') + '.done'), true);
run('tasks[0].maxStreak = 31;');
check('streak badges read maxStreak',
      run('["s7", "s30", "s100"].map(function (id) { return rwStatus("life", rwFind("life", id), rwContext()).done; })'),
      [true, true, false]);

console.log('\n--- storage ---');
reset();
run(habit(1) + 'toggleTask(1, true); rwCollectMorning(); rwCollect("life", "first");');
const payload = run('JSON.stringify(dewWalletPayload().rw)');
check('the payload carries what was collected', JSON.parse(payload).life, ['first']);
check('and the morning run', JSON.parse(payload).mrun, 1);
run(`wallet = dewNormalizeWallet({ bal: 3, rw: ${payload} });`);
check('it survives a load', run('[wallet.rw.life, wallet.rw.mrun]'), [['first'], 1]);
run(`wallet = dewNormalizeWallet({ rw: { life: ['first', 'nope', 7, 'first'], mrun: 99, dc: ['zzz'], m: 'bad' } });`);
check('junk is dropped on load', run('[wallet.rw.life, wallet.rw.mrun, wallet.rw.dc, wallet.rw.m]'), [['first'], 7, [], null]);
run('wallet = dewNormalizeWallet(null);');
check('a garden with no rewards yet loads empty', run('wallet.rw.life.length'), 0);

console.log('\n--- the page ---');
reset();
run(habit(1) + 'toggleTask(1, true);');
run('navigateTo("rewards");');
check('the page shows', run('document.getElementById("page-rewards").classList.contains("hidden")'), false);
check('other pages are hidden', run('document.getElementById("page-tasks").classList.contains("hidden")'), true);
check('it has Morning dew, three boards plus the badge board, and 12 badges',
      run('[!!document.querySelector(".rw-morning"), document.querySelectorAll(".rw-board").length, document.querySelectorAll(".rw-badge").length]'),
      [true, 4, 12]);
check('the URL follows', run('location.hash'), '#rewards');
check('the menu plank is lit', run('document.querySelector(\'.nav-plank[data-page="rewards"]\').classList.contains("current")'), true);
check('the ready dot shows the count',
      run('document.querySelector(\'.nav-plank[data-page="rewards"]\').getAttribute("data-rw-count")'),
      String(run('rwReadyCount()')));
b0 = run('wallet.bal');
run('document.querySelector("[data-rw-morning]").click();');
check('tapping Collect pays', run('wallet.bal - ' + b0), 2);
check('and the button becomes a note', run('!!document.querySelector("[data-rw-morning]")'), false);
run('navigateTo("garden");');
check('leaving hides it', run('document.getElementById("page-rewards").classList.contains("hidden")'), true);
run('navigateTo("guide");');
check('the guide has its own plank now', run('document.querySelector(\'.nav-plank[data-page="guide"]\').classList.contains("current")'), true);
check('front page has GUIDE and REWARDS signs', run('[!!document.getElementById("btn-to-guide"), !!document.getElementById("btn-to-rewards")]'), [true, true]);
check('both signs are carved', run('["cutGuide", "cutRewards"].map(function (id) { return HB_SIGNS.some(function (s) { return s.hostId === id; }); })'), [true, true]);
run('navigateTo("home"); document.getElementById("btn-to-rewards").click();');
check('the REWARDS sign goes to Rewards', run('currentPage'), 'rewards');
run('navigateTo("home"); document.getElementById("btn-to-guide").click();');
check('the GUIDE sign goes to the guide', run('currentPage'), 'guide');

console.log(fail.length ? `\n${fail.length} FAILURE(S):\n` + fail.join('\n') : '\nall passed');
process.exit(fail.length ? 1 : 0);
