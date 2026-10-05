// ============================================
// 18: MARKET - things Dew can do, not just wear
// Part of DISCIPLANT. Plain global script, loaded after 15 (it spends
// through the wallet and rides on its save), 16 and 17 (it wraps the
// yesterday fix), and before 11.
// ============================================
//
// WHAT IS HERE
//   Mulch   Bought with Dew, held (at most MULCH_MAX_HELD), and spent
//           automatically at the midnight rollover: a habit that missed
//           exactly one scheduled day keeps its streak, and that day is
//           marked as covered. Longest streak first if several missed.
//           One per plant per MULCH_GAP_DAYS, so never two days in a row.
//   Pause   Free. Up to PAUSE_MAX_DAYS for exam week, illness, a trip:
//           no habit is due on a paused day, so nothing can be missed.
//           Starts today or tomorrow - never in the past - and the next
//           one can start PAUSE_COOLDOWN_DAYS after the last one ended.
//
// THE RULE THIS FILE KEEPS: DEW NEVER BUYS GROWTH
// Mulch saves a streak; it never adds a day to the plant, never writes
// the history, never touches height. A covered day is a day that was
// forgiven, not one that was done. See the invariants in ROADMAP.md.
//
// HOW A DAY STOPS COUNTING
// Both items work the same way underneath: isScheduledOn() and
// wasDueOn() in 01 answer "no" for a paused day, and for a day a
// plant's Mulch covered. Everything that decides whether a day was
// missed - the rollover, the streak count in 17, the heatmap's
// denominator, the Tasks page's "due today" - already asks those two,
// so none of it had to change.
//
// MULCH AND "FORGOT TO TICK YESTERDAY?"
// Mulch is spent at midnight, before anyone could say they just forgot.
// So logging yesterday through 17 hands the Mulch back, and undoing
// that log puts it back on - the free fix always wins over the paid one.
//
// STORAGE
// `wallet.mk` on gardens/{uid}, written by the save that writes the
// rest of the wallet. No new document, read, write or listener.
// ============================================


// ---- The numbers ------------------------------------------------

var MULCH_PRICE        = 25;
var MULCH_MAX_HELD     = 2;
var MULCH_GAP_DAYS     = 7;    // one per plant per week
var MULCH_HELD_CEILING = MULCH_MAX_HELD + 1;  // a hand-back can top a full sack up by one
var MULCH_LOG_MAX      = 6;    // recent saves shown on the page
var MULCH_KEEP_DAYS    = 400;  // covered days older than this are dropped

var PAUSE_LENGTHS       = [3, 7, 14];
var PAUSE_MAX_DAYS      = 14;
var PAUSE_COOLDOWN_DAYS = 7;


// ---- State ------------------------------------------------------

function mkEmpty() {
  return {
    mulch: 0,     // held
    cov:   {},    // taskId -> [covered dates]
    log:   [],    // [{ t: taskId, d: date, s: streak saved }], newest last
    unc:   null,  // { d: today, p: { taskId: date } } - Mulch handed back by 17 today
    pause: null,  // { from, to } - inclusive
    pend:  null,  // the day the last pause ended
  };
}

