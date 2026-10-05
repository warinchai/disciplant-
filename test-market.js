// Market (18-market.js): buying Mulch, logging yesterday with it (the
// only way now - it wraps 17), Fertilizer, the wallet invariant the security rules
// rely on, saving, and the Greenhouse's two tabs.
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
run('var realSaveData = saveData; saveData = function () {};');
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
const MULCH = run('MULCH_PRICE');
const FERT  = run('FERT_PRICE');
function rich(n) { run(`wallet.bal = ${n}; wallet.earned = ${n}; wallet.spent = 0;`); }
const inv = () => run('wallet.bal === wallet.earned - wallet.spent');
const YY = 'shiftDate(getTodayString(), -1)';
const TICK = run('DEW_HABIT_TICK');   // Dew per habit tick, read from 15

console.log('\n--- buying Mulch ---');
reset();
check('a new garden holds none', run('mkState().mulch'), 0);
check('it cannot be bought without the Dew', run('mkBuyMulch()'), false);
rich(60);
check('with 60 Dew it can', run('mkBuyMulch()'), true);
check('boosters are cheap: Mulch 15, Fertilizer 20', [MULCH, FERT], [15, 20]);
check('it costs its price', run('wallet.bal'), 60 - MULCH);
check('counted as spent', run('wallet.spent'), MULCH);
check('and the balance still adds up', inv(), true);
check('one in the shed', run('mkState().mulch'), 1);
run('mkBuyMulch();');
check('a second', run('mkState().mulch'), 2);
rich(100); run('wallet.mk.mulch = 9;');
check('up to ten', run('mkBuyMulch() && mkState().mulch'), 10);
check('but never an eleventh', run('mkBuyMulch()'), false);

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
check('the tick Dew is paid as usual', run('wallet.bal'), TICK);
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
check('it goes to the Greenhouse', run('currentPage'), 'greenhouse');
check('on the Booster tab', $('ghBooster').classList.contains('hidden'), false);

