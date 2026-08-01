// ============================================
// 05: STATS + APP SHELL — stats page, profile header, main render(), sky, dev panel, greenhouse page
// Part of DISCIPLANT — split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 4 files.
// ============================================

// ============================================
// Stats page — yearly heatmaps + summary metric cards
//
// Two view modes, switched via #statsViewSelect:
//  - Overall Garden Overview: a 371-day (53-week) heatmap where each
//    day's intensity is the % of all current tasks completed that
//    day, plus garden-wide summary cards.
//  - Individual Plant View: the same grid for one selected task,
//    binary (completed / not), plus that task's own summary cards.
//
// Data source: each task's own `history` map (see toggleTask()),
// recording every calendar day it was actually checked off. Days
// before this field existed have no entry and simply render as
// "0% / not completed" — there's no way to recover completions that
// predate the field.
// ============================================

// ---- Date helpers ----

function formatDateStr(d) {
  var yyyy = d.getFullYear();
  var mm   = String(d.getMonth() + 1).padStart(2, '0');
  var dd   = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function getDateNDaysAgo(n) {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return formatDateStr(d);
}

// Builds a GitHub-style grid: an array of weeks, each an array of 7
// date strings (Sun–Sat), covering the last ~53 weeks up through
// today. The very first week is aligned back to the preceding Sunday
// so columns line up as real calendar weeks; the last week is padded
// with nulls past today so it's always exactly 7 cells.
function buildYearGrid() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var totalDays = 371; // 53 weeks
  var start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay()); // back up to Sunday

  var allDates = [];
  var cur = new Date(start);
  while (cur <= today) {
    allDates.push(formatDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }

  var weeks = [];
  for (var i = 0; i < allDates.length; i += 7) {
    var week = allDates.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// ---- Overall (all-tasks) day stats ----

// "Total active tasks" is simplified to the current task count for
// every date, since the app doesn't track how many tasks existed on
// any given past day — see the module note above.
function computeOverallDayStats(dateStr) {
  var total     = tasks.length;
  var completed = 0;
  tasks.forEach(function (t) {
    if (t.history && t.history[dateStr]) completed++;
  });
  var percent = total > 0 ? (completed / total) * 100 : 0;
  return { completed: completed, total: total, percent: percent };
}

function heatStageForPercent(percent) {
  if (percent <= 0)  return 0;
  if (percent <= 33) return 1;
  if (percent <= 66) return 2;
  return 3;
}

// ---- Shared grid renderer ----

// cellInfoFn(dateStr) -> { stage: 0-3, data: <anything> }
// tooltipFn(dateStr, info) -> string shown on hover
function renderHeatmapGrid(containerEl, weeks, cellInfoFn, tooltipFn) {
  containerEl.innerHTML = '';
  var grid = document.createElement('div');
  grid.className = 'heatmap-grid';

  weeks.forEach(function (week) {
    var col = document.createElement('div');
    col.className = 'heatmap-week';
    week.forEach(function (dateStr) {
      var cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      if (!dateStr) {
        cell.classList.add('heatmap-cell-empty');
      } else {
        var info = cellInfoFn(dateStr);
        cell.classList.add('heat-stage-' + info.stage);
        cell.dataset.tooltip = tooltipFn(dateStr, info);
      }
      col.appendChild(cell);
    });
    grid.appendChild(col);
  });

  containerEl.appendChild(grid);
}

// Hooks up hover tooltips for a heatmap container once — uses event
// delegation so it keeps working after renderHeatmapGrid() replaces
// the container's children on every re-render.
function initHeatmapTooltips(containerEl) {
  if (!containerEl || !heatmapTooltipEl) return;
  containerEl.addEventListener('mouseover', function (e) {
    var cell = e.target.closest('.heatmap-cell');
    if (!cell || !cell.dataset.tooltip) return;
    heatmapTooltipEl.textContent = cell.dataset.tooltip;
    heatmapTooltipEl.classList.remove('hidden');
  });
  containerEl.addEventListener('mousemove', function (e) {
    if (heatmapTooltipEl.classList.contains('hidden')) return;
    heatmapTooltipEl.style.left = (e.clientX + 14) + 'px';
    heatmapTooltipEl.style.top  = (e.clientY + 14) + 'px';
  });
  containerEl.addEventListener('mouseout', function (e) {
    if (!e.target.closest('.heatmap-cell')) return;
    heatmapTooltipEl.classList.add('hidden');
  });
}

function renderOverallHeatmap() {
  var container = document.getElementById('statsOverallHeatmap');
  if (!container) return;
  var weeks = buildYearGrid();

  renderHeatmapGrid(
    container,
    weeks,
    function (dateStr) {
      var d = computeOverallDayStats(dateStr);
      return { stage: heatStageForPercent(d.percent), data: d };
    },
    function (dateStr, info) {
      var d = info.data;
      return dateStr + ': ' + Math.round(d.percent) + '% of tasks completed (' +
        d.completed + '/' + d.total + ' tasks)';
    }
  );
}

function renderIndividualHeatmap(taskId) {
  var container = document.getElementById('statsIndividualHeatmap');
  var titleEl   = document.getElementById('statsIndividualHeatmapTitle');
  if (!container) return;

  var task = tasks.find(function (t) { return t.id === taskId; });

  if (titleEl) {
    titleEl.textContent = task
      ? (getCategoryById(task.categoryId).emoji + ' ' + task.text + ' — Yearly Activity')
      : 'Yearly Activity';
  }

  if (!task) {
    container.innerHTML = '<p class="empty-state">No task selected.</p>';
    return;
  }

  var hist  = task.history || {};
  var weeks = buildYearGrid();

  renderHeatmapGrid(
    container,
    weeks,
    function (dateStr) {
      var done = !!hist[dateStr];
      return { stage: done ? 3 : 0, data: { done: done } };
    },
    function (dateStr, info) {
      return dateStr + ': ' + (info.data.done ? 'Completed' : 'Not Completed');
    }
  );
}

// ---- Summary metric cards ----

function computeOverallStats() {
  var maxGrowthTask    = null;
  var allTimeMaxStreak = 0;
  var currentMaxStreak = 0;
  var weeklyGrowth     = 0;
  var monthlyGrowth    = 0;

  var last7  = []; for (var i = 0; i < 7;  i++) last7.push(getDateNDaysAgo(i));
  var last30 = []; for (var j = 0; j < 30; j++) last30.push(getDateNDaysAgo(j));

  tasks.forEach(function (t) {
    var totalGrowthDays = t.totalGrowthDays || 0;
    if (!maxGrowthTask || totalGrowthDays > (maxGrowthTask.totalGrowthDays || 0)) {
      maxGrowthTask = t;
    }
    allTimeMaxStreak = Math.max(allTimeMaxStreak, t.maxStreak || 0, t.streak || 0);
    currentMaxStreak = Math.max(currentMaxStreak, t.streak || 0);

    var hist = t.history || {};
    last7.forEach(function (d)  { if (hist[d]) weeklyGrowth++; });
    last30.forEach(function (d) { if (hist[d]) monthlyGrowth++; });
  });

  return {
    maxGrowthTask:    maxGrowthTask,
    allTimeMaxStreak: allTimeMaxStreak,
    currentMaxStreak: currentMaxStreak,
    weeklyGrowth:     weeklyGrowth,
    monthlyGrowth:    monthlyGrowth,
  };
}

function computeIndividualStats(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return null;

  var cat              = getCategoryById(task.categoryId);
  var totalGrowthDays  = task.totalGrowthDays || 0;
  var stageIdx         = getStageIndexForDays(totalGrowthDays);
  var scale            = computeScaleForDays(totalGrowthDays);
  var heightMeters     = computeHeightMeters(scale);
  var streak           = task.streak || 0;
  var maxStreak         = Math.max(task.maxStreak || 0, streak);

  var last7  = []; for (var i = 0; i < 7;  i++) last7.push(getDateNDaysAgo(i));
  var last30 = []; for (var j = 0; j < 30; j++) last30.push(getDateNDaysAgo(j));
  var hist   = task.history || {};

  return {
    task:            task,
    cat:             cat,
    stageIdx:        stageIdx,
    heightMeters:    heightMeters,
    streak:          streak,
    maxStreak:       maxStreak,
    weekCompletions:  last7.filter(function (d) { return hist[d]; }).length,
    monthCompletions: last30.filter(function (d) { return hist[d]; }).length,
  };
}

function statCardHtml(emoji, label, value, sub) {
  return (
    '<div class="stat-card">' +
      '<div class="stat-card-emoji">' + emoji + '</div>' +
      '<div class="stat-card-body">' +
        '<div class="stat-card-label">' + escapeHtml(label) + '</div>' +
        '<div class="stat-card-value">' + escapeHtml(value) + '</div>' +
        (sub ? '<div class="stat-card-sub">' + escapeHtml(sub) + '</div>' : '') +
      '</div>' +
    '</div>'
  );
}

function renderOverallCards() {
  var container = document.getElementById('statsOverallCards');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks yet — add one on the Tasks page to see your stats here.</p>';
    return;
  }

  var s      = computeOverallStats();
  var maxCat = s.maxGrowthTask ? getCategoryById(s.maxGrowthTask.categoryId) : null;

  container.innerHTML =
    statCardHtml(
      maxCat ? maxCat.emoji : '🌳',
      'Max Plant',
      maxCat ? s.maxGrowthTask.text : '—',
      maxCat ? ((s.maxGrowthTask.totalGrowthDays || 0) + ' days grown · ' + maxCat.species) : ''
    ) +
    statCardHtml('🏆', 'All-Time Max Streak',    s.allTimeMaxStreak + ' day' + (s.allTimeMaxStreak === 1 ? '' : 's'), '') +
    statCardHtml('🔥', 'Current Highest Streak', s.currentMaxStreak + ' day' + (s.currentMaxStreak === 1 ? '' : 's'), '') +
    statCardHtml('📅', 'Weekly Growth',          s.weeklyGrowth + ' completion' + (s.weeklyGrowth === 1 ? '' : 's'), 'last 7 days') +
    statCardHtml('📈', 'Monthly Growth',         s.monthlyGrowth + ' completion' + (s.monthlyGrowth === 1 ? '' : 's'), 'last 30 days');
}

function renderIndividualCards(taskId) {
  var container = document.getElementById('statsIndividualCards');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks yet — add one on the Tasks page to see your stats here.</p>';
    return;
  }

  var s = computeIndividualStats(taskId);
  if (!s) {
    container.innerHTML = '<p class="empty-state">No task selected.</p>';
    return;
  }

  container.innerHTML =
    statCardHtml(
      s.cat.emoji,
      'Current Stage & Height',
      'Stage ' + s.stageIdx + ' · ' + formatHeightMeters(s.heightMeters),
      s.cat.species + ' · ' + (s.task.totalGrowthDays || 0) + ' days grown'
    ) +
    statCardHtml('🔥', 'Current Streak',    s.streak + ' day' + (s.streak === 1 ? '' : 's'), '') +
    statCardHtml('🏆', 'Max Streak',        s.maxStreak + ' day' + (s.maxStreak === 1 ? '' : 's'), '') +
    statCardHtml('📅', 'Growth This Week',  s.weekCompletions + ' completion' + (s.weekCompletions === 1 ? '' : 's'), 'last 7 days') +
    statCardHtml('📈', 'Growth This Month', s.monthCompletions + ' completion' + (s.monthCompletions === 1 ? '' : 's'), 'last 30 days');
}

