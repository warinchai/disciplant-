// Boots the app in jsdom the way test-app.js does, then drives
// classifyDenial() against every shape of failure the write paths in
// 02-auth-tasks.js can see.
//
// The bug this guards: App Check enforcement and the rate-limit rules
// both reject with 'permission-denied', so for a long while a broken
// attestation token was reported as "you have hit the write limit"
// and retried three times for nothing.
const fs = require('fs');
const { JSDOM } = require('jsdom');

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

runScript('var db = firebase.firestore(); var auth = firebase.auth();', 'config');

const files = ['01-app-core.js', '02-auth-tasks.js', '03-plant-art.js', '04-garden-scene.js',
               '05-stats-app.js', '06-friends.js', '07-friend-garden.js', '12-tasks-page.js',
               '10-account-data.js'];
for (const f of files) runScript(fs.readFileSync(f, 'utf8'), f);
console.log('all files loaded, no throw');

const run = (code) => win.eval(code);
const fail = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fail.push(`${label}\n     got:      ${JSON.stringify(actual)}\n     expected: ${JSON.stringify(expected)}`);
  console.log((ok ? '  ok   ' : '  FAIL ') + label);
}

run('authReady = true;');

// ---- Harness -------------------------------------------------
// Clears the probe cache so each case starts cold, and counts how
// many times the App Check backend was actually asked.
let getTokenCalls = 0;

function setAppCheck(behaviour) {
  getTokenCalls = 0;
  if (behaviour === 'absent') { delete win.firebase.appCheck; }
  else {
    win.firebase.appCheck = () => ({
      getToken: (force) => {
        getTokenCalls++;
        if (behaviour === 'ok')       return Promise.resolve({ token: 'attested-' + force });
        if (behaviour === 'rejects')  return Promise.reject(new Error('AppCheck: fetch failed'));
        if (behaviour === 'empty')    return Promise.resolve({});
        if (behaviour === 'throws')   { throw new Error('appCheck not activated'); }
        if (behaviour === 'notPromise') return undefined;
      },
    });
  }
  run('appCheckProbeResult = null; appCheckProbeAt = 0; appCheckProbeInFlight = null;');
}

const denied = () => ({ code: 'permission-denied' });

function classify(error) {
  return new Promise((resolve) => win.classifyDenial(error, resolve));
}

