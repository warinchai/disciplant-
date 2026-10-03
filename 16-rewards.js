// ============================================
// 16: REWARDS - more ways to earn Dew
// Part of DISCIPLANT. Plain global script, loaded after 15-wallet.js
// (it credits through dewCredit and rides on the wallet's save) and
// before 11.
// ============================================
//
// WHAT IS HERE
//   Morning dew   One collect a day, opened by ticking anything at
//                 all. Consecutive days climb a seven-step ladder
//                 (MORNING_LADDER) and the seventh fills the jar; a
//                 missed day starts the ladder again from the bottom.
//   Quests        Three for today, three for this week (Monday to
//                 Sunday), three for this month. Each one is a target
//                 and a Dew reward, collected by hand once it is met.
//   Lifelong      Badges. Each pays once, ever.
//
// EVERYTHING IS DERIVED, NOTHING IS COUNTED
// Every bit of progress is read back off what the garden already
// stores - the packed per-day history, doneAt on assignments,
// maxStreak, the category of each plant. There is no tick counter to
// keep in step with toggleTask(), no counter to drift, and history
// from before this file existed counts on day one. The only new state
// is which rewards have been COLLECTED, and that is a short list.
//
// COLLECTED IS FINAL
// A collected reward stays collected even if the tick behind it is
// later taken back, the same stance 15 takes on streak milestones:
// each one is collectable once per period, so the most a mis-tap can
// be worth is that one reward, once.
//
// STORAGE
// `wallet.rw` on gardens/{uid}, written by the same save that writes
// the rest of the wallet (see dewWalletPayload in 15). No new
// document, read, write or listener.
// ============================================


// ---- The numbers ------------------------------------------------

// Day 1 to day 7 of an unbroken run of morning collects.
var MORNING_LADDER = [2, 2, 3, 3, 4, 4, 10];

// progress(ctx) returns how far along the quest is; done at `target`.
// ctx is built once per render by rwContext() below.
var RW_QUESTS = {
  day: [
    { id: 'd3',    icon: 'tick',  title: 'Three ticks',        text: 'Tick off any 3 tasks today.',
      target: 3, dew: 3, progress: function (c) { return c.dayTicks; } },
    { id: 'dall',  icon: 'sun',   title: 'Clean sweep',        text: 'Finish every habit due today.',
      target: 1, dew: 4, progress: function (c) { return c.dayAllHabits ? 1 : 0; } },
    { id: 'dhard', icon: 'flame', title: 'Push through',       text: 'Log a tick as Hard or All out.',
      target: 1, dew: 2, progress: function (c) { return c.dayHard ? 1 : 0; } },
  ],
  week: [
    { id: 'w5',    icon: 'cal',   title: 'Five-day week',      text: 'Tick something on 5 different days.',
      target: 5, dew: 10, progress: function (c) { return c.weekDays; } },
    { id: 'w25',   icon: 'tick',  title: 'Busy bee',           text: 'Reach 25 ticks this week.',
      target: 25, dew: 10, progress: function (c) { return c.weekTicks; } },
    { id: 'wa2',   icon: 'scroll',title: 'Paper chase',        text: 'Finish 2 assignments this week.',
      target: 2, dew: 8, progress: function (c) { return c.weekAssign; } },
  ],
  month: [
    { id: 'm20',   icon: 'cal',   title: 'Showing up',         text: 'Tick something on 20 different days.',
      target: 20, dew: 30, progress: function (c) { return c.monthDays; } },
    { id: 'm100',  icon: 'tick',  title: 'A hundred ticks',    text: 'Reach 100 ticks this month.',
      target: 100, dew: 25, progress: function (c) { return c.monthTicks; } },
    { id: 'ma5',   icon: 'scroll',title: 'Desk cleared',       text: 'Finish 5 assignments this month.',
      target: 5, dew: 20, progress: function (c) { return c.monthAssign; } },
  ],
};