// ---- View mode wiring ----

// Rebuilds the single stats dropdown: "Overall" plus one entry per
// plant. Replaces the old two-dropdown (view mode + task) setup —
// picking a plant directly switches into Individual Plant View for
// that plant, no separate selector needed. Keeps the previous
// selection if it's still valid, otherwise falls back to Overall.
function populateStatsViewSelect() {
  var sel = document.getElementById('statsViewSelect');
  if (!sel) return;

  var prevValue = sel.value;
  sel.innerHTML = '';

  var overallOpt = document.createElement('option');
  overallOpt.value = 'overall';
  overallOpt.textContent = '🌻 Overall Garden Overview';
  sel.appendChild(overallOpt);

  tasks.forEach(function (t) {
    var cat = getCategoryById(t.categoryId);
    var opt = document.createElement('option');
    opt.value = String(t.id);
    opt.textContent = cat.emoji + ' ' + t.text;
    sel.appendChild(opt);
  });

  var validValues = ['overall'].concat(tasks.map(function (t) { return String(t.id); }));
  sel.value = (validValues.indexOf(prevValue) !== -1) ? prevValue : 'overall';
}

function renderStatsView() {
  var viewSelEl        = document.getElementById('statsViewSelect');
  var overallViewEl    = document.getElementById('statsOverallView');
  var individualViewEl = document.getElementById('statsIndividualView');
  var value = viewSelEl ? viewSelEl.value : 'overall';

  if (value !== 'overall') {
    var taskId = parseInt(value, 10);

    if (overallViewEl)    overallViewEl.classList.add('hidden');
    if (individualViewEl) individualViewEl.classList.remove('hidden');

    renderIndividualHeatmap(taskId);
    renderIndividualCards(taskId);
  } else {
    if (overallViewEl)    overallViewEl.classList.remove('hidden');
    if (individualViewEl) individualViewEl.classList.add('hidden');

    renderOverallHeatmap();
    renderOverallCards();
  }
}