// ---- Cases ---------------------------------------------------
(async function () {
  console.log('\n--- classifying a permission-denied ---');

  setAppCheck('ok');
  check('a mintable token means the rules rejected it, not App Check',
        await classify(denied()), 'ratelimit');
  check('and the probe forced a refresh rather than trusting the cache',
        getTokenCalls, 1);

  setAppCheck('rejects');
  check('a token that will not mint is App Check, not the rate limiter',
        await classify(denied()), 'appcheck');

  setAppCheck('empty');
  check('a result with no token in it counts as failed attestation',
        await classify(denied()), 'appcheck');

  setAppCheck('throws');
  check('getToken throwing outright is failed attestation too',
        await classify(denied()), 'appcheck');

  console.log('\n--- degrading gracefully ---');

  setAppCheck('absent');
  check('no App Check on the page at all: fall back to the old reading',
        await classify(denied()), 'ratelimit');
  check('and nothing was probed',
        getTokenCalls, 0);

  setAppCheck('notPromise');
  check('a getToken that returns no promise is inconclusive, not a verdict',
        await classify(denied()), 'ratelimit');

  console.log('\n--- everything that is not a denial ---');

  setAppCheck('rejects');
  check('unavailable is passed straight through',
        await classify({ code: 'unavailable' }), 'other');
  check('so is a null error',
        await classify(null), 'other');
  check('and neither one wakes the App Check backend',
        getTokenCalls, 0);

  console.log('\n--- the probe cache ---');

  setAppCheck('rejects');
  check('first denial probes', await classify(denied()), 'appcheck');
  check('second denial reuses the answer', await classify(denied()), 'appcheck');
  check('third too', await classify(denied()), 'appcheck');
  check('so a denial storm costs exactly one round trip', getTokenCalls, 1);

  // Two denials landing together must share one in-flight probe rather
  // than each opening their own.
  setAppCheck('rejects');
  const [a, b, c] = await Promise.all([classify(denied()), classify(denied()), classify(denied())]);
  check('concurrent denials all resolve', [a, b, c], ['appcheck', 'appcheck', 'appcheck']);
  check('and share a single in-flight probe', getTokenCalls, 1);

  setAppCheck('rejects');
  await classify(denied());
  run('appCheckProbeAt = Date.now() - (APPCHECK_PROBE_TTL_MS + 1000);');
  await classify(denied());
  check('once the cache expires it probes again', getTokenCalls, 2);

  console.log('\n--- reporting ---');

  const errors = [];
  const realError = win.console.error;
  win.console.error = (...args) => errors.push(args.join(' '));
  run('appCheckFailureReported = false;');
  run("reportAppCheckFailure('the garden save');");
  run("reportAppCheckFailure('the profile write');");
  run("reportAppCheckFailure('the summary write');");
  win.console.error = realError;

  check('three failing writes produce one diagnosis, not three', errors.length, 1);
  check('which names App Check', /App Check/.test(errors[0]), true);
  check('says plainly it was not the rate limiter', /NOT by the rate limiter/.test(errors[0]), true);
  check('says retrying will not help', /retrying cannot help/.test(errors[0]), true);
  check('and points at the domain list, this being a production hostname',
        /reCAPTCHA Enterprise key domain list/.test(errors[0]), true);

  console.log('\n--- what the write paths actually do ---');

  // Drives a real write through to rejection, with the retry delays
  // collapsed to zero, and counts how many times it hit Firestore.
  // This is the bug in its original form: four writes burnt against
  // the budget for a failure no retry could ever fix.
  async function driveWrite(kind, appCheckBehaviour) {
    setAppCheck(appCheckBehaviour);
    let writes = 0;

    const rejectingDoc = {
      set: () => { writes++; return Promise.reject({ code: 'permission-denied' }); },
    };
    win.db = { collection: () => ({ doc: () => rejectingDoc }) };

    const realTimeout = win.setTimeout;
    win.setTimeout = (fn) => realTimeout(fn, 0);
    const realError = win.console.error;
    win.console.error = noop;

    run('appCheckFailureReported = false;');
    run('lastProfileSignature = "sig";');
    run('userRlStartMs = Date.now(); userRlStartIsLocal = true;');

    if (kind === 'profile') {
      win.writeUserProfileDoc('u1', { uid: 'u1' }, true);
    } else {
      run('currentUserId = "u1"; gardenSummaryWritten = false;');
      run('gardenRlStartMs = Date.now(); gardenRlStartIsLocal = true;');
      win.writeGardenSummary([], true);
    }

    await new Promise((r) => realTimeout(r, 120));
    win.setTimeout = realTimeout;
    win.console.error = realError;
    return writes;
  }

  check('a rate-limit denial still tries the other branch and backs off',
        await driveWrite('profile', 'ok'), 4);
  check('an App Check denial stops dead after the first attempt',
        await driveWrite('profile', 'rejects'), 1);
  check('and the optimistic window it recorded is taken back',
        [run('userRlStartMs'), run('userRlStartIsLocal')], [0, false]);
  check('while the signature is cleared so the next token refresh retries',
        run('lastProfileSignature'), null);

  check('the summary write retries on a rate-limit denial',
        await driveWrite('summary', 'ok'), 4);
  check('and stops dead on an App Check one',
        await driveWrite('summary', 'rejects'), 1);

  // ---- Result ------------------------------------------------
  console.log('');
  if (fail.length) {
    console.log(fail.length + ' FAILED:\n');
    fail.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('App Check classification checks passed');
  process.exit(0);
})();