var RW_BADGES = [
  { id: 'first',  icon: 'sprout', title: 'First drop',     text: 'Tick your very first task.',
    target: 1,    dew: 5,  progress: function (c) { return c.lifeTicks; } },
  { id: 't100',   icon: 'leaves', title: 'Green thumb',    text: '100 ticks, all time.',
    target: 100,  dew: 15, progress: function (c) { return c.lifeTicks; } },
  { id: 't500',   icon: 'tree',   title: 'Old growth',     text: '500 ticks, all time.',
    target: 500,  dew: 40, progress: function (c) { return c.lifeTicks; } },
  { id: 't1000',  icon: 'crown',  title: 'Master gardener',text: '1,000 ticks, all time.',
    target: 1000, dew: 80, progress: function (c) { return c.lifeTicks; } },
  { id: 's7',     icon: 'flame',  title: 'Week unbroken',  text: 'Any habit on a 7-day streak.',
    target: 7,    dew: 5,  progress: function (c) { return c.bestStreak; } },
  { id: 's30',    icon: 'flame2', title: 'Month unbroken', text: 'Any habit on a 30-day streak.',
    target: 30,   dew: 15, progress: function (c) { return c.bestStreak; } },
  { id: 's100',   icon: 'flame3', title: 'Evergreen',      text: 'Any habit on a 100-day streak.',
    target: 100,  dew: 40, progress: function (c) { return c.bestStreak; } },
  { id: 'p5',     icon: 'pots',   title: 'Full bench',     text: 'Have 5 plants growing.',
    target: 5,    dew: 10, progress: function (c) { return c.plants; } },
  { id: 'cats',   icon: 'plots',  title: 'Every plot',     text: 'A plant in every one of the plots.',
    target: 1,    dew: 25, progress: function (c) { return c.catsPlanted; }, targetFn: function (c) { return c.catsTotal; } },
  { id: 'a10',    icon: 'scroll', title: 'Ten done',       text: 'Finish 10 assignments.',
    target: 10,   dew: 15, progress: function (c) { return c.lifeAssign; } },
  { id: 'friend', icon: 'friend', title: 'Good company',   text: 'Add your first friend.',
    target: 1,    dew: 10, progress: function (c) { return c.friends; } },
  { id: 'spend',  icon: 'drop',   title: 'First purchase', text: 'Spend Dew in the Greenhouse.',
    target: 1,    dew: 5,  progress: function (c) { return c.spent > 0 ? 1 : 0; } },
];

var RW_TIERS = [
  { key: 'day',   title: 'Today',      icon: 'sun'  },
  { key: 'week',  title: 'This week',  icon: 'sprig' },
  { key: 'month', title: 'This month', icon: 'moon' },
];


// ---- State ------------------------------------------------------

function rwEmpty() {
  return {
    mday: null,  // last day Morning dew was collected
    mrun: 0,     // which ladder step that collect was (1-7)
    d: null, dc: [],   // today's key, quests collected today
    w: null, wc: [],   // this week's Monday, quests collected this week
    m: null, mc: [],   // this month (YYYY-MM), quests collected this month
    life: [],          // badges collected, ever
  };
}

function rwIdsFrom(list, allowed) {
  var out = [];
  if (!Array.isArray(list)) return out;
  list.forEach(function (id) {
    if (typeof id === 'string' && allowed.indexOf(id) !== -1 && out.indexOf(id) === -1) out.push(id);
  });
  return out;
}

function rwIds(defs) { return defs.map(function (q) { return q.id; }); }

// Same stance as dewNormalizeWallet: the document is browser-writable,
// so anything odd becomes something sane here.
function rwNormalize(raw) {
  var r = rwEmpty();
  if (!raw || typeof raw !== 'object') return r;
  var isDay = function (s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); };
  r.mday = isDay(raw.mday) ? raw.mday : null;
  r.mrun = Math.max(0, Math.min(MORNING_LADDER.length, Math.round(Number(raw.mrun)) || 0));
  r.d  = isDay(raw.d) ? raw.d : null;
  r.w  = isDay(raw.w) ? raw.w : null;
  r.m  = (typeof raw.m === 'string' && /^\d{4}-\d{2}$/.test(raw.m)) ? raw.m : null;
  r.dc = rwIdsFrom(raw.dc, rwIds(RW_QUESTS.day));
  r.wc = rwIdsFrom(raw.wc, rwIds(RW_QUESTS.week));
  r.mc = rwIdsFrom(raw.mc, rwIds(RW_QUESTS.month));
  r.life = rwIdsFrom(raw.life, rwIds(RW_BADGES));
  return r;
}

function rwState() {
  if (!wallet.rw) wallet.rw = rwEmpty();
  rwRoll(wallet.rw);
  return wallet.rw;
}

function rwWeekStart(dateStr) {
  return shiftDate(dateStr, -((dayOfWeek(dateStr) + 6) % 7));   // Monday
}

// A new day, week or month empties that period's collected list.
function rwRoll(r) {
  var today = getTodayString();
  var week  = rwWeekStart(today);
  var month = today.slice(0, 7);
  if (r.d !== today) { r.d = today; r.dc = []; }
  if (r.w !== week)  { r.w = week;  r.wc = []; }
  if (r.m !== month) { r.m = month; r.mc = []; }
}

// Ride on the wallet: in through the normalizer, out through the
// payload. 15 calls both by name, so reassigning them is enough.
var rwBaseNormalizeWallet = dewNormalizeWallet;
dewNormalizeWallet = function (raw) {
  var w = rwBaseNormalizeWallet.apply(this, arguments);
  w.rw = rwNormalize(raw && raw.rw);
  return w;
};

var rwBaseWalletPayload = dewWalletPayload;
dewWalletPayload = function () {
  var out = rwBaseWalletPayload.apply(this, arguments);
  var r = rwState();
  out.rw = {
    mday: r.mday, mrun: r.mrun,
    d: r.d, dc: r.dc.slice(),
    w: r.w, wc: r.wc.slice(),
    m: r.m, mc: r.mc.slice(),
    life: r.life.slice(),
  };
  return out;
};


