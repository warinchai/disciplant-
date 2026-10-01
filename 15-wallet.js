// ============================================
// 15: DEW - the garden's currency
// Part of DISCIPLANT. Plain global script, loaded after 01-07, 10 and
// 12-14 (it wraps functions from 01, 02, 03, 05 and 10) and before 11.
// ============================================
//
// WHAT DEW IS
// Dew is earned by getting things done and spent on looks: plant skins
// in the Greenhouse, and the garden's landscape. It buys nothing that
// changes growth, streaks or stats, which is the whole reason the rest
// of this file can afford to be client-authoritative (see STORAGE).
//
// HOW IT IS EARNED
//   Assignments  Finishing one pays its impact rating in Dew: Small 1,
//                Medium 3, Large 7, Major 14. Paid only when the WHOLE
//                assignment is done - a manual tick with steps still
//                open pays nothing until the last step lands. Capped at
//                DEW_DAILY_CAP a day, and an assignment created less
//                than DEW_MIN_AGE_MS ago pays nothing, so "make a Major
//                assignment and tick it" is not a Dew printer.
//   Habits       A little on every tick: DEW_HABIT_TICK, once per
//                habit per day, capped at DEW_HABIT_DAILY_CAP a day on
//                a counter of its own, so ticking ten habits never
//                crowds out what an assignment can pay. Plus a bonus at
//                streak milestones (7, 30, 100, 365 days), once per
//                plant per milestone. Read off maxStreak, which is
//                already a high-water mark, so a broken streak never
//                pays the same milestone twice. Milestones are not
//                capped: they are rare by construction.
//
// THE REFUND RULE MIRRORS THE GROWTH RULE
// An assignment's tick is reversible on the day it was made (see
// isAwardReversible in 01), and so is its Dew: unticking refunds
// exactly what was paid, and re-rating or editing steps while the
// tick is live re-tunes the payout the same way retuneAward()
// re-tunes the plant. Once the day rolls over it is banked. A habit's
// tick Dew is refunded the same way if it is unticked that day; its
// milestones are banked immediately, because maxStreak is.
//
// A refund can take the balance below zero, if the Dew was spent in
// between. That is shown honestly as a negative balance rather than
// clawed back off a purchase, and nothing can be bought until it is
// positive again.
//
// HOW IT IS SPENT
//   Plant skins   Bought per SPECIES, not per plant: buying Aurelian
//                 unlocks it on every oak. Priced by slot (DEW_PLANT_
//                 PRICES). The achievement gates in 03 still work as a
//                 free route - a skin is unlocked if it was earned OR
//                 bought, so nobody loses anything they already have.
//   Landscapes    Meadow is free; every other landscape is bought. A
//                 garden already wearing a non-default landscape when
//                 this file first loads keeps it (grandfathered into
//                 owned), so the update never takes a look away.
//
// STORAGE
// One `wallet` map on gardens/{uid}, written by the save that was
// already happening (see the hook in saveData, 02). No new document,
// no new listener, no extra read or write. Nothing in it is mirrored
// to gardenSummaries, so friends never see a balance.
//
// Client-authoritative, like every other number on that document: the
// browser writes it, so a determined person can edit their own
// balance. What they can buy with it is a recolour. Server-side
// validation would need Cloud Functions on the Blaze plan, and that is
// not worth paying for to protect cosmetics.
// ============================================


// ---- The numbers ------------------------------------------------

var DEW_DAILY_CAP        = 25;   // assignments, per day
var DEW_HABIT_TICK       = 1;    // every habit tick
var DEW_HABIT_DAILY_CAP  = 10;   // habit ticks, per day, counted separately
var DEW_MIN_AGE_MS  = 10 * 60 * 1000;
var DEW_BALANCE_MIN = -9999;
var DEW_BALANCE_MAX = 99999;
var DEW_OWNED_MAX   = 200;

var DEW_STREAK_MILESTONES = [
  { days: 7,   dew: 3  },
  { days: 30,  dew: 10 },
  { days: 100, dew: 25 },
  { days: 365, dew: 50 },
];

