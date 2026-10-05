// Dew (15-wallet.js): earning, refunds, the daily cap, streak
// milestones, buying skins and landscapes, and the two-tap shop tile.
// Same jsdom + Firebase-stub harness as test-impact.js.
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
                 '10-account-data.js', '15-wallet.js']) runScript(fs.readFileSync(f, 'utf8'), f);

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

// A fresh wallet, and an assignment old enough to pay. makeTask()
// records a birth time, so every fixture clears it to stand in for
// "created more than ten minutes ago".
function freshAssignment(id, impact) {
  return `
    (function () {
      var a = makeTask(${id}, 'Essay ${id}', 'education');
      setTaskKind(a, 'once');
      setTaskImpact(a, ${impact});
      tasks.push(a);
      delete wallet.born['${id}'];
    })();`;
}
function reset() { run('tasks = []; nextId = 1; wallet = dewEmptyWallet();'); }

console.log('\n--- earning from assignments ---');
reset();
check('a new wallet is empty', run('wallet.bal'), 0);
run(freshAssignment(1, 3));
run('toggleTask(1, true);');
check('finishing a Medium assignment pays 3', run('wallet.bal'), 3);
check('it counts towards today', run('wallet.today'), 3);
check('and is remembered for the refund', run('wallet.paid["1"]'), 3);
run('toggleTask(1, false);');
check('unticking the same day refunds it', run('wallet.bal'), 0);
check('and gives the daily room back', run('wallet.today'), 0);
check('and forgets the payment', run('wallet.paid["1"]'), undefined);

reset();
run(`var y = makeTask(1, 'Quick', 'education'); setTaskKind(y, 'once'); setTaskImpact(y, 14); tasks.push(y);`);
run('toggleTask(1, true);');
check('an assignment created moments ago pays nothing', run('wallet.bal'), 0);
check('but it still grows the plant', run('tasks[0].totalGrowthDays'), 14);

reset();
run(freshAssignment(1, 14) + freshAssignment(2, 14) + freshAssignment(3, 1));
run('toggleTask(1, true); toggleTask(2, true); toggleTask(3, true);');
check('the daily cap holds at 25', run('wallet.bal'), 25);
check('the second Major was paid only up to the cap', run('wallet.paid["2"]'), 11);
check('and the third paid nothing', run('wallet.paid["3"]'), undefined);
run('toggleTask(2, false);');
check('refunding the capped one returns what it was actually paid', run('wallet.bal'), 14);
check('and frees exactly that much room', run('wallet.today'), 14);

console.log('\n--- steps, re-rating, banking ---');
reset();
run(freshAssignment(1, 7));
run('addSubtask(tasks[0], "Method"); addSubtask(tasks[0], "Results"); toggleSubtask(tasks[0], 1); toggleTask(1, true);');
check('a manual tick with steps open pays nothing', run('wallet.bal'), 0);
run('toggleSubtask(tasks[0], 2);');
check('finishing the last step pays in full', run('wallet.bal'), 7);
run('toggleSubtask(tasks[0], 2);');
check('reopening a step takes it back', run('wallet.bal'), 0);
check('nothing is left on the books', run('wallet.paid["1"]'), undefined);

reset();
run(freshAssignment(1, 1));
run('toggleTask(1, true); setTaskImpact(tasks[0], 7);');
check('re-rating a live tick tops the payout up', run('wallet.bal'), 7);
run('setTaskImpact(tasks[0], 3);');
check('and down', run('wallet.bal'), 3);

reset();
run(freshAssignment(1, 3));
run('toggleTask(1, true); tasks[0].doneAt = shiftDate(getTodayString(), -1); wallet.day = shiftDate(getTodayString(), -1);');
run('toggleTask(1, false);');
check('a tick from an earlier day is banked', run('wallet.bal'), 3);
check('and a new day starts with a fresh cap', run('dewRollDay(); wallet.today'), 0);

console.log('\n--- habit ticks ---');
// Read from the file rather than written in, so retuning the numbers
// (3 a tick and 30 a day since 6 Oct 2026; 1 and 10 before) does not
// mean rewriting every check below.
const TICK = run('DEW_HABIT_TICK');
const HCAP = run('DEW_HABIT_DAILY_CAP');
check('a habit tick pays 3', TICK, 3);
check('up to 30 a day from habits - ten habits', HCAP, 30);
reset();
run(`tasks = [makeTask(1, 'Read', 'education')];`);
run('toggleTask(1, true);');
check('every habit tick pays its tick', run('wallet.bal'), TICK);
check('on its own counter', run('[wallet.htoday, wallet.today]'), [TICK, 0]);
run('toggleTask(1, false);');
check('unticking takes it back', run('wallet.bal'), 0);
check('and frees the room', run('wallet.htoday'), 0);
run('toggleTask(1, true); tasks[0].completed = false; toggleTask(1, true);');
check('one tick\'s worth per habit per day', run('wallet.bal'), TICK);
reset();
run('for (var i = 1; i <= 12; i++) tasks.push(makeTask(i, "H" + i, "education"));');
run('for (var j = 1; j <= 12; j++) toggleTask(j, true);');
check('habit ticks stop at their daily cap', run('wallet.bal'), HCAP);
run(freshAssignment(20, 7));
run('toggleTask(20, true);');
check('and never crowd out an assignment', run('wallet.bal'), HCAP + 7);
reset();
run(`tasks = [makeTask(1, 'Read', 'education')]; toggleTask(1, true); setTaskKind(tasks[0], 'once');`);
check('turning a ticked habit into an assignment hands its tick Dew back', run('wallet.bal'), 0);

