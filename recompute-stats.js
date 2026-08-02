// ============================================
// DISCIPLANT — recompute the public community counters
//
// THIS FILE IS NOT PART OF THE WEBSITE.
// Never upload it with the app, never load it from index.html. It
// uses the Firebase Admin SDK, which BYPASSES your security rules
// entirely — that's the whole point of it, and the reason it only
// ever runs somewhere you control.
//
// WHAT IT DOES
//   Counts /usernames, walks every /gardens document, totals things
//   up, and writes one public document: /stats/global. The home page
//   reads that document and nothing else.
//
// WHY IT EXISTS
//   /gardens and /users are owner-only by design, so the browser
//   cannot count any of this. Rather than opening those up, or
//   letting clients bump a counter they could inflate, the counting
//   happens here — server-side, by you, on purpose. Clients get
//   `allow write: if false` on /stats and can never touch it.
//
// HOW TO RUN IT (Google Cloud Shell — nothing installs on your machine)
//   1. Open the Google Cloud Console, signed in as the account that
//      owns this Firebase project.
//   2. Click the >_ terminal icon in the top toolbar.
//   3. First time only:   npm install firebase-admin
//   4. Dry run (reads only, writes NOTHING):
//                         node recompute-stats.js
//   5. When the numbers look right, write them for real:
//                         node recompute-stats.js --write
//
//   Note the default is the SAFE one. You have to ask for the write.
//
// PRIVACY NOTE
//   To count tasks it has to fetch them, so this script sees every
//   user's task text in memory. It counts and discards. It never
//   prints, stores, or publishes anything but the three totals below
//   — please keep it that way if you edit it, and don't run it while
//   screen-sharing or recording.
// ============================================

// Sub-path imports, not the old `require('firebase-admin')` namespace.
// The namespaced style (admin.firestore(), admin.firestore.FieldValue)
// is legacy and isn't reliably present in current versions of the SDK
// — on firebase-admin v13 under Node 24 it fails with
// "admin.firestore is not a function". These entry points are the
// documented modern API and work across versions.
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PROJECT_ID = 'disciplant-e3bb7';

// No key file, no credentials in this repo. In Cloud Shell (and after
// `gcloud auth application-default login` locally) the SDK picks up
// your own Google account automatically — Application Default
// Credentials. There is deliberately nothing secret in this file, so
// it's safe to commit.
initializeApp({ projectId: PROJECT_ID });

const db = getFirestore();

// Writing is opt-in. Anything other than an explicit --write is a
// read-only rehearsal, so a mistyped command can never overwrite the
// live numbers.
const WRITE = process.argv.includes('--write');


// ---- Gardeners -------------------------------------------------
// One /usernames document per person who claimed a name, so counting
// the collection IS the number. count() is an aggregation query: it
// runs server-side and bills roughly one read per 1000 documents
// rather than one per document.
//
// This deliberately does NOT count anonymous guests who never picked
// a username. Since the app signs everyone in anonymously on arrival,
// counting those would mostly count browser sessions — the same
// person in a private window is a brand new uid. "Gardeners" is the
// more honest number.
async function countGardeners() {
  const snapshot = await db.collection('usernames').count().get();
  return snapshot.data().count;
}


// ---- Habits growing and days completed -------------------------
// One pass over every garden.
//
//   habitsGrowing   = how many tasks exist right now, everywhere.
//                     NOT "habits ever created" — deleting a task
//                     erases it completely, so a lifetime total is
//                     not recoverable from the data that exists.
//                     This figure is exactly correct on every run.
//
//   habitsCompleted = the sum of every task's totalGrowthDays, which
//                     is the count of days that task has been ticked
//                     off across its whole life. So it's habit-DAYS,
//                     which is why the home page labels it "days
//                     completed" rather than "habits completed".
//
// .select('tasks') asks Firestore for just that one field, so the
// other fields never leave the database.
async function countGardens() {
  const snapshot = await db.collection('gardens').select('tasks').get();

  let gardens = 0;
  let habitsGrowing = 0;
  let habitsCompleted = 0;

  snapshot.forEach((doc) => {
    gardens++;
    const tasks = (doc.get('tasks') || []);
    if (!Array.isArray(tasks)) return;

    habitsGrowing += tasks.length;

    tasks.forEach((task) => {
      // Guard every read: one malformed task shouldn't poison the
      // total or crash a run that's otherwise fine.
      const days = task && Number(task.totalGrowthDays);
      if (Number.isFinite(days) && days > 0) habitsCompleted += Math.floor(days);
    });
  });

  return { gardens, habitsGrowing, habitsCompleted };
}


async function main() {
  console.log('DISCIPLANT — recomputing community stats');
  console.log('project: ' + PROJECT_ID);
  console.log(WRITE ? 'mode:    WRITE\n' : 'mode:    dry run (nothing will be written)\n');

  const [gardeners, gardenTotals] = await Promise.all([
    countGardeners(),
    countGardens(),
  ]);

  const stats = {
    gardeners:       gardeners,
    habitsGrowing:   gardenTotals.habitsGrowing,
    habitsCompleted: gardenTotals.habitsCompleted,
  };

  // Aggregates only. Never log a document's contents.
  console.log('gardeners (with a username): ' + stats.gardeners);
  console.log('gardens scanned:             ' + gardenTotals.gardens);
  console.log('habits growing:              ' + stats.habitsGrowing);
  console.log('days completed:              ' + stats.habitsCompleted);

  if (!WRITE) {
    console.log('\nDry run complete — nothing was written.');
    console.log('Run again with --write to publish these to stats/global.');
    return;
  }

  // generatedAt is for you, not the page: it's how you tell at a
  // glance how stale the published numbers are. It says when YOU last
  // ran this, which reveals nothing about any user.
  await db.collection('stats').doc('global').set({
    gardeners:       stats.gardeners,
    habitsGrowing:   stats.habitsGrowing,
    habitsCompleted: stats.habitsCompleted,
    generatedAt:     FieldValue.serverTimestamp(),
  });

  console.log('\nWritten to stats/global. Reload the home page to see them.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nFailed:', error && error.message ? error.message : error);
    console.error(
      '\nIf this says permission denied, the signed-in account may not have ' +
      'access to project ' + PROJECT_ID + '. Check with: gcloud config get-value project'
    );
    process.exit(1);
  });