// By slot, the same five-slot ladder 03 documents above PLANT_SKINS:
// classic, gold, rainbow, themed, showcase. Anything past slot 4 (a
// sixth skin appended later) gets the last price rather than free.
var DEW_PLANT_PRICES = [0, 30, 40, 50, 80];

// By landscape id. A new landscape not listed here costs the default.
var DEW_GARDEN_PRICES = {
  meadow:   0,
  candy:    100,
  beach:    100,
  volcanic: 150,
  mars:     150,
};
var DEW_GARDEN_PRICE_DEFAULT = 120;


// ---- State ------------------------------------------------------

function dewEmptyWallet() {
  return {
    bal:    0,     // spendable; may go negative after a refund
    earned: 0,     // lifetime, net of refunds
    spent:  0,     // lifetime
    day:    null,  // the day `today` and `paid` belong to
    today:  0,     // capped assignment earnings so far on `day`
    htoday: 0,     // capped habit-tick earnings so far on `day`
    paid:   {},    // taskId -> Dew paid for that assignment's tick on `day`
    hpaid:  {},    // taskId -> Dew paid for that habit's tick on `day`
    born:   {},    // taskId -> ms created, only while younger than DEW_MIN_AGE_MS
    owned:  [],    // 'p:<catId>:<skinId>' and 'g:<gardenSkinId>'
  };
}

var wallet = dewEmptyWallet();

function dewInt(n, lo, hi) {
  n = Math.round(Number(n));
  if (!isFinite(n)) return 0;
  return Math.max(lo, Math.min(hi, n));
}

// The edge the data arrives at. Same stance as the task normalizer in
// 02: the document is browser-writable, so anything odd in it becomes
// something sane here rather than something that breaks a render.
function dewNormalizeWallet(raw) {
  var w = dewEmptyWallet();
  if (!raw || typeof raw !== 'object') return w;

  w.bal    = dewInt(raw.bal, DEW_BALANCE_MIN, DEW_BALANCE_MAX);
  w.earned = dewInt(raw.earned, 0, 1e9);
  w.spent  = dewInt(raw.spent, 0, 1e9);
  w.day    = (typeof raw.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.day)) ? raw.day : null;
  w.today  = dewInt(raw.today, 0, DEW_DAILY_CAP);
  w.htoday = dewInt(raw.htoday, 0, DEW_HABIT_DAILY_CAP);

  var k;
  ['paid', 'hpaid'].forEach(function (field) {
    var src = raw[field];
    if (!src || typeof src !== 'object') return;
    for (var id in src) {
      if (!Object.prototype.hasOwnProperty.call(src, id)) continue;
      var amt = dewInt(src[id], 0, 1000);
      if (amt > 0 && /^\d+$/.test(id)) w[field][id] = amt;
    }
  });
  if (raw.born && typeof raw.born === 'object') {
    for (k in raw.born) {
      if (!Object.prototype.hasOwnProperty.call(raw.born, k)) continue;
      var ms = Number(raw.born[k]);
      if (isFinite(ms) && ms > 0 && /^\d+$/.test(k)) w.born[k] = ms;
    }
  }
  if (Array.isArray(raw.owned)) {
    raw.owned.forEach(function (key) {
      if (w.owned.length >= DEW_OWNED_MAX) return;
      if (typeof key !== 'string') return;
      if (!/^(p:[a-z]+:[a-z0-9_-]+|g:[a-z0-9_-]+)$/.test(key)) return;
      if (w.owned.indexOf(key) === -1) w.owned.push(key);
    });
  }

  dewRollDay(w);
  dewPruneBorn(w);
  return w;
}

// `today` and `paid` belong to one day. A new day starts both empty,
// which is also what banks yesterday's assignment payouts: with no
// `paid` entry there is nothing left to refund.
function dewRollDay(w) {
  w = w || wallet;
  var today = getTodayString();
  if (w.day === today) return;
  w.day    = today;
  w.today  = 0;
  w.htoday = 0;
  w.paid   = {};
  w.hpaid  = {};
}