// ============================================
// Profile identity header (Stats page)
// ============================================
// Garden level/badge — derived from LIFETIME growth days summed
// across every plant the user has ever grown, so it reflects total
// gardening effort rather than any single plant's progress.
var GARDEN_LEVELS = [
  { min: 0,   label: 'Level 1 — Seedling Starter' },
  { min: 10,  label: 'Level 2 — Sprout Novice' },
  { min: 30,  label: 'Level 3 — Growing Gardener' },
  { min: 75,  label: 'Level 4 — Bloom Keeper' },
  { min: 150, label: 'Level 5 — Flourishing Grower' },
  { min: 300, label: 'Level 6 — Master Gardener' },
];

function computeGardenLevel(lifetimeGrowthDays) {
  var current = GARDEN_LEVELS[0];
  GARDEN_LEVELS.forEach(function (lvl) {
    if (lifetimeGrowthDays >= lvl.min) current = lvl;
  });
  return current.label;
}

function renderProfileHeader() {
  if (!profileHeaderEl) return;

  var profile = currentUserProfile;

  var lifetimeGrowthDays = 0;
  var longestStreak      = 0;
  tasks.forEach(function (t) {
    lifetimeGrowthDays += (t.totalGrowthDays || 0);
    longestStreak = Math.max(longestStreak, t.maxStreak || 0, t.streak || 0);
  });
  var totalActivePlants = tasks.length;
  var levelLabel = computeGardenLevel(lifetimeGrowthDays);

  var avatarHtml = (!profile.isAnonymous && profile.photoURL)
    ? '<img class="profile-avatar-img" src="' + profile.photoURL + '" alt="" />'
    : '<div class="profile-avatar-fallback">' + (profile.isAnonymous ? '\uD83C\uDF31' : '\uD83C\uDF3B') + '</div>';

  var nameText  = profile.isAnonymous ? 'Guest Gardener' : (profile.displayName || 'Gardener');
  var emailText = profile.isAnonymous ? 'Not signed in — sign in to save your garden to an account' : (profile.email || '');

  var actionHtml = profile.isAnonymous
    ? '<button id="profileActionBtn" class="profile-action-btn" type="button">Sign in with Google</button>'
    : '<button id="profileActionBtn" class="profile-action-btn is-signout" type="button">Sign Out</button>';

  profileHeaderEl.innerHTML =
    '<div class="profile-header-top">' +
      avatarHtml +
      '<div class="profile-id-block">' +
        '<div class="profile-name">' + escapeHtml(nameText) + '</div>' +
        '<div class="profile-email">' + escapeHtml(emailText) + '</div>' +
        '<span class="profile-badge">' + escapeHtml(levelLabel) + '</span>' +
      '</div>' +
      actionHtml +
    '</div>' +
    '<div class="profile-quick-stats">' +
      '<div class="profile-quick-stat">' +
        '<div class="profile-quick-stat-value">' + longestStreak + '</div>' +
        '<div class="profile-quick-stat-label">Longest Streak</div>' +
      '</div>' +
      '<div class="profile-quick-stat">' +
        '<div class="profile-quick-stat-value">' + totalActivePlants + '</div>' +
        '<div class="profile-quick-stat-label">Active Plants</div>' +
      '</div>' +
      '<div class="profile-quick-stat">' +
        '<div class="profile-quick-stat-value">' + lifetimeGrowthDays + '</div>' +
        '<div class="profile-quick-stat-label">Lifetime Growth Days</div>' +
      '</div>' +
    '</div>';

  var actionBtn = document.getElementById('profileActionBtn');
  if (actionBtn) {
    actionBtn.addEventListener('click', function () {
      if (profile.isAnonymous) {
        openAuthModal();
      } else {
        signOutUser();
      }
    });
  }
}