console.log('\n--- the Booster Market lists the plants ---');
reset();
run(habit(1, [-3, -2]));
run(habit(2, [-1]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1; lastResetDate = getTodayString(); navigateTo('market');`);
const gb = () => $('ghBooster');
const mulchCard = () => gb().querySelector('.bm-card');
check('only the habit not ticked yesterday is listed', mulchCard().querySelectorAll('.bm-row').length, 1);
gb().querySelector('.bm-row [data-yd-act="fix"]').click();
check('Use Mulch there logs it', run(`histGet(tasks[0].history, ${YY})`), true);
check('and it stays listed with Undo', !!gb().querySelector('.bm-row [data-yd-act="undo"]'), true);
gb().querySelector('.bm-row [data-yd-act="undo"]').click();
check('which works from there', run('mkState().mulch'), 1);
reset();
run(`navigateTo('market');`);
check('with nothing to log it says so', !!gb().querySelector('.bm-empty'), true);

console.log('\n--- Pause is gone ---');
reset();
run(habit(1, [-2], { streak: 1, maxStreak: 1 }));
check('an old pause on the document is dropped on load',
  run('"pause" in mkNormalize({ mulch: 0, pause: { from: getTodayString(), to: shiftDate(getTodayString(), 6) } })'), false);
run('wallet = dewNormalizeWallet({ bal: 0, earned: 0, spent: 0, mk: { pause: { from: getTodayString(), to: shiftDate(getTodayString(), 6) } } });');
check('so habits are due again today', run('isScheduledOn(tasks[0], getTodayString())'), true);
check('and nothing called Pause is sold', run('typeof mkStartPause'), 'undefined');

console.log('\n--- Fertilizer ---');
reset(); rich(100);
run(habit(1, [-3, -2]));
check('none held to begin with', run('mkState().fz'), 0);
check('a plant cannot be fed without a bag', run('mkUseFert(1)'), false);
check('a bag can be bought', run('mkBuyFert()'), true);
check('for its price', run('wallet.bal'), 100 - FERT);
check('and the balance still adds up', inv(), true);
run('mkBuyFert();');
check('a second', run('mkState().fz'), 2);
rich(100); run('wallet.mk.fz = 9;');
check('up to ten', run('mkBuyFert() && mkState().fz'), 10);
check('but never an eleventh', run('mkBuyFert()'), false);

run('mkUseFert(1);');
check('feeding uses a bag', run('mkState().fz'), 9);
check('the plant is fed from today', run('mkFedToday(tasks[0])'), true);
check('for seven days', run('mkFedWeek(tasks[0], getTodayString()).t === shiftDate(getTodayString(), 6)'), true);
check('and not on the eighth', run('growthBonusOn(tasks[0], shiftDate(getTodayString(), 7))'), 0);
check('feeding by itself grows nothing', run('tasks[0].totalGrowthDays'), 2);
run('toggleTask(1, true);');
check('a Steady tick on it grows 1.25', run('tasks[0].totalGrowthDays'), 3.25);
run('setTaskEffort(tasks[0], 3);');
check('All out grows 2.25', run('tasks[0].totalGrowthDays'), 4.25);
check('the 7-day gain counts the bonus', run('recentGrowthPoints(tasks[0], 7, true)'), 4.25);
check('the growth chart ends on the plant and walks it back exactly',
  run('var g = buildGrowthSeries(tasks[0], 7); [g[g.length - 1].days, g[g.length - 2].days]'), [4.25, 2]);
check('show today\'s growth hides the fed amount', run('growthEarnedToday(tasks[0])'), 2.25);
run('toggleTask(1, false);');
check('unticking takes back exactly what it gave', run('tasks[0].totalGrowthDays'), 2);
check('one plant cannot take two bags at once', run('mkUseFert(1)'), false);
check('the Tasks page says it is fed', run('tpRowMeta(tasks[0])[0].text.indexOf("Fertilized until") === 0'), true);

reset();
run(habit(1, [-2]));
run('wallet.mk = mkEmpty(); wallet.mk.fz = 1; toggleTask(1, true);');
check('ticked first: an ordinary day', run('tasks[0].totalGrowthDays'), 2);
run('mkUseFert(1);');
check('feeding afterwards tops today\'s tick up', run('tasks[0].totalGrowthDays'), 2.25);
run('mkUndoFert(1);');
check('undo takes the top-up back', run('tasks[0].totalGrowthDays'), 2);
check('and the bag', run('mkState().fz'), 1);
check('and the plant is no longer fed', run('mkFedToday(tasks[0])'), false);
run('mkUseFert(1); wallet.mk.fuse.d = shiftDate(getTodayString(), -1);');
check('a bag put on another day cannot be undone', run('mkUndoFert(1)'), false);

reset();
run(`(function () { var a = makeTask(1, 'Essay', 'education'); setTaskKind(a, 'once'); setTaskImpact(a, 3);
      tasks.push(a); delete wallet.born['1']; })();`);
run('wallet.mk = mkEmpty(); wallet.mk.fz = 1; mkUseFert(1); toggleTask(1, true);');
check('an assignment can be fed too: Medium grows 3.75', run('tasks[0].totalGrowthDays'), 3.75);

reset();
run(habit(1, [-3, -2]));
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 1;
     wallet.mk.fert = { "1": [{ f: ${YY}, t: shiftDate(getTodayString(), 5) }] }; lastResetDate = getTodayString();`);
run('ydFix(1, EFFORT_DEFAULT);');
check('a day logged late with Mulch inside a fed week is fed too', run('tasks[0].totalGrowthDays'), 3.25);

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
run(`wallet.mk = mkEmpty(); wallet.mk.mulch = 2; wallet.mk.fz = 1;
     wallet.mk.cov = { "1": [shiftDate(getTodayString(), -3)], "99": [shiftDate(getTodayString(), -3)] };
     wallet.mk.fert = { "1": [{ f: getTodayString(), t: shiftDate(getTodayString(), 6) }], "99": [{ f: getTodayString(), t: shiftDate(getTodayString(), 6) }] };`);
const saved = JSON.parse(run('JSON.stringify(dewWalletPayload().mk)'));
check('what is held is saved', [saved.mulch, saved.fz], [2, 1]);
check('a Mulched day is saved', Object.keys(saved.cov), ['1']);
check('a fed week is saved', Object.keys(saved.fert), ['1']);
check('a plant since dug up is dropped', [saved.cov['99'], saved.fert['99']], [undefined, undefined]);
run('wallet = dewNormalizeWallet(JSON.parse(JSON.stringify(dewWalletPayload())));');
check('and it all survives a reload', run('mkState().mulch === 2 && mkState().fz === 1 && mkFedToday(tasks[0])'), true);
check('nonsense on the document becomes nothing',
  run('JSON.stringify(mkNormalize({ mulch: 999, fz: 999, cov: { x: ["nope"] }, fert: { "1": [{ f: "2026-01-01", t: "2027-01-01" }] } }))'),
  run('JSON.stringify(Object.assign(mkEmpty(), { mulch: MULCH_HELD_CEILING, fz: FERT_HELD_CEILING }))'));

// HOW THE GARDEN IS WRITTEN. Two bugs live here, so it is pinned.
//   merge:true merges DEEP: a key the wallet left out stayed in the
//     stored document, so an ended Pause came straight back.
//   set() with mergeFields fixed that and broke every save: naming the
//     increment-transformed rlCount in the field mask clears it before
//     the increment runs, so it always wrote 1, and the rules' "old + 1"
//     refused every save but the one that opened each 10-minute window.
// Both confirmed on the Firestore emulator with the live rules. An
// existing garden is now written with update() (each field replaced
// whole, increments applied to the stored value); only creating one
// uses set(merge:true), where nothing is stored to linger.
reset();
run(`var gardenWrites = [];
     db = { collection: function () { return { doc: function () { return {
       set: function (data, opts) { gardenWrites.push({ how: 'set', data: data, opts: opts }); return { catch: function () {} }; },
       update: function (data) { gardenWrites.push({ how: 'update', data: data }); return { catch: function () {} }; }
     }; } }; } };
     currentUserId = 'u1';`);
run('gardenDocExists = true; lastSaveAt = 0; realSaveData();');
check('an existing garden is written with update()', run('gardenWrites[0].how'), 'update');
check('never with mergeFields', run('JSON.stringify(gardenWrites[0].opts || {})'), '{}');
check('the wallet is sent whole', run('!!gardenWrites[0].data.wallet && !!gardenWrites[0].data.wallet.mk'), true);
run('gardenWrites = []; gardenDocExists = false; lastSaveAt = 0; realSaveData();');
check('a garden that does not exist yet is created with set(merge:true)',
  run('gardenWrites[0].how + " " + JSON.stringify(gardenWrites[0].opts)'), 'set {"merge":true}');

console.log('\n--- one Greenhouse, two markets ---');
reset();
rich(30);
run('navigateTo("greenhouse");');
check('the Greenhouse has two tabs', win.document.querySelectorAll('#ghTabs [data-gh-tab]').length, 2);
check('named for the two markets', Array.from(win.document.querySelectorAll('#ghTabs .gh-tab-name')).map(e => e.textContent),
  ['Decoration Market', 'Booster Market']);
check('it opens on Decoration', $('ghTabDecor').getAttribute('aria-selected'), 'true');
check('which holds the plants and landscapes', !!$('ghDecor').querySelector('#greenhouseGrid') && !!$('ghDecor').querySelector('#landscapePicker'), true);
check('the Booster panel is hidden', $('ghBooster').classList.contains('hidden'), true);
check('the Dew balance sits above both tabs', $('dewBalance').nextElementSibling === $('ghTabs'), true);
$('ghTabBoost').click();
check('the Booster tab switches over', $('ghBooster').classList.contains('hidden'), false);
check('and hides Decoration', $('ghDecor').classList.contains('hidden'), true);
check('and is marked as chosen', $('ghTabBoost').getAttribute('aria-selected'), 'true');
check('it sells Mulch and Fertilizer', Array.from(gb().querySelectorAll('.bm-name h3')).map(e => e.textContent), ['Mulch', 'Fertilizer']);
check('there is no Market page any more', $('page-market'), null);
check('nor a Market plank in the menu', win.document.querySelector('.nav-plank[data-page="market"]'), null);
run('navigateTo("home"); ghTab = "decor"; navigateTo("market");');
check('the old Market address opens the Greenhouse', run('currentPage'), 'greenhouse');
check('on the Booster tab', $('ghBooster').classList.contains('hidden'), false);
check('it can still be linked to', run('NAV_HASH_PAGES.indexOf("market") !== -1'), true);

gb().querySelector('[data-mk-item="mulch"]').click();
check('the first tap only arms the purchase', run('mkState().mulch'), 0);
check('and says so', gb().querySelector('[data-mk-item="mulch"]').textContent, 'Tap again to buy');
check('without arming the other item', gb().querySelector('[data-mk-item="fert"]').textContent.indexOf('Buy for') === 0, true);
gb().querySelector('[data-mk-item="mulch"]').click();
check('the second buys it', run('mkState().mulch'), 1);
check('for its price', run('wallet.bal'), 30 - MULCH);
check('the balance above the tabs follows', $('dewBalance').querySelector('.dew-balance-amount').textContent, String(30 - MULCH));
rich(80);
run('tasks = []; nextId = 1;');
run(habit(1, [-2]));
run('renderGreenhouse();');
gb().querySelector('[data-mk-item="fert"]').click();
gb().querySelector('[data-mk-item="fert"]').click();
check('Fertilizer buys the same way', run('mkState().fz'), 1);
check('the plant list offers Feed', !!gb().querySelector('[data-mk-act="feed"]'), true);
gb().querySelector('[data-mk-act="feed"]').click();
check('Feed feeds it', run('mkFedToday(tasks[0])'), true);
check('the row says so, with Undo', !!gb().querySelector('.bm-row.is-fed [data-mk-act="unfeed"]'), true);
gb().querySelector('[data-mk-act="unfeed"]').click();
check('and Undo works from there', run('mkFedToday(tasks[0])'), false);
$('ghTabDecor').click();
check('and Decoration is one tap back', $('ghDecor').classList.contains('hidden'), false);

console.log('\n--- export ---');
run('mkWrapExport();');
check('the data export carries the Market', run('typeof buildAccountExport().dew.market.mulch_held'), 'number');
check('including Fertilizer', run('typeof buildAccountExport().dew.market.fertilizer_held'), 'number');

console.log(fail.length ? `\n${fail.length} FAILURE(S):\n` + fail.join('\n') : '\nall passed');
process.exit(fail.length ? 1 : 0);