console.log('\n--- habit milestones ---');
reset();
run(`var h = makeTask(1, 'Read', 'education'); h.streak = 6; h.maxStreak = 6; tasks.push(h);`);
run('toggleTask(1, true);');
check('reaching a 7-day streak pays 3 on top of the tick', run('wallet.bal'), TICK + 3);
check('milestones use neither daily cap', run('[wallet.htoday, wallet.today]'), [TICK, 0]);
run('toggleTask(1, false); toggleTask(1, true);');
check('re-ticking the same day does not pay the milestone twice', run('wallet.bal'), TICK + 3);
run('tasks[0].streak = 0; tasks[0].maxStreak = 7;');
for (let i = 0; i < 7; i++) run('tasks[0].completed = false; toggleTask(1, true);');
check('rebuilding to 7 after a break pays nothing new', run('wallet.bal'), TICK + 3);
run('tasks[0].streak = 29; tasks[0].maxStreak = 29; tasks[0].completed = false; toggleTask(1, true);');
check('30 days pays 10', run('wallet.bal'), TICK + 3 + 10);

console.log('\n--- buying plant skins ---');
// Prices read from 15, so retuning them changes no check below. The
// numbers themselves are pinned once, here.
const SKIN1 = run('DEW_PLANT_PRICES[1]');
const SKIN4 = run('DEW_PLANT_PRICES[4]');
const CANDY = run('DEW_GARDEN_PRICES.candy');
check('skins cost 50 / 75 / 100 / 150 by slot', run('DEW_PLANT_PRICES.slice(1)'), [50, 75, 100, 150]);
check('landscapes cost 150 and 250', run('[DEW_GARDEN_PRICES.candy, DEW_GARDEN_PRICES.beach, DEW_GARDEN_PRICES.volcanic, DEW_GARDEN_PRICES.mars]'), [150, 150, 250, 250]);
reset();
run(`tasks = [makeTask(1, 'Read', 'education'), makeTask(2, 'Study', 'education')];`);
check('gold oak is locked with no friends', run('isSkinUnlocked(tasks[0], "education", "aurelian")'), false);
check('and priced at slot 1', run('getSkinUnlockState(tasks[0], "education", "aurelian").price'), SKIN1);
check('the requirement mentions both routes',
  run('skinUnlockRequirement(getSkinUnlockState(tasks[0], "education", "aurelian"))').endsWith('or ' + SKIN1 + ' Dew'), true);
check('cannot buy without the Dew', run('dewBuyPlantSkin(tasks[0], "aurelian")'), false);
run('wallet.bal = ' + (SKIN1 + 70) + ';');
check('can buy with it', run('dewBuyPlantSkin(tasks[0], "aurelian")'), true);
check('it costs its price', run('wallet.bal'), 70);
check('and is worn straight away', run('getTaskSkinId(tasks[0])'), 'aurelian');
check('it unlocks for every oak', run('isSkinUnlocked(tasks[1], "education", "aurelian")'), true);
check('buying it twice is refused', run('dewBuyPlantSkin(tasks[1], "aurelian")'), false);
check('and charges nothing', run('wallet.bal'), 70);
run('tasks[0].maxGrowthDays = 30;');
check('an earned skin is never sold', run('dewBuyPlantSkin(tasks[0], "nebulark")'), false);
check('the classic skin is free and never sold', run('getSkinUnlockState(tasks[0], "education", "classic").price'), 0);

console.log('\n--- buying landscapes ---');
reset();
run('gardenSkinId = null;');
check('meadow stays free', run('isGardenSkinUnlocked("meadow")'), true);
check('candy is now locked', run('isGardenSkinUnlocked("candy")'), false);
check('it says what it costs', run('gardenSkinUnlockRequirement(getGardenSkinUnlockState("candy"))'), CANDY + ' Dew');
run('gardenSkinId = "candy";');
check('a locked landscape is never worn', run('getActiveGardenSkinId()'), 'meadow');
run('wallet.bal = ' + (CANDY + 20) + '; dewBuyGardenSkin("candy");');
check('buying it equips it', run('getActiveGardenSkinId()'), 'candy');
check('and costs its price', run('wallet.bal'), 20);