function renderStatsPage() {
  populateStatsViewSelect();
  renderStatsView();
  renderProfileHeader();
}

// Wire the dropdowns once — renderStatsView() itself is what redraws
// the page content each time either selection changes.
var statsViewSelectEl = document.getElementById('statsViewSelect');
if (statsViewSelectEl) statsViewSelectEl.addEventListener('change', renderStatsView);

// Tooltip hookup — done once; both containers get their children
// replaced on every render, but delegation means this still works.
initHeatmapTooltips(document.getElementById('statsOverallHeatmap'));
initHeatmapTooltips(document.getElementById('statsIndividualHeatmap'));


// ============================================
// Main render — called after every state change
// ============================================
function render() {
  renderTaskList();
  renderGarden();
  renderDevPanel();
  if (currentPage === 'stats' && authReady) renderStatsPage();
  if (currentPage === 'greenhouse' && authReady) renderGreenhouse();
}


// ============================================
// Sky background — real-time time-of-day display
// ============================================

function hexToRgb(hex) {
  var match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function lerpColor(hexA, hexB, t) {
  var a = hexToRgb(hexA);
  var b = hexToRgb(hexB);
  return (
    'rgb(' +
    Math.round(a.r + (b.r - a.r) * t) + ',' +
    Math.round(a.g + (b.g - a.g) * t) + ',' +
    Math.round(a.b + (b.b - a.b) * t) +
    ')'
  );
}

function updateSky() {
  var now         = new Date();
  var timeDecimal = now.getHours() + now.getMinutes() / 60;

  var prev = SKY_KEY_FRAMES[0];
  var next = SKY_KEY_FRAMES[SKY_KEY_FRAMES.length - 1];
  for (var i = 0; i < SKY_KEY_FRAMES.length - 1; i++) {
    if (timeDecimal >= SKY_KEY_FRAMES[i].hour &&
        timeDecimal <  SKY_KEY_FRAMES[i + 1].hour) {
      prev = SKY_KEY_FRAMES[i];
      next = SKY_KEY_FRAMES[i + 1];
      break;
    }
  }
  var t        = (timeDecimal - prev.hour) / (next.hour - prev.hour);
  var topColor = lerpColor(prev.top,    next.top,    t);
  var botColor = lerpColor(prev.bottom, next.bottom, t);
  skyEl.style.background =
    'linear-gradient(180deg, ' + topColor + ' 0%, ' + botColor + ' 100%)';

  var isDay         = timeDecimal >= 7 && timeDecimal < 19;
  skyBodyEl.textContent = isDay ? '☀️' : '🌙';

  // Toggle ambient-detail visibility based on time of day
  skyEl.classList.toggle('sky-day',   isDay);
  skyEl.classList.toggle('sky-night', !isDay);

  // Garden page ground (fence + lawn) — the sky itself is now the
  // shared #sky element above, so this just keeps the ground's
  // night-dimming in sync with real time.
  if (gardenBackdropEl) gardenBackdropEl.classList.toggle('gb-night', !isDay);
  if (gardenSceneEl)    gardenSceneEl.classList.toggle('scene-night', !isDay);

  var arcProgress;
  if (isDay) {
    arcProgress = (timeDecimal - 7) / 12;
  } else {
    var hoursPast19 = timeDecimal >= 19
      ? timeDecimal - 19
      : timeDecimal + 5;
    arcProgress = hoursPast19 / 12;
  }
  arcProgress = Math.max(0, Math.min(1, arcProgress));

  var leftPct  = 8 + arcProgress * 80;
  var arcHeight = Math.sin(arcProgress * Math.PI);
  var topPct    = 5 + (1 - arcHeight) * 35;

  skyBodyEl.style.left = leftPct + '%';
  skyBodyEl.style.top  = topPct  + '%';
}

updateSky();
setInterval(updateSky, 60000);


// ============================================
// Watch for a live midnight rollover
// ============================================
// applyDayBoundaries() otherwise only runs once, when the Firestore
// snapshot first loads — if the tab is left open across midnight,
// today's checkboxes and streak resets wouldn't apply until the next
// reload. Poll alongside the sky update so it takes effect live.
function checkDayRollover() {
  if (!currentUserId) return;
  if (applyDayBoundaries()) {
    saveData();
    render();
  }
}
setInterval(checkDayRollover, 60000);


// ============================================
// Keep plant positions correct across resizes
// ============================================
// computePlantLayout() sizes its label-clipping safety margin off
// window.innerWidth, so a real viewport resize (rotating a phone,
// resizing a browser window) can change what a safe position is.
// Debounced so a drag-resize doesn't re-render on every pixel.
var gardenResizeTimer = null;
window.addEventListener('resize', function () {
  if (currentPage !== 'garden' || !authReady) return;
  clearTimeout(gardenResizeTimer);
  gardenResizeTimer = setTimeout(function () { renderGarden(); }, 150);
});


// ============================================
// Developer mode — editable growth inspector
//
// Lets you punch in (or nudge, or jump to a milestone) a task's
// streak and totalGrowthDays directly, so you can watch the garden
// respond immediately instead of waiting real days for a plant to
// grow. Streak/total-days edits here are PREVIEW ONLY — they update
// local state and re-render the garden, but deliberately skip
// saveData(), so a page reload always restores your real saved
// progress. The "done today" checkbox is the one real exception: it
// calls the same toggleTask() used on the Tasks page, so it behaves
// identically and does save.
// ============================================

let devModeEnabled = false;
try { devModeEnabled = localStorage.getItem('disciplant_devmode') === '1'; } catch (e) {}

const devToggleBtn      = document.getElementById('devModeToggle');
const devPanelEl         = document.getElementById('devPanel');
const devPanelBody       = document.getElementById('devPanelBody');
const devPanelClose      = document.getElementById('devPanelClose');
const devActionRollover  = document.getElementById('devActionRollover');
const devActionLog       = document.getElementById('devActionLog');
const devActionCopy      = document.getElementById('devActionCopy');

function addDaysToDateString(dateStr, delta) {
  var d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  var yyyy = d.getFullYear();
  var mm   = String(d.getMonth() + 1).padStart(2, '0');
  var dd   = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function setDevMode(on) {
  devModeEnabled = on;
  try { localStorage.setItem('disciplant_devmode', on ? '1' : '0'); } catch (e) {}
  if (devPanelEl)   devPanelEl.classList.toggle('hidden', !on);
  if (devToggleBtn) devToggleBtn.classList.toggle('active', on);
  if (on) renderDevPanel();
}

function devFlashButton(btn, tempText, restoreText, ms) {
  if (!btn) return;
  btn.textContent = tempText;
  setTimeout(function () { btn.textContent = restoreText; }, ms || 1200);
}

function getDevTaskId(el) {
  var row = el.closest('[data-task-id]');
  return row ? parseInt(row.getAttribute('data-task-id'), 10) : null;
}

// Builds the full editable panel body: a short summary line, then
// one card per task with live-computed Daily and Long-Term stage +
// scale, so the numbers you're editing and their visual effect are
// right next to each other.
function renderDevPanel() {
  if (!devModeEnabled || !devPanelBody) return;

  var maxStageIdx = PLANT_SVG_DATA.misc.length - 1;

  var summaryHtml =
    '<div class="dev-summary">' +
      '<span>' + currentGardenTab + ' garden</span><span>·</span>' +
      '<span>' + tasks.length + ' task' + (tasks.length === 1 ? '' : 's') + '</span><span>·</span>' +
      '<span>' + getTodayString() + '</span>' +
    '</div>' +
    '<p class="dev-note">Streak and total-days fields below are preview only — they update the garden live but aren\'t saved, so reloading restores your real progress. "Done today" is real and does save.</p>';

  var rowsHtml = tasks.map(function (t) {
    var cat            = getCategoryById(t.categoryId);
    var streak          = Math.max(0, t.streak || 0);
    var totalGrowthDays = Math.max(0, t.totalGrowthDays || 0);

    var dailyStreakStage = getStageIndexForDays(streak);
    var dailyStreakScale = computeScaleForDays(streak);
    var dailyStageIdx    = t.completed ? maxStageIdx : dailyStreakStage;
    var dailyScale       = t.completed ? (dailyStreakScale * 1.35) : dailyStreakScale;

    var ltStageIdx = getStageIndexForDays(totalGrowthDays);
    var momentum   = 1 + Math.min(streak, 60) * 0.004;
    var ltScale    = computeScaleForDays(totalGrowthDays) * momentum;

    var milestoneBtns = STAGE_MILESTONES.map(function (m) {
      return '<button type="button" class="dev-quick-btn" data-dev-action="set" ' +
        'data-dev-field="totalGrowthDays" data-dev-value="' + m + '">' + m + 'd</button>';
    }).join('');

    return (
      '<div class="dev-task-row" data-task-id="' + t.id + '">' +
        '<div class="dev-task-row-head">' +
          '<span class="dev-task-title">' + cat.emoji + ' ' + escapeHtml(t.text) + '</span>' +
          '<label class="dev-task-done">' +
            '<input type="checkbox" data-dev-field="completed"' + (t.completed ? ' checked' : '') + ' /> done today' +
          '</label>' +
        '</div>' +

        '<div class="dev-field-group">' +
          '<span class="dev-field-label">Streak 🔥</span>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="dec" data-dev-field="streak" data-dev-step="1">−1</button>' +
          '<input type="number" class="dev-number-input" data-dev-field="streak" min="0" value="' + streak + '" />' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="streak" data-dev-step="1">+1</button>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="streak" data-dev-step="7">+7</button>' +
        '</div>' +

        '<div class="dev-field-group">' +
          '<span class="dev-field-label">Total days 🌱</span>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="dec" data-dev-field="totalGrowthDays" data-dev-step="1">−1</button>' +
          '<input type="number" class="dev-number-input" data-dev-field="totalGrowthDays" min="0" value="' + totalGrowthDays + '" />' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="totalGrowthDays" data-dev-step="1">+1</button>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="totalGrowthDays" data-dev-step="7">+7</button>' +
          '<button type="button" class="dev-quick-btn" data-dev-action="inc" data-dev-field="totalGrowthDays" data-dev-step="30">+30</button>' +
        '</div>' +

        '<div class="dev-field-group dev-milestones">' +
          '<span class="dev-field-label">Jump to stage</span>' +
          milestoneBtns +
        '</div>' +

        '<div class="dev-task-readout">' +
          'Daily: stage ' + dailyStageIdx + ' · ' + dailyScale.toFixed(2) + 'x' +
          ' &nbsp;|&nbsp; Long-term: stage ' + ltStageIdx + ' · ' + ltScale.toFixed(2) + 'x' +
        '</div>' +
      '</div>'
    );
  }).join('');

  devPanelBody.innerHTML = summaryHtml +
    (rowsHtml || '<p class="dev-empty">No tasks yet — add one on the Tasks page to see it here.</p>');
}

if (devToggleBtn) {
  devToggleBtn.addEventListener('click', function () { setDevMode(!devModeEnabled); });
}
if (devPanelClose) {
  devPanelClose.addEventListener('click', function () { setDevMode(false); });
}

// Ctrl/Cmd + Shift + D also toggles the panel.
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    setDevMode(!devModeEnabled);
  }
});