function mkIsDay(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

// Same stance as dewNormalizeWallet: the document is browser-writable,
// so anything odd in it becomes something sane here.
function mkNormalize(raw) {
  var m = mkEmpty();
  if (!raw || typeof raw !== 'object') return m;
  m.mulch = Math.max(0, Math.min(MULCH_HELD_CEILING, Math.round(Number(raw.mulch)) || 0));
  if (raw.cov && typeof raw.cov === 'object') {
    for (var id in raw.cov) {
      if (!Object.prototype.hasOwnProperty.call(raw.cov, id) || !/^\d+$/.test(id)) continue;
      if (!Array.isArray(raw.cov[id])) continue;
      var days = raw.cov[id].filter(mkIsDay).sort();
      days = days.filter(function (d, i) { return days.indexOf(d) === i; }).slice(-60);
      if (days.length) m.cov[id] = days;
    }
  }
  if (Array.isArray(raw.log)) {
    m.log = raw.log.filter(function (e) {
      return e && /^\d+$/.test(String(e.t)) && mkIsDay(e.d);
    }).slice(-MULCH_LOG_MAX).map(function (e) {
      return { t: Number(e.t), d: e.d, s: Math.max(0, Math.round(Number(e.s)) || 0) };
    });
  }
  if (raw.unc && raw.unc.d === getTodayString() && raw.unc.p && typeof raw.unc.p === 'object') {
    m.unc = { d: raw.unc.d, p: {} };
    for (var k in raw.unc.p) {
      if (Object.prototype.hasOwnProperty.call(raw.unc.p, k) && /^\d+$/.test(k) && mkIsDay(raw.unc.p[k])) {
        m.unc.p[k] = raw.unc.p[k];
      }
    }
  }
  if (raw.pause && mkIsDay(raw.pause.from) && mkIsDay(raw.pause.to) &&
      raw.pause.from <= raw.pause.to && dayGap(raw.pause.from, raw.pause.to) < PAUSE_MAX_DAYS) {
    m.pause = { from: raw.pause.from, to: raw.pause.to };
  }
  m.pend = mkIsDay(raw.pend) ? raw.pend : null;
  return m;
}

function mkState() {
  if (typeof wallet === 'undefined') return mkEmpty();
  if (!wallet.mk) wallet.mk = mkEmpty();
  var m = wallet.mk;
  // A pause that has run its course becomes the cooldown's start.
  if (m.pause && m.pause.to < getTodayString()) {
    m.pend  = m.pause.to;
    m.pause = null;
  }
  if (m.unc && m.unc.d !== getTodayString()) m.unc = null;
  return m;
}

var mkBaseNormalizeWallet = dewNormalizeWallet;
dewNormalizeWallet = function (raw) {
  var w = mkBaseNormalizeWallet.apply(this, arguments);
  w.mk = mkNormalize(raw && raw.mk);
  return w;
};

var mkBaseWalletPayload = dewWalletPayload;
dewWalletPayload = function () {
  var out = mkBaseWalletPayload.apply(this, arguments);
  var m = mkState();
  var keep = shiftDate(getTodayString(), -MULCH_KEEP_DAYS);
  var live = {};
  (typeof tasks !== 'undefined' ? tasks : []).forEach(function (t) { live[String(t.id)] = true; });
  var cov = {};
  for (var id in m.cov) {
    if (!Object.prototype.hasOwnProperty.call(m.cov, id) || !live[id]) continue;
    var days = m.cov[id].filter(function (d) { return d >= keep; });
    if (days.length) cov[id] = days;
  }
  out.mk = { mulch: m.mulch };
  if (Object.keys(cov).length) out.mk.cov = cov;
  if (m.log.length)            out.mk.log = m.log.slice();
  if (m.unc && Object.keys(m.unc.p).length) out.mk.unc = { d: m.unc.d, p: Object.assign({}, m.unc.p) };
  if (m.pause)                 out.mk.pause = { from: m.pause.from, to: m.pause.to };
  if (m.pend)                  out.mk.pend = m.pend;
  return out;
};


// ---- Which days count -------------------------------------------

function mkPaused(dateStr) {
  var p = mkState().pause;
  return !!p && dateStr >= p.from && dateStr <= p.to;
}

function mkCovered(task, dateStr) {
  var list = task && mkState().cov[String(task.id)];
  return !!list && list.indexOf(dateStr) !== -1;
}

// While set, a Mulched day counts as scheduled again. Only ever on for
// the length of one call, below, to ask 17 "could this be logged if
// the Mulch were not there?".
var mkIgnoreCover = false;

var mkBaseIsScheduledOn = isScheduledOn;
isScheduledOn = function (task, dateStr) {
  if (!mkBaseIsScheduledOn.apply(this, arguments)) return false;
  if (mkPaused(dateStr)) return false;
  if (!mkIgnoreCover && mkCovered(task, dateStr)) return false;
  return true;
};

// The heatmap's denominator (05) asks this one rather than
// isScheduledOn, so it gets the same two exceptions: a paused or
// covered day was never owed, so it is not a missed square.
var mkBaseWasDueOn = wasDueOn;
wasDueOn = function (task, dateStr) {
  if (!mkBaseWasDueOn.apply(this, arguments)) return false;
  if (mkPaused(dateStr) || mkCovered(task, dateStr)) return false;
  return true;
};


// ---- Mulch at midnight ------------------------------------------

// No cover for this plant in the MULCH_GAP_DAYS before `day` - which
// is also what rules out two days in a row.
function mkMayCover(task, day) {
  var list = mkState().cov[String(task.id)] || [];
  var since = shiftDate(day, -MULCH_GAP_DAYS);
  return !list.some(function (d) { return d > since && d < day; }) && list.indexOf(day) === -1;
}

function mkCover(task, day) {
  var m = mkState();
  var id = String(task.id);
  m.cov[id] = (m.cov[id] || []).concat([day]).sort();
}

function mkUncover(task, day) {
  var m = mkState();
  var id = String(task.id);
  if (!m.cov[id]) return;
  m.cov[id] = m.cov[id].filter(function (d) { return d !== day; });
  if (!m.cov[id].length) delete m.cov[id];
}

// The scheduled days in [from, to) this habit did not do. The same walk
// missedAScheduledDay() in 01 makes, returning the days instead of a
// yes/no - including its rule that the first day's answer may still be
// sitting in task.completed.
function mkMissedDays(task, from, to) {
  var out = [];
  var gap = dayGap(from, to);
  if (!(gap > 0) || gap > MAX_STREAK_LOOKBACK_DAYS) return out;
  for (var i = 0; i < gap; i++) {
    var day = shiftDate(from, i);
    if (!isScheduledOn(task, day)) continue;
    var done = (i === 0) ? (task.completed || histGet(task.history, day)) : histGet(task.history, day);
    if (!done) out.push(day);
  }
  return out;
}

var mkSavedToday = [];

function mkAutoMulch(from, to) {
  var m = mkState();
  if (m.mulch <= 0 || !from || from >= to) return;
  var habits = tasks.filter(function (t) { return t.kind !== 'once' && t.streak > 0; })
                    .sort(function (a, b) { return (b.streak || 0) - (a.streak || 0); });
  habits.forEach(function (task) {
    if (m.mulch <= 0) return;
    var missed = mkMissedDays(task, from, to);
    if (missed.length !== 1) return;          // more than one day is a real break
    var day = missed[0];
    if (!mkMayCover(task, day)) return;
    mkCover(task, day);
    m.mulch--;
    m.log.push({ t: task.id, d: day, s: task.streak });
    m.log = m.log.slice(-MULCH_LOG_MAX);
    mkSavedToday.push(task);
  });
}

var mkBaseApplyDayBoundaries = applyDayBoundaries;
applyDayBoundaries = function () {
  var today = getTodayString();
  if (lastResetDate && lastResetDate !== today) mkAutoMulch(lastResetDate, today);
  var out = mkBaseApplyDayBoundaries.apply(this, arguments);
  if (mkSavedToday.length && typeof dewToast === 'function') {
    mkSavedToday.forEach(function (t) {
      dewToast('Mulch saved your ' + t.streak + '-day ' + t.text + ' streak');
    });
  }
  mkSavedToday = [];
  return out;
};


// ---- Mulch and "Forgot to tick yesterday?" (17) ------------------

if (typeof ydCanFix === 'function') {
  var mkBaseYdCanFix = ydCanFix;
  ydCanFix = function (task) {
    if (mkBaseYdCanFix.apply(this, arguments)) return true;
    if (!task || !mkCovered(task, ydDay())) return false;
    mkIgnoreCover = true;
    try { return mkBaseYdCanFix.apply(this, arguments); }
    finally { mkIgnoreCover = false; }
  };

  var mkBaseYdFix = ydFix;
  ydFix = function (taskId) {
    var task = tasks.find(function (t) { return t.id === taskId; });
    var y = ydDay();
    var handBack = !!task && mkCovered(task, y) && ydCanFix(task);
    var m = mkState();
    if (handBack) mkUncover(task, y);
    var ok = mkBaseYdFix.apply(this, arguments);
    if (handBack && !ok) { mkCover(task, y); return ok; }
    if (handBack) {
      m.mulch = Math.min(MULCH_HELD_CEILING, m.mulch + 1);
      if (!m.unc) m.unc = { d: getTodayString(), p: {} };
      m.unc.p[String(task.id)] = y;
      m.log = m.log.filter(function (e) { return !(e.t === task.id && e.d === y); });
      if (typeof dewToast === 'function') dewToast('Mulch handed back - you did it after all');
      saveData();
      render();
    }
    return ok;
  };

  var mkBaseYdUndo = ydUndo;
  ydUndo = function (taskId) {
    var task = tasks.find(function (t) { return t.id === taskId; });
    var y = ydDay();
    var m = mkState();
    var wasHandedBack = !!task && !!m.unc && m.unc.p[String(task.id)] === y;
    var ok = mkBaseYdUndo.apply(this, arguments);
    if (ok && wasHandedBack && m.mulch > 0) {
      mkCover(task, y);
      m.mulch--;
      delete m.unc.p[String(task.id)];
      m.log.push({ t: task.id, d: y, s: 0 });
      m.log = m.log.slice(-MULCH_LOG_MAX);
      task.streak = clampStreak(ydStreakFromHistory(task));
      m.log[m.log.length - 1].s = task.streak;
      if (typeof dewToast === 'function') dewToast('Mulch is back on ' + task.text);
      saveData();
      render();
    }
    return ok;
  };
}


// ---- Buying and pausing -----------------------------------------

function mkBuyMulch() {
  var m = mkState();
  if (m.mulch >= MULCH_MAX_HELD) return false;
  if (wallet.bal < MULCH_PRICE) return false;
  wallet.bal   -= MULCH_PRICE;
  wallet.spent += MULCH_PRICE;
  m.mulch++;
  dewToast('Mulch in the shed (' + m.mulch + ' of ' + MULCH_MAX_HELD + ')');
  saveData();
  render();
  return true;
}

// The first day a new pause may start, or null if one is set already.
function mkPauseEarliest() {
  var m = mkState();
  if (m.pause) return null;
  var today = getTodayString();
  if (!m.pend) return today;
  var after = shiftDate(m.pend, PAUSE_COOLDOWN_DAYS + 1);
  return after > today ? after : today;
}

function mkStartPause(from, days) {
  var m = mkState();
  var today = getTodayString();
  var earliest = mkPauseEarliest();
  days = Math.round(Number(days));
  if (!earliest || !(days >= 1 && days <= PAUSE_MAX_DAYS)) return false;
  if (from !== today && from !== shiftDate(today, 1)) return false;   // never in the past
  if (from < earliest) return false;
  m.pause = { from: from, to: shiftDate(from, days - 1) };
  saveData();
  render();
  return true;
}

// Ending a pause keeps the days already behind it (they stay paused)
// and gives back the rest. One that never started simply goes, with
// no cooldown; one ended on its first day still counts as used if
// that day has passed.
function mkEndPause() {
  var m = mkState();
  if (!m.pause) return false;
  var today = getTodayString();
  var yesterday = shiftDate(today, -1);
  if (m.pause.from > yesterday) {
    m.pause = null;
  } else {
    m.pend  = yesterday < m.pause.to ? yesterday : m.pause.to;
    m.pause = null;
  }
  saveData();
  render();
  return true;
}


// ---- The page ---------------------------------------------------

var pageMarketEl    = document.getElementById('page-market');
var marketContentEl = document.getElementById('marketContent');
var marketLoadingEl = document.getElementById('marketLoadingState');

var mkArmed = false;        // two taps to buy, the same as a shop tile
var mkPauseFrom = 'today';  // 'today' | 'tomorrow'
var mkPauseDays = 7;

function mkTaskName(id) {
  var t = tasks.find(function (x) { return x.id === id; });
  return t ? t.text : 'a plant since dug up';
}

function mkShortDate(d) {
  var p = d.split('-');
  return (+p[2]) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec'][+p[1] - 1];
}

function mkMulchArt() {
  return '<svg class="mk-art" viewBox="0 0 64 64" aria-hidden="true">' +
    '<ellipse cx="32" cy="56" rx="26" ry="5" style="fill:var(--bark-deep,#5E4632);opacity:0.35"/>' +
    '<path d="M12 22 C12 18 15 16 18 16 L46 16 C49 16 52 18 52 22 L55 50 C55 54 52 56 48 56 L16 56 C12 56 9 54 9 50 Z" style="fill:var(--clay-deep,#C39F73)"/>' +
    '<path d="M14 16 C20 10 44 10 50 16 C44 20 20 20 14 16 Z" style="fill:var(--bark,#7A5C42)"/>' +
    '<path d="M18 15 C24 8 40 8 46 15" style="fill:none;stroke:var(--bark-deep,#5E4632);stroke-width:2.4;stroke-linecap:round"/>' +
    '<rect x="17" y="30" width="30" height="14" rx="3" style="fill:var(--linen,#F8EEDC)"/>' +
    '<path d="M24 41 C24 36 27 33 32 33 C32 38 29 41 24 41 Z" style="fill:var(--leaf,#7FA968)"/>' +
    '<path d="M40 41 C40 36 37 33 32 33" style="fill:none;stroke:var(--leaf-deep,#5C8149);stroke-width:2;stroke-linecap:round"/>' +
  '</svg>';
}

function mkPauseArt() {
  return '<svg class="mk-art" viewBox="0 0 64 64" aria-hidden="true">' +
    '<ellipse cx="32" cy="56" rx="24" ry="5" style="fill:var(--bark-deep,#5E4632);opacity:0.35"/>' +
    '<path d="M14 34 C14 22 22 14 32 14 C42 14 50 22 50 34 Z" style="fill:var(--dusk,#9C8FB8)"/>' +
    '<path d="M32 14 L32 54" style="fill:none;stroke:var(--bark,#7A5C42);stroke-width:3;stroke-linecap:round"/>' +
    '<path d="M14 34 C17 31 20 31 23 34 C26 31 29 31 32 34 C35 31 38 31 41 34 C44 31 47 31 50 34" style="fill:none;stroke:var(--linen,#F8EEDC);stroke-width:2;stroke-linecap:round"/>' +
    '<path d="M32 54 C32 57 28 57 28 54" style="fill:none;stroke:var(--bark,#7A5C42);stroke-width:3;stroke-linecap:round"/>' +
  '</svg>';
}

function mkMulchHtml() {
  var m = mkState();
  var full = m.mulch >= MULCH_MAX_HELD;
  var short = Math.max(0, MULCH_PRICE - wallet.bal);
  var btn;
  if (full) {
    btn = '<span class="rw-collected">Shed full (' + MULCH_MAX_HELD + ' of ' + MULCH_MAX_HELD + ')</span>';
  } else if (mkArmed && short > 0) {
    btn = '<button type="button" class="rw-collect" disabled>Need ' + short + ' more Dew</button>';
  } else {
    btn = '<button type="button" class="rw-collect mk-buy' + (mkArmed ? ' is-armed' : '') + '" data-mk-act="buy">' +
      (mkArmed ? 'Tap again to buy' : dewDropIcon() + ' ' + MULCH_PRICE) + '</button>';
  }

  var pips = '';
  for (var i = 0; i < MULCH_MAX_HELD; i++) {
    pips += '<span class="mk-pip' + (i < m.mulch ? ' is-full' : '') + '"></span>';
  }

  var log = m.log.slice().reverse().map(function (e) {
    return '<li>' + mkShortDate(e.d) + ': saved ' + escapeHtml(mkTaskName(e.t)) +
      (e.s ? ' (' + e.s + '-day streak)' : '') + '</li>';
  }).join('');

  return '<section class="rw-board mk-item">' +
    '<div class="mk-item-head">' + mkMulchArt() +
      '<div class="mk-item-text">' +
        '<h3 class="rw-h">Mulch</h3>' +
        '<p class="rw-sub">Keeps a streak alive through one missed day. It works on its own at ' +
          'midnight: if a habit missed exactly one day it was due, a bag of Mulch covers it and the ' +
          'streak carries on. It never grows the plant - only real days do that.</p>' +
      '</div>' +
    '</div>' +
    '<div class="mk-item-foot">' +
      '<span class="mk-held" aria-label="' + m.mulch + ' held">' + pips +
        '<span>' + m.mulch + ' in the shed</span></span>' +
      btn +
    '</div>' +
    '<p class="mk-fine">Hold up to ' + MULCH_MAX_HELD + '. One per plant per week, so it never covers two days in a row. ' +
      'Longest streak gets it first. If you log the day through "Forgot to tick yesterday?", the Mulch comes back.</p>' +
    (log ? '<ul class="mk-log">' + log + '</ul>' : '') +
  '</section>';
}

function mkPauseHtml() {
  var m = mkState();
  var today = getTodayString();
  var body;

  if (m.pause) {
    var started = m.pause.from <= today;
    body = '<p class="mk-status">' + (started ? 'Paused until ' : 'Pause starts ' +
      mkShortDate(m.pause.from) + ', until ') + '<b>' + mkShortDate(m.pause.to) + '</b>. ' +
      'No habit is due' + (started ? '' : ' then') + ', so no streak can break.</p>' +
      '<button type="button" class="ob-btn ob-btn-quiet" data-mk-act="endpause">' +
        (started ? 'End the pause' : 'Cancel it') + '</button>';
  } else {
    var earliest = mkPauseEarliest();
    var tomorrow = shiftDate(today, 1);
    if (earliest > tomorrow) {
      body = '<p class="mk-status">Your last pause ended ' + mkShortDate(m.pend) + '. ' +
        'The next one can start from <b>' + mkShortDate(earliest) + '</b>.</p>';
    } else {
      if (earliest === tomorrow && mkPauseFrom === 'today') mkPauseFrom = 'tomorrow';
      var seg = function (group, value, label, on, disabled) {
        return '<button type="button" class="tp-seg-btn' + (on ? ' active' : '') + '" ' +
          'data-mk-' + group + '="' + value + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
          (disabled ? ' disabled' : '') + '>' + label + '</button>';
      };
      body =
        '<div class="mk-pause-pick">' +
          '<div class="tp-seg" role="group" aria-label="When it starts">' +
            seg('from', 'today', 'From today', mkPauseFrom === 'today', earliest > today) +
            seg('from', 'tomorrow', 'From tomorrow', mkPauseFrom === 'tomorrow', false) +
          '</div>' +
          '<div class="tp-seg" role="group" aria-label="How long">' +
            PAUSE_LENGTHS.map(function (n) {
              return seg('days', n, n + ' days', mkPauseDays === n, false);
            }).join('') +
          '</div>' +
        '</div>' +
        '<button type="button" class="ob-btn ob-btn-go" data-mk-act="startpause">Start pause</button>';
    }
  }

  return '<section class="rw-board mk-item">' +
    '<div class="mk-item-head">' + mkPauseArt() +
      '<div class="mk-item-text">' +
        '<h3 class="rw-h">Pause <span class="mk-free">Free</span></h3>' +
        '<p class="rw-sub">Exam week, sick, away? Pause the whole garden for up to ' + PAUSE_MAX_DAYS +
          ' days. Habits are not due while it lasts, so streaks wait for you. You can still tick ' +
          'anything you do.</p>' +
      '</div>' +
    '</div>' +
    '<div class="mk-item-foot mk-pause-foot">' + body + '</div>' +
    '<p class="mk-fine">Starts today or tomorrow, never backdated. After one ends, the next can start ' +
      PAUSE_COOLDOWN_DAYS + ' days later.</p>' +
  '</section>';
}

function renderMarketPage() {
  if (!marketContentEl) return;
  marketContentEl.innerHTML =
    '<header class="rw-header">' +
      '<div class="rw-header-text">' +
        '<h2 class="rw-title">Market</h2>' +
        '<p class="rw-subtitle">Dew you earn by showing up, spent on things that help you keep ' +
          'showing up. Nothing here makes a plant grow - only real days do that.</p>' +
        '<div class="rw-balance">' + dewDropIcon() + '<strong>' + wallet.bal + '</strong> Dew' +
          '<button type="button" class="rw-link" data-mk-go="rewards">More ways to earn</button></div>' +
      '</div>' +
    '</header>' +
    '<h3 class="mk-shelf">Protect your streaks</h3>' +
    mkMulchHtml() +
    mkPauseHtml() +
    '<h3 class="mk-shelf">Decorate</h3>' +
    '<button type="button" class="rw-board mk-link" data-mk-go="greenhouse">' +
      '<span class="mk-link-text"><b>Skins and landscapes</b>' +
      '<span>New looks for every plant and the whole garden are in the Greenhouse.</span></span>' +
      '<span class="mk-link-arrow" aria-hidden="true">&rarr;</span>' +
    '</button>';
}

if (marketContentEl) {
  marketContentEl.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button');
    if (!btn || btn.disabled) return;

    if (btn.hasAttribute('data-mk-go')) { navigateTo(btn.getAttribute('data-mk-go')); return; }

    var act = btn.getAttribute('data-mk-act');
    if (act === 'buy') {
      if (mkArmed) { mkArmed = false; mkBuyMulch(); }
      else { mkArmed = true; renderMarketPage(); }
      return;
    }
    if (act === 'startpause') {
      var today = getTodayString();
      mkStartPause(mkPauseFrom === 'tomorrow' ? shiftDate(today, 1) : today, mkPauseDays);
      return;
    }
    if (act === 'endpause') { mkEndPause(); return; }

    if (btn.hasAttribute('data-mk-from')) { mkPauseFrom = btn.getAttribute('data-mk-from'); renderMarketPage(); return; }
    if (btn.hasAttribute('data-mk-days')) { mkPauseDays = parseInt(btn.getAttribute('data-mk-days'), 10); renderMarketPage(); }
  });
}

