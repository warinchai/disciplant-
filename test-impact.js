// Smoke-drives the Impact picker in the task sheet the way a person
// would: open an assignment, click a rung, confirm the plant moved.
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
function runScript(code) {
  const el = win.document.createElement('script');
  el.textContent = code;
  win.document.body.appendChild(el);
}
runScript('var db = firebase.firestore(); var auth = firebase.auth();');
for (const f of ['01-app-core.js','02-auth-tasks.js','03-plant-art.js','04-garden-scene.js',
                 '05-stats-app.js','06-friends.js','07-friend-garden.js','12-tasks-page.js',
                 '10-account-data.js']) runScript(fs.readFileSync(f, 'utf8'));

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

console.log('\n--- impact picker ---');

// A habit must not offer one.
run(`
  tasks = [makeTask(1, 'Read', 'education')];
  nextId = 2;
  tpOpenSheet(1);
`);
check('a habit sheet has no impact picker',
  !!win.document.querySelector('[data-group="impact"]'), false);

// An assignment does, with every rung.
run(`
  tasks = [makeTask(1, 'Lab report', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  tpOpenSheet(1);
`);
const seg = win.document.querySelector('[data-group="impact"]');
check('an assignment sheet has one', !!seg, true);
check('with four rungs', seg.querySelectorAll('[data-act="impact"]').length, 4);
check('Small is selected by default',
  seg.querySelector('.tp-seg-btn.active').textContent, 'Small');

// Click "Large".
const large = Array.from(seg.querySelectorAll('[data-act="impact"]'))
  .find((b) => b.textContent === 'Large');
large.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('clicking Large stores 7', run('tasks[0].impact'), 7);
check('the picker re-renders with Large active',
  win.document.querySelector('[data-group="impact"] .tp-seg-btn.active').textContent, 'Large');
check('the hint states what it is worth',
  /grows the plant by 7 days/.test(win.document.querySelector('[data-group="impact"]').parentNode.textContent), true);

// Ticking it grows by seven.
run('toggleTask(1, true);');
check('finishing it grows seven days', run('tasks[0].totalGrowthDays'), 7);

// Re-rating while still reversible resizes.
run('tpOpenSheet(1);');
const major = Array.from(win.document.querySelectorAll('[data-act="impact"]'))
  .find((b) => b.textContent === 'Major');
major.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('re-rating to Major resizes the plant', run('tasks[0].totalGrowthDays'), 14);

// A finished-earlier assignment says so and does not resize.
run(`
  tasks[0].doneAt = shiftDate(getTodayString(), -5);
  tpOpenSheet(1);
`);
check('an older finish warns that growth is banked',
  /banked growth is never taken back/.test(
    win.document.querySelector('[data-group="impact"]').parentNode.textContent), true);
const small = Array.from(win.document.querySelectorAll('[data-act="impact"]'))
  .find((b) => b.textContent === 'Small');
small.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('and re-rating it does not shrink the plant', run('tasks[0].totalGrowthDays'), 14);

// The row chip.
run(`
  tasks = [makeTask(1, 'Big project', 'education')];
  setTaskKind(tasks[0], 'once');
  setTaskImpact(tasks[0], 7);
  var chips = tpRowMeta(tasks[0]).map(function (b) { return b.text; });
`);
check('a rated assignment row shows the rung', run('chips.indexOf("Large") >= 0'), true);
run('setTaskImpact(tasks[0], 1); var chips2 = tpRowMeta(tasks[0]).map(function (b) { return b.text; });');
check('an unrated one shows nothing', run('chips2.indexOf("Small")'), -1);

console.log('\n--- partial credit in the sheet ---');

run(`
  tasks = [makeTask(1, 'Tidy room', 'chores')];
  nextId = 2;
  addSubtask(tasks[0], 'Desk');
  addSubtask(tasks[0], 'Floor');
  toggleSubtask(tasks[0], 1);
  tpOpenSheet(1);
`);
check('the steps hint states the partial award',
  /grows it by 0.5 instead of 1/.test(win.document.body.textContent), true);