console.log('\n--- loading and saving ---');
run('dewLoadFromDoc({ gardenSkinId: "beach" });');
check('a landscape picked before Dew is kept', run('dewOwns("g:beach")'), true);
run('dewLoadFromDoc({ gardenSkinId: "beach", wallet: { bal: 5 } });');
check('but only on the first load', run('dewOwns("g:beach")'), false);
run('dewLoadFromDoc(null);');
check('a brand new garden starts empty', run('wallet.bal'), 0);
run('dewLoadFromDoc({ wallet: { bal: "lots", earned: -4, today: 999, owned: ["p:education:aurelian", 7, "<x>", "p:education:aurelian"], paid: { "1": 3, "x": 9 } } });');
check('junk balance reads as zero', run('wallet.bal'), 0);
check('negative lifetime totals clamp', run('wallet.earned'), 0);
check('owned keeps only well-formed keys, once', run('wallet.owned'), ['p:education:aurelian']);
run('wallet = dewEmptyWallet(); wallet.bal = 4; wallet.owned = ["g:mars"];');
const payload = run('JSON.stringify(dewWalletPayload())');
check('the payload leaves out empty maps', JSON.parse(payload).paid, undefined);
check('and carries what was bought', JSON.parse(payload).owned, ['g:mars']);

console.log('\n--- the account export ---');
run('wallet = dewEmptyWallet(); wallet.bal = 9; wallet.owned = ["g:mars", "p:education:aurelian"];');
check('the export carries the balance', run('buildAccountExport().dew.balance'), 9);
check('and what was bought', run('JSON.stringify(buildAccountExport().dew.owned)'),
  JSON.stringify([{ kind: 'landscape', id: 'mars' }, { kind: 'plant skin', category: 'education', id: 'aurelian' }]));

console.log('\n--- spending then refunding ---');
reset();
run(freshAssignment(1, 7));
run('toggleTask(1, true); wallet.bal -= 7; wallet.spent += 7; toggleTask(1, false);');
check('a refund after spending goes negative rather than undoing a purchase', run('wallet.bal'), -7);
check('and nothing can be bought below zero', run('dewSpend("g:mars", 150)'), false);

console.log('\n--- habit flipped to an assignment ---');
reset();
run(`var f = makeTask(1, 'Thing', 'education'); delete wallet.born['1']; tasks.push(f); setTaskKind(f, 'once'); setTaskImpact(f, 14); toggleTask(1, true);`);
check('switching kind restarts the ten-minute clock', run('wallet.bal'), 0);

console.log('\n--- the shop tile ---');
reset();
run(`tasks = [makeTask(1, 'Read', 'education')]; wallet.bal = ${SKIN1 + 20}; currentPage = 'greenhouse'; greenhouseOpenTaskId = 1; renderGreenhouse();`);
const tileSel = '#skin-drawer-1 .skin-tile[data-skin-id="aurelian"]';
check('a locked tile becomes a shop tile', run(`document.querySelector('${tileSel}').classList.contains('dew-shop')`), true);
check('and is clickable', run(`document.querySelector('${tileSel}').disabled`), false);
check('showing its price', run(`document.querySelector('${tileSel} .dew-price').textContent`), String(SKIN1));
run(`document.querySelector('${tileSel}').click();`);
check('the first tap only arms it', run('wallet.bal'), SKIN1 + 20);
check('and says so', run(`document.querySelector('${tileSel}').classList.contains('dew-armed')`), true);
run(`document.querySelector('${tileSel}').click();`);
check('the second tap buys it', run('wallet.bal'), 20);
check('and puts it on', run('getTaskSkinId(tasks[0])'), 'aurelian');
check('the Greenhouse shows the balance', run(`document.querySelector('#dewBalance .dew-balance-amount').textContent`), '20');
run(`document.querySelector('${'#skin-drawer-1 .skin-tile[data-skin-id="nebulark"]'}').click();`);
check('arming one you cannot afford says how short you are',
  run(`document.querySelector('#skin-drawer-1 .skin-tile[data-skin-id="nebulark"] .dew-price-note').textContent`), 'Need ' + (SKIN4 - 20) + ' more Dew');
run(`document.querySelector('#skin-drawer-1 .skin-tile[data-skin-id="nebulark"]').click();`);
check('and a second tap still spends nothing', run('wallet.bal'), 20);
run(`document.querySelector('#landscapePicker .skin-tile[data-garden-skin-id="candy"]').click();`);
check('landscape tiles are shop tiles too',
  run(`document.querySelector('#landscapePicker .skin-tile[data-garden-skin-id="candy"]').classList.contains('dew-armed')`), true);

console.log('\n--- the pill ---');
reset();
run('wallet.bal = 42; authReady = true; currentPage = "garden"; updateDewPill();');
check('the garden shows the balance', run(`document.querySelector('#dewPill .dew-pill-amount').textContent`), '42');
check('and it is visible', run(`document.getElementById('dewPill').classList.contains('hidden')`), false);
run('wallet.bal = 45; updateDewPill();');
check('it bumps when Dew comes in', run(`document.getElementById('dewPill').classList.contains('is-bump')`), true);
run('currentPage = "home"; updateDewPill();');
check('it is not on the home page', run(`document.getElementById('dewPill').classList.contains('hidden')`), true);
run('currentPage = "garden"; updateDewPill(); document.getElementById("dewPill").click();');
check('tapping it opens the Greenhouse', run('currentPage'), 'greenhouse');

console.log(fail.length ? `\n${fail.length} FAILED:\n` + fail.join('\n') : '\nall passed');
process.exit(fail.length ? 1 : 0);
