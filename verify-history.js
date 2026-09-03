// ============================================
// DISCIPLANT — round-trip test for packed history
//
// THIS FILE IS NOT PART OF THE WEBSITE. Do not add a script tag for
// it, and add it to .vercelignore alongside 09-dev-mode.js and
// recompute-stats.js.
//
// WHY IT EXISTS
// Packing history is a ONE-WAY change. Once a migrated garden saves,
// the old per-day keys are gone from Firestore and there is no undo.
// The single assertion that makes that safe is this one:
//
//     histDates(migrateHistory(old)) === Object.keys(old).sort()
//
// If that holds for real data, the conversion is lossless by
// definition - the export is the only consumer that reads every
// date, and it is reading exactly what it read before.
//
// HOW TO RUN IT
//   Synthetic cases only (no data needed):
//       node verify-history.js
//
//   Against your own real garden, which is the run that matters:
//       1. Open Disciplant, Account -> Export my data, save the JSON.
//       2. node verify-history.js /path/to/disciplant-export.json
//
//   Note the export's `completed_on` is ALREADY a sorted date array,
//   so this rebuilds the old map shape from it and round-trips that.
//   An export taken after migration round-trips too - migrateHistory
//   passes packed input straight through - so this stays useful as a
//   regression check long after the change has shipped.
//
// Exit code 0 means every case passed. Anything else means do not
// deploy.
// ============================================

const fs = require('fs');

let passed = 0;
let failed = 0;

// ---- The functions under test -------------------------------
// Copied verbatim from the block in 01-app-core.js rather than
// imported, because that file is a browser global script with no
// exports and pulling it in would drag the whole app with it. If you
// edit them there, edit them here - and Case 0 below ENFORCES that
// rather than trusting it, by reading the real file off disk and
// comparing. A test running against a stale copy of the code is
// worse than no test.

function dayOfYear(dateStr) {
  var p = String(dateStr).split('-');
  return Math.round(
    (Date.UTC(+p[0], +p[1] - 1, +p[2]) - Date.UTC(+p[0], 0, 1)) / 86400000
  );
}

var EFFORT_LEVELS = [
  null,
  { value: 1, label: 'Steady',  mult: 1,   hint: 'an ordinary day' },
  { value: 2, label: 'Hard',    mult: 1.5, hint: 'it cost you' },
  { value: 3, label: 'All out', mult: 2,   hint: 'as much as you had' },
];

var EFFORT_DEFAULT = 1;

function dateFromDayOfYear(year, index) {
  return new Date(Date.UTC(year, 0, 1 + index)).toISOString().slice(0, 10);
}

function normalizeEffort(value) {
  var n = Math.floor(Number(value));
  if (!isFinite(n) || n < 1 || n >= EFFORT_LEVELS.length) return EFFORT_DEFAULT;
  return n;
}

function histGet(hist, dateStr) {
  var row = hist && hist[String(dateStr).slice(0, 4)];
  if (!row) return false;
  var c = row.charAt(dayOfYear(dateStr));
  return c !== '' && c !== '0';
}

function histLevel(hist, dateStr) {
  if (!histGet(hist, dateStr)) return 0;
  var row = hist[String(dateStr).slice(0, 4)];
  return normalizeEffort(row.charAt(dayOfYear(dateStr)));
}

function histSet(hist, dateStr, on) {
  if (!hist) return;
  var key  = String(dateStr);
  var year = key.slice(0, 4);
  var i    = dayOfYear(key);
  if (!(i >= 0 && i <= 365)) return;
  if (dateFromDayOfYear(+year, i) !== key) return;

  var ch = '0';
  if (on === true)          ch = String(EFFORT_DEFAULT);
  else if (on && on !== '0') ch = String(normalizeEffort(on));

  var row = hist[year] || '';
  while (row.length < i) row += '0';
  row = (row.slice(0, i) + ch + row.slice(i + 1))
          .replace(/0+$/, '');

  if (row) hist[year] = row;
  else delete hist[year];
}