// Quick +/-/jump buttons — click applies immediately.
if (devPanelBody) {
  devPanelBody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dev-action]');
    if (!btn) return;

    var field = btn.getAttribute('data-dev-field');
    if (field !== 'streak' && field !== 'totalGrowthDays') return;

    var taskId = getDevTaskId(btn);
    var task   = tasks.find(function (t) { return t.id === taskId; });
    if (!task) return;

    var action  = btn.getAttribute('data-dev-action');
    var current = Math.max(0, task[field] || 0);
    var next;

    if (action === 'set') {
      next = parseInt(btn.getAttribute('data-dev-value'), 10) || 0;
    } else {
      var step = parseInt(btn.getAttribute('data-dev-step'), 10) || 1;
      next = action === 'inc' ? current + step : Math.max(0, current - step);
    }

    task[field] = next;
    render(); // updates the garden AND rebuilds this panel — preview only, not saved
  });

  // Typed number-field edits — applied on change (blur / Enter), so
  // the panel doesn't rebuild itself out from under you mid-keystroke.
  devPanelBody.addEventListener('change', function (e) {
    var target = e.target;
    if (!target.matches('[data-dev-field]')) return;

    var taskId = getDevTaskId(target);
    var task   = tasks.find(function (t) { return t.id === taskId; });
    if (!task) return;

    var field = target.getAttribute('data-dev-field');

    if (field === 'completed') {
      toggleTask(taskId, target.checked); // real toggle — same as the Tasks page, does save
      return;
    }

    if (field === 'streak' || field === 'totalGrowthDays') {
      var val = Math.max(0, parseInt(target.value, 10) || 0);
      task[field] = val;
      render();
    }
  });
}