// ---- Reading progress off the garden ----------------------------

// Every date from `from` to `to`, inclusive. Only ever asked for a
// week or a month, so at most 31 entries.
function rwDates(from, to) {
  var out = [];
  for (var d = from; d <= to && out.length < 40; d = shiftDate(d, 1)) out.push(d);
  return out;
}

function rwTicksIn(dates) {
  var ticks = 0, days = 0;
  dates.forEach(function (d) {
    var n = 0;
    tasks.forEach(function (t) { if (histGet(t.history, d)) n++; });
    ticks += n;
    if (n > 0) days++;
  });
  return { ticks: ticks, days: days };
}

// Every completed day in every year of every plant.
function rwLifetimeTicks() {
  var n = 0;
  tasks.forEach(function (t) {
    var h = t.history || {};
    for (var y in h) {
      if (!Object.prototype.hasOwnProperty.call(h, y) || typeof h[y] !== 'string') continue;
      for (var i = 0; i < h[y].length; i++) if (h[y].charAt(i) !== '0') n++;
    }
  });
  return n;
}

function rwAssignDoneBetween(from, to) {
  return tasks.filter(function (t) {
    return t.kind === 'once' && typeof t.doneAt === 'string' && t.doneAt >= from && t.doneAt <= to;
  }).length;
}

function rwContext() {
  var today = getTodayString();
  var week  = rwTicksIn(rwDates(rwWeekStart(today), today));
  var month = rwTicksIn(rwDates(today.slice(0, 8) + '01', today));

  var dueHabits = tasks.filter(function (t) { return t.kind !== 'once' && isScheduledOn(t, today); });
  var cats = {};
  var bestStreak = 0;
  tasks.forEach(function (t) {
    cats[t.categoryId] = true;
    bestStreak = Math.max(bestStreak, t.maxStreak || 0, t.streak || 0);
  });

  return {
    today:        today,
    dayTicks:     rwTicksIn([today]).ticks,
    dayAllHabits: dueHabits.length > 0 && dueHabits.every(function (t) { return histGet(t.history, today); }),
    dayHard:      tasks.some(function (t) { return histLevel(t.history, today) >= 2; }),
    weekTicks:    week.ticks,
    weekDays:     week.days,
    weekAssign:   rwAssignDoneBetween(rwWeekStart(today), today),
    monthTicks:   month.ticks,
    monthDays:    month.days,
    monthAssign:  rwAssignDoneBetween(today.slice(0, 8) + '01', today),
    lifeTicks:    rwLifetimeTicks(),
    lifeAssign:   tasks.filter(function (t) { return t.kind === 'once' && (t.doneAt || t.completed); }).length,
    bestStreak:   bestStreak,
    plants:       tasks.length,
    catsPlanted:  CATEGORIES.filter(function (c) { return cats[c.id]; }).length,
    catsTotal:    CATEGORIES.length,
    friends:      (typeof myFriendUids !== 'undefined' && myFriendUids) ? myFriendUids.length : 0,
    spent:        wallet.spent || 0,
  };
}

function rwTarget(q, c) { return q.targetFn ? q.targetFn(c) : q.target; }

function rwCollectedList(tier) {
  var r = rwState();
  return tier === 'day' ? r.dc : tier === 'week' ? r.wc : tier === 'month' ? r.mc : r.life;
}

