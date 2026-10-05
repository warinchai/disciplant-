// ============================================
// 18: MARKET - things Dew can do, not just wear
// Part of DISCIPLANT. Plain global script, loaded after 15 (it spends
// through the wallet and rides on its save), 16 and 17 (it wraps the
// yesterday fix), and before 11.
// ============================================
//
// WHAT IS HERE
//   Mulch   Bought with Dew, held (at most MULCH_MAX_HELD), and the only
//           way to log a day after it has gone: a habit that was due
//           yesterday and not ticked can be logged late by spending one
//           bag. The day, its growth, its streak and its tick Dew all
//           come back, exactly as if it had been ticked on time - this is
//           "Forgot to tick yesterday?" (17), with a price on it.
//           Yesterday only, until today ends, undoable in that window
//           (the bag comes back). One per plant per MULCH_GAP_DAYS.
//   Pause   Free. Up to PAUSE_MAX_DAYS for exam week, illness, a trip:
//           no habit is due on a paused day, so nothing can be missed.
//           Starts today or tomorrow - never in the past - and the next
//           one can start PAUSE_COOLDOWN_DAYS after the last one ended.
//
// WHAT DEW CAN AND CANNOT DO TO A PLANT
// Dew never buys growth BY ITSELF. The only growth Mulch gives is the
// ordinary tick for a day the user says they did, logged late - the
// same tick, at the same size, that ticking it on time would have
// given. There is no item that adds a day nobody claims to have done,
// and none that makes a tick worth more. See ROADMAP.md (invariants).
//
// HOW A PAUSED DAY STOPS COUNTING
// isScheduledOn() and wasDueOn() in 01 answer "no" for a paused day.
// Everything that decides whether a day was missed - the rollover, the
// streak count in 17, the heatmap's denominator, the Tasks page's "due
// today" - already asks those two, so none of it had to change.
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
    use:   null,  // { d: today, p: { taskId: date } } - Mulch spent by hand today, so it can be undone
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
  if (raw.use && raw.use.d === getTodayString() && raw.use.p && typeof raw.use.p === 'object') {
    m.use = { d: raw.use.d, p: {} };
    for (var k in raw.use.p) {
      if (Object.prototype.hasOwnProperty.call(raw.use.p, k) && /^\d+$/.test(k) && mkIsDay(raw.use.p[k])) {
        m.use.p[k] = raw.use.p[k];
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
  if (m.use && m.use.d !== getTodayString()) m.use = null;
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
  if (m.use && Object.keys(m.use.p).length) out.mk.use = { d: m.use.d, p: Object.assign({}, m.use.p) };
  if (m.pause)                 out.mk.pause = { from: m.pause.from, to: m.pause.to };
  if (m.pend)                  out.mk.pend = m.pend;
  return out;
};


// ---- Which days count -------------------------------------------

function mkPaused(dateStr) {
  var p = mkState().pause;
  return !!p && dateStr >= p.from && dateStr <= p.to;
}

var mkBaseIsScheduledOn = isScheduledOn;
isScheduledOn = function (task, dateStr) {
  if (!mkBaseIsScheduledOn.apply(this, arguments)) return false;
  return !mkPaused(dateStr);
};

// The heatmap's denominator (05) asks this one rather than
// isScheduledOn, so it gets the same exception: a paused day was never
// owed, so it is not a missed square.
var mkBaseWasDueOn = wasDueOn;
wasDueOn = function (task, dateStr) {
  if (!mkBaseWasDueOn.apply(this, arguments)) return false;
  return !mkPaused(dateStr);
};


// ---- Logging yesterday with Mulch (wraps 17) ---------------------
//
// `cov` holds, per plant, the days that were logged with a bag - what
// the weekly limit is counted from, and what the page lists.

function mkMulched(task, dateStr) {
  var list = task && mkState().cov[String(task.id)];
  return !!list && list.indexOf(dateStr) !== -1;
}

// No bag used on this plant in the MULCH_GAP_DAYS before `day` - which
// is also what rules out two days in a row.
function mkMayCover(task, day) {
  var list = mkState().cov[String(task.id)] || [];
  var since = shiftDate(day, -MULCH_GAP_DAYS);
  return !list.some(function (d) { return d > since && d < day; }) && list.indexOf(day) === -1;
}

function mkRecord(task, day) {
  var m = mkState();
  var id = String(task.id);
  m.cov[id] = (m.cov[id] || []).concat([day]).sort();
}

function mkUnrecord(task, day) {
  var m = mkState();
  var id = String(task.id);
  if (!m.cov[id]) return;
  m.cov[id] = m.cov[id].filter(function (d) { return d !== day; });
  if (!m.cov[id].length) delete m.cov[id];
}

// Yesterday was logged with a bag today, so it can still be undone.
function mkUsedToday(task) {
  var m = mkState();
  return !!task && !!m.use && m.use.p[String(task.id)] === ydDay() && mkMulched(task, ydDay());
}

// A missed yesterday the card should OFFER to log: everything 17 asks,
// plus the weekly limit. Whether a bag is in the shed is asked
// separately, so the offer can point at the Market rather than vanish.
function mkCanMulch(task) {
  if (!task || task.kind === 'once' || typeof ydCanFix !== 'function') return false;
  return ydCanFix(task) && mkMayCover(task, ydDay());
}

// The one way in. Spends a bag, then hands over to 17's fix, which
// writes the day, grows the plant, rebuilds the streak and pays the
// tick Dew - all exactly as a tick on time would have.
function mkUseMulch(taskId, level) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  var m = mkState();
  if (m.mulch <= 0 || !mkCanMulch(task)) return false;
  var y = ydDay();
  // The bag is taken before 17 saves, so that save carries it - and the
  // day is recorded only after, because a recorded day is one the
  // weekly limit (and so ydCanFix) refuses.
  m.mulch--;
  var ok = mkBaseYdFix(taskId, level || EFFORT_DEFAULT);
  if (!ok) { m.mulch++; return false; }
  mkRecord(task, y);
  if (!m.use) m.use = { d: getTodayString(), p: {} };
  m.use.p[String(task.id)] = y;
  if (typeof dewToast === 'function') dewToast('1 Mulch used · ' + m.mulch + ' left');
  m.log.push({ t: task.id, d: y, s: task.streak });
  m.log = m.log.slice(-MULCH_LOG_MAX);
  saveData();
  render();
  return true;
}

function mkUndoMulch(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!mkUsedToday(task)) return false;
  var m = mkState();
  var y = ydDay();
  if (!mkBaseYdUndo(taskId)) return false;
  mkUnrecord(task, y);
  delete m.use.p[String(task.id)];
  m.mulch = Math.min(MULCH_HELD_CEILING, m.mulch + 1);
  m.log = m.log.filter(function (e) { return !(e.t === task.id && e.d === y); });
  if (typeof dewToast === 'function') dewToast('Mulch back in the shed');
  saveData();
  render();
  return true;
}