// A birth time only matters for its first ten minutes. Dropping it
// after that keeps the map at a handful of entries at most, rather
// than one per task forever on a document rewritten every tick.
function dewPruneBorn(w) {
  w = w || wallet;
  var now = Date.now();
  for (var k in w.born) {
    if (!Object.prototype.hasOwnProperty.call(w.born, k)) continue;
    if (now - w.born[k] >= DEW_MIN_AGE_MS || now - w.born[k] < -60000) delete w.born[k];
  }
}


// ---- Load / save hooks (called from 02) -------------------------

// Called with the garden document's data, or null for a brand new
// garden. GRANDFATHERING happens only when the document has no wallet
// at all - i.e. the first load after this feature shipped - so it
// runs once per garden in practice, and a landscape picked before Dew
// existed stays picked.
function dewLoadFromDoc(data) {
  wallet = dewNormalizeWallet(data && data.wallet);

  if (data && !data.wallet && typeof data.gardenSkinId === 'string' &&
      data.gardenSkinId && data.gardenSkinId !== GARDEN_SKIN_DEFAULT_ID) {
    var key = 'g:' + getGardenSkin(data.gardenSkinId).id;
    if (key !== 'g:' + GARDEN_SKIN_DEFAULT_ID && wallet.owned.indexOf(key) === -1) {
      wallet.owned.push(key);
    }
  }
}

// What saveData() writes. Empty maps are left out, the same habit
// buildCleanTasks() has, since this rides on every tick.
function dewWalletPayload() {
  dewRollDay();
  dewPruneBorn();
  var out = {
    bal:    wallet.bal,
    earned: wallet.earned,
    spent:  wallet.spent,
    day:    wallet.day,
    today:  wallet.today,
    htoday: wallet.htoday,
    owned:  wallet.owned.slice(),
  };
  if (Object.keys(wallet.paid).length)  out.paid  = Object.assign({}, wallet.paid);
  if (Object.keys(wallet.hpaid).length) out.hpaid = Object.assign({}, wallet.hpaid);
  if (Object.keys(wallet.born).length) out.born = Object.assign({}, wallet.born);
  return out;
}


// ---- Earning ----------------------------------------------------

// `cap` names the daily ceiling a credit counts against: 'a' for
// assignments, 'h' for habit ticks, or nothing for habit milestones,
// which are uncapped and count towards neither. Returns what was
// actually credited.
function dewCapField(cap) { return cap === 'h' ? 'htoday' : 'today'; }
function dewCapMax(cap)   { return cap === 'h' ? DEW_HABIT_DAILY_CAP : DEW_DAILY_CAP; }

function dewCredit(amount, cap) {
  dewRollDay();
  amount = Math.max(0, Math.round(amount) || 0);
  if (cap === true) cap = 'a';
  if (cap) {
    var f = dewCapField(cap);
    amount = Math.min(amount, Math.max(0, dewCapMax(cap) - wallet[f]));
    wallet[f] += amount;
  }
  wallet.bal    = Math.min(DEW_BALANCE_MAX, wallet.bal + amount);
  wallet.earned += amount;
  return amount;
}

// Only ever undoes a capped credit from today, which is the only kind
// that can be refunded.
function dewRefund(amount, cap) {
  dewRollDay();
  amount = Math.max(0, Math.round(amount) || 0);
  var f = dewCapField(cap || 'a');
  wallet.bal    = Math.max(DEW_BALANCE_MIN, wallet.bal - amount);
  wallet.earned = Math.max(0, wallet.earned - amount);
  wallet[f]     = Math.max(0, wallet[f] - amount);
  return amount;
}

function dewTaskIsYoung(task) {
  var born = wallet.born[String(task.id)];
  return !!born && (Date.now() - born) < DEW_MIN_AGE_MS;
}

// What finishing this assignment is worth right now, before the cap.
// Steps have to be finished: partial credit is a growth concept, and
// a fraction of a Dew is not a thing.
function dewForAssignment(task) {
  if (!task || task.kind !== 'once') return 0;
  var subs = task.subtasks || [];
  if (subs.length && !subtasksAllDone(task)) return 0;
  if (dewTaskIsYoung(task)) return 0;
  return normalizeImpact(task.impact);
}