function histDates(hist) {
  var out = [];
  if (!hist || typeof hist !== 'object') return out;

  for (var year in hist) {
    if (!Object.prototype.hasOwnProperty.call(hist, year)) continue;
    var row = hist[year];
    if (typeof row !== 'string') continue;
    for (var i = 0; i < row.length; i++) {
      if (row.charAt(i) !== '0') out.push(dateFromDayOfYear(+year, i));
    }
  }
  return out.sort();
}

function firstCompletedDate(hist) {
  if (!hist || typeof hist !== 'object') return null;

  var years = [];
  for (var y in hist) {
    if (!Object.prototype.hasOwnProperty.call(hist, y)) continue;
    if (!/^\d{4}$/.test(y)) continue;
    if (typeof hist[y] !== 'string') continue;
    if (!/[^0]/.test(hist[y])) continue;
    years.push(y);
  }
  if (!years.length) return null;

  years.sort();
  return dateFromDayOfYear(+years[0], hist[years[0]].search(/[^0]/));
}

function migrateHistory(raw) {
  var packed = {};
  if (!raw || typeof raw !== 'object') return packed;

  for (var k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;

    if (/^\d{4}$/.test(k) && typeof raw[k] === 'string') {
      var row = raw[k].replace(/[^0-9]/g, '1').replace(/0+$/, '');
      row = row.replace(/[0-9]/g, function (c) {
        return c === '0' ? '0' : String(normalizeEffort(c));
      });
      if (row) packed[k] = row;
      continue;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && raw[k]) {
      histSet(packed, k, true);
    }
  }
  return packed;
}


// ---- Case 0: drift check -------------------------------------
// The copies above are exactly that - copies. A test running against
// a stale duplicate of the code is worse than no test, because it
// reports green while the thing that ships is broken. So rather than
// trusting the comment that says "edit them in both places", this
// reads 01-app-core.js off disk and compares.
//
// Comments and whitespace are stripped before comparing, so the two
// may be documented differently - the app file carries the long
// explanation, this one does not - but a single changed character of
// LOGIC fails the run.

function normaliseFn(src) {
  return src
    .replace(/\/\/[^\n]*/g, '')     // line comments
    .replace(/\s+/g, ' ')           // all whitespace collapsed
    .trim();
}

function extractFn(src, name) {
  const m = src.match(new RegExp('^function ' + name + '\\(.*?^\\}', 'ms'));
  return m ? m[0] : null;
}

(function checkDrift() {
  const APP_FILE = process.env.DISCIPLANT_CORE || '01-app-core.js';
  const NAMES = ['dayOfYear', 'dateFromDayOfYear', 'normalizeEffort',
                 'histGet', 'histLevel', 'histSet', 'histDates',
                 'migrateHistory', 'firstCompletedDate'];

  let appSrc, selfSrc;
  try {
    appSrc  = fs.readFileSync(APP_FILE, 'utf8').replace(/\r\n/g, '\n');
    selfSrc = fs.readFileSync(__filename, 'utf8').replace(/\r\n/g, '\n');
  } catch (e) {
    console.error('FAIL  drift check could not read ' + APP_FILE);
    console.error('        Run this from the folder holding 01-app-core.js, or set');
    console.error('        DISCIPLANT_CORE=/path/to/01-app-core.js');
    failed++;
    return;
  }

  NAMES.forEach(function (name) {
    const inApp  = extractFn(appSrc, name);
    const inTest = extractFn(selfSrc, name);

    if (!inApp)  { failed++; console.error('FAIL  ' + name + ' missing from ' + APP_FILE); return; }
    if (!inTest) { failed++; console.error('FAIL  ' + name + ' missing from the test copy'); return; }

    if (normaliseFn(inApp) === normaliseFn(inTest)) {
      passed++;
    } else {
      failed++;
      console.error('FAIL  ' + name + ' has drifted from ' + APP_FILE);
      console.error('        app:  ' + normaliseFn(inApp).slice(0, 200));
      console.error('        test: ' + normaliseFn(inTest).slice(0, 200));
    }
  });
})();