// Tick the parent through the sheet checkbox path.
run('toggleTask(1, true); tpRenderSheet();');
check('the chip shows the partial total',
  /0\.5/.test(win.document.querySelector('.tp-stats').textContent), true);

// An assignment warns that its rating is not what it will pay out.
run(`
  tasks = [makeTask(1, 'Lab report', 'education')];
  nextId = 2;
  setTaskKind(tasks[0], 'once');
  setTaskImpact(tasks[0], 7);
  addSubtask(tasks[0], 'Method');
  addSubtask(tasks[0], 'Results');
  toggleSubtask(tasks[0], 1);
  tpOpenSheet(1);
`);
check('the impact hint says what ticking it now is worth',
  /ticking it now is worth 3.5/.test(win.document.body.textContent), true);

console.log('\n--- effort control ---');

run(`
  tasks = [makeTask(1, 'Run', 'exercise')];
  nextId = 2;
  tpOpenSheet(1);
`);
check('no effort control before the box is ticked',
  !!win.document.querySelector('[data-group="effort"]'), false);

run('toggleTask(1, true); tpRenderSheet();');
const eff = win.document.querySelector('[data-group="effort"]');
check('it appears once today is ticked', !!eff, true);
check('with three rungs', eff.querySelectorAll('[data-act="effort"]').length, 3);
check('Steady selected by default',
  eff.querySelector('.tp-seg-btn.active').textContent, 'Steady');

const hard = Array.from(eff.querySelectorAll('[data-act="effort"]'))
  .find((b) => b.textContent === 'Hard');
hard.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('clicking Hard regrows the plant', run('tasks[0].totalGrowthDays'), 1.5);
check('the hint states the new figure',
  /Today grew 1.5 instead of 1/.test(win.document.body.textContent), true);
check('and the history holds the level',
  run('histLevel(tasks[0].history, getTodayString())'), 2);

console.log('\n--- effort dialog on tick ---');

// The list has to actually be on the page for this one.
run(`
  tasks = [makeTask(1, 'Run', 'exercise'), makeTask(2, 'Read', 'education')];
  nextId = 3;
  tpAskId = null;
  tpCloseSheet();
  render();
`);
const ask = win.document.getElementById('effortAsk');
check('the dialog is hidden before anything is ticked',
  ask.classList.contains('hidden'), true);

// Tick via the row checkbox, the way a person does.
var check1 = win.document.querySelector('.tp-row[data-id="1"] [data-act="toggle"]');
check1.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('ticking opens the dialog', ask.classList.contains('hidden'), false);
check('and announces itself to a screen reader',
  ask.getAttribute('aria-hidden'), 'false');
check('the page behind it is locked',
  win.document.body.classList.contains('tp-ask-open'), true);
check('it asks about the task that was ticked', run('tpAskId'), 1);
check('and names it',
  ask.querySelector('.tp-ask-name').textContent, 'Run');
check('with three choices',
  ask.querySelectorAll('[data-act="askeffort"]').length, 3);
check('Steady lit, because that is what the tick already wrote',
  ask.querySelector('.tp-ask-opt.active .tp-ask-opt-label').textContent, 'Steady');

// It is a dialog now, not a strip under a row: nothing is appended to
// the list itself.
check('nothing is added to the list',
  win.document.querySelectorAll('.tp-list > :not(.tp-row)').length, 0);

// Ticking a different task moves the question rather than stacking one.
var check2 = win.document.querySelector('.tp-row[data-id="2"] [data-act="toggle"]');
check2.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('ticking another moves it', run('tpAskId'), 2);
check('to the new task', ask.querySelector('.tp-ask-name').textContent, 'Read');
check('and there is still only one dialog',
  win.document.querySelectorAll('.tp-ask').length, 1);

// Answering applies the growth and closes it.
var hardBtn = Array.from(ask.querySelectorAll('[data-act="askeffort"]'))
  .find((b) => b.textContent.indexOf('Hard') === 0);
hardBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('answering grows the plant',
  run('tasks.find(function (t) { return t.id === 2; }).totalGrowthDays'), 1.5);
check('and closes the dialog', ask.classList.contains('hidden'), true);
check('and unlocks the page',
  win.document.body.classList.contains('tp-ask-open'), false);