function dewIsReversibleToday(task) {
  return task.kind === 'once' && task.doneAt === getTodayString();
}

// Every milestone crossed going from `prevBest` to `nextBest`.
function dewMilestonesBetween(prevBest, nextBest) {
  return DEW_STREAK_MILESTONES.filter(function (m) {
    return prevBest < m.days && nextBest >= m.days;
  });
}

// Runs BEFORE the real toggleTask(), on purpose: toggleTask() saves
// and renders, and doing the Dew first means that save carries the
// new balance and that render shows it. Every decision here is made
// from the same inputs toggleTask() itself uses, so the two cannot
// disagree about which branch is being taken.
function dewBeforeToggle(task, newChecked) {
  var was = !!task.completed;
  var key = String(task.id);
  var note = null;

  if (newChecked && !was) {
    if (task.kind === 'once') {
      var want = dewForAssignment(task);
      var got  = dewCredit(want, 'a');
      if (got > 0) wallet.paid[key] = got;
      if (got > 0)               note = '+' + got + ' Dew';
      else if (want > 0)         note = dewTaskIsYoung(task) ? null : 'Daily Dew limit reached';
    } else {
      var total = 0;
      var label = '';
      // One tick's worth per habit per day. A habit ticked, unticked
      // and ticked again was refunded in between, so it is paid
      // again; one whose `completed` was reset some other way keeps
      // its entry and is not.
      if (!wallet.hpaid[key]) {
        var tick = dewCredit(DEW_HABIT_TICK, 'h');
        if (tick > 0) { wallet.hpaid[key] = tick; total += tick; }
      }
      var prevBest = Math.max(task.maxStreak || 0, task.streak || 0);
      var nextBest = Math.max(prevBest, (task.streak || 0) + 1);
      dewMilestonesBetween(prevBest, nextBest).forEach(function (m) {
        total += dewCredit(m.dew, null);
        label = ' \u00b7 ' + m.days + '-day streak';
      });
      if (total > 0) note = '+' + total + ' Dew' + label;
    }
  } else if (!newChecked && was && task.kind !== 'once') {
    // A habit's tick is always today's (the day boundary unticks it
    // overnight), so its tick Dew is always refundable. Milestones
    // are not.
    var hback = wallet.hpaid[key] || 0;
    if (hback > 0) {
      dewRefund(hback, 'h');
      note = '\u2212' + hback + ' Dew';
    }
    delete wallet.hpaid[key];
  } else if (!newChecked && was && dewIsReversibleToday(task)) {
    var back = wallet.paid[key] || 0;
    if (back > 0) {
      dewRefund(back, 'a');
      note = '\u2212' + back + ' Dew';
    }
    delete wallet.paid[key];
  }

  if (note) dewToast(note);
}

// The Dew half of retuneAward(): while an assignment's tick is live,
// what it has been paid always equals what it would be paid now.
function dewRetune(task) {
  if (!task || task.kind !== 'once' || !task.completed) return;
  if (!dewIsReversibleToday(task)) return;

  var key    = String(task.id);
  var have   = wallet.paid[key] || 0;
  var target = dewForAssignment(task);
  if (target === have) return;

  if (target > have) {
    var got = dewCredit(target - have, 'a');
    if (got > 0) {
      wallet.paid[key] = have + got;
      dewToast('+' + got + ' Dew');
    }
  } else {
    dewRefund(have - target, 'a');
    if (target > 0) wallet.paid[key] = target;
    else delete wallet.paid[key];
    dewToast('\u2212' + (have - target) + ' Dew');
  }
}

function dewNoteBorn(taskId) {
  wallet.born[String(taskId)] = Date.now();
}


// ---- Wrapping 01 and 02 -----------------------------------------
// Reassigning a global function from a later script is how every
// caller - the tasks page, the subtask sync in 01, onboarding - picks
// up the new behaviour without being edited. Each wrapper calls the
// original unchanged.

