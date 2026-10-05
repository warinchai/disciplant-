// firestore.rules against a REAL Firestore emulator - the one thing the
// jsdom suites cannot check. Run it before publishing any rules change,
// and after any change to how 02 writes the garden (a set()/mergeFields
// mix-up once broke every save for a day; see ROADMAP I4).
//
// Not run by default: it needs Java and the Firebase emulator, which
// this repo does not ship. One-time setup, anywhere outside the repo:
//   npm i firebase-tools@13 firebase@10.12.0 @firebase/rules-unit-testing@3
//   (and a Java 11+ runtime on PATH)
// Then, from that folder, with this file and firestore.rules copied in:
//   RULES=firestore.rules npx firebase emulators:exec --only firestore \
//     --project demo-disciplant "node test-rules.mjs"
//
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-disciplant',
  firestore: { rules: fs.readFileSync(process.env.RULES, 'utf8'), host: '127.0.0.1', port: 8080 },
});
const FV = firebase.firestore.FieldValue;
const TS = firebase.firestore.Timestamp;
const uid = 'u1';
const today = new Date().toISOString().slice(0, 10);
const tasks = [{ id: 1, text: 'Read', categoryId: 'education', completed: true, history: {} }];

function W(over) {
  return Object.assign({ bal: 40, earned: 70, spent: 30, day: today, today: 0, htoday: 3,
    owned: ['p:education:aurelian'], rw: { life: ['first'] }, mk: { mulch: 1, fz: 1 } }, over || {});
}
async function seed(wallet) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const doc = { tasks, lastResetDate: today, gardenSkinId: 'meadow',
      rlAt: TS.fromMillis(Date.now() - 1000), rlStart: TS.fromMillis(Date.now() - 60000), rlCount: 3 };
    if (wallet !== undefined) doc.wallet = wallet;
    await ctx.firestore().collection('gardens').doc(uid).set(doc);
  });
}
async function clear() {
  await env.withSecurityRulesDisabled(async (ctx) => { await ctx.firestore().collection('gardens').doc(uid).delete(); });
}
const ref = () => env.authenticatedContext(uid).firestore().collection('gardens').doc(uid);
const save = (wallet) => {
  const p = { tasks, lastResetDate: today, gardenSkinId: 'meadow', rlAt: FV.serverTimestamp(), rlCount: FV.increment(1) };
  if (wallet !== undefined) p.wallet = wallet;
  return ref().update(p);
};

let bad = 0;
async function expect(label, should, promise) {
  try {
    await (should === 'allow' ? assertSucceeds(promise) : assertFails(promise));
    console.log('  ok    ' + label);
  } catch (e) {
    bad++;
    console.log('  WRONG ' + label + '  (expected ' + should + ') ' + String(e.message || e).split('\n')[0].slice(0, 120));
  }
}

console.log('RULES: ' + process.env.RULES);

// Honest saves: everything the app does keeps bal == earned - spent.
await seed(W()); await expect('a tick (earn 3)', 'allow', save(W({ bal: 43, earned: 73, htoday: 6 })));
await seed(W()); await expect('a same-day untick (refund 3)', 'allow', save(W({ bal: 37, earned: 67 })));
await seed(W()); await expect('buying a skin (spend 50, owned grows)', 'allow',
  save(W({ bal: -10 + 0, earned: 70, spent: 80, owned: ['p:education:aurelian', 'p:exercise:midas'] })));
await seed(W()); await expect('buying Mulch (spend 15, held 2)', 'allow', save(W({ bal: 25, spent: 45, mk: { mulch: 2, fz: 1 } })));
await seed(W()); await expect('holding 10 Mulch and 10 Fertilizer', 'allow', save(W({ mk: { mulch: 10, fz: 10 } })));
await seed(W()); await expect('a negative balance after a refund', 'allow', save(W({ bal: -5, earned: 25, spent: 30 })));
await seed(W()); await expect('a save that leaves the wallet out entirely', 'allow', save(undefined));
await seed(undefined); await expect('first wallet on an old garden, landscape grandfathered into owned', 'allow',
  save({ bal: 0, earned: 0, spent: 0, owned: ['g:beach'] }));
await seed(W()); await expect('five quick saves in a row (counter keeps climbing)', 'allow', (async () => {
  for (let i = 0; i < 5; i++) await save(W({ bal: 40 + 3 * (i + 1), earned: 70 + 3 * (i + 1) }));
})());
await clear(); await expect('creating a brand new garden with set(merge:true)', 'allow',
  ref().set({ tasks: [], lastResetDate: today, gardenSkinId: 'meadow', wallet: { bal: 0, earned: 0, spent: 0, owned: [] },
    rlAt: FV.serverTimestamp(), rlStart: FV.serverTimestamp(), rlCount: 1 }, { merge: true }));

// Cheats.
await seed(W()); await expect('editing the balance alone', 'deny', save(W({ bal: 99999 })));
await seed(W()); await expect('a balance over 99,999 even if it adds up', 'deny', save(W({ bal: 100000, earned: 100030 })));
await seed(W()); await expect('a skin added without spending', 'deny', save(W({ owned: ['p:education:aurelian', 'p:misc:xenobloom'] })));
await seed(W()); await expect('12 bags of Mulch', 'deny', save(W({ mk: { mulch: 12, fz: 0 } })));
await seed(W()); await expect('12 bags of Fertilizer', 'deny', save(W({ mk: { mulch: 0, fz: 12 } })));
await seed(W()); await expect('a negative lifetime total', 'deny', save(W({ bal: 40, earned: -10, spent: -50 })));
await seed(W()); await expect('a balance that is not a number', 'deny', save(W({ bal: 'lots' })));
await clear(); await expect('creating a garden with a forged balance', 'deny',
  ref().set({ tasks: [], lastResetDate: today, wallet: { bal: 500, earned: 0, spent: 0 },
    rlAt: FV.serverTimestamp(), rlStart: FV.serverTimestamp(), rlCount: 1 }, { merge: true }));

console.log(bad ? '\n' + bad + ' WRONG' : '\nall as expected');
await env.cleanup();
process.exit(bad ? 1 : 0);