// A tap anywhere else disarms a half-made purchase.
document.addEventListener('click', function (e) {
  if (!mkArmed) return;
  if (e.target.closest && e.target.closest('[data-mk-act="buy"]')) return;
  mkArmed = false;
  if (currentPage === 'market' && authReady) renderMarketPage();
});


// ---- Wiring: navigation, render, the Greenhouse link -------------

if (typeof NAV_HASH_PAGES !== 'undefined' && NAV_HASH_PAGES.indexOf('market') === -1) {
  NAV_HASH_PAGES.push('market');
}

var mkBaseNavigateTo = navigateTo;
navigateTo = function (page) {
  var out = mkBaseNavigateTo.apply(this, arguments);
  if (pageMarketEl) pageMarketEl.classList.toggle('hidden', page !== 'market');
  if (page === 'market') {
    mkArmed = false;
    if (marketLoadingEl) marketLoadingEl.classList.toggle('hidden', authReady);
    if (marketContentEl) marketContentEl.classList.toggle('hidden', !authReady);
    if (authReady) renderMarketPage();
    if (pageMarketEl) pageMarketEl.scrollTop = 0;
  }
  return out;
};

var mkBaseRender = render;
render = function () {
  var out = mkBaseRender.apply(this, arguments);
  if (currentPage === 'market' && authReady) {
    if (marketLoadingEl) marketLoadingEl.classList.add('hidden');
    if (marketContentEl) marketContentEl.classList.remove('hidden');
    renderMarketPage();
  }
  return out;
};

