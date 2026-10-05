// ============================================
// 18: MARKET - the Greenhouse's Booster Market: Mulch and Pause
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
// WHERE IT LIVES
// A second tab on the Greenhouse page, beside the Decoration Market
// (skins and landscapes). See "The Greenhouse's two markets" below.
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


// ---- The Greenhouse's two markets --------------------------------
// The Greenhouse page holds both shops, as two tabs under one Dew
// balance: the Decoration Market (the plant cards, skins and
// landscapes 05 already draws) and the Booster Market (Mulch and
// Pause, drawn here). There is no separate Market page: "#market" and
// navigateTo('market') still work, and open the Greenhouse on the
// Booster tab.
//
// The tab bar and the Booster panel are built here rather than in
// index.html, and the Decoration panel is made by moving 05's own
// elements into a wrapper - so removing this script tag puts the
// Greenhouse back exactly as it was.

var mkArmed = false;        // two taps to buy, the same as a shop tile
var mkPauseFrom = 'today';  // 'today' | 'tomorrow'
var mkPauseDays = 7;
var ghTab = 'decor';        // 'decor' | 'boost'

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
  return '<svg class="bm-art-svg" viewBox="0 0 64 64" aria-hidden="true">' +
    '<ellipse cx="32" cy="57" rx="24" ry="4.5" style="fill:var(--bark-deep,#5E4632);opacity:0.25"/>' +
    '<path d="M12 22 C12 18 15 16 18 16 L46 16 C49 16 52 18 52 22 L55 50 C55 54 52 56 48 56 L16 56 C12 56 9 54 9 50 Z" style="fill:var(--clay-deep,#C39F73)"/>' +
    '<path d="M14 16 C20 10 44 10 50 16 C44 20 20 20 14 16 Z" style="fill:var(--bark,#7A5C42)"/>' +
    '<path d="M18 15 C24 8 40 8 46 15" style="fill:none;stroke:var(--bark-deep,#5E4632);stroke-width:2.4;stroke-linecap:round"/>' +
    '<rect x="17" y="30" width="30" height="14" rx="3" style="fill:var(--linen,#F8EEDC)"/>' +
    '<path d="M24 41 C24 36 27 33 32 33 C32 38 29 41 24 41 Z" style="fill:var(--leaf,#7FA968)"/>' +
    '<path d="M40 41 C40 36 37 33 32 33" style="fill:none;stroke:var(--leaf-deep,#5C8149);stroke-width:2;stroke-linecap:round"/>' +
  '</svg>';
}

function mkPauseArt() {
  return '<svg class="bm-art-svg" viewBox="0 0 64 64" aria-hidden="true">' +
    '<ellipse cx="32" cy="57" rx="22" ry="4.5" style="fill:var(--bark-deep,#5E4632);opacity:0.25"/>' +
    '<path d="M12 34 C12 21 21 12 32 12 C43 12 52 21 52 34 Z" style="fill:var(--dusk,#9C8FB8)"/>' +
    '<path d="M32 12 L32 53" style="fill:none;stroke:var(--bark,#7A5C42);stroke-width:3;stroke-linecap:round"/>' +
    '<path d="M12 34 C15.5 31 19 31 22 34 C25.5 31 28.5 31 32 34 C35.5 31 38.5 31 42 34 C45 31 48.5 31 52 34" style="fill:none;stroke:var(--linen,#F8EEDC);stroke-width:2;stroke-linecap:round"/>' +
    '<path d="M32 53 C32 57 27 57 27 53" style="fill:none;stroke:var(--bark,#7A5C42);stroke-width:3;stroke-linecap:round"/>' +
  '</svg>';
}

function bmFacts(list) {
  return '<ul class="bm-facts">' + list.map(function (f) {
    return '<li>' + f + '</li>';
  }).join('') + '</ul>';
}