// Unticking closes it rather than leaving a stray question about a day
// that no longer exists. Task 1 is still ticked from earlier, so this
// click unticks it.
function tick(id) {
  win.document.querySelector('.tp-row[data-id="' + id + '"] [data-act="toggle"]')
     .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
}
tick(1);
check('unticking closes it', ask.classList.contains('hidden'), true);
check('and takes the growth back',
  run('tasks.find(function (t) { return t.id === 1; }).totalGrowthDays'), 0);

// Skipping is a valid answer: the day stays Steady and keeps its
// ordinary growth.
tick(1);
check('re-ticking reopens it', ask.classList.contains('hidden'), false);
ask.querySelector('[data-act="askclose"]')
   .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('skipping closes it', ask.classList.contains('hidden'), true);
check('and leaves the day at Steady',
  run('tasks.find(function (t) { return t.id === 1; }).totalGrowthDays'), 1);

// The backdrop is the same answer as Skip.
tick(1);
tick(1);
check('re-ticking after an untick reopens it', ask.classList.contains('hidden'), false);
ask.querySelector('.tp-ask-backdrop')
   .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
check('the backdrop closes it too', ask.classList.contains('hidden'), true);
check('leaving the day at Steady as well',
  run('tasks.find(function (t) { return t.id === 1; }).totalGrowthDays'), 1);

// Escape closes the dialog before the sheet, since it sits on top.
run('tpOpenSheet(1);');
tick(1);
tick(1);
check('the dialog can open over the sheet',
  ask.classList.contains('hidden') === false &&
  win.document.getElementById('taskSheet').classList.contains('hidden') === false, true);
win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('Escape closes the dialog first', ask.classList.contains('hidden'), true);
check('and leaves the sheet standing',
  win.document.getElementById('taskSheet').classList.contains('hidden'), false);
win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('a second Escape closes the sheet',
  win.document.getElementById('taskSheet').classList.contains('hidden'), true);

console.log('\n--- adding lands on the sheet ---');

// A new task is two keystrokes, but its schedule and its due date are
// decisions - so the add drops you straight into the place they are
// made rather than leaving a row to go find.
run(`
  tasks = [];
  nextId = 1;
  tpAskId = null;
  tpCloseSheet();
  tpAddKind = 'habit';
  render();
`);
const addForm = win.document.getElementById('tpAddForm');
win.document.getElementById('tpAddInput').value = 'Stretch';
addForm.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));

check('the habit is planted', run('tasks.length'), 1);
check('and the sheet is open on it',
  win.document.getElementById('taskSheet').classList.contains('hidden'), false);
check('showing the task just added', run('tpOpenTaskId'), 1);
check('with its schedule to set',
  win.document.querySelectorAll('#taskSheetBody [data-act="day"]').length, 7);
check('and the input is cleared for the next one',
  win.document.getElementById('tpAddInput').value, '');
check('no effort question, because nothing was ticked',
  ask.classList.contains('hidden'), true);

// The same for an assignment, which lands on its due date instead.
run(`
  tpCloseSheet();
  tpAddKind = 'once';
`);
win.document.getElementById('tpAddInput').value = 'Lab report';
addForm.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
check('the assignment is planted', run('tasks.length'), 2);
check('the sheet is open on it', run('tpOpenTaskId'), 2);
check('and it is an assignment',
  run('tasks.find(function (t) { return t.id === 2; }).kind'), 'once');
check('so the sheet offers a due date',
  !!win.document.getElementById('tpSheetDue'), true);

// An empty name plants nothing and opens nothing.
run('tpCloseSheet();');
win.document.getElementById('tpAddInput').value = '   ';
addForm.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
check('an empty name plants nothing', run('tasks.length'), 2);
check('and leaves the sheet shut',
  win.document.getElementById('taskSheet').classList.contains('hidden'), true);

console.log('');
if (fail.length) {
  console.log(fail.length + ' FAILURE(S):\n');
  fail.forEach((f) => console.log('  - ' + f + '\n'));
  process.exit(1);
}
console.log('impact picker checks passed');
process.exit(0);