function rwFind(tier, id) {
  var list = tier === 'life' ? RW_BADGES : (RW_QUESTS[tier] || []);
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

// { have, need, done, collected }
function rwStatus(tier, q, c) {
  var need = rwTarget(q, c);
  var have = Math.max(0, Math.min(need, q.progress(c)));
  return {
    have:      have,
    need:      need,
    done:      have >= need,
    collected: rwCollectedList(tier).indexOf(q.id) !== -1,
  };
}


// ---- Morning dew ------------------------------------------------

// { step: ladder step this collect would be (1-7), dew, collected, open }
function rwMorning(c) {
  var r = rwState();
  var today = c ? c.today : getTodayString();
  if (r.mday === today) {
    return { step: r.mrun, dew: MORNING_LADDER[r.mrun - 1] || 0, collected: true, open: false };
  }
  var step = (r.mday === shiftDate(today, -1)) ? (r.mrun % MORNING_LADDER.length) + 1 : 1;
  var ticked = c ? c.dayTicks > 0 : rwTicksIn([today]).ticks > 0;
  return { step: step, dew: MORNING_LADDER[step - 1], collected: false, open: ticked };
}

function rwCollectMorning() {
  var m = rwMorning(rwContext());
  if (m.collected || !m.open) return false;
  var r = rwState();
  r.mday = getTodayString();
  r.mrun = m.step;
  var got = dewCredit(m.dew, null);
  dewToast('+' + got + ' Dew · Morning dew' + (m.step === MORNING_LADDER.length ? ', full jar!' : ''));
  saveData();
  render();
  return true;
}


// ---- Collecting -------------------------------------------------

function rwCollect(tier, id) {
  var q = rwFind(tier, id);
  if (!q) return false;
  var s = rwStatus(tier, q, rwContext());
  if (!s.done || s.collected) return false;
  rwCollectedList(tier).push(q.id);
  var got = dewCredit(q.dew, null);
  dewToast('+' + got + ' Dew · ' + q.title);
  saveData();
  render();
  return true;
}

// How many things are waiting to be collected right now. Drives the
// little dot on the menu plank, the front-page sign and the Dew pill.
function rwReadyCount() {
  if (typeof authReady === 'undefined' || !authReady) return 0;
  var c = rwContext();
  var n = 0;
  var m = rwMorning(c);
  if (m.open && !m.collected) n++;
  RW_TIERS.forEach(function (tier) {
    RW_QUESTS[tier.key].forEach(function (q) {
      var s = rwStatus(tier.key, q, c);
      if (s.done && !s.collected) n++;
    });
  });
  RW_BADGES.forEach(function (b) {
    var s = rwStatus('life', b, c);
    if (s.done && !s.collected) n++;
  });
  return n;
}


// ---- Art --------------------------------------------------------
// Flat shapes in the garden's own colours. Fills go through style=""
// with a fallback, never fill="var(...)" - see the invariants in
// ROADMAP.md.

function rwF(token, fallback) { return 'style="fill:var(' + token + ',' + fallback + ')"'; }
function rwS(token, fallback, w) {
  return 'style="fill:none;stroke:var(' + token + ',' + fallback + ');stroke-width:' + w +
         ';stroke-linecap:round;stroke-linejoin:round"';
}

var RW_ICONS = {
  tick:   '<circle cx="16" cy="16" r="13" ' + rwF('--leaf', '#7FA968') + '/>' +
          '<path d="M9.5 16.5 L14 21 L22.5 11.5" ' + rwS('--linen', '#F8EEDC', 3.2) + '/>',
  sun:    '<g ' + rwS('--sun-deep', '#C4913A', 2.4) + '>' +
          '<path d="M16 2.5v4M16 25.5v4M2.5 16h4M25.5 16h4M6.4 6.4l2.8 2.8M22.8 22.8l2.8 2.8M6.4 25.6l2.8-2.8M22.8 9.2l2.8-2.8"/></g>' +
          '<circle cx="16" cy="16" r="7.2" ' + rwF('--sun', '#E8B75C') + '/>',
  flame:  '<path d="M16 3 C19 9 25 12 25 19.5 C25 25 21 29 16 29 C11 29 7 25 7 19.5 C7 15 10 12.5 11.5 9.5 C12.5 13 14 14 15 14 C14 10 14.5 6.5 16 3Z" ' + rwF('--bloom', '#D89A8E') + '/>' +
          '<path d="M16 15 C18 18.5 20.5 20 20.5 23.5 C20.5 26.2 18.5 28 16 28 C13.5 28 11.5 26.2 11.5 23.5 C11.5 21 13.5 19.5 16 15Z" ' + rwF('--sun', '#E8B75C') + '/>',
  cal:    '<rect x="4" y="6.5" width="24" height="22" rx="4" ' + rwF('--linen', '#F8EEDC') + '/>' +
          '<rect x="4" y="6.5" width="24" height="7" rx="3" ' + rwF('--bloom', '#D89A8E') + '/>' +
          '<path d="M10 4v5M22 4v5" ' + rwS('--bark-deep', '#5E4632', 2.4) + '/>' +
          '<g ' + rwF('--leaf', '#7FA968') + '><circle cx="10" cy="19" r="2"/><circle cx="16" cy="19" r="2"/><circle cx="22" cy="19" r="2"/><circle cx="10" cy="24.5" r="2"/><circle cx="16" cy="24.5" r="2"/></g>',
  scroll: '<rect x="7" y="4" width="18" height="24" rx="2.5" ' + rwF('--linen', '#F8EEDC') + '/>' +
          '<path d="M11 10h10M11 14.5h10M11 19h6" ' + rwS('--ink-faint', '#A98D6B', 1.8) + '/>' +
          '<circle cx="22.5" cy="23.5" r="5.5" ' + rwF('--leaf', '#7FA968') + '/>' +
          '<path d="M20 23.6l1.8 1.8 3.2-3.4" ' + rwS('--linen', '#F8EEDC', 1.8) + '/>',
  sprig:  '<path d="M16 29 C16 20 16 11 16 3" ' + rwS('--leaf-deep', '#5C8149', 2.2) + '/>' +
          '<g ' + rwF('--leaf', '#7FA968') + '>' +
          '<ellipse cx="11.5" cy="24" rx="4.4" ry="2.3" transform="rotate(-28 11.5 24)"/>' +
          '<ellipse cx="20.5" cy="20.5" rx="4.4" ry="2.3" transform="rotate(28 20.5 20.5)"/>' +
          '<ellipse cx="11.5" cy="17" rx="4.4" ry="2.3" transform="rotate(-28 11.5 17)"/>' +
          '<ellipse cx="20.5" cy="13.5" rx="4.4" ry="2.3" transform="rotate(28 20.5 13.5)"/>' +
          '<ellipse cx="11.5" cy="10" rx="4.4" ry="2.3" transform="rotate(-28 11.5 10)"/>' +
          '<ellipse cx="20.5" cy="6.5" rx="4" ry="2.1" transform="rotate(28 20.5 6.5)"/>' +
          '<ellipse cx="16" cy="3.4" rx="2.1" ry="3"/></g>',
  moon:   '<path d="M21 3.5 A13 13 0 1 0 28.5 21 A10 10 0 1 1 21 3.5Z" ' + rwF('--dusk', '#9C8FB8') + '/>' +
          '<g ' + rwF('--linen', '#F8EEDC') + '><circle cx="25" cy="7" r="1.3"/><circle cx="28" cy="13" r="0.9"/></g>',
  sprout: '<path d="M16 29 C16 23 16 19 16 15" ' + rwS('--leaf-deep', '#5C8149', 2.4) + '/>' +
          '<path d="M16 16 C10 16 6 12 6 6.5 C12 6.5 16 10 16 16Z" ' + rwF('--leaf', '#7FA968') + '/>' +
          '<path d="M16 18 C21.5 18 26 14.5 26 9 C20.5 9 16 12.5 16 18Z" ' + rwF('--leaf-deep', '#5C8149') + '/>',
  leaves: '<path d="M7 26 C7 14 14 6 26 5 C26 17 19 26 7 26Z" ' + rwF('--leaf', '#7FA968') + '/>' +
          '<path d="M8 25 C13 19 18 13 24 7" ' + rwS('--leaf-dark', '#47673A', 1.8) + '/>',
  tree:   '<rect x="14" y="19" width="4" height="10" rx="1.5" ' + rwF('--bark', '#7A5C42') + '/>' +
          '<circle cx="16" cy="12" r="9" ' + rwF('--leaf-deep', '#5C8149') + '/>' +
          '<circle cx="10.5" cy="16" r="5.5" ' + rwF('--leaf', '#7FA968') + '/>' +
          '<circle cx="21.5" cy="16" r="5.5" ' + rwF('--leaf', '#7FA968') + '/>',
  crown:  '<path d="M5 24 L4 9 L10.5 15 L16 6 L21.5 15 L28 9 L27 24Z" ' + rwF('--sun', '#E8B75C') + '/>' +
          '<rect x="5" y="23.5" width="22" height="4.5" rx="1.5" ' + rwF('--sun-deep', '#C4913A') + '/>' +
          '<g ' + rwF('--leaf', '#7FA968') + '><circle cx="10.5" cy="19" r="1.8"/><circle cx="16" cy="17.5" r="2"/><circle cx="21.5" cy="19" r="1.8"/></g>',
  flame2: '', flame3: '',
  pots:   '<path d="M3 17h11l-1.5 11h-8Z" ' + rwF('--bloom-deep', '#A5544A') + '/>' +
          '<path d="M18 17h11l-1.5 11h-8Z" ' + rwF('--bloom-deep', '#A5544A') + '/>' +
          '<path d="M8.5 17 C8.5 11 5 8 5 8 M8.5 13 C10 10 12.5 9 12.5 9" ' + rwS('--leaf', '#7FA968', 2.2) + '/>' +
          '<path d="M23.5 17 C23.5 9 23.5 5 23.5 5 M23.5 11 C20 9 19 7 19 7 M23.5 9 C26.5 7.5 28 5.5 28 5.5" ' + rwS('--leaf', '#7FA968', 2.2) + '/>',
  plots:  '<g ' + rwF('--bark-light', '#9A7855') + '><rect x="3" y="3" width="11.5" height="11.5" rx="2.5"/><rect x="17.5" y="3" width="11.5" height="11.5" rx="2.5"/>' +
          '<rect x="3" y="17.5" width="11.5" height="11.5" rx="2.5"/><rect x="17.5" y="17.5" width="11.5" height="11.5" rx="2.5"/></g>' +
          '<g ' + rwF('--leaf', '#7FA968') + '><circle cx="8.8" cy="8.8" r="3"/><circle cx="23.2" cy="8.8" r="3"/><circle cx="8.8" cy="23.2" r="3"/><circle cx="23.2" cy="23.2" r="3"/></g>',
  friend: '<circle cx="11" cy="11" r="4.6" ' + rwF('--sun', '#E8B75C') + '/>' +
          '<path d="M3 27 C3 20.5 6.5 17.5 11 17.5 C15.5 17.5 19 20.5 19 27Z" ' + rwF('--sun', '#E8B75C') + '/>' +
          '<circle cx="21.5" cy="12.5" r="4.2" ' + rwF('--leaf', '#7FA968') + '/>' +
          '<path d="M14.5 28 C14.5 22 17.5 19 21.5 19 C25.5 19 29 22 29 28Z" ' + rwF('--leaf', '#7FA968') + '/>',
  drop:   '<path d="M16 3 C19.5 9 26 14.5 26 20.5 C26 26 21.5 29.5 16 29.5 C10.5 29.5 6 26 6 20.5 C6 14.5 12.5 9 16 3Z" ' + rwF('--dew-drop', '#6CC4E8') + '/>' +
          '<path d="M10.5 20.5 C10.5 18 11.8 15.8 13.2 14.4 C12.7 16.6 12.6 18.8 13.2 21.2Z" ' + rwF('--dew-glint', '#E6F7FF') + '/>',
};
// Longer streaks are the same flame, hotter.
RW_ICONS.flame2 = RW_ICONS.flame.replace(/--bloom,#D89A8E/, '--bloom-deep,#A5544A');
RW_ICONS.flame3 = RW_ICONS.flame2.replace(/--sun,#E8B75C/, '--dew-drop,#6CC4E8');

function rwIcon(name, cls) {
  return '<svg class="' + (cls || 'rw-icon') + '" viewBox="0 0 32 32" aria-hidden="true">' +
         (RW_ICONS[name] || RW_ICONS.drop) + '</svg>';
}

// The jar: a glass jar on a shelf, filled as far as today's quests
// have been collected. `level` is 0 to 1.
function rwJarSvg(level) {
  level = Math.max(0, Math.min(1, level || 0));
  var top = 40, bottom = 128;
  var y = bottom - (bottom - top) * level;
  return '<svg class="rw-jar" viewBox="0 0 120 150" aria-hidden="true">' +
    '<defs><clipPath id="rwJarClip"><path d="M30 38 C24 44 22 54 22 66 L22 116 C22 124 28 130 36 130 L84 130 C92 130 98 124 98 116 L98 66 C98 54 96 44 90 38Z"/></clipPath></defs>' +
    // shelf
    '<rect x="4" y="130" width="112" height="10" rx="3" ' + rwF('--bark', '#7A5C42') + '/>' +
    '<rect x="4" y="138" width="112" height="6" rx="2" ' + rwF('--bark-deep', '#5E4632') + '/>' +
    // glass back
    '<path d="M30 38 C24 44 22 54 22 66 L22 116 C22 124 28 130 36 130 L84 130 C92 130 98 124 98 116 L98 66 C98 54 96 44 90 38Z" style="fill:var(--dew-glint,#E6F7FF);fill-opacity:0.28"/>' +
    // water
    '<g clip-path="url(#rwJarClip)">' +
      '<path class="rw-jar-water" d="M10 ' + y + ' C30 ' + (y - 5) + ' 50 ' + (y + 5) + ' 70 ' + y + ' C85 ' + (y - 4) + ' 100 ' + (y + 3) + ' 112 ' + y + ' L112 140 L10 140Z" ' + rwF('--dew-drop', '#6CC4E8') + '/>' +
      '<circle cx="44" cy="' + (y + 22) + '" r="3" ' + rwF('--dew-glint', '#E6F7FF') + ' opacity="0.7"/>' +
      '<circle cx="70" cy="' + (y + 40) + '" r="2" ' + rwF('--dew-glint', '#E6F7FF') + ' opacity="0.7"/>' +
    '</g>' +
    // glass outline + shine
    '<path d="M30 38 C24 44 22 54 22 66 L22 116 C22 124 28 130 36 130 L84 130 C92 130 98 124 98 116 L98 66 C98 54 96 44 90 38" ' + rwS('--linen', '#F8EEDC', 3) + ' opacity="0.85"/>' +
    '<path d="M31 62 C31 54 33 49 36 46 M31 72 L31 100" ' + rwS('--linen', '#F8EEDC', 3.5) + ' opacity="0.6"/>' +
    // lid and twine
    '<rect x="26" y="24" width="68" height="16" rx="4" ' + rwF('--bark-light', '#9A7855') + '/>' +
    '<rect x="26" y="34" width="68" height="6" rx="2" ' + rwF('--bark', '#7A5C42') + '/>' +
    '<path d="M28 40 C45 44 75 44 92 40" ' + rwS('--clay-deep', '#C39F73', 2.4) + '/>' +
    // a leaf on the lid
    '<path d="M60 24 C60 15 66 9 76 8 C76 17 70 23 60 24Z" ' + rwF('--leaf', '#7FA968') + '/>' +
    '<path d="M60 24 C64 19 68 15 73 11" ' + rwS('--leaf-dark', '#47673A', 1.4) + '/>' +
  '</svg>';
}


// ---- The page ---------------------------------------------------

var pageRewardsEl     = document.getElementById('page-rewards');
var rewardsContentEl  = document.getElementById('rewardsContent');
var rewardsLoadingEl  = document.getElementById('rewardsLoadingState');

function rwResetsText(tier, today) {
  if (tier === 'day') return 'Resets at midnight';
  if (tier === 'week') return 'Resets Monday';
  var p = today.split('-');
  var next = new Date(Date.UTC(+p[0], +p[1], 1));
  return 'Resets ' + next.getUTCDate() + ' ' +
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][next.getUTCMonth()];
}

function rwRewardChip(dew) {
  return '<span class="rw-chip">' + dewDropIcon() + '+' + dew + '</span>';
}

function rwButtonHtml(tier, q, s) {
  if (s.collected) return '<span class="rw-collected">Collected</span>';
  return '<button type="button" class="rw-collect"' + (s.done ? '' : ' disabled') +
         ' data-rw-tier="' + tier + '" data-rw-id="' + q.id + '">' +
         (s.done ? 'Collect' : s.have + ' / ' + s.need) + '</button>';
}

function rwQuestHtml(tier, q, c) {
  var s = rwStatus(tier, q, c);
  var pct = s.need ? Math.round(100 * s.have / s.need) : 0;
  return '<li class="rw-quest' + (s.done ? ' is-done' : '') + (s.collected ? ' is-collected' : '') + '">' +
    rwIcon(q.icon, 'rw-quest-icon') +
    '<div class="rw-quest-body">' +
      '<div class="rw-quest-top"><span class="rw-quest-title">' + escapeHtml(q.title) + '</span>' + rwRewardChip(q.dew) + '</div>' +
      '<p class="rw-quest-text">' + escapeHtml(q.text) + '</p>' +
      '<div class="rw-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + s.need + '" aria-valuenow="' + s.have + '">' +
        '<span style="width:' + pct + '%"></span></div>' +
    '</div>' +
    rwButtonHtml(tier, q, s) +
  '</li>';
}

function rwMorningHtml(c) {
  var m = rwMorning(c);
  var pips = '';
  for (var i = 1; i <= MORNING_LADDER.length; i++) {
    var filled = m.collected ? i <= m.step : i < m.step;
    var cls = 'rw-pip' + (filled ? ' is-filled' : '') + (i === m.step && !m.collected ? ' is-next' : '') +
              (i === MORNING_LADDER.length ? ' is-big' : '');
    pips += '<li class="' + cls + '">' + dewDropIcon() + '<span>+' + MORNING_LADDER[i - 1] + '</span></li>';
  }
  var action;
  if (m.collected) {
    action = '<span class="rw-collected">Collected - back tomorrow for day ' + ((m.step % MORNING_LADDER.length) + 1) + '</span>';
  } else if (m.open) {
    action = '<button type="button" class="rw-collect rw-collect-big" data-rw-morning="1">Collect ' + m.dew + ' Dew</button>';
  } else {
    action = '<span class="rw-hint">Tick any task today to open it.</span>';
  }
  return '<section class="rw-morning" aria-label="Morning dew">' +
    '<div class="rw-morning-head">' +
      '<h3 class="rw-h">Morning dew</h3>' +
      '<p class="rw-sub">Collect once a day. Come back every day and it climbs; day 7 fills the jar. Miss a day and it starts again.</p>' +
    '</div>' +
    '<ol class="rw-pips">' + pips + '</ol>' +
    '<div class="rw-morning-action">' + action + '</div>' +
  '</section>';
}

function rwBadgeHtml(b, c) {
  var s = rwStatus('life', b, c);
  var cls = 'rw-badge' + (s.collected ? ' is-earned' : s.done ? ' is-ready' : ' is-locked');
  var foot;
  if (s.collected) foot = '<span class="rw-badge-foot">Earned</span>';
  else if (s.done) foot = '<button type="button" class="rw-collect" data-rw-tier="life" data-rw-id="' + b.id + '">Collect +' + b.dew + '</button>';
  else foot = '<span class="rw-badge-foot">' + s.have + ' / ' + s.need + ' · +' + b.dew + '</span>';
  return '<li class="' + cls + '">' +
    '<span class="rw-medal">' + rwIcon(b.icon, 'rw-medal-icon') + '</span>' +
    '<span class="rw-badge-title">' + escapeHtml(b.title) + '</span>' +
    '<span class="rw-badge-text">' + escapeHtml(b.text) + '</span>' +
    foot +
  '</li>';
}

function renderRewardsPage() {
  if (!rewardsContentEl) return;
  var c = rwContext();
  var r = rwState();

  var dayDone = RW_QUESTS.day.filter(function (q) { return r.dc.indexOf(q.id) !== -1; }).length;
  var level = (dayDone + (rwMorning(c).collected ? 1 : 0)) / (RW_QUESTS.day.length + 1);

  var earnedBadges = r.life.length;
  var html =
    '<header class="rw-header">' +
      '<div class="rw-header-text">' +
        '<h2 class="rw-title">Rewards</h2>' +
        '<p class="rw-subtitle">More ways to earn Dew. Everything here is read from the ticks you already make - just come back and collect.</p>' +
        '<div class="rw-balance">' + dewDropIcon() + '<strong>' + wallet.bal + '</strong> Dew' +
          '<button type="button" class="rw-link" data-rw-go="greenhouse">Spend it in the Greenhouse</button></div>' +
      '</div>' +
      '<div class="rw-jar-wrap" title="Fills as you collect today’s rewards">' + rwJarSvg(level) +
        '<span class="rw-jar-label">Today ' + Math.round(level * 100) + '%</span></div>' +
    '</header>' +
    rwMorningHtml(c);

  RW_TIERS.forEach(function (tier) {
    html += '<section class="rw-board rw-board-' + tier.key + '">' +
      '<div class="rw-board-head">' + rwIcon(tier.icon, 'rw-board-icon') +
        '<h3 class="rw-h">' + tier.title + '</h3>' +
        '<span class="rw-resets">' + rwResetsText(tier.key, c.today) + '</span></div>' +
      '<ul class="rw-quests">' +
        RW_QUESTS[tier.key].map(function (q) { return rwQuestHtml(tier.key, q, c); }).join('') +
      '</ul></section>';
  });

  html += '<section class="rw-board rw-board-life">' +
    '<div class="rw-board-head">' + rwIcon('crown', 'rw-board-icon') +
      '<h3 class="rw-h">Lifelong</h3>' +
      '<span class="rw-resets">' + earnedBadges + ' of ' + RW_BADGES.length + ' earned</span></div>' +
    '<ul class="rw-badges">' + RW_BADGES.map(function (b) { return rwBadgeHtml(b, c); }).join('') + '</ul>' +
  '</section>';

  rewardsContentEl.innerHTML = html;
}

if (rewardsContentEl) {
  rewardsContentEl.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button');
    if (!btn || btn.disabled) return;
    if (btn.hasAttribute('data-rw-morning')) { rwCollectMorning(); return; }
    if (btn.hasAttribute('data-rw-go'))      { navigateTo(btn.getAttribute('data-rw-go')); return; }
    var tier = btn.getAttribute('data-rw-tier');
    var id   = btn.getAttribute('data-rw-id');
    if (tier && id) rwCollect(tier, id);
  });
}