// A way in from the Greenhouse, under the Dew balance it already shows.
var mkBaseRenderDewBalance = renderDewBalance;
renderDewBalance = function () {
  var out = mkBaseRenderDewBalance.apply(this, arguments);
  var el = document.getElementById('dewBalance');
  if (el && !el.querySelector('[data-mk-go]')) {
    el.insertAdjacentHTML('beforeend',
      '<button type="button" class="mk-gh-link" data-mk-go="market">' +
        'Mulch and Pause are in the Market &rarr;</button>');
  }
  return out;
};

document.addEventListener('click', function (e) {
  var link = e.target.closest && e.target.closest('.mk-gh-link');
  if (link) navigateTo('market');
});


// ---- The account export (10) ------------------------------------

function mkWrapExport() {
  if (typeof buildAccountExport !== 'function' || buildAccountExport.mkWrapped) return;
  var base = buildAccountExport;
  buildAccountExport = function () {
    var out = base.apply(this, arguments);
    var m = mkState();
    if (out.dew) {
      out.dew.market = {
        mulch_held:    m.mulch,
        mulch_covered: m.cov,
        pause:         m.pause,
        last_pause_ended: m.pend,
      };
    }
    return out;
  };
  buildAccountExport.mkWrapped = true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', mkWrapExport);
}
