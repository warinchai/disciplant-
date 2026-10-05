// ============================================
// 17: YESTERDAY - "I did it, I just forgot to tick it" (B4)
// Part of DISCIPLANT. Plain global script, loaded after 12 (it wraps
// tpRenderSections and tpRenderSheet), after 15 and 16 (it pays Dew
// through the wallet and rides on its save), and before 11.
// ============================================
//
// THE PROBLEM
// A habit ticked last night but never logged is, by midnight, a missed
// day: applyDayBoundaries() in 01 sees the gap and zeroes the streak.
// One forgotten tap cost a forty-day run, and there was no way back.
//
// WHAT THIS DOES
// For one day - today - any habit that was DUE yesterday and not
// ticked can be logged for yesterday. Doing so writes yesterday into
// the history with an effort level, grows the plant by what an
// ordinary tick would have, and rebuilds the streak from the history,
// so it reads as if the day had never been missed.
//
// Two places offer it: a card under the Tasks page's list naming
// every habit it applies to, and a "Yesterday" row in each habit's
// detail sheet. The card can be hidden for the day; the sheet always
// has it.
//
// THE RULES
//   Yesterday only. "I forgot" is almost always last night, and a
//     longer window turns a fix for forgetting into a way to write
//     history that never happened.
//   Habits only. An assignment finished late is simply ticked today.
//   Only a day the habit was scheduled for, and not one from before
//     the habit existed.
//   Reversible until today ends, exactly like an ordinary tick, and
//     effort can be changed in the same window. After that it is
//     banked like every other day.
//
// STORAGE
// One optional field per task, `lateOn`: the date a back-fill was
// made. It is what tells "yesterday, logged today" (still reversible)
// apart from "yesterday, ticked yesterday" (banked). buildCleanTasks()
// in 02 writes it only while it is today's, so it prunes itself and a
// garden that never uses this saves exactly the document it did.
// The Dew it paid lives in `wallet.ly` for the same one day.
// ============================================


// ---- The day being fixed ----------------------------------------

function ydDay() {
  return shiftDate(getTodayString(), -1);
}

// The streak as the history tells it: ticked days counted back from
// today, skipping days the habit was not scheduled for, until the
// first scheduled day that was not done. Today not being ticked yet
// is not a break - the day is not over. `assumeDay` is counted as
// done whatever the history says, which is how the card can say what
// a fix would bring the streak back to before it is made.
//
// A ticked unscheduled day counts, because toggleTask() counts it.
function ydStreakFromHistory(task, assumeDay) {
  var today = getTodayString();
  var n = 0;
  for (var i = 0; i <= MAX_STREAK_LOOKBACK_DAYS; i++) {
    var day = shiftDate(today, -i);
    if (task.createdAt && day < task.createdAt) break;
    var done = day === assumeDay || histGet(task.history, day);
    if (done) { n++; continue; }
    if (i === 0) continue;
    if (!isScheduledOn(task, day)) continue;
    break;
  }
  return n;
}

// Can yesterday still be logged for this habit?
function ydCanFix(task) {
  if (!task || task.kind === 'once') return false;
  if (typeof authReady !== 'undefined' && !authReady) return false;
  // Before today's rollover has run, "yesterday" has not been
  // closed yet and the ordinary tick still covers it.
  if (lastResetDate !== getTodayString()) return false;
  var y = ydDay();
  if (task.createdAt && task.createdAt > y) return false;
  if (!isScheduledOn(task, y)) return false;
  return !histGet(task.history, y);
}

// Was yesterday logged today, so it can still be changed or undone?
function ydIsFixed(task) {
  return !!task && task.kind !== 'once' &&
         task.lateOn === getTodayString() &&
         histGet(task.history, ydDay());
}

// What a day at this effort is worth to this habit. The same sum
// toggleTask() does, with yesterday's effort in place of today's.
// Steps are not part of it: yesterday's checklist was cleared at
// midnight, and saying "I did it" is saying all of it.
function ydAward(task, level) {
  return clampGrowthPoints(taskGrowthWeight(task) * effortMultiplier(level));
}