if (devActionRollover) {
  devActionRollover.addEventListener('click', function () {
    // Backdates lastResetDate by one day and runs the same boundary
    // logic a real midnight rollover uses — any task not currently
    // checked off will have its streak reset to 0 and get unchecked,
    // exactly like missing a real day would.
    lastResetDate = addDaysToDateString(getTodayString(), -1);
    checkDayRollover();
    devFlashButton(devActionRollover, 'Rolled ✓', 'Simulate day rollover', 1200);
  });
}

if (devActionLog) {
  devActionLog.addEventListener('click', function () {
    console.log('DISCIPLANT dev state:', {
      tasks: tasks, lastResetDate: lastResetDate, currentUserId: currentUserId,
      currentPage: currentPage, currentGardenTab: currentGardenTab,
    });
    console.table(tasks);
    devFlashButton(devActionLog, 'Logged ✓', 'Log to console', 1200);
  });
}

if (devActionCopy) {
  devActionCopy.addEventListener('click', function () {
    var payload = JSON.stringify({ tasks: tasks, lastResetDate: lastResetDate }, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload)
        .then(function () { devFlashButton(devActionCopy, 'Copied ✓', 'Copy state JSON', 1200); })
        .catch(function (err) { console.error('DISCIPLANT: copy failed:', err); });
    } else {
      console.log(payload);
    }
  });
}