// ---- Harness -------------------------------------------------

function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    console.error('FAIL  ' + label);
    console.error('        expected: ' + e.slice(0, 300));
    console.error('        actual:   ' + a.slice(0, 300));
  }
}

// The core property, run over a list of dates.
function roundTrip(label, dates) {
  const old = {};
  dates.forEach((d) => { old[d] = true; });
  check(label, histDates(migrateHistory(old)), dates.slice().sort());
}

// ---- Case 1: the boundaries -----------------------------------
// First and last day of a common year, a leap year, and the leap day
// itself. If UTC arithmetic were wrong anywhere, these are where it
// would show.
roundTrip('year boundaries, common year', ['2026-01-01', '2026-12-31']);
roundTrip('year boundaries, leap year',   ['2024-01-01', '2024-02-29', '2024-12-31']);
roundTrip('leap day alone',               ['2024-02-29']);

check('Jan 1 is index 0',        dayOfYear('2026-01-01'), 0);
check('Dec 31 common is 364',    dayOfYear('2026-12-31'), 364);
check('Dec 31 leap is 365',      dayOfYear('2024-12-31'), 365);
check('inverse of index 0',      dateFromDayOfYear(2026, 0),   '2026-01-01');
check('inverse of index 365',    dateFromDayOfYear(2024, 365), '2024-12-31');

// ---- Case 1b: effort levels share the slot (C1) ----------------
// The point of the whole design: an effort digit is a completed day
// everywhere a ' + chr(39) + '1' + chr(39) + ' was, so nothing that reads history needs to
// know the feature exists.
check('a hard day round-trips as a date',
  histDates(migrateHistory({ '2026': '0020' })), ['2026-01-03']);
check('mixed levels all round-trip',
  histDates(migrateHistory({ '2026': '1230' })),
  ['2026-01-01', '2026-01-02', '2026-01-03']);
check('and the levels themselves survive',
  migrateHistory({ '2026': '1230' })['2026'], '123');
check('an unreadable digit becomes Steady, not a lost day',
  migrateHistory({ '2026': '0090' })['2026'], '001');
check('a non-digit becomes Steady too',
  migrateHistory({ '2026': '00z0' })['2026'], '001');
check('an old boolean map still migrates to Steady',
  migrateHistory({ '2026-01-03': true })['2026'], '001');
check('effort does not change the row length',
  migrateHistory({ '2026': '333' })['2026'].length, 3);

// ---- Case 2: daylight saving ----------------------------------
// The days either side of a DST transition in a northern and a
// southern timezone. These pass regardless of the machine's TZ
// because the arithmetic is UTC - which is the point of testing them.
roundTrip('around northern DST', ['2026-03-28', '2026-03-29', '2026-03-30']);
roundTrip('around southern DST', ['2026-10-31', '2026-11-01', '2026-11-02']);

// ---- Case 3: spanning years -----------------------------------
roundTrip('across a year boundary', ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
roundTrip('three years, sparse',    ['2024-06-15', '2025-01-01', '2026-08-15']);

// ---- Case 4: a realistic dense year ---------------------------
// Every third day for two years, which is roughly what a real habit
// looks like and long enough to catch a padding bug.
const dense = [];
for (let i = 0; i < 730; i += 3) {
  dense.push(new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10));
}
roundTrip('two years, every third day', dense);

// A fully completed leap year - the longest row that can exist.
const solid = [];
for (let i = 0; i < 366; i++) solid.push(dateFromDayOfYear(2024, i));
roundTrip('a perfect leap year', solid);
check('perfect year row length', migrateHistory(
  solid.reduce((m, d) => (m[d] = true, m), {})
)['2024'].length, 366);