function bmHead(art, name, tag, priceHtml, what) {
  return '<div class="bm-head">' +
      '<span class="bm-art">' + art + '</span>' +
      '<div class="bm-name">' +
        '<h3>' + name + '</h3>' +
        '<span class="bm-tag">' + tag + '</span>' +
      '</div>' +
      priceHtml +
    '</div>' +
    '<p class="bm-what">' + what + '</p>';
}

function mkMulchHtml() {
  var m = mkState();
  var full = m.mulch >= MULCH_MAX_HELD;
  var short = Math.max(0, MULCH_PRICE - wallet.bal);

  var buy;
  if (full) {
    buy = '<span class="bm-note">Shed full</span>';
  } else if (mkArmed && short > 0) {
    buy = '<button type="button" class="bm-buy" disabled>Need ' + short + ' more Dew</button>';
  } else {
    buy = '<button type="button" class="bm-buy' + (mkArmed ? ' is-armed' : '') + '" data-mk-act="buy">' +
      (mkArmed ? 'Tap again to buy' : 'Buy for ' + dewDropIcon() + MULCH_PRICE) + '</button>';
  }

  var pips = '';
  for (var i = 0; i < MULCH_MAX_HELD; i++) {
    pips += '<span class="mk-pip' + (i < m.mulch ? ' is-full' : '') + '"></span>';
  }

  // The plants a bag could log right now - and any logged today, so
  // Undo is reachable from here too.
  var targets = tasks.filter(function (t) { return mkCanMulch(t) || mkUsedToday(t); });
  if (typeof tpSortHabits === 'function') targets = tpSortHabits(targets);
  var rows = targets.map(function (t) {
    var ctl;
    if (mkUsedToday(t)) {
      ctl = '<span class="bm-done">Logged</span>' +
        '<button type="button" class="yd-undo" data-yd-act="undo" data-yd-id="' + t.id + '">Undo</button>';
    } else if (m.mulch > 0) {
      ctl = '<button type="button" class="ob-btn ob-btn-go bm-use" data-yd-act="fix" data-yd-id="' +
        t.id + '">Use Mulch</button>';
    } else {
      ctl = '<span class="bm-note">Buy a bag first</span>';
    }
    return '<li class="bm-row">' +
      '<span class="bm-row-name">' + escapeHtml(t.text) +
        '<small>' + (mkUsedToday(t) ? 'Logged for yesterday · ' + t.streak + '-day streak'
          : 'Not ticked yesterday · brings back a ' + ydStreakFromHistory(t, ydDay()) + '-day streak') +
        '</small></span>' +
      ctl +
    '</li>';
  }).join('');

  var recent = m.log.slice(-3).reverse().map(function (e) {
    return mkShortDate(e.d) + ': ' + escapeHtml(mkTaskName(e.t));
  }).join(' · ');

  return '<article class="bm-card">' +
    bmHead(mkMulchArt(), 'Mulch', 'Booster',
      '<span class="bm-price">' + dewDropIcon() + MULCH_PRICE + '</span>',
      'Did a habit yesterday but forgot to tick it? One bag logs it late, and the day, ' +
      'its growth and its streak all come back.') +
    bmFacts(['Yesterday only', 'Undo until midnight', 'One per plant a week', 'Hold up to ' + MULCH_MAX_HELD]) +
    '<div class="bm-action">' +
      '<span class="bm-held">' + pips + '<b>' + m.mulch + '</b> of ' + MULCH_MAX_HELD + ' in your shed</span>' +
      buy +
    '</div>' +
    '<div class="bm-use-on">' +
      '<h4>Use it on</h4>' +
      (rows
        ? '<ul class="bm-rows">' + rows + '</ul>'
        : '<p class="bm-empty">Nothing to log today. A habit you did not tick yesterday shows up here.</p>') +
    '</div>' +
    (recent ? '<p class="bm-recent">Recently: ' + recent + '</p>' : '') +
  '</article>';
}