var dewBaseToggleTask = toggleTask;
toggleTask = function (taskId, newChecked) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (task) dewBeforeToggle(task, newChecked);
  return dewBaseToggleTask.apply(this, arguments);
};

var dewBaseRetuneAward = retuneAward;
retuneAward = function (task, prevAward) {
  var out = dewBaseRetuneAward.apply(this, arguments);
  dewRetune(task);
  return out;
};

var dewBaseMakeTask = makeTask;
makeTask = function (id) {
  var task = dewBaseMakeTask.apply(this, arguments);
  dewNoteBorn(id);
  return task;
};

// Turning a habit into an assignment restarts the clock, or the trick
// is just "plant a habit, flip it to Major, tick it".
var dewBaseSetTaskKind = setTaskKind;
//
// A change of kind also hands back whatever today's tick of the OLD
// kind paid, because the refund rules are per kind: left in place, a
// habit's tick Dew would sit on an assignment that cannot refund it.
setTaskKind = function (task, kind) {
  var wasOnce = task && task.kind === 'once';
  var out = dewBaseSetTaskKind.apply(this, arguments);
  if (!task || wasOnce === (task.kind === 'once')) return out;

  var key = String(task.id);
  if (wallet.hpaid[key]) { dewRefund(wallet.hpaid[key], 'h'); delete wallet.hpaid[key]; }
  if (wallet.paid[key])  { dewRefund(wallet.paid[key], 'a');  delete wallet.paid[key]; }
  if (task.kind === 'once') dewNoteBorn(task.id);
  return out;
};


// ---- Spending ---------------------------------------------------

function dewOwns(key) {
  return wallet.owned.indexOf(key) !== -1;
}

function dewPlantKey(catId, skinId)  { return 'p:' + catId + ':' + skinId; }
function dewGardenKey(skinId)        { return 'g:' + skinId; }

function dewPlantPrice(slot) {
  if (slot <= 0) return 0;
  return DEW_PLANT_PRICES[Math.min(slot, DEW_PLANT_PRICES.length - 1)];
}

function dewGardenPrice(skinId) {
  return Object.prototype.hasOwnProperty.call(DEW_GARDEN_PRICES, skinId)
    ? DEW_GARDEN_PRICES[skinId]
    : DEW_GARDEN_PRICE_DEFAULT;
}

// Returns true if bought. Does not save or render - the callers below
// equip the new look, and that path already does both, once.
function dewSpend(key, price) {
  if (dewOwns(key)) return false;
  if (!(price > 0) || wallet.bal < price) return false;
  wallet.bal   -= price;
  wallet.spent += price;
  wallet.owned.push(key);
  return true;
}

function dewBuyPlantSkin(task, skinId) {
  if (!task) return false;
  var catId = task.categoryId;
  var state = getSkinUnlockState(task, catId, skinId);
  if (state.unlocked) return false;
  if (!dewSpend(dewPlantKey(catId, state.skin.id), state.price)) return false;
  dewToast('Unlocked ' + state.skin.name + ' for every ' + getCategoryById(catId).species);
  setTaskSkin(task.id, state.skin.id);   // saves + renders
  return true;
}

function dewBuyGardenSkin(skinId) {
  var state = getGardenSkinUnlockState(skinId);
  if (state.unlocked) return false;
  if (!dewSpend(dewGardenKey(state.skin.id), state.price)) return false;
  dewToast('Unlocked ' + state.skin.name);
  setGardenSkin(state.skin.id);          // saves + renders
  return true;
}


// ---- Wrapping the unlock rules in 03 ----------------------------
// Every renderer asks these, so overriding them is what makes a
// bought skin wearable everywhere at once - the garden, the cards,
// a friend's view of the plot.

var dewBaseGetSkinUnlockState = getSkinUnlockState;
getSkinUnlockState = function (task, catId, skinId) {
  var state = dewBaseGetSkinUnlockState.apply(this, arguments);
  state.earned = state.unlocked;
  state.price  = dewPlantPrice(state.slot);
  state.bought = dewOwns(dewPlantKey(catId, state.skin.id));
  if (state.bought) state.unlocked = true;
  return state;
};