// ---- Fixing, re-rating, undoing ---------------------------------

function ydFix(taskId, level) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!ydCanFix(task)) return false;
  level = normalizeEffort(level || EFFORT_DEFAULT);

  var prevBest = Math.max(task.maxStreak || 0, task.streak || 0);
  var y = ydDay();

  if (!task.history) task.history = {};
  histSet(task.history, y, level);
  task.totalGrowthDays = clampGrowthPoints((task.totalGrowthDays || 0) + ydAward(task, level));
  task.maxGrowthDays   = Math.max(clampGrowthPoints(task.maxGrowthDays), task.totalGrowthDays);
  task.streak    = clampStreak(Math.max(ydStreakFromHistory(task), (task.streak || 0) + 1));
  task.maxStreak = Math.max(task.maxStreak || 0, task.streak);
  task.lateOn    = getTodayString();

  ydPayDew(task, prevBest);
  saveData();
  render();
  return true;
}

function ydSetEffort(taskId, level) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!ydIsFixed(task)) return false;
  var y = ydDay();
  var was = histLevel(task.history, y);
  level = normalizeEffort(level);
  if (level === was) return false;

  histSet(task.history, y, level);
  task.totalGrowthDays = clampGrowthPoints(Math.max(0,
    (task.totalGrowthDays || 0) + ydAward(task, level) - ydAward(task, was)));
  task.maxGrowthDays = Math.max(clampGrowthPoints(task.maxGrowthDays), task.totalGrowthDays);
  saveData();
  render();
  return true;
}

// Back to exactly what the rollover left: the day missed, the growth
// gone, the streak counted again without it. maxStreak stays where it
// got to, the same as unticking an ordinary tick - it is a high-water
// mark, and it is what keeps an unlocked skin unlocked.
function ydUndo(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!ydIsFixed(task)) return false;
  var y = ydDay();
  var level = histLevel(task.history, y);

  task.totalGrowthDays = clampGrowthPoints(Math.max(0,
    (task.totalGrowthDays || 0) - ydAward(task, level)));
  histSet(task.history, y, false);
  task.streak = clampStreak(ydStreakFromHistory(task));
  task.lateOn = null;

  ydRefundDew(task);
  saveData();
  render();
  return true;
}


// ---- Dew (15) ---------------------------------------------------
// A back-filled day pays what the tick would have: the habit tick,
// counted against today's habit cap because that is when it is
// earned, and any streak milestone the restored streak crosses.
// The tick refunds on undo; a milestone does not, the same rule 15
// has for every milestone.

function ydLedger() {
  if (typeof wallet === 'undefined') return null;
  var today = getTodayString();
  if (!wallet.ly || wallet.ly.d !== today) wallet.ly = { d: today, p: {} };
  return wallet.ly;
}

function ydPayDew(task, prevBest) {
  if (typeof dewCredit !== 'function') return;
  var ly = ydLedger();
  var total = 0, label = '';
  var tick = dewCredit(DEW_HABIT_TICK, 'h');
  if (tick > 0) { ly.p[String(task.id)] = tick; total += tick; }
  dewMilestonesBetween(prevBest, Math.max(prevBest, task.streak)).forEach(function (m) {
    total += dewCredit(m.dew, null);
    label = ' · ' + m.days + '-day streak';
  });
  if (total > 0) dewToast('+' + total + ' Dew' + label);
}

function ydRefundDew(task) {
  if (typeof dewRefund !== 'function') return;
  var ly = ydLedger();
  var back = ly.p[String(task.id)] || 0;
  delete ly.p[String(task.id)];
  if (back > 0) {
    dewRefund(back, 'h');
    dewToast('−' + back + ' Dew');
  }
}