function mkPauseHtml() {
  var m = mkState();
  var today = getTodayString();
  var action;

  if (m.pause) {
    var started = m.pause.from <= today;
    action = '<p class="bm-status">' + (started
        ? 'Paused until <b>' + mkShortDate(m.pause.to) + '</b>'
        : 'Starts <b>' + mkShortDate(m.pause.from) + '</b>, until <b>' + mkShortDate(m.pause.to) + '</b>') +
      '</p>' +
      '<button type="button" class="ob-btn ob-btn-quiet" data-mk-act="endpause">' +
        (started ? 'End pause' : 'Cancel') + '</button>';
  } else {
    var earliest = mkPauseEarliest();
    var tomorrow = shiftDate(today, 1);
    if (earliest > tomorrow) {
      action = '<p class="bm-status">Next pause from <b>' + mkShortDate(earliest) + '</b></p>';
    } else {
      if (earliest === tomorrow && mkPauseFrom === 'today') mkPauseFrom = 'tomorrow';
      var seg = function (group, value, label, on, disabled) {
        return '<button type="button" class="tp-seg-btn' + (on ? ' active' : '') + '" ' +
          'data-mk-' + group + '="' + value + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
          (disabled ? ' disabled' : '') + '>' + label + '</button>';
      };
      action =
        '<div class="bm-pick">' +
          '<div class="tp-seg" role="group" aria-label="When it starts">' +
            seg('from', 'today', 'Today', mkPauseFrom === 'today', earliest > today) +
            seg('from', 'tomorrow', 'Tomorrow', mkPauseFrom === 'tomorrow', false) +
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

  return '<article class="bm-card">' +
    bmHead(mkPauseArt(), 'Pause', 'Booster',
      '<span class="bm-price bm-free">Free</span>',
      'Exam week, sick or away? Pause your whole garden. No habit is due while it lasts, ' +
      'so no streak can break. You can still tick anything you do.') +
    bmFacts(['Up to ' + PAUSE_MAX_DAYS + ' days', 'Starts today or tomorrow', 'Next one ' + PAUSE_COOLDOWN_DAYS + ' days after']) +
    '<div class="bm-action bm-action-pause">' + action + '</div>' +
  '</article>';
}

// The Booster Market panel.
function renderMarketPage() {
  var el = ghBoosterEl();
  if (!el) return;
  el.innerHTML =
    '<p class="gh-panel-lede">Boosters help you keep showing up. Nothing here grows a plant by ' +
      'itself - only real days do that.</p>' +
    '<div class="bm-grid">' + mkMulchHtml() + mkPauseHtml() + '</div>';
}


// ---- Building the two tabs inside the Greenhouse -----------------

function ghBoosterEl() { return document.getElementById('ghBooster'); }

function ghEnsureTabs() {
  var content = document.getElementById('greenhouseContent');
  if (!content) return null;
  var tabs = document.getElementById('ghTabs');
  if (tabs) return tabs;

  var header = content.querySelector('.greenhouse-header');
  tabs = document.createElement('div');
  tabs.id = 'ghTabs';
  tabs.className = 'gh-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Greenhouse markets');
  tabs.innerHTML =
    '<button type="button" class="gh-tab" role="tab" id="ghTabDecor" data-gh-tab="decor" aria-controls="ghDecor">' +
      '<span class="gh-tab-name">Decoration Market</span>' +
      '<span class="gh-tab-sub">Skins and landscapes</span></button>' +
    '<button type="button" class="gh-tab" role="tab" id="ghTabBoost" data-gh-tab="boost" aria-controls="ghBooster">' +
      '<span class="gh-tab-name">Booster Market</span>' +
      '<span class="gh-tab-sub">Mulch and Pause</span></button>';
  if (header && header.nextSibling) content.insertBefore(tabs, header.nextSibling);
  else content.insertBefore(tabs, content.firstChild);

  // The Decoration panel is 05's own elements, moved into a wrapper.
  var decor = document.createElement('div');
  decor.id = 'ghDecor';
  decor.className = 'gh-panel';
  decor.setAttribute('role', 'tabpanel');
  decor.setAttribute('aria-labelledby', 'ghTabDecor');
  ['landscapePicker', 'greenhouseGrid', 'greenhouseEmpty'].forEach(function (id) {
    var node = document.getElementById(id);
    if (node) decor.appendChild(node);
  });
  content.appendChild(decor);

  var boost = document.createElement('div');
  boost.id = 'ghBooster';
  boost.className = 'gh-panel gh-booster';
  boost.setAttribute('role', 'tabpanel');
  boost.setAttribute('aria-labelledby', 'ghTabBoost');
  content.appendChild(boost);

  tabs.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-gh-tab]');
    if (!btn) return;
    ghTab = btn.getAttribute('data-gh-tab');
    mkArmed = false;
    renderGreenhouse();
  });
  return tabs;
}