var dewBaseSkinUnlockRequirement = skinUnlockRequirement;
skinUnlockRequirement = function (state) {
  var base = dewBaseSkinUnlockRequirement.apply(this, arguments);
  if (!base || !state || !state.price) return base;
  return base + ', or ' + state.price + ' Dew';
};

// Landscapes have no achievement gates (GARDEN_SKIN_UNLOCK_RULES is
// empty), so here Dew is the only route. The default is always free.
var dewBaseGetGardenSkinUnlockState = getGardenSkinUnlockState;
getGardenSkinUnlockState = function (skinId) {
  var state = dewBaseGetGardenSkinUnlockState.apply(this, arguments);
  state.price  = dewGardenPrice(state.skin.id);
  state.bought = dewOwns(dewGardenKey(state.skin.id));
  if (state.skin.id === GARDEN_SKIN_DEFAULT_ID || state.price <= 0) return state;
  if (state.unlocked && !state.bought) {
    state.unlocked = false;
    state.kind     = 'dew';
    state.need     = state.price;
    state.have     = Math.max(0, wallet.bal);
  }
  return state;
};

var dewBaseGardenSkinUnlockRequirement = gardenSkinUnlockRequirement;
gardenSkinUnlockRequirement = function (state) {
  if (state && !state.unlocked && state.kind === 'dew') return state.price + ' Dew';
  return dewBaseGardenSkinUnlockRequirement.apply(this, arguments);
};


// ---- Greenhouse UI ----------------------------------------------
// The tiles are built by 05; this only turns a locked tile into a
// shop tile after the fact. Buying is two taps on the same tile - the
// first arms it and says what it costs, the second spends - so a
// stray tap never spends anything, and there is no modal to build.

var dewArmedKey = null;

function dewDropIcon() {
  return '<svg class="dew-drop" viewBox="0 0 12 16" aria-hidden="true">' +
    '<path d="M6 0.6 C7.6 3.6 11 7.2 11 10.4 C11 13.3 8.8 15.4 6 15.4 ' +
    'C3.2 15.4 1 13.3 1 10.4 C1 7.2 4.4 3.6 6 0.6 Z" style="fill:var(--dew-drop,#6CC4E8)"/>' +
    '<path d="M3.6 10.2 C3.6 8.9 4.3 7.6 5 6.8 C4.7 8 4.6 9.2 4.9 10.6 Z" ' +
    'style="fill:var(--dew-glint,#E6F7FF)"/></svg>';
}

function dewShopTile(tile, key, price, label, onBuy) {
  var footer = tile.querySelector('.skin-tile-req');
  if (!footer) return;

  tile.disabled = false;
  tile.removeAttribute('aria-disabled');
  tile.classList.add('dew-shop');

  var armed = (dewArmedKey === key);
  var short = Math.max(0, price - wallet.bal);
  tile.classList.toggle('dew-armed', armed);
  tile.classList.toggle('dew-short', short > 0);

  var line;
  if (armed && short > 0) {
    line = 'Need ' + short + ' more Dew';
  } else if (armed) {
    line = 'Tap again to buy';
  } else {
    line = label;
  }
  footer.innerHTML =
    '<span class="dew-price">' + dewDropIcon() + price + '</span>' +
    '<span class="dew-price-note">' + escapeHtml(line) + '</span>';

  tile.addEventListener('click', function () {
    if (dewArmedKey === key && short <= 0) {
      dewArmedKey = null;
      onBuy();
      return;
    }
    dewArmedKey = key;
    renderGreenhouse();
  });
}