// Reflect whatever was stored from a previous session.
setDevMode(devModeEnabled);


// ============================================
// Greenhouse — the plant skin page
// ============================================
// Every task is a plant, and every plant gets a card here. Tapping a
// card unfolds a skin section directly beneath it — full width of the
// grid — with one tile per skin available to that plant's species.
// Choosing a tile repaints the card AND the plant standing out in the
// garden, because both read the same task.skinId.
//
// This replaces the old per-row picker modal on the Tasks page; the
// pip button on a task row is now just a shortcut that jumps here.
// ============================================

var greenhouseGridEl  = document.getElementById('greenhouseGrid');
var greenhouseEmptyEl = document.getElementById('greenhouseEmpty');

// Which plant's skin section is currently unfolded (null = none).
var greenhouseOpenTaskId = null;

// Set for exactly one render when a card is freshly opened, so the
// section scrolls itself into view then — but never on the re-render
// that follows picking a skin, which would yank the page around.
var greenhouseScrollPending = false;

// Skins are always previewed fully grown — at seed stage almost every
// skin looks the same, which makes for a useless choice.
var SKIN_PREVIEW_STAGE = 3;

// The three-colour chip used on task rows, plant cards and skin tiles.
function skinPipHtml(skin) {
  var s = (skin && skin.swatch) || ['#8FBF7F', '#5C8267', '#274F3C'];
  return '<span class="skin-pip" style="background:linear-gradient(135deg,' +
         s[0] + ' 0 33%,' + s[1] + ' 33% 66%,' + s[2] + ' 66% 100%)"></span>';
}

function skinCountLabel(n) {
  return n + (n === 1 ? ' skin' : ' skins');
}


// ---- Opening / closing a plant's skin section --------------------

function toggleGreenhousePlant(taskId) {
  if (greenhouseOpenTaskId === taskId) {
    greenhouseOpenTaskId = null;          // tapping an open card closes it
  } else {
    greenhouseOpenTaskId    = taskId;
    greenhouseScrollPending = true;
  }
  renderGreenhouse();
}

function closeGreenhousePlant() {
  greenhouseOpenTaskId = null;
  renderGreenhouse();
}

// Used by the pip shortcut on the Tasks page: jump to the Greenhouse
// with this plant's skins already open.
function openPlantSkins(taskId) {
  greenhouseOpenTaskId    = taskId;
  greenhouseScrollPending = true;
  navigateTo('greenhouse');
}