// In and out with the rest of the wallet, the way 16 carries `rw`.
if (typeof dewNormalizeWallet === 'function') {
  var ydBaseNormalizeWallet = dewNormalizeWallet;
  dewNormalizeWallet = function (raw) {
    var w = ydBaseNormalizeWallet.apply(this, arguments);
    var src = raw && raw.ly;
    w.ly = { d: null, p: {} };
    if (src && typeof src === 'object' && src.d === getTodayString() &&
        src.p && typeof src.p === 'object') {
      w.ly.d = src.d;
      for (var id in src.p) {
        if (!Object.prototype.hasOwnProperty.call(src.p, id) || !/^\d+$/.test(id)) continue;
        var amt = Math.max(0, Math.min(DEW_HABIT_DAILY_CAP, Math.round(Number(src.p[id])) || 0));
        if (amt > 0) w.ly.p[id] = amt;
      }
    }
    return w;
  };

  var ydBaseWalletPayload = dewWalletPayload;
  dewWalletPayload = function () {
    var out = ydBaseWalletPayload.apply(this, arguments);
    var ly = wallet.ly;
    if (ly && ly.d === getTodayString() && Object.keys(ly.p).length) {
      out.ly = { d: ly.d, p: Object.assign({}, ly.p) };
    }
    return out;
  };
}


// ---- Markup -----------------------------------------------------

function ydEffortButtons(task) {
  var level = histLevel(task.history, ydDay());
  return '<div class="tp-seg yd-effort" role="group" aria-label="How was it?">' +
    EFFORT_LEVELS.slice(1).map(function (lvl) {
      var on = lvl.value === level;
      return '<button type="button" class="tp-seg-btn' + (on ? ' active' : '') + '" ' +
        'data-yd-act="effort" data-yd-id="' + task.id + '" data-yd-value="' + lvl.value + '" ' +
        'aria-pressed="' + (on ? 'true' : 'false') + '" title="' + escapeHtml(lvl.hint) + '">' +
        escapeHtml(lvl.label) + '</button>';
    }).join('') +
  '</div>';
}

// The controls for one habit: a button while it can be fixed, the
// effort question and Undo once it has been.
function ydControlsHtml(task) {
  if (ydIsFixed(task)) {
    return '<div class="yd-done">' +
      '<span class="yd-done-label">Logged. How was it?</span>' +
      ydEffortButtons(task) +
      '<button type="button" class="yd-undo" data-yd-act="undo" data-yd-id="' + task.id + '">Undo</button>' +
    '</div>';
  }
  return '<button type="button" class="ob-btn ob-btn-go yd-fix" data-yd-act="fix" data-yd-id="' +
    task.id + '">Yes, I did it</button>';
}

function ydPromiseText(task) {
  var n = ydStreakFromHistory(task, ydDay());
  return n > 1 ? 'Brings your streak back to ' + tpPlural(n, 'day', 'days') : 'Counts yesterday as done';
}

function ydRowHtml(task) {
  return '<li class="yd-row' + (ydIsFixed(task) ? ' is-fixed' : '') + '">' +
    '<span class="yd-row-art" aria-hidden="true">' + tpTaskArt(task, 26) + '</span>' +
    '<span class="yd-row-text">' +
      '<span class="yd-row-name">' + escapeHtml(task.text) + '</span>' +
      (ydIsFixed(task) ? '' : '<span class="yd-row-meta">' + escapeHtml(ydPromiseText(task)) + '</span>') +
    '</span>' +
    ydControlsHtml(task) +
  '</li>';
}


// ---- The card on the Tasks page ---------------------------------

var YD_HIDE_KEY = 'disciplant:ydHidden';

function ydHiddenToday() {
  try { return localStorage.getItem(YD_HIDE_KEY) === getTodayString(); }
  catch (e) { return false; }
}

function ydHideToday() {
  try { localStorage.setItem(YD_HIDE_KEY, getTodayString()); } catch (e) {}
}