var dewBaseBuildSkinDrawer = buildSkinDrawer;
buildSkinDrawer = function (task, cat) {
  var drawer = dewBaseBuildSkinDrawer.apply(this, arguments);
  drawer.querySelectorAll('.skin-tile.locked').forEach(function (tile) {
    var skinId = tile.getAttribute('data-skin-id');
    var state  = getSkinUnlockState(task, task.categoryId, skinId);
    if (state.unlocked || !state.price) return;
    var earnHint = dewBaseSkinUnlockRequirement(state);
    dewShopTile(tile, dewPlantKey(task.categoryId, state.skin.id), state.price,
      'Every ' + cat.species + (earnHint ? ' \u00b7 or ' + earnHint.charAt(0).toLowerCase() + earnHint.slice(1) : ''),
      function () { dewBuyPlantSkin(task, state.skin.id); });
  });
  return drawer;
};

var dewBaseRenderLandscapePicker = renderLandscapePicker;
renderLandscapePicker = function () {
  dewBaseRenderLandscapePicker.apply(this, arguments);
  if (typeof landscapePickerEl === 'undefined' || !landscapePickerEl) return;
  landscapePickerEl.querySelectorAll('.skin-tile.locked').forEach(function (tile) {
    var skinId = tile.getAttribute('data-garden-skin-id');
    var state  = getGardenSkinUnlockState(skinId);
    if (state.unlocked || state.kind !== 'dew') return;
    dewShopTile(tile, dewGardenKey(state.skin.id), state.price, 'For the whole garden',
      function () { dewBuyGardenSkin(state.skin.id); });
  });
};

function dewBalanceHtml() {
  dewRollDay();
  var neg = wallet.bal < 0;
  return (
    '<div class="dew-balance-main">' +
      dewDropIcon() +
      '<span class="dew-balance-amount' + (neg ? ' is-negative' : '') + '">' +
        wallet.bal + '</span>' +
      '<span class="dew-balance-unit">Dew</span>' +
    '</div>' +
    '<div class="dew-balance-meta">' +
      '<span>Today: ' + wallet.htoday + ' / ' + DEW_HABIT_DAILY_CAP + ' from habits \u00b7 ' +
        wallet.today + ' / ' + DEW_DAILY_CAP + ' from assignments</span>' +
      '<span>Every habit tick earns ' + DEW_HABIT_TICK + '. Finished assignments earn their impact. ' +
        'Streaks of 7, 30, 100 and 365 days pay a bonus.</span>' +
      (neg ? '<span>A refunded tick took you below zero - buying is paused until you are back above it.</span>' : '') +
    '</div>'
  );
}

function renderDewBalance() {
  var picker = document.getElementById('landscapePicker');
  if (!picker || !picker.parentNode) return;
  var el = document.getElementById('dewBalance');
  if (!el) {
    el = document.createElement('section');
    el.id = 'dewBalance';
    el.className = 'dew-balance';
    el.setAttribute('aria-label', 'Dew balance');
    picker.parentNode.insertBefore(el, picker);
  }
  el.innerHTML = dewBalanceHtml();
}

var dewBaseRenderGreenhouse = renderGreenhouse;
renderGreenhouse = function () {
  renderDewBalance();
  return dewBaseRenderGreenhouse.apply(this, arguments);
};

// Leaving the page disarms a half-made purchase.
document.addEventListener('click', function (e) {
  if (dewArmedKey === null) return;
  if (e.target.closest && e.target.closest('.dew-shop')) return;
  dewArmedKey = null;
  if (currentPage === 'greenhouse' && authReady) renderGreenhouse();
});


// ---- The Dew pill -----------------------------------------------
// The balance, always in view while you are in the garden: a small
// pill pinned to the top-left corner, the mirror of the account pill
// in the top-right. Tapping it goes to the Greenhouse, which is the
// only place Dew is spent. It bumps when the balance goes up, so a
// tick ticked from the garden's own page is seen to pay.
//
// Built here rather than in index.html so that removing the script
// tag removes the pill too. Repainted from render() and navigateTo(),
// which between them run after every change that could move it.

var dewPillLast = null;

function dewPillEl() {
  var el = document.getElementById('dewPill');
  if (el || !document.body) return el;
  el = document.createElement('button');
  el.type      = 'button';
  el.id        = 'dewPill';
  el.className = 'dew-pill hidden';
  el.title     = 'Dew - spend it in the Greenhouse';
  el.addEventListener('click', function () { navigateTo('greenhouse'); });
  document.body.appendChild(el);
  return el;
}