// 17 stays the engine; these make its own entry points go through a
// bag. A free fix is no longer something the app offers - ydFix and
// ydUndo now mean "with Mulch".
var mkBaseYdFix  = ydFix;
var mkBaseYdUndo = ydUndo;
ydFix  = function (taskId, level) { return mkUseMulch(taskId, level); };
ydUndo = function (taskId) { return mkUndoMulch(taskId); };

// A late log with no bag behind it is not undoable through Mulch, and
// is not "fixed" for the card either - only today's bags are.
var mkBaseYdIsFixed = ydIsFixed;
ydIsFixed = function (task) {
  return mkBaseYdIsFixed.apply(this, arguments) && mkUsedToday(task);
};

// The weekly limit hides a plant from the card altogether: offering a
// button that cannot work is worse than not offering it.
var mkBaseYdCanFix = ydCanFix;
ydCanFix = function (task) {
  if (!mkBaseYdCanFix.apply(this, arguments)) return false;
  return mkMayCover(task, ydDay());
};

// The card and the sheet in 17 draw their controls through
// ydControlsHtml. With a bag in the shed the button spends one; with
// none it points at the Market instead. Once used, 17's own
// effort-and-Undo controls take over.
var mkBaseYdControlsHtml = ydControlsHtml;
ydControlsHtml = function (task) {
  if (ydIsFixed(task)) return mkBaseYdControlsHtml.apply(this, arguments);
  var held = mkState().mulch;
  if (held > 0) {
    return '<button type="button" class="ob-btn ob-btn-go yd-fix" data-yd-act="fix" data-yd-id="' +
      task.id + '">' + mkMulchIcon() + ' Use Mulch to log it <span class="mk-left">(' + held + ' left)</span></button>';
  }
  return '<button type="button" class="ob-btn ob-btn-quiet yd-fix mk-yd-buy">Get Mulch to log it</button>';
};