// The habits the card lists, in the Tasks page's own order and plot
// filter: every one that can be fixed, and every one fixed today so
// its effort and Undo stay in reach.
function ydCardTasks() {
  var list = (typeof tpVisibleTasks === 'function') ? tpVisibleTasks() : tasks;
  list = list.filter(function (t) { return ydCanFix(t) || ydIsFixed(t); });
  return (typeof tpSortHabits === 'function') ? tpSortHabits(list) : list;
}

function ydCardHtml() {
  var list = ydCardTasks();
  if (!list.length) return '';
  // Hiding only hides the offer. Once something has been fixed the
  // card stays until it can no longer be undone, or that would be
  // the only way to reach Undo from this page.
  var anyFixed = list.some(ydIsFixed);
  if (ydHiddenToday() && !anyFixed) return '';

  return '<section class="yd-card" aria-label="Forgot to tick yesterday?">' +
    '<div class="yd-head">' +
      '<h3 class="yd-title">Forgot to tick yesterday?</h3>' +
      (anyFixed ? '' : '<button type="button" class="yd-hide" data-yd-act="hide">Hide</button>') +
    '</div>' +
    '<p class="yd-sub">If you did it and just forgot to tick it, log it here and your streak ' +
      'comes back as if you never missed. Only for yesterday, and only until today ends.</p>' +
    '<ul class="yd-list">' + list.map(ydRowHtml).join('') + '</ul>' +
  '</section>';
}

function ydCardEl() {
  var el = document.getElementById('ydCard');
  if (el || !tpSectionsEl || !tpSectionsEl.parentNode) return el;
  el = document.createElement('div');
  el.id = 'ydCard';
  // Below today's list, not above it: today's tasks come first, and
  // yesterday is a catch-up for once those are in view.
  tpSectionsEl.parentNode.insertBefore(el, tpSectionsEl.nextSibling);
  return el;
}

function renderYesterdayCard() {
  var el = ydCardEl();
  if (!el) return;
  el.innerHTML = tasks.length ? ydCardHtml() : '';
}

var ydBaseRenderSections = tpRenderSections;
tpRenderSections = function () {
  var out = ydBaseRenderSections.apply(this, arguments);
  renderYesterdayCard();
  return out;
};


// ---- The row in the detail sheet --------------------------------

var ydBaseRenderSheet = tpRenderSheet;
tpRenderSheet = function () {
  var out = ydBaseRenderSheet.apply(this, arguments);
  var task = tpOpenTask();
  if (!task || !tpSheetBodyEl || !(ydCanFix(task) || ydIsFixed(task))) return out;
  var stats = tpSheetBodyEl.querySelector('.tp-stats');
  if (!stats) return out;
  stats.insertAdjacentHTML('afterend',
    '<div class="tp-field yd-field">' +
      '<label class="tp-label">Yesterday</label>' +
      '<div class="yd-field-row">' + ydControlsHtml(task) + '</div>' +
      '<p class="tp-hint">' + (ydIsFixed(task)
        ? 'Logged for yesterday. You can change or undo it until today ends.'
        : 'Not ticked, and it was due. If you did it, log it - ' +
          ydPromiseText(task).charAt(0).toLowerCase() + ydPromiseText(task).slice(1) + '.') +
      '</p>' +
    '</div>');
  return out;
};


// ---- Clicks -----------------------------------------------------
// Delegated from the document, once, because both hosts are rebuilt
// on every render. The sheet's own listener ignores these: it only
// acts on [data-act].

document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('[data-yd-act]');
  if (!btn) return;
  var act = btn.getAttribute('data-yd-act');
  var id  = parseInt(btn.getAttribute('data-yd-id'), 10);

  if (act === 'fix')    { ydFix(id, EFFORT_DEFAULT); return; }
  if (act === 'effort') { ydSetEffort(id, parseInt(btn.getAttribute('data-yd-value'), 10)); return; }
  if (act === 'undo')   { ydUndo(id); return; }
  if (act === 'hide')   { ydHideToday(); renderYesterdayCard(); }
});