function ghSyncTabs() {
  var tabs = ghEnsureTabs();
  if (!tabs) return;
  tabs.querySelectorAll('[data-gh-tab]').forEach(function (b) {
    var on = b.getAttribute('data-gh-tab') === ghTab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  var decor = document.getElementById('ghDecor');
  var boost = ghBoosterEl();
  if (decor) decor.classList.toggle('hidden', ghTab !== 'decor');
  if (boost) boost.classList.toggle('hidden', ghTab !== 'boost');
}

// The Dew balance belongs to both markets, so it sits above the tabs
// rather than inside the Decoration panel where 15 first puts it.
var mkBaseRenderDewBalance = renderDewBalance;
renderDewBalance = function () {
  var out = mkBaseRenderDewBalance.apply(this, arguments);
  var bal  = document.getElementById('dewBalance');
  var tabs = ghEnsureTabs();
  if (bal && tabs && bal.nextSibling !== tabs) tabs.parentNode.insertBefore(bal, tabs);
  return out;
};

var mkBaseRenderGreenhouse = renderGreenhouse;
renderGreenhouse = function () {
  ghEnsureTabs();
  var out = mkBaseRenderGreenhouse.apply(this, arguments);
  ghSyncTabs();
  if (ghTab === 'boost') renderMarketPage();
  return out;
};

// Clicks in the Booster panel. Logging and Undo buttons carry 17's
// data-yd-act and are handled by 17's own document listener.
document.addEventListener('click', function (e) {
  var panel = ghBoosterEl();
  if (!panel || !e.target.closest || !panel.contains(e.target)) return;
  var btn = e.target.closest('button');
  if (!btn || btn.disabled) return;

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

// A tap anywhere else disarms a half-made purchase.
document.addEventListener('click', function (e) {
  if (!mkArmed) return;
  if (e.target.closest && e.target.closest('[data-mk-act="buy"]')) return;
  mkArmed = false;
  if (currentPage === 'greenhouse' && ghTab === 'boost' && authReady) renderMarketPage();
});


// ---- Wiring: the old Market address, and every "go to the Market" --

// "#market" and navigateTo('market') open the Greenhouse on the
// Booster tab. Kept so the links in 17's card, and any bookmark from
// the day the Market had its own page, still land somewhere sensible.
if (typeof NAV_HASH_PAGES !== 'undefined' && NAV_HASH_PAGES.indexOf('market') === -1) {
  NAV_HASH_PAGES.push('market');
}

var mkBaseNavigateTo = navigateTo;
navigateTo = function (page) {
  if (page === 'market') {
    ghTab = 'boost';
    var args = Array.prototype.slice.call(arguments);
    args[0] = 'greenhouse';
    var out = mkBaseNavigateTo.apply(this, args);
    try { history.replaceState(null, '', '#greenhouse'); } catch (e) {}
    return out;
  }
  // Arriving at the Greenhouse any other way - the menu, the home sign,
  // "Spend it in the Greenhouse" - starts on Decoration, its front page.
  if (page === 'greenhouse' && currentPage !== 'greenhouse') { mkArmed = false; ghTab = 'decor'; }
  return mkBaseNavigateTo.apply(this, arguments);
};

// "Get Mulch to log it" under the Tasks page goes to the Booster tab.
document.addEventListener('click', function (e) {
  var go = e.target.closest && e.target.closest('.mk-yd-buy');
  if (go) navigateTo('market');
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