var mkBaseYdPromiseText = ydPromiseText;
ydPromiseText = function (task) {
  var base = mkBaseYdPromiseText.apply(this, arguments);
  return base + ' \u00b7 costs 1 Mulch';
};

function mkMulchIcon() {
  return '<svg class="mk-mini" viewBox="0 0 16 16" aria-hidden="true">' +
    '<path d="M3 5 C3 4 4 3.5 5 3.5 L11 3.5 C12 3.5 13 4 13 5 L13.7 12.5 C13.7 13.4 13 14 12 14 L4 14 C3 14 2.3 13.4 2.3 12.5 Z" style="fill:var(--clay,#E7CDA6)"/>' +
    '<path d="M6 11 C6 9.4 7 8.4 8.5 8.4 C8.5 10 7.5 11 6 11 Z" style="fill:var(--leaf-dark,#47673A)"/>' +
  '</svg>';
}

// "Get Mulch" goes to the Market.
document.addEventListener('click', function (e) {
  var go = e.target.closest && e.target.closest('.mk-yd-buy');
  if (go) navigateTo('market');
});


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
    return '<li>' + mkShortDate(e.d) + ': logged ' + escapeHtml(mkTaskName(e.t)) +
      (e.s ? ' (' + e.s + '-day streak)' : '') + '</li>';
  }).join('');

  // The plants a bag could log right now - and any logged today, so
  // Undo is reachable from here too.
  var targets = tasks.filter(function (t) { return mkCanMulch(t) || mkUsedToday(t); });
  if (typeof tpSortHabits === 'function') targets = tpSortHabits(targets);
  var pick = targets.map(function (t) {
    var ctl;
    if (mkUsedToday(t)) {
      ctl = '<span class="mk-pick-done">Logged</span>' +
        '<button type="button" class="yd-undo mk-pick-undo" data-yd-act="undo" data-yd-id="' + t.id + '">Undo</button>';
    } else if (m.mulch > 0) {
      ctl = '<button type="button" class="ob-btn ob-btn-go mk-pick-use" data-yd-act="fix" data-yd-id="' +
        t.id + '">Use Mulch</button>';
    } else {
      ctl = '<span class="mk-pick-done">Buy a bag first</span>';
    }
    return '<li class="mk-pick">' +
      '<span class="mk-pick-name">' + escapeHtml(t.text) +
        '<span>' + (mkUsedToday(t) ? 'Logged for yesterday \u00b7 ' + t.streak + '-day streak'
          : 'Not ticked yesterday \u00b7 back to a ' + ydStreakFromHistory(t, ydDay()) + '-day streak') + '</span></span>' +
      ctl +
    '</li>';
  }).join('');

  return '<section class="rw-board mk-item">' +
    '<div class="mk-item-head">' + mkMulchArt() +
      '<div class="mk-item-text">' +
        '<h3 class="rw-h">Mulch</h3>' +
        '<p class="rw-sub">Did a habit yesterday but forgot to tick it? A bag of Mulch logs it late: ' +
          'the day, its growth and its streak all come back, as if you had ticked it on time.</p>' +
      '</div>' +
    '</div>' +
    '<div class="mk-item-foot">' +
      '<span class="mk-held" aria-label="' + m.mulch + ' held">' + pips +
        '<span>' + m.mulch + ' in the shed</span></span>' +
      btn +
    '</div>' +
    (pick
      ? '<h4 class="mk-pick-title">Not ticked yesterday</h4><ul class="mk-picks">' + pick + '</ul>'
      : '<p class="mk-fine mk-none">Nothing to log today. When a habit goes unticked on a day it was due, ' +
        'it shows up here and under your tasks the next day.</p>') +
    '<p class="mk-fine">Hold up to ' + MULCH_MAX_HELD + '. Only for yesterday, and you can undo it until ' +
      'today ends - the bag comes back. One per plant per week. Only use it for something you really did: ' +
      'the plant is meant to show real days.</p>' +
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
          'showing up. Nothing here grows a plant by itself - only real days do that.</p>' +
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
