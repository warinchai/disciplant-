// Reloading on a page other than Home. A refresh on #stats or
// #greenhouse used to leave the page empty until you went Home and
// back: the first garden snapshot rendered BEFORE authReady was set,
// and those pages only draw once it is. This drives the real load
// order - deep-link navigation, then sign-in, then the first snapshot -
// with Firebase stubbed so the callbacks can be fired by hand.
const fs = require('fs');
const { JSDOM } = require('jsdom');

function load(hash) {
  const html = fs.readFileSync('index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
                                url: 'https://disciplant.com/' + hash });
  const win = dom.window;
  const noop = () => {};
  const thenable = { then: (f) => { f && f({}); return thenable; }, catch: () => thenable };
  const hooks = { token: null, garden: null };

  function docStub(path) {
    return {
      set: () => thenable, update: () => thenable, get: () => thenable, delete: () => thenable,
      collection: () => collStub(),
      onSnapshot: (cb) => { if (path === 'gardens') hooks.garden = cb; return noop; },
    };
  }
  function collStub(name) {
    return { doc: () => docStub(name), where: () => collStub(name), get: () => thenable, onSnapshot: () => noop };
  }
  win.firebase = {
    apps: [], app: () => ({ options: { authDomain: 'disciplant.com' } }), initializeApp: noop,
    auth: Object.assign(() => ({
      onAuthStateChanged: () => noop, signInAnonymously: () => thenable, signOut: () => thenable,
      getRedirectResult: () => thenable, setPersistence: () => thenable, currentUser: null,
      onIdTokenChanged: (cb) => { hooks.token = cb; return noop; },
    }), { GoogleAuthProvider: function () { this.setCustomParameters = noop; } }),
    firestore: Object.assign(() => ({ collection: collStub, doc: docStub,
      batch: () => ({ set: noop, update: noop, delete: noop, commit: () => thenable }) }),
      { FieldValue: { serverTimestamp: () => 'TS', increment: (n) => n, delete: () => 'DEL', arrayUnion: noop, arrayRemove: noop },
        Timestamp: { now: () => ({ toMillis: () => Date.now() }) } }),
  };
  win.gtag = noop; win.dataLayer = [];
  win.console.error = noop;

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
  win.eval('saveData = function () {};');

  // The real order: every script is in, the deep link navigates, then
  // Firebase restores the session, then the garden document arrives.
  win.document.dispatchEvent(new win.Event('DOMContentLoaded'));
  hooks.token({ uid: 'u1', isAnonymous: true, displayName: null, email: null, photoURL: null, providerData: [] });
  hooks.garden({
    exists: true,
    data: () => ({
      tasks: [{ id: 1, text: 'Read 10 pages', categoryId: 'education', history: {}, totalGrowthDays: 3 },
              { id: 2, text: 'Walk', categoryId: 'exercise', history: {}, totalGrowthDays: 1 }],
      lastResetDate: win.eval('getTodayString()'),
      wallet: { bal: 12, earned: 12, spent: 0 },
    }),
  });
  return win;
}

const fail = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fail.push(`${label}\n     got:      ${JSON.stringify(actual)}\n     expected: ${JSON.stringify(expected)}`);
  console.log((ok ? '  ok   ' : '  FAIL ') + label);
}

console.log('\n--- reload on the Greenhouse ---');
let w = load('#greenhouse');
check('it is the page showing', w.eval('currentPage'), 'greenhouse');
check('the loading text is gone', w.document.getElementById('greenhouseLoadingState').classList.contains('hidden'), true);
check('the plants are drawn without leaving the page', w.document.querySelectorAll('#greenhouseGrid .plant-card').length, 2);
check('and the markets with them', !!w.document.getElementById('ghTabs'), true);
const balEl = w.document.querySelector('#dewBalance .dew-balance-amount');
check('the Dew balance too', balEl && balEl.textContent, '12');

console.log('\n--- reload on Stats ---');
w = load('#stats');
check('it is the page showing', w.eval('currentPage'), 'stats');
check('the loading text is gone', w.document.getElementById('statsLoadingState').classList.contains('hidden'), true);
check('the yearly heatmap is drawn', w.document.getElementById('statsOverallHeatmap').children.length > 0, true);
check('the view picker lists the plants', w.document.querySelectorAll('#statsViewSelect option').length > 1, true);

console.log('\n--- reload on Rewards ---');
w = load('#rewards');
check('it is the page showing', w.eval('currentPage'), 'rewards');
check('the rewards are drawn', !!w.document.querySelector('#rewardsContent .rw-board'), true);
check('and shown', w.document.getElementById('rewardsContent').classList.contains('hidden'), false);

console.log('\n--- reload on Tasks, which always worked ---');
w = load('#tasks');
check('the task list is drawn', w.document.querySelectorAll('#tpSections .tp-row').length, 2);

console.log(fail.length ? `\n${fail.length} FAILURE(S):\n` + fail.join('\n') : '\nall passed');
process.exit(fail.length ? 1 : 0);