// ---- Showing that something is ready ----------------------------

function updateRewardsDots() {
  if (typeof document === 'undefined') return;
  var n = rwReadyCount();
  var label = n ? String(n) : '';
  document.querySelectorAll('[data-rw-dot]').forEach(function (el) {
    el.classList.toggle('rw-has-dot', n > 0);
    el.setAttribute('data-rw-count', label);
  });
  var pill = document.getElementById('dewPill');
  if (pill) pill.classList.toggle('rw-has-dot', n > 0);
}


// ---- Wiring into navigation (01) and render (05) ----------------
// Same approach as 15: wrap, call the original unchanged. The page
// itself, its plank and its front-page sign are all in index.html.

if (typeof NAV_HASH_PAGES !== 'undefined' && NAV_HASH_PAGES.indexOf('rewards') === -1) {
  NAV_HASH_PAGES.push('rewards');
}

if (typeof HB_SIGNS !== 'undefined') {
  HB_SIGNS.push({ hostId: 'cutRewards', text: 'REWARDS',
    lit: '#BFE6EC', shadow: '#123B40', floor: '#2C6870' });
}

var rwBaseNavigateTo = navigateTo;
navigateTo = function (page) {
  var out = rwBaseNavigateTo.apply(this, arguments);
  if (pageRewardsEl) pageRewardsEl.classList.toggle('hidden', page !== 'rewards');
  if (page === 'rewards') {
    if (rewardsLoadingEl) rewardsLoadingEl.classList.toggle('hidden', authReady);
    if (rewardsContentEl) rewardsContentEl.classList.toggle('hidden', !authReady);
    if (authReady) renderRewardsPage();
    if (pageRewardsEl) pageRewardsEl.scrollTop = 0;
  }
  updateRewardsDots();
  return out;
};

var rwBaseRender = render;
render = function () {
  var out = rwBaseRender.apply(this, arguments);
  if (currentPage === 'rewards' && authReady) {
    if (rewardsLoadingEl) rewardsLoadingEl.classList.add('hidden');
    if (rewardsContentEl) rewardsContentEl.classList.remove('hidden');
    renderRewardsPage();
  }
  updateRewardsDots();
  return out;
};

var rwBtnEl = document.getElementById('btn-to-rewards');
if (rwBtnEl) rwBtnEl.addEventListener('click', function () { navigateTo('rewards'); });


// ---- The account export (10) ------------------------------------
// Registered after 15's own DOMContentLoaded hook, so 15 has already
// put `dew` on the export by the time this adds to it.

function rwWrapExport() {
  if (typeof buildAccountExport !== 'function' || buildAccountExport.rwWrapped) return;
  var base = buildAccountExport;
  buildAccountExport = function () {
    var out = base.apply(this, arguments);
    var r = rwState();
    if (out.dew) {
      out.dew.rewards = {
        morning_last_collected: r.mday,
        morning_run_step:       r.mrun,
        badges_earned:          r.life.slice(),
      };
    }
    return out;
  };
  buildAccountExport.rwWrapped = true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', rwWrapExport);
}
