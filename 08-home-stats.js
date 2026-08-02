// ============================================
// 08: HOME STATS — community counters on the home page
// Part of DISCIPLANT — split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 7 files.
// ============================================

// ============================================
// Where these numbers come from
//
// A single public document, /stats/global, holding three integers.
// Nothing else in the app writes it — the rules say
// `allow write: if false`, so no client can, ever. It's produced by
// recompute-stats.js, run by hand through the Admin SDK (which
// bypasses security rules), because none of these numbers can be
// counted from the browser:
//
//   gardeners        — one per /usernames doc. The browser could
//                      actually count this collection itself, but
//                      taking all three from one document keeps this
//                      to a single read and one code path.
//   habitsGrowing    — total tasks across every garden. NOT "habits
//                      ever created": a deleted task leaves no trace
//                      anywhere, so a lifetime figure is unrecoverable
//                      and would have to start from zero at launch.
//                      This one is exactly true every time it's run.
//   habitsCompleted  — the sum of every task's totalGrowthDays, i.e.
//                      habit-days ticked off across all time. Survives
//                      task deletion only for the days already banked.
//
// /gardens and /users are owner-only and stay that way — the script
// reads them server-side, publishes only these totals, and never
// exposes anything per-person.
//
// The trade-off: these are as fresh as the last script run. That's the
// price of not letting clients write, and a visitor can't tell a
// weekly refresh from a live one.
// ============================================

var homeStatsData = null; // { gardeners, habitsGrowing, habitsCompleted } | null


// ============================================
// DOM references
// ============================================
var homeStatsEl          = document.getElementById('homeStats');
var statGardenersEl      = document.getElementById('statGardeners');
var statHabitsGrowingEl  = document.getElementById('statHabitsGrowing');
var statHabitsDoneEl     = document.getElementById('statHabitsCompleted');


// ============================================
// Rendering
// ============================================

// Thousands separators, and a hard guard against painting anything
// that isn't a real number — a half-written or hand-edited stats doc
// should leave the strip hidden rather than print "undefined" across
// the home page.
function formatStatNumber(value) {
  if (typeof value !== 'number' || !isFinite(value) || value < 0) return null;
  return Math.floor(value).toLocaleString();
}

function renderHomeStats() {
  if (!homeStatsEl) return;

  if (!homeStatsData) {
    homeStatsEl.classList.add('hidden');
    return;
  }

  var gardeners = formatStatNumber(homeStatsData.gardeners);
  var growing   = formatStatNumber(homeStatsData.habitsGrowing);
  var completed = formatStatNumber(homeStatsData.habitsCompleted);

  // All or nothing: a strip with one blank cell looks broken, so if
  // any value is missing the whole thing stays hidden and the home
  // page reads exactly as it did before this feature existed.
  if (gardeners === null || growing === null || completed === null) {
    homeStatsEl.classList.add('hidden');
    return;
  }

  if (statGardenersEl)     statGardenersEl.textContent     = gardeners;
  if (statHabitsGrowingEl) statHabitsGrowingEl.textContent = growing;
  if (statHabitsDoneEl)    statHabitsDoneEl.textContent    = completed;

  homeStatsEl.classList.remove('hidden');
}


// ============================================
// Loading
// ============================================
// Fired once at load, not on every visit to the home page: the
// document only changes when the owner reruns the script, so there is
// nothing to re-poll. Deliberately NOT a snapshot listener either —
// that would hold an open subscription for the life of the page to
// watch a value that changes a few times a year.
//
// Every failure path ends the same way, with the strip hidden. A
// missing document is the normal state before the script's first run,
// so it's logged as information rather than as an error.
function loadHomeStats() {
  if (typeof db === 'undefined' || !db) return;

  db.collection('stats').doc('global').get()
    .then(function (docSnapshot) {
      if (!docSnapshot.exists) {
        console.log(
          'DISCIPLANT: no stats/global document yet — run recompute-stats.js ' +
          'to create it. The home page just hides the counters until then.'
        );
        homeStatsData = null;
        renderHomeStats();
        return;
      }
      homeStatsData = docSnapshot.data() || null;
      renderHomeStats();
    })
    .catch(function (error) {
      // Most likely cause: the /stats rule hasn't been published in the
      // Firebase Console yet. Nothing else on the home page depends on
      // this, so failing quietly is the right behaviour.
      homeStatsData = null;
      renderHomeStats();
      if (error && error.code === 'permission-denied') {
        console.error(
          'DISCIPLANT: reading stats/global was denied. Publish the updated ' +
          'firestore.rules in Firebase Console -> Firestore -> Rules.'
        );
        return;
      }
      console.error('DISCIPLANT: could not load community stats:', error);
    });
}

loadHomeStats();