// ---- Case 5: the degenerate inputs ----------------------------
check('undefined history',   histDates(migrateHistory(undefined)), []);
check('null history',        histDates(migrateHistory(null)),      []);
check('empty history',       histDates(migrateHistory({})),        []);
check('non-object history',  histDates(migrateHistory('nope')),    []);

// Falsy values were never written by the app, but if one exists it
// was not treated as completed by the old heatmaps either.
check('falsy value dropped', histDates(migrateHistory({ '2026-08-15': false })), []);

// ---- Case 6: malformed keys -----------------------------------
// The bounds guard. Without it, '2026-13-45' rolls over into 2027 and
// pads hundreds of junk characters onto the row.
// '2026-13-45' rolls past the end of the year and the bounds check
// stops it. '2026-02-99' does NOT - it lands on 2026-05-10, a
// perfectly valid index - and was silently recorded as a completion
// until the round-trip check was added. This case is the reason that
// check exists; do not remove it.
check('impossible month/day rejected', histDates(migrateHistory({ '2026-13-45': true })), []);
check('rollover landing in range',     histDates(migrateHistory({ '2026-02-99': true })), []);
check('impossible day, no rollover',   histDates(migrateHistory({ '2026-02-30': true })), []);
check('month 00 rejected',             histDates(migrateHistory({ '2026-00-10': true })), []);
check('day 00 rejected',               histDates(migrateHistory({ '2026-03-00': true })), []);
check('non-leap Feb 29 rejected',      histDates(migrateHistory({ '2026-02-29': true })), []);
check('real leap Feb 29 kept',         histDates(migrateHistory({ '2024-02-29': true })), ['2024-02-29']);
check('junk key ignored',              histDates(migrateHistory({ 'garbage': true })),    []);
check('mixed junk and real',
  histDates(migrateHistory({ 'garbage': true, '2026-08-15': true, '2026-13-45': true })),
  ['2026-08-15']);

// ---- Case 7: idempotence and mixed shapes ---------------------
// Migrating an already-migrated document must be a no-op, because it
// happens on every single load for the rest of the app's life.
const once  = migrateHistory({ '2026-08-15': true, '2026-01-01': true });
const twice = migrateHistory(once);
check('migration is idempotent', twice, once);
check('idempotent round-trip',   histDates(twice), ['2026-01-01', '2026-08-15']);

// A save interrupted mid-flight could leave one year packed and
// another not. Both branches feed the same output.
check('mixed shapes in one history',
  histDates(migrateHistory(Object.assign({ '2026-03-01': true }, migrateHistory({ '2025-07-04': true })))),
  ['2025-07-04', '2026-03-01']);

// ---- Case 8: histGet / histSet agree with the packing ---------
const h = {};
histSet(h, '2026-08-15', true);
check('set then get',            histGet(h, '2026-08-15'), true);
check('unset day reads false',   histGet(h, '2026-08-14'), false);
check('unset year reads false',  histGet(h, '2019-08-14'), false);
check('short row past end',      histGet(h, '2026-12-31'), false);

histSet(h, '2026-08-15', false);
check('clearing the only day empties the year', h, {});
check('get on empty history',    histGet({}, '2026-08-15'), false);
check('get on null history',     histGet(null, '2026-08-15'), false);

// Trailing zeros trimmed, which is what keeps a year in progress short.
const t = {};
histSet(t, '2026-01-05', true);
check('row trimmed to last completed day', t['2026'].length, 5);
histSet(t, '2026-06-01', true);
histSet(t, '2026-06-01', false);
check('row re-trims after a clear',        t['2026'].length, 5);

// Setting a day that was never set must not disturb the others.
const u = {};
['2026-01-01', '2026-06-15', '2026-12-31'].forEach((d) => histSet(u, d, true));
histSet(u, '2026-03-03', false);
check('clearing an unset day is harmless',
  histDates(u), ['2026-01-01', '2026-06-15', '2026-12-31']);