function updateDewPill() {
  if (typeof document === 'undefined') return;
  var el = dewPillEl();
  if (!el) return;

  var show = (currentPage === 'garden') && authReady;
  el.classList.toggle('hidden', !show);
  document.body.classList.toggle('dew-pill-on', show);
  if (!show) return;

  dewRollDay();
  var bal = wallet.bal;
  el.innerHTML = dewDropIcon() +
    '<span class="dew-pill-amount">' + bal + '</span>' +
    '<span class="dew-pill-unit">Dew</span>';
  el.setAttribute('aria-label', bal + ' Dew. Opens the Greenhouse, where Dew is spent.');
  el.classList.toggle('is-negative', bal < 0);

  // Restarting a CSS animation needs the class off, a reflow, and the
  // class back on - otherwise a second gain inside the first bump's
  // duration shows nothing.
  if (dewPillLast !== null && bal > dewPillLast) {
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  }
  dewPillLast = bal;
}

var dewBaseRender = render;
render = function () {
  var out = dewBaseRender.apply(this, arguments);
  updateDewPill();
  return out;
};

var dewBaseNavigateTo = navigateTo;
navigateTo = function () {
  var out = dewBaseNavigateTo.apply(this, arguments);
  updateDewPill();
  return out;
};


// ---- The account export (10) ------------------------------------
// The wallet is the person's own data, so "Download my data" has to
// carry it. 10 builds the export from named fields, so it is added
// here rather than by editing 10. Wrapped whichever order the two
// files load in: now if 10 is already here, otherwise once the page
// has finished loading every script.

var dewExportWrapped = false;

function dewWrapExport() {
  if (dewExportWrapped || typeof buildAccountExport !== 'function') return;
  dewExportWrapped = true;
  var base = buildAccountExport;
  buildAccountExport = function () {
    var out = base.apply(this, arguments);
    dewRollDay();
    out.dew = {
      balance:          wallet.bal,
      earned_lifetime:  wallet.earned,
      spent_lifetime:   wallet.spent,
      earned_today:     wallet.today + wallet.htoday,
      owned:            wallet.owned.map(function (key) {
        var p = key.split(':');
        return p[0] === 'g'
          ? { kind: 'landscape', id: p[1] }
          : { kind: 'plant skin', category: p[1], id: p[2] };
      }),
    };
    return out;
  };
}

dewWrapExport();
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', dewWrapExport);
}


// ---- The popups -------------------------------------------------
// One small "+1 Dew" per change, each its own element that rises and
// fades in about a second. Several can be in the air at once, so ten
// quick ticks read as ten payouts rather than one label being
// rewritten in place. Oldest ones are dropped past DEW_POP_MAX so a
// burst never stacks up the screen.
//
// The words also go to one visually hidden live region, so a screen
// reader hears each change even though the popups themselves are
// decoration.

var DEW_POP_MS  = 1100;   // keep in step with dewPopRise in 15-wallet.css
var DEW_POP_MAX = 5;

function dewPopHost() {
  var host = document.getElementById('dewPops');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'dewPops';
  host.className = 'dew-pops';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);

  var live = document.createElement('div');
  live.id = 'dewLive';
  live.className = 'dew-live';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  return host;
}

function dewToast(text) {
  if (typeof document === 'undefined' || !document.body) return;
  var host = dewPopHost();

  var pop = document.createElement('div');
  pop.className = 'dew-pop' + (text.charAt(0) === '−' ? ' is-minus' : '');
  pop.innerHTML = dewDropIcon() + '<span>' + escapeHtml(text) + '</span>';
  host.appendChild(pop);

  while (host.children.length > DEW_POP_MAX) host.removeChild(host.firstChild);
  setTimeout(function () {
    if (pop.parentNode) pop.parentNode.removeChild(pop);
  }, DEW_POP_MS);

  var live = document.getElementById('dewLive');
  if (live) live.textContent = text;
}