function setTaskSkin(taskId, skinId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;
  task.skinId = skinId;
  saveData();
  // One render repaints the card here, the pip on the Tasks page and
  // the plant out in the garden — they all read task.skinId.
  render();
}


// ---- The skin section that unfolds under a card ------------------

function buildSkinDrawer(task, cat) {
  var drawer       = document.createElement('div');
  drawer.className = 'skin-drawer';
  drawer.id        = 'skin-drawer-' + task.id;

  var skins   = getSkinsFor(task.categoryId);
  // Compare against the *resolved* skin so the tile for the default is
  // still shown as selected when a task carries an unknown id.
  var current = getSkin(task.categoryId, getTaskSkinId(task)).id;

  var tiles = skins.map(function (skin) {
    var selected = (skin.id === current);
    return (
      '<button type="button" class="skin-tile' + (selected ? ' selected' : '') + '"' +
        ' data-skin-id="' + skin.id + '"' +
        ' aria-pressed="' + (selected ? 'true' : 'false') + '">' +
        '<span class="skin-tile-art">' +
          getPlantSVG(task.categoryId, SKIN_PREVIEW_STAGE, skin.id, 74) +
        '</span>' +
        '<span class="skin-tile-name">' + skinPipHtml(skin) +
          escapeHtml(skin.name) + '</span>' +
        '<span class="skin-tile-note">' + escapeHtml(skin.note || '') + '</span>' +
      '</button>'
    );
  }).join('');

  drawer.innerHTML =
    '<div class="skin-drawer-head">' +
      '<div class="skin-drawer-heading">' +
        '<h3 class="skin-drawer-title">' + escapeHtml(task.text) + '</h3>' +
        '<p class="skin-drawer-subtitle">' + cat.emoji + ' ' + escapeHtml(cat.species) +
          ' \u00b7 ' + skinCountLabel(skins.length) + ' \u00b7 shown at full growth</p>' +
      '</div>' +
      '<button type="button" class="skin-drawer-close" aria-label="Close skins">\u2715</button>' +
    '</div>' +
    '<div class="skin-grid">' + tiles + '</div>';

  drawer.querySelectorAll('.skin-tile').forEach(function (tile) {
    tile.addEventListener('click', function () {
      setTaskSkin(task.id, tile.getAttribute('data-skin-id'));
    });
  });

  var closeBtn = drawer.querySelector('.skin-drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeGreenhousePlant);

  return drawer;
}


// ---- The page ----------------------------------------------------

function renderGreenhouse() {
  if (!greenhouseGridEl) return;

  // A task can be removed on the Tasks page while its skin section is
  // open here — don't leave a dangling id behind.
  if (greenhouseOpenTaskId !== null &&
      !tasks.some(function (t) { return t.id === greenhouseOpenTaskId; })) {
    greenhouseOpenTaskId = null;
  }

  greenhouseGridEl.innerHTML = '';
  if (greenhouseEmptyEl) greenhouseEmptyEl.classList.toggle('hidden', tasks.length > 0);

  tasks.forEach(function (task) {
    var cat  = getCategoryById(task.categoryId);
    var skin = getSkin(task.categoryId, getTaskSkinId(task));
    var open = (task.id === greenhouseOpenTaskId);

    var card              = document.createElement('button');
    card.type             = 'button';
    card.className        = 'plant-card' + (open ? ' open' : '');
    card.dataset.category = task.categoryId;
    card.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.setAttribute('aria-controls', 'skin-drawer-' + task.id);
    card.title = 'Change how this ' + cat.species + ' looks';

    card.innerHTML =
      '<span class="plant-card-art">' +
        getPlantSVG(task.categoryId, SKIN_PREVIEW_STAGE, skin.id, 84) +
      '</span>' +
      '<span class="plant-card-name">' + escapeHtml(task.text) + '</span>' +
      '<span class="plant-card-species">' + cat.emoji + ' ' +
        escapeHtml(cat.species) + '</span>' +
      '<span class="plant-card-skin">' + skinPipHtml(skin) +
        escapeHtml(skin.name) + '</span>';

    (function (id) {
      card.addEventListener('click', function () { toggleGreenhousePlant(id); });
    }(task.id));

    greenhouseGridEl.appendChild(card);

    // The section spans the full grid width, so it always lands on its
    // own row directly beneath the card that opened it.
    if (open) greenhouseGridEl.appendChild(buildSkinDrawer(task, cat));
  });

  if (greenhouseScrollPending && greenhouseOpenTaskId !== null) {
    greenhouseScrollPending = false;
    var openDrawer = document.getElementById('skin-drawer-' + greenhouseOpenTaskId);
    if (openDrawer && openDrawer.scrollIntoView) {
      requestAnimationFrame(function () {
        openDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }
}

// Escape closes an open skin section.
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && currentPage === 'greenhouse' && greenhouseOpenTaskId !== null) {
    closeGreenhousePlant();
  }
});