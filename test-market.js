// Market (18-market.js): buying Mulch, logging yesterday with it (the
// only way now - it wraps 17), Pause, the wallet invariant the security rules
// rely on, saving, and the page itself.
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
                 '16-rewards.js', '17-yesterday.js', '18-market.js']) runScript(fs.readFileSync(f, 'utf8'), f);

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

const T = (n) => run(`shiftDate(getTodayString(), ${n})`);
function rich(n) { run(`wallet.bal = ${n}; wallet.earned = ${n}; wallet.spent = 0;`); }
const inv = () => run('wallet.bal === wallet.earned - wallet.spent');
const YY = 'shiftDate(getTodayString(), -1)';

console.log('\n--- buying Mulch ---');
reset();
check('a new garden holds none', run('mkState().mulch'), 0);
check('it cannot be bought without the Dew', run('mkBuyMulch()'), false);
rich(60);
check('with 60 Dew it can', run('mkBuyMulch()'), true);
check('it costs 25', run('wallet.bal'), 35);
check('counted as spent', run('wallet.spent'), 25);
check('and the balance still adds up', inv(), true);
check('one in the shed', run('mkState().mulch'), 1);
run('mkBuyMulch();');
check('a second', run('mkState().mulch'), 2);
rich(100); run('wallet.mk.mulch = 2;');
check('but never a third', run('mkBuyMulch()'), false);

console.log('\n--- nothing happens at midnight ---');
reset();
run(habit(1, [-5, -4, -3, -2], { streak: 4, maxStreak: 4 }));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 2; lastResetDate = ${YY}; applyDayBoundaries();`);
check('the rollover breaks the streak as it always did', run('tasks[0].streak'), 0);
check('and spends no Mulch by itself', run('mkState().mulch'), 2);

console.log('\n--- logging yesterday costs a bag ---');
reset();
run(habit(1, [-5, -4, -3, -2]));
run(`wallet.mk = mkEmpty(); lastResetDate = getTodayString();`);
check('with no Mulch, yesterday cannot be logged', run('ydFix(1, EFFORT_DEFAULT)'), false);
check('nothing changed', run(`histGet(tasks[0].history, ${YY})`), false);
check('but the plant is still offered, so the card can point at the Market', run('mkCanMulch(tasks[0])'), true);

run('wallet.mk.mulch = 2;');
run('ydFix(1, EFFORT_DEFAULT);');
check('with a bag it logs the day', run(`histGet(tasks[0].history, ${YY})`), true);
check('the plant grows by an ordinary day', run('tasks[0].totalGrowthDays'), 5);
check('the streak comes back', run('tasks[0].streak'), 5);
check('the tick Dew is paid as usual', run('wallet.bal'), 1);
check('one bag is spent', run('mkState().mulch'), 1);
check('the day is recorded against the weekly limit', run(`mkMulched(tasks[0], ${YY})`), true);
check('the log is kept for the page', run('mkState().log.length && mkState().log[0].s'), 5);
check('it cannot be logged twice', run('ydFix(1, EFFORT_DEFAULT)'), false);
check('effort can still be changed', run('ydSetEffort(1, 3) && tasks[0].totalGrowthDays'), 6);
run('ydUndo(1);');
check('undo takes the day back', run(`histGet(tasks[0].history, ${YY})`), false);
check('and the growth', run('tasks[0].totalGrowthDays'), 4);
check('and the streak', run('tasks[0].streak'), 0);
check('and refunds the tick Dew', run('wallet.bal'), 0);
check('and puts the bag back', run('mkState().mulch'), 2);
check('and forgets the record', run(`mkMulched(tasks[0], ${YY})`), false);
check('so it can be logged again', run('mkCanMulch(tasks[0])'), true);

reset();
run(habit(1, [-3, -2]));
run(habit(2, [-6, -5, -4, -3, -2]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1; lastResetDate = getTodayString();`);
run('ydFix(1, EFFORT_DEFAULT);');
check('you choose which plant gets it', run('[tasks[0].streak, tasks[1].streak]'), [3, 0]);
check('and the other then has none to take', run('ydFix(2, EFFORT_DEFAULT)'), false);