// ---- Case 8b: firstCompletedDate -------------------------------
// The Overall heatmap's denominator leans on this: a habit counts on
// a given day only if it had already been completed by then. Getting
// it wrong shifts the shading of a whole year, so it is checked
// against the same round-tripped data as everything else.
//
// It must always agree with histDates()[0], while never expanding the
// history to get there.
function firstSeenCase(label, dates, expected) {
  const packed = migrateHistory(dates.reduce((m, d) => (m[d] = true, m), {}));
  check(label, firstCompletedDate(packed), expected);
  check(label + ' agrees with histDates', firstCompletedDate(packed), histDates(packed)[0] || null);
}

firstSeenCase('single day',            ['2026-08-15'], '2026-08-15');
firstSeenCase('earliest of several',   ['2026-08-15', '2026-01-02', '2026-12-31'], '2026-01-02');
firstSeenCase('earliest across years', ['2026-01-01', '2024-11-30', '2025-06-01'], '2024-11-30');
firstSeenCase('leap day first',        ['2024-02-29', '2024-03-01'], '2024-02-29');
firstSeenCase('Jan 1 first',           ['2026-01-01', '2026-07-04'], '2026-01-01');

check('never completed',   firstCompletedDate(migrateHistory({})),        null);
check('null history',      firstCompletedDate(null),                      null);
check('undefined history', firstCompletedDate(undefined),                 null);
check('non-object',        firstCompletedDate('nope'),                    null);
// An all-zero row cannot survive migrateHistory (it trims), but a
// hand-edited document could carry one. It must not be read as a
// completion on 1 January.
check('all-zero row',      firstCompletedDate({ '2026': '0000' }),        null);
check('non-string row',    firstCompletedDate({ '2026': 12345 }),         null);
check('junk year key',     firstCompletedDate({ 'garbage': '1' }),        null);
check('junk beside real',  firstCompletedDate({ 'x': '1', '2026': '01' }), '2026-01-02');

// The dense two-year habit from Case 4, as a realistic check.
check('dense habit first day',
  firstCompletedDate(migrateHistory(dense.reduce((m, d) => (m[d] = true, m), {}))),
  dense[0]);


// ---- Case 9: size, for the record -----------------------------
// Not an assertion, just the number that motivated the change.
(function reportSize() {
  const dates = [];
  for (let i = 0; i < 365 * 3; i++) {
    dates.push(new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10));
  }
  const oldBytes = dates.length * 12;               // key + 1, boolean = 1
  const packed   = migrateHistory(dates.reduce((m, d) => (m[d] = true, m), {}));
  const newBytes = Object.keys(packed)
    .reduce((n, y) => n + y.length + 1 + packed[y].length + 1, 0);
  console.log(
    '\nSize, three fully-completed years, one habit: ' +
    oldBytes + ' bytes -> ' + newBytes + ' bytes (' +
    (oldBytes / newBytes).toFixed(1) + 'x)'
  );
})();

// ---- Case 10: real exported data ------------------------------
// The run that actually licenses the deploy.
const file = process.argv[2];
if (file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const habits = data.habits || [];

  if (!habits.length) {
    console.error('\nFAIL  export contains no habits — wrong file?');
    failed++;
  }

  habits.forEach((habit, i) => {
    const dates = habit.completed_on || [];
    const label = 'export habit ' + (i + 1) + ' (' + dates.length + ' days)';
    roundTrip(label, dates);
  });

  const totalDays = habits.reduce((n, h2) => n + (h2.completed_on || []).length, 0);
  console.log('\nChecked ' + habits.length + ' habits, ' + totalDays + ' completed days from ' + file);
} else {
  console.log('\nNo export file given — synthetic cases only.');
  console.log('Run again with your own export to license the deploy:');
  console.log('    node verify-history.js /path/to/disciplant-export.json');
}


// ---- Result ---------------------------------------------------
console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed) {
  console.error('\nDO NOT DEPLOY. The migration is one-way and this says it loses data.');
  process.exit(1);
}
console.log('Round-trip is lossless.');