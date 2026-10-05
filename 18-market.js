// ============================================
// 18: MARKET - the Greenhouse's Booster Market: Mulch and Fertilizer
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
//   Fertilizer  Bought with Dew, held (at most FERT_MAX_HELD), and put on
//           one plant you choose. For FERT_DAYS days, starting the day it
//           goes on, every tick on that plant grows FERT_BONUS more on
//           top of its effort: Steady x1.25, Hard x1.75, All out x2.25.
//           A day that is not ticked gets nothing. One bag per plant at
//           a time; undoable on the day it went on.
//
// (Pause, a free streak freeze, shipped and was removed on 5 October
// 2026. Its days stop counting as due here no longer; a garden that
// still has one stored simply drops it on load.)
//
// WHAT DEW CAN AND CANNOT DO TO A PLANT
// Dew never buys growth BY ITSELF. Mulch gives the ordinary tick for a
// day the user says they did, logged late. Fertilizer makes the user's
// own ticks worth more for a week - it does nothing on a day nobody
// ticked. There is no item that adds a day nobody claims to have done.
// See ROADMAP.md (invariants).
//
// HOW FERTILIZER COUNTS
// growthBonusOn() in 01 is the one place a day's extra multiplier comes
// from, and dayMultiplier() adds it to the effort everywhere a day turns
// into growth - the tick, the show/hide toggle, the 7-day gain, the
// charts, a late log. This file reassigns growthBonusOn() to answer
// FERT_BONUS for a date inside one of the plant's fed weeks. The weeks
// are kept (MULCH_KEEP_DAYS) so the charts can still read old ones.
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
var MULCH_MAX_HELD     = 10;
var MULCH_GAP_DAYS     = 7;    // one per plant per week
var MULCH_HELD_CEILING = MULCH_MAX_HELD + 1;  // a hand-back can top a full sack up by one
var MULCH_LOG_MAX      = 6;    // recent saves shown on the page
var MULCH_KEEP_DAYS    = 400;  // covered days older than this are dropped

var FERT_PRICE    = 40;
var FERT_MAX_HELD = 10;
var FERT_DAYS     = 7;
var FERT_BONUS    = 0.25;
var FERT_HELD_CEILING = FERT_MAX_HELD + 1;

// ---- State ------------------------------------------------------

function mkEmpty() {
  return {
    mulch: 0,     // held
    cov:   {},    // taskId -> [covered dates]
    log:   [],    // [{ t: taskId, d: date, s: streak saved }], newest last
    use:   null,  // { d: today, p: { taskId: date } } - Mulch spent by hand today, so it can be undone
    fz:    0,     // Fertilizer bags held
    fert:  {},    // taskId -> [{ f, t }] fed weeks, inclusive
    fuse:  null,  // { d: today, p: { taskId: true } } - bags put on today, so they can be undone
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
  m.fz = Math.max(0, Math.min(FERT_HELD_CEILING, Math.round(Number(raw.fz)) || 0));
  if (raw.fert && typeof raw.fert === 'object') {
    for (var fid in raw.fert) {
      if (!Object.prototype.hasOwnProperty.call(raw.fert, fid) || !/^\d+$/.test(fid)) continue;
      if (!Array.isArray(raw.fert[fid])) continue;
      var weeks = raw.fert[fid].filter(function (w) {
        return w && mkIsDay(w.f) && mkIsDay(w.t) && w.f <= w.t && dayGap(w.f, w.t) < FERT_DAYS;
      }).map(function (w) { return { f: w.f, t: w.t }; }).slice(-60);
      if (weeks.length) m.fert[fid] = weeks;
    }
  }
  if (raw.fuse && raw.fuse.d === getTodayString() && raw.fuse.p && typeof raw.fuse.p === 'object') {
    m.fuse = { d: raw.fuse.d, p: {} };
    for (var uk in raw.fuse.p) {
      if (Object.prototype.hasOwnProperty.call(raw.fuse.p, uk) && /^\d+$/.test(uk) && raw.fuse.p[uk]) m.fuse.p[uk] = true;
    }
  }
  return m;
}

function mkState() {
  if (typeof wallet === 'undefined') return mkEmpty();
  if (!wallet.mk) wallet.mk = mkEmpty();
  var m = wallet.mk;
  if (m.use && m.use.d !== getTodayString()) m.use = null;
  if (m.fuse && m.fuse.d !== getTodayString()) m.fuse = null;
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
  out.mk.fz = m.fz;
  var fert = {};
  for (var fid in m.fert) {
    if (!Object.prototype.hasOwnProperty.call(m.fert, fid) || !live[fid]) continue;
    var weeks = m.fert[fid].filter(function (w) { return w.t >= keep; });
    if (weeks.length) fert[fid] = weeks.map(function (w) { return { f: w.f, t: w.t }; });
  }
  if (Object.keys(fert).length) out.mk.fert = fert;
  if (m.fuse && Object.keys(m.fuse.p).length) out.mk.fuse = { d: m.fuse.d, p: Object.assign({}, m.fuse.p) };
  return out;
};


// ---- Fertilizer: which days are fed -----------------------------

function mkFedWeek(task, dateStr) {
  var list = task && mkState().fert[String(task.id)];
  if (!list) return null;
  for (var i = 0; i < list.length; i++) {
    if (dateStr >= list[i].f && dateStr <= list[i].t) return list[i];
  }
  return null;
}

growthBonusOn = function (task, dateStr) {
  return mkFedWeek(task, dateStr) ? FERT_BONUS : 0;
};

function mkFedToday(task) { return !!mkFedWeek(task, getTodayString()); }

function mkFedTodayByHand(task) {
  var m = mkState();
  return !!task && !!m.fuse && !!m.fuse.p[String(task.id)] && mkFedToday(task);
}

// Every plant can take a bag, as long as it is not already fed.
function mkCanFeed(task) {
  return !!task && !mkFedToday(task);
}

// Putting a bag on, and taking it back off the same day, both move the
// plant through retuneAward() in 01: if today's tick is still live, the
// plant has to carry exactly what that tick is worth NOW, fed or not.
function mkUseFert(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  var m = mkState();
  if (m.fz <= 0 || !mkCanFeed(task)) return false;
  var today = getTodayString();
  var prevAward = taskCompletionAward(task);
  var id = String(task.id);
  m.fert[id] = (m.fert[id] || []).concat([{ f: today, t: shiftDate(today, FERT_DAYS - 1) }]);
  m.fz--;
  if (!m.fuse) m.fuse = { d: today, p: {} };
  m.fuse.p[id] = true;
  retuneAward(task, prevAward);
  if (typeof dewToast === 'function') dewToast(task.text + ' is fed for ' + FERT_DAYS + ' days');
  saveData();
  render();
  return true;
}

function mkUndoFert(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!mkFedTodayByHand(task)) return false;
  var m = mkState();
  var today = getTodayString();
  var id = String(task.id);
  var prevAward = taskCompletionAward(task);
  m.fert[id] = m.fert[id].filter(function (w) { return w.f !== today; });
  if (!m.fert[id].length) delete m.fert[id];
  delete m.fuse.p[id];
  m.fz = Math.min(FERT_HELD_CEILING, m.fz + 1);
  retuneAward(task, prevAward);
  if (typeof dewToast === 'function') dewToast('Fertilizer back in the shed');
  saveData();
  render();
  return true;
}


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



// ---- Buying ------------------------------------------------------

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

function mkBuyFert() {
  var m = mkState();
  if (m.fz >= FERT_MAX_HELD) return false;
  if (wallet.bal < FERT_PRICE) return false;
  wallet.bal   -= FERT_PRICE;
  wallet.spent += FERT_PRICE;
  m.fz++;
  dewToast('Fertilizer in the shed (' + m.fz + ' of ' + FERT_MAX_HELD + ')');
  saveData();
  render();
  return true;
}


// ---- The Greenhouse's two markets --------------------------------
// The Greenhouse page holds both shops, as two tabs under one Dew
// balance: the Decoration Market (the plant cards, skins and
// landscapes 05 already draws) and the Booster Market (Mulch and
// Fertilizer, drawn here). There is no separate Market page: "#market" and
// navigateTo('market') still work, and open the Greenhouse on the
// Booster tab.
//
// The tab bar and the Booster panel are built here rather than in
// index.html, and the Decoration panel is made by moving 05's own
// elements into a wrapper - so removing this script tag puts the
// Greenhouse back exactly as it was.

var mkArmed = null;         // 'mulch' | 'fert' - two taps to buy, the same as a shop tile
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

function mkFertArt() {
  return '<svg class="bm-art-svg" viewBox="0 0 64 64" aria-hidden="true">' +
    '<ellipse cx="32" cy="57" rx="22" ry="4.5" style="fill:var(--bark-deep,#5E4632);opacity:0.25"/>' +
    '<path d="M16 24 L48 24 L51 52 C51 55 49 56 46 56 L18 56 C15 56 13 55 13 52 Z" style="fill:var(--sun,#E8B75C)"/>' +
    '<path d="M16 24 L48 24 L47 30 L17 30 Z" style="fill:var(--sun-deep,#C4913A)"/>' +
    '<path d="M19 24 C19 18 23 15 26 18 C28 13 36 13 38 18 C41 15 45 18 45 24 Z" style="fill:var(--bark,#7A5C42)"/>' +
    '<path d="M32 50 L32 38" style="fill:none;stroke:var(--leaf-deep,#5C8149);stroke-width:2.6;stroke-linecap:round"/>' +
    '<path d="M32 41 C27 41 24 38 24 34 C29 34 32 37 32 41 Z" style="fill:var(--leaf,#7FA968)"/>' +
    '<path d="M32 39 C37 39 40 36 40 32 C35 32 32 35 32 39 Z" style="fill:var(--leaf,#7FA968)"/>' +
    '<path d="M50 10 L51.4 14 L55.5 15.4 L51.4 16.8 L50 21 L48.6 16.8 L44.5 15.4 L48.6 14 Z" style="fill:var(--sun,#E8B75C)"/>' +
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
  } else {
    buy = bmBuyButton('mulch', MULCH_PRICE);
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
      '<span class="bm-held"><b>' + m.mulch + '</b> in your shed</span>' +
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

// The two-tap buy button both items share. `item` is what the first
// tap arms, so arming Mulch never arms Fertilizer.
function bmBuyButton(item, price) {
  var armed = mkArmed === item;
  var short = Math.max(0, price - wallet.bal);
  if (armed && short > 0) {
    return '<button type="button" class="bm-buy" disabled>Need ' + short + ' more Dew</button>';
  }
  return '<button type="button" class="bm-buy' + (armed ? ' is-armed' : '') + '" data-mk-act="buy" data-mk-item="' + item + '">' +
    (armed ? 'Tap again to buy' : 'Buy for ' + dewDropIcon() + price) + '</button>';
}

function mkFertHtml() {
  var m = mkState();
  var buy = m.fz >= FERT_MAX_HELD ? '<span class="bm-note">Shed full</span>' : bmBuyButton('fert', FERT_PRICE);


  // Every plant, fed ones first: what is fed and until when is the
  // thing worth seeing at a glance.
  var list = tasks.slice();
  if (typeof tpSortHabits === 'function') list = tpSortHabits(list);
  list.sort(function (a, b) { return (mkFedToday(b) ? 1 : 0) - (mkFedToday(a) ? 1 : 0); });
  var rows = list.map(function (t) {
    var week = mkFedWeek(t, getTodayString());
    var ctl;
    if (week && mkFedTodayByHand(t)) {
      ctl = '<span class="bm-done">Fed</span>' +
        '<button type="button" class="yd-undo" data-mk-act="unfeed" data-mk-id="' + t.id + '">Undo</button>';
    } else if (week) {
      ctl = '<span class="bm-done">Fed</span>';
    } else if (m.fz > 0) {
      ctl = '<button type="button" class="ob-btn ob-btn-go bm-use" data-mk-act="feed" data-mk-id="' +
        t.id + '">Feed</button>';
    } else {
      ctl = '';
    }
    return '<li class="bm-row' + (week ? ' is-fed' : '') + '">' +
      '<span class="bm-row-name">' + escapeHtml(t.text) +
        '<small>' + (week ? 'Every tick \u00d7' + (1 + FERT_BONUS) + ' or more until ' + mkShortDate(week.t)
                          : getCategoryById(t.categoryId).species) + '</small></span>' +
      ctl +
    '</li>';
  }).join('');

  return '<article class="bm-card">' +
    bmHead(mkFertArt(), 'Fertilizer', 'Booster',
      '<span class="bm-price">' + dewDropIcon() + FERT_PRICE + '</span>',
      'Feed one plant for a week. Every tick on it grows a quarter more: Steady \u00d71.25, ' +
      'Hard \u00d71.75, All out \u00d72.25. A day you do not tick gets nothing.') +
    bmFacts([FERT_DAYS + ' days', '+' + FERT_BONUS + ' on every tick', 'One bag per plant', 'Hold up to ' + FERT_MAX_HELD]) +
    '<div class="bm-action">' +
      '<span class="bm-held"><b>' + m.fz + '</b> in your shed</span>' +
      buy +
    '</div>' +
    '<div class="bm-use-on">' +
      '<h4>Feed a plant</h4>' +
      (rows
        ? '<ul class="bm-rows">' + rows + '</ul>'
        : '<p class="bm-empty">Plant something first.</p>') +
      (m.fz <= 0 && rows ? '<p class="bm-empty bm-hint">Buy a bag to feed one.</p>' : '') +
    '</div>' +
  '</article>';
}

// The Booster Market panel.
function renderMarketPage() {
  var el = ghBoosterEl();
  if (!el) return;
  el.innerHTML =
    '<p class="gh-panel-lede">Boosters help you keep showing up. Nothing here grows a plant by ' +
      'itself - only real days do that.</p>' +
    '<div class="bm-grid">' + mkMulchHtml() + mkFertHtml() + '</div>';
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
      '<span class="gh-tab-sub">Mulch and Fertilizer</span></button>';
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
    mkArmed = null;
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
    var item = btn.getAttribute('data-mk-item');
    if (mkArmed === item) {
      mkArmed = null;
      if (item === 'fert') mkBuyFert(); else mkBuyMulch();
    } else {
      mkArmed = item;
      renderMarketPage();
    }
    return;
  }
  var id = parseInt(btn.getAttribute('data-mk-id'), 10);
  if (act === 'feed')   { mkUseFert(id); return; }
  if (act === 'unfeed') { mkUndoFert(id); return; }
});

// A tap anywhere else disarms a half-made purchase.
document.addEventListener('click', function (e) {
  if (!mkArmed) return;
  if (e.target.closest && e.target.closest('[data-mk-act="buy"]')) return;
  mkArmed = null;
  if (currentPage === 'greenhouse' && ghTab === 'boost' && authReady) renderMarketPage();
});


// ---- A fed plant says so on the Tasks page ------------------------

if (typeof tpRowMeta === 'function') {
  var mkBaseTpRowMeta = tpRowMeta;
  tpRowMeta = function (task) {
    var bits = mkBaseTpRowMeta.apply(this, arguments);
    var week = mkFedWeek(task, getTodayString());
    if (week) bits.unshift({ text: 'Fertilized until ' + mkShortDate(week.t), tone: 'fed' });
    return bits;
  };
}


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
  if (page === 'greenhouse' && currentPage !== 'greenhouse') { mkArmed = null; ghTab = 'decor'; }
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
        fertilizer_held: m.fz,
        fertilizer_weeks: m.fert,
      };
    }
    return out;
  };
  buildAccountExport.mkWrapped = true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', mkWrapExport);
}