reset();
run(habit(1, [-9, -8, -7, -6, -5, -3, -2]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1; wallet.mk.cov["1"] = [shiftDate(getTodayString(), -4)];
     lastResetDate = getTodayString();`);
check('not twice for one plant in a week', run('mkCanMulch(tasks[0])'), false);
check('so the card does not offer it either', run('ydCanFix(tasks[0])'), false);
run(`wallet.mk.cov["1"] = [shiftDate(getTodayString(), -9)];`);
check('but again once a week has passed', run('mkCanMulch(tasks[0])'), true);

reset();
run(habit(1, [-1]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1; lastResetDate = getTodayString();`);
check('not on a habit that was ticked yesterday', run('mkCanMulch(tasks[0])'), false);

reset();
run(habit(1, [-3, -2]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1; lastResetDate = getTodayString();`);
run('ydFix(1, EFFORT_DEFAULT);');
run(`wallet.mk.use.d = shiftDate(getTodayString(), -1);`);
check('a bag used on an earlier day cannot be undone', run('ydUndo(1)'), false);
check('and the day it logged stays', run(`histGet(tasks[0].history, ${YY})`), true);

console.log('\n--- the card under the Tasks page ---');
reset();
run(habit(1, [-3, -2]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 2; lastResetDate = getTodayString(); currentPage = 'tasks'; render();`);
const ydc = () => $('ydCard');
check('there is one button, not two', ydc().querySelectorAll('.yd-row button').length, 1);
check('and it spends Mulch', ydc().querySelector('[data-yd-act="fix"]').textContent.trim(), 'Use Mulch to log it (2 left)');
check('the card says what it costs', ydc().querySelector('.yd-row-meta').textContent.indexOf('costs 1 Mulch') !== -1, true);
check('and what Mulch does', ydc().querySelector('.yd-sub').textContent.indexOf('A bag of Mulch logs it late') !== -1, true);
ydc().querySelector('[data-yd-act="fix"]').click();
check('tapping it logs the day', run(`histGet(tasks[0].history, ${YY})`), true);
check('and spends the bag', run('mkState().mulch'), 1);
check('the row asks how it was, as before', !!ydc().querySelector('[data-yd-act="effort"]'), true);
ydc().querySelector('[data-yd-act="undo"]').click();
check('and its Undo gives the bag back', run('mkState().mulch'), 2);
run('tpOpenSheet(1);');
check('the habit sheet spends Mulch too', $('taskSheetBody').querySelector('[data-yd-act="fix"]').textContent.indexOf('Use Mulch') !== -1, true);
run('tpCloseSheet();');
run('wallet.mk.mulch = 0; render();');
check('with none in the shed it offers to get some', ydc().querySelector('.mk-yd-buy').textContent, 'Get Mulch to log it');
check('which is not a free log', ydc().querySelector('[data-yd-act="fix"]'), null);
ydc().querySelector('.mk-yd-buy').click();
check('it goes to the Market', run('currentPage'), 'market');

console.log('\n--- the Market page lists the plants ---');
reset();
run(habit(1, [-3, -2]));
run(habit(2, [-1]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1; lastResetDate = getTodayString(); navigateTo('market');`);
check('only the habit not ticked yesterday is listed', $('marketContent').querySelectorAll('.mk-pick').length, 1);
$('marketContent').querySelector('.mk-pick [data-yd-act="fix"]').click();
check('Use Mulch there logs it', run(`histGet(tasks[0].history, ${YY})`), true);
check('and it stays listed with Undo', !!$('marketContent').querySelector('.mk-pick [data-yd-act="undo"]'), true);
$('marketContent').querySelector('.mk-pick [data-yd-act="undo"]').click();
check('which works from there', run('mkState().mulch'), 1);
reset();
run(`navigateTo('market');`);
check('with nothing to log it says so', !!$('marketContent').querySelector('.mk-none'), true);

console.log('\n--- Pause ---');
reset();
run(habit(1, [-2], { streak: 1, maxStreak: 1 }));
check('it cannot start in the past', run(`mkStartPause(${YY}, 3)`), false);
check('or run past 14 days', run('mkStartPause(getTodayString(), 15)'), false);
check('a week from today is fine', run('mkStartPause(getTodayString(), 7)'), true);
check('and costs nothing', run('wallet.bal'), 0);
check('habits are not due today', run('isScheduledOn(tasks[0], getTodayString())'), false);
check('so the Tasks page lists none as due', run('tpBuildSections()[0].list.length'), 0);
check('nor on its last day', run('isScheduledOn(tasks[0], shiftDate(getTodayString(), 6))'), false);
check('but again the day after', run('isScheduledOn(tasks[0], shiftDate(getTodayString(), 7))'), true);
check('a second pause cannot be set on top', run('mkStartPause(shiftDate(getTodayString(), 1), 3)'), false);
run('mkEndPause();');
check('one that started today ends cleanly', run('mkState().pause'), null);
check('with no wait for the next', run('mkPauseEarliest() === getTodayString()'), true);

reset();
run(habit(1, [-4, -3], { streak: 2, maxStreak: 2 }));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1;
     wallet.mk.pause = { from: shiftDate(getTodayString(), -2), to: shiftDate(getTodayString(), 4) };
     lastResetDate = shiftDate(getTodayString(), -2); applyDayBoundaries();`);
check('paused days never break a streak', run('tasks[0].streak'), 2);
check('and are not offered for Mulch', run('mkCanMulch(tasks[0])'), false);
check('nor count against the heatmap', run(`dayTally(tasks[0], ${YY}).counted`), false);
run('mkEndPause();');
check('ending a running pause keeps the days behind it', run(`mkState().pend === ${YY}`), true);
check('the next can start a week after', run('mkPauseEarliest() === shiftDate(getTodayString(), 7)'), true);
check('not before', run('mkStartPause(getTodayString(), 3)'), false);

reset();
run(`wallet.mk = mkEmpty(); wallet.mk.pause = { from: shiftDate(getTodayString(), -6), to: ${YY} };`);
check('a finished pause becomes the cooldown on its own',
  run(`mkState().pause === null && mkState().pend === ${YY}`), true);

console.log('\n--- the balance always adds up ---');
reset();
run('wallet.bal = 99990; wallet.earned = 99990; wallet.spent = 0; dewCredit(50, null);');
check('a credit at the ceiling stops at it', run('wallet.bal'), 99999);
check('and earned moves by the same', inv(), true);
reset();
run('wallet.bal = 2; wallet.earned = 2; wallet.spent = 0; dewRefund(5, "h");');
check('a refund cannot take back more than was earned', run('wallet.earned'), 0);
check('and still adds up', inv(), true);
check('a broken wallet is repaired on load',
  run('var w = dewNormalizeWallet({ bal: 40, earned: 10, spent: 5 }); w.bal === w.earned - w.spent && w.bal === 40'), true);

console.log('\n--- saving ---');
reset();
run(habit(1, [-2], { streak: 1 }));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 2;
     wallet.mk.cov = { "1": [shiftDate(getTodayString(), -3)], "99": [shiftDate(getTodayString(), -3)] };
     wallet.mk.pause = { from: getTodayString(), to: shiftDate(getTodayString(), 2) };`);
const saved = JSON.parse(run('JSON.stringify(dewWalletPayload().mk)'));
check('what is held is saved', saved.mulch, 2);
check('a covered day is saved', Object.keys(saved.cov), ['1']);
check('a plant since dug up is dropped', saved.cov['99'], undefined);
check('the pause is saved', !!saved.pause, true);
run('wallet = dewNormalizeWallet(JSON.parse(JSON.stringify(dewWalletPayload())));');
check('and it all survives a reload', run('mkState().mulch === 2 && mkPaused(getTodayString())'), true);
check('nonsense on the document becomes nothing',
  run('JSON.stringify(mkNormalize({ mulch: 999, cov: { x: ["nope"] }, pause: { from: "2026-01-01", to: "2027-01-01" } }))'),
  run('JSON.stringify(Object.assign(mkEmpty(), { mulch: MULCH_HELD_CEILING }))'));

console.log('\n--- the page ---');
reset();
rich(30);
run('navigateTo("market");');
check('the Market is a page of its own', $('page-market').classList.contains('hidden'), false);
check('the Greenhouse is not shown', $('page-greenhouse').classList.contains('hidden'), true);
check('it can be linked to', run('NAV_HASH_PAGES.indexOf("market") !== -1'), true);
check('it is in the menu', !!win.document.querySelector('.nav-plank[data-page="market"]'), true);
const mc = () => $('marketContent');
check('it shows the balance', mc().querySelector('.rw-balance strong').textContent, '30');
mc().querySelector('[data-mk-act="buy"]').click();
check('the first tap only arms the purchase', run('mkState().mulch'), 0);
check('and says so', mc().querySelector('[data-mk-act="buy"]').textContent, 'Tap again to buy');
mc().querySelector('[data-mk-act="buy"]').click();
check('the second buys it', run('mkState().mulch'), 1);
check('for 25', run('wallet.bal'), 5);
mc().querySelector('[data-mk-days="3"]').click();
mc().querySelector('[data-mk-from="tomorrow"]').click();
mc().querySelector('[data-mk-act="startpause"]').click();
check('the pause controls start one', run('!!mkState().pause && mkState().pause.from === shiftDate(getTodayString(), 1)'), true);
check('for the length picked', run('mkState().pause.to === shiftDate(getTodayString(), 3)'), true);
check('and the page says when', mc().querySelector('.mk-status').textContent.indexOf('Pause starts') === 0, true);
mc().querySelector('[data-mk-act="endpause"]').click();
check('it can be cancelled from there', run('mkState().pause'), null);
mc().querySelector('[data-mk-go="greenhouse"]').click();
check('Decorate leads to the Greenhouse', run('currentPage'), 'greenhouse');
check('which links back to the Market', !!$('dewBalance').querySelector('.mk-gh-link'), true);
$('dewBalance').querySelector('.mk-gh-link').click();
check('and the link works', run('currentPage'), 'market');

console.log('\n--- export ---');
run('mkWrapExport();');
check('the data export carries the Market', run('typeof buildAccountExport().dew.market.mulch_held'), 'number');

console.log(fail.length ? `\n${fail.length} FAILURE(S):\n` + fail.join('\n') : '\nall passed');
process.exit(fail.length ? 1 : 0);
