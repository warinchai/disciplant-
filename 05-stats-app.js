// ============================================
// 05: STATS + APP SHELL — stats page, profile header, main render(), sky, greenhouse page
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
  // Days, not `scale`. computeHeightMeters() takes a day count, and
  // handing it the size multiplier instead quietly reported the height
  // of a two-or-three-day-old plant no matter how old the plant was.
  // It went unnoticed while the two numbers were the same order of
  // magnitude; speeding growth up would have moved this readout, which
  // is exactly what the height figure is supposed to never do.
  var heightMeters     = computeHeightMeters(totalGrowthDays);
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

  // The account picture is the sprout circle for everyone, signed in
  // or not - same AVATAR_SPROUT_SVG the widget pill and both modals
  // use (global from 02, which loads first). The Google account photo
  // is deliberately not painted any more, and the guest/signed-in
  // emoji pair it used to fall back to is gone with it. The host div
  // stays: .profile-avatar-fallback is what sizes the 56px circle.
  var avatarHtml =
    '<div class="profile-avatar-fallback">' + AVATAR_SPROUT_SVG + '</div>';

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
  // Only present when 09-dev-mode.js is loaded, which it is not in
  // production. Without this guard every render throws.
  if (typeof renderDevPanel === 'function') renderDevPanel();
  if (currentPage === 'stats' && authReady) renderStatsPage();
  if (currentPage === 'greenhouse' && authReady) renderGreenhouse();
  if (currentPage === 'friends' && authReady) renderFriendsPage();
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

// Pulls an already-interpolated 'rgb(r, g, b)' string toward black.
// Takes the string rather than the two hex keyframes because the
// colour it is given has already been mixed between them.
function deepenColor(rgbString, amount) {
  var match = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgbString);
  if (!match) return rgbString;

  var keep = Math.max(0, 1 - amount);
  return (
    'rgb(' +
    Math.round(match[1] * keep) + ',' +
    Math.round(match[2] * keep) + ',' +
    Math.round(match[3] * keep) +
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

  // The garden scrolls up past the top of the frame, and the strip of
  // sky above it is painted from these two: the colour the top of the
  // frame is showing right now, and that same colour taken further
  // toward space. See .garden-sky-extension in style.css.
  //
  // Published as custom properties on the document rather than written
  // onto the strip itself, because renderGarden() rebuilds that
  // element from scratch on every render and would throw an inline
  // style away - this way the sky keeps following the clock without
  // either side having to know when the other runs.
  var rootStyle = document.documentElement.style;
  rootStyle.setProperty('--sky-top',  topColor);
  rootStyle.setProperty('--sky-high', deepenColor(topColor, 0.55));

  var isDay         = timeDecimal >= 7 && timeDecimal < 19;
  skyBodyEl.textContent = isDay ? '☀️' : '🌙';

  // Toggle ambient-detail visibility based on time of day
  skyEl.classList.toggle('sky-day',   isDay);
  skyEl.classList.toggle('sky-night', !isDay);

  // Garden page ground (lawn + fence) — all of it lives inside the
  // scrollable scene now, so one class on the scene dims the lot in
  // step with real time.
  if (gardenSceneEl) gardenSceneEl.classList.toggle('scene-night', !isDay);
  // The friend garden is a second scene element (see 01), so it needs
  // the same night class or a friend's plot would stay lit at midnight
  // while the user's own garden dims.
  if (friendGardenSceneEl) friendGardenSceneEl.classList.toggle('scene-night', !isDay);

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
// Developer mode
// ============================================
// Moved out to 09-dev-mode.js, which is NOT loaded on the public site
// (commented script tag in index.html, and the filename is in
// .vercelignore so it is never even deployed). Nothing here depends on
// it — render() calls renderDevPanel() through a typeof guard, so the
// app behaves identically whether the file is present or not.


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
  // Locked tiles are already disabled buttons, so this only fires if
  // something bypassed the UI. Checked here anyway — this is the one
  // function that writes skinId, so it's the only place a locked skin
  // could ever get saved.
  if (!isSkinUnlocked(task, task.categoryId, skinId)) return;
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
  // still shown as selected when a task carries an unknown id — or one
  // that's currently locked, in which case classic is what's worn and
  // classic is what should read as selected.
  var current  = getSkin(task.categoryId, getTaskSkinId(task)).id;
  var unlocked = countUnlockedSkins(task, task.categoryId);

  // A locked tile shows its plant in full colour — same art, same
  // palette, same swatch pip as an unlocked one. Dimming it would hide
  // exactly the thing that makes someone want it, and wanting it is
  // the mechanic. What marks it locked instead: a padlock pinned to
  // the tile's top-right corner, clear of the plant, and the thing to
  // go and do written underneath in place of its flavour note.
  var tiles = skins.map(function (skin) {
    var state    = getSkinUnlockState(task, task.categoryId, skin.id);
    var selected = (skin.id === current);
    var locked   = !state.unlocked;
    var progress = skinUnlockProgress(state);

    var footer = locked
      ? '<span class="skin-tile-req">' + escapeHtml(skinUnlockRequirement(state)) +
          (progress ? '<span class="skin-tile-progress">' + escapeHtml(progress) + '</span>' : '') +
        '</span>'
      : '<span class="skin-tile-note">' + escapeHtml(skin.note || '') + '</span>';

    return (
      '<button type="button" class="skin-tile' +
        (selected ? ' selected' : '') + (locked ? ' locked' : '') + '"' +
        ' data-skin-id="' + skin.id + '"' +
        (locked ? ' disabled aria-disabled="true"' : '') +
        ' aria-pressed="' + (selected ? 'true' : 'false') + '"' +
        ' title="' + escapeHtml(locked ? skin.name + ' \u2014 ' + skinUnlockRequirement(state)
                                       : skin.name) + '">' +
        // Sibling of the art, not a child of it: the padlock anchors
        // to the tile's corner, and .skin-tile-art clips overflow.
        (locked ? '<span class="skin-lock" aria-hidden="true">\uD83D\uDD12</span>' : '') +
        '<span class="skin-tile-art">' +
          getPlantSVG(task.categoryId, SKIN_PREVIEW_STAGE, skin.id, 74) +
        '</span>' +
        '<span class="skin-tile-name">' + skinPipHtml(skin) +
          escapeHtml(skin.name) + '</span>' +
        footer +
      '</button>'
    );
  }).join('');

  drawer.innerHTML =
    '<div class="skin-drawer-head">' +
      '<div class="skin-drawer-heading">' +
        '<h3 class="skin-drawer-title">' + escapeHtml(task.text) + '</h3>' +
        '<p class="skin-drawer-subtitle">' + cat.emoji + ' ' + escapeHtml(cat.species) +
          ' \u00b7 ' + unlocked + ' of ' + skinCountLabel(skins.length) + ' unlocked' +
          ' \u00b7 shown at full growth</p>' +
      '</div>' +
      '<button type="button" class="skin-drawer-close" aria-label="Close skins">\u2715</button>' +
    '</div>' +
    '<div class="skin-grid">' + tiles + '</div>';

  drawer.querySelectorAll('.skin-tile').forEach(function (tile) {
    if (tile.disabled) return;   // locked tiles get no listener at all
    tile.addEventListener('click', function () {
      setTaskSkin(task.id, tile.getAttribute('data-skin-id'));
    });
  });

  var closeBtn = drawer.querySelector('.skin-drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeGreenhousePlant);

  return drawer;
}


// ============================================
// The landscape picker
// ============================================
// One choice for the whole garden, so unlike the plant skins below
// there is no card to open and no drawer to unfold - it is just the
// row of options, always visible, at the top of the page.
//
// The preview in each tile is NOT a picture of the skin. The tile
// button carries the skin's own custom properties inline, and the
// SVG inside reads them by name, exactly as the real lawn and fence
// do. So the swatch cannot drift from what the garden will look
// like: to make it lie you would have to break the garden too.
//
// One consequence worth knowing: every colour in that SVG has to be
// set through a style attribute, never a fill/stroke attribute.
// Presentation attributes don't resolve var(), so fill="var(--x)"
// silently paints nothing at all.
// ============================================

var landscapePickerEl = document.getElementById('landscapePicker');

// Enough blades to read as ground cover at this size without turning
// the tile into a solid block of colour.
var LANDSCAPE_PREVIEW_BLADES = 22;

function landscapePreviewSvg(skin) {
  var grass = getGrassPalette(skin);

  // Grass first as a string, so the blades sit above the ground bands
  // and below the fence in paint order.
  var blades = '';
  for (var i = 0; i < LANDSCAPE_PREVIEW_BLADES; i++) {
    var s   = i * 7.31;
    // Stratified across the width, same trick as the real field, so
    // no tile ever draws with a bald patch down one side.
    var x   = (i + 0.15 + hashSeed(s) * 0.7) * (160 / LANDSCAPE_PREVIEW_BLADES);
    // Bases only in the ground band, so the tallest blade still tops
    // out below the fence rather than sprouting out of thin air.
    var y   = 38 + hashSeed(s + 0.41) * 48;
    var h   = 5 + hashSeed(s + 0.83) * 8;
    var w   = 1.5 + hashSeed(s + 1.27) * 1.3;
    var rot = (hashSeed(s + 1.79) - 0.5) * 34;
    var col = grass.palette[Math.floor(hashSeed(s + 2.31) * grass.palette.length)];
    blades +=
      '<rect x="' + (x - w / 2).toFixed(2) + '" y="' + (y - h).toFixed(2) +
      '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) +
      '" rx="' + (w / 2).toFixed(2) + '"' +
      ' transform="rotate(' + rot.toFixed(1) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')"' +
      ' style="fill:' + col + ';opacity:0.9"></rect>';
  }

  // One of each prop type the skin carries, at the two spots on the
  // right that the signpost isn't using. Built by the same builders
  // the garden calls, so a skin can't advertise a lollipop and then
  // grow something else.
  //
  // Wrapped in a <g transform> rather than given x/y: the builders
  // return a complete <svg> sized in user units, and a nested <svg>
  // inherits an ancestor transform, so translating the group puts the
  // prop's top-left exactly where it's told.
  var propPreview = '';
  if (skin && Array.isArray(skin.props)) {
    var spots = [[116, 84], [62, 88]];
    skin.props.slice(0, 2).forEach(function (prop, i) {
      // Not the garden's px width - the preview is a 160x90 box and
      // a crater 78px across at real size would fill half of it. The
      // factor is tuned to the tile, and only the proportions and
      // palette are meant to carry over.
      var w = (prop.width || 24) * 0.42;
      var h = w * (prop.ratio || 1);
      propPreview +=
        '<g transform="translate(' + (spots[i][0] - w / 2).toFixed(1) + ',' +
          (spots[i][1] - h).toFixed(1) + ')">' +
        prop.build(i * 9.71 + 3.37, w) + '</g>';
    });
  }

  // Five pickets cycling the four fence shades, which is what the
  // real repeating gradient does over 104px.
  var pickets = '';
  var order = ['--fence-a', '--fence-b', '--fence-c', '--fence-d', '--fence-a'];
  for (var p = 0; p < order.length; p++) {
    pickets +=
      '<rect x="' + (10 + p * 31) + '" y="8" width="11" height="19" rx="2"' +
      ' style="fill:var(' + order[p] + ')"></rect>';
  }

  return (
    '<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      // Ground, back to front. Three flat bands rather than a
      // gradient: no gradient means no <defs>, and no <defs> means no
      // element id that could collide with the other tile's.
      '<rect x="0" y="24" width="160" height="30" style="fill:var(--lawn-back)"></rect>' +
      '<rect x="0" y="50" width="160" height="22" style="fill:var(--lawn-mid)"></rect>' +
      '<rect x="0" y="68" width="160" height="22" style="fill:var(--lawn-front)"></rect>' +
      // The soft crest along the top edge of the ground.
      '<path d="M0 26 Q40 20 82 25 Q124 30 160 24 L160 32 L0 32 Z"' +
        ' style="fill:var(--lawn-crest)"></path>' +
      // Fence: rail, pickets, then the contact shadow bridging it
      // into the grass - the same three parts as the real one.
      '<rect x="0" y="6" width="160" height="3" style="fill:var(--fence-rail)"></rect>' +
      pickets +
      '<rect x="0" y="27" width="160" height="5"' +
        ' style="fill:rgba(var(--fence-shadow-rgb), 0.30)"></rect>' +
      blades +
      propPreview +
      // The signpost, so the man-made half of the skin is visible too.
      '<rect x="20" y="63" width="4" height="17" rx="1"' +
        ' style="fill:var(--scenery-wood);stroke:var(--scenery-wood-deep);stroke-width:1.4"></rect>' +
      '<rect x="8" y="52" width="29" height="13" rx="2.5"' +
        ' style="fill:var(--scenery-wood-lit);stroke:var(--scenery-wood-deep);stroke-width:1.6"></rect>' +
      '<rect x="13" y="57" width="19" height="2" rx="1"' +
        ' style="fill:var(--scenery-ink);opacity:0.75"></rect>' +
    '</svg>'
  );
}

// Writes the choice. The only place gardenSkinId is ever assigned
// outside the Firestore load, which is what keeps a locked landscape
// from being saved if the gates ever arrive and something bypasses
// the disabled button.
function setGardenSkin(skinId) {
  if (!isGardenSkinUnlocked(skinId)) return;

  var resolved = getGardenSkin(skinId).id;
  // Re-tapping the tile that's already on would otherwise cost a
  // document write for no change at all.
  if (resolved === getActiveGardenSkinId()) return;

  gardenSkinId = resolved;
  saveData();
  // One render repaints the tiles here AND the garden itself, since
  // renderGarden() re-resolves the active skin every time.
  render();
}

function renderLandscapePicker() {
  if (!landscapePickerEl) return;

  var current = getActiveGardenSkinId();

  var tiles = GARDEN_SKINS.map(function (skin) {
    var state    = getGardenSkinUnlockState(skin.id);
    var selected = (skin.id === current);
    var locked   = !state.unlocked;

    var footer = locked
      ? '<span class="skin-tile-req">' +
          escapeHtml(gardenSkinUnlockRequirement(state)) + '</span>'
      : '<span class="skin-tile-note">' + escapeHtml(skin.note || '') + '</span>';

    return (
      '<button type="button" class="skin-tile' +
        (selected ? ' selected' : '') + (locked ? ' locked' : '') + '"' +
        ' data-garden-skin-id="' + skin.id + '"' +
        // The skin paints its own preview - see the note above.
        ' style="' + skinStyleString(skin) + '"' +
        (locked ? ' disabled aria-disabled="true"' : '') +
        ' aria-pressed="' + (selected ? 'true' : 'false') + '"' +
        ' title="' + escapeHtml(skin.name) + '">' +
        (locked ? '<span class="skin-lock" aria-hidden="true"></span>' : '') +
        '<span class="landscape-tile-art">' + landscapePreviewSvg(skin) + '</span>' +
        '<span class="skin-tile-name">' + skinPipHtml(skin) +
          escapeHtml(skin.name) + '</span>' +
        footer +
      '</button>'
    );
  }).join('');

  landscapePickerEl.innerHTML =
    '<div class="landscape-picker-head">' +
      '<h3 class="landscape-picker-title">The grounds</h3>' +
    '</div>' +
    '<div class="skin-grid">' + tiles + '</div>';

  landscapePickerEl.querySelectorAll('.skin-tile').forEach(function (tile) {
    if (tile.disabled) return;
    tile.addEventListener('click', function () {
      setGardenSkin(tile.getAttribute('data-garden-skin-id'));
    });
  });
}


// ---- The page ----------------------------------------------------

function renderGreenhouse() {
  if (!greenhouseGridEl) return;

  // Independent of the plant cards below - it has no task to hang
  // off, and it should still be there to choose from on a garden
  // with nothing planted in it yet.
  renderLandscapePicker();

  // A task can be removed on the Tasks page while its skin section is
  // open here — don't leave a dangling id behind.
  if (greenhouseOpenTaskId !== null &&
      !tasks.some(function (t) { return t.id === greenhouseOpenTaskId; })) {
    greenhouseOpenTaskId = null;
  }

  greenhouseGridEl.innerHTML = '';
  if (greenhouseEmptyEl) greenhouseEmptyEl.classList.toggle('hidden', tasks.length > 0);

  tasks.forEach(function (task) {
    var cat    = getCategoryById(task.categoryId);
    var skin   = getSkin(task.categoryId, getTaskSkinId(task));
    var open   = (task.id === greenhouseOpenTaskId);
    var total  = getSkinsFor(task.categoryId).length;
    var locked = total - countUnlockedSkins(task, task.categoryId);

    var card              = document.createElement('button');
    card.type             = 'button';
    card.className        = 'plant-card' + (open ? ' open' : '');
    card.dataset.category = task.categoryId;
    card.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.setAttribute('aria-controls', 'skin-drawer-' + task.id);
    card.title = task.text + ' — change how this ' + cat.species + ' looks';

    card.innerHTML =
      '<span class="plant-card-art">' +
        getPlantSVG(task.categoryId, SKIN_PREVIEW_STAGE, skin.id, 84) +
      '</span>' +
      '<span class="plant-card-name">' + escapeHtml(task.text) + '</span>' +
      '<span class="plant-card-species">' + cat.emoji + ' ' +
        escapeHtml(cat.species) + '</span>' +
      '<span class="plant-card-skin">' + skinPipHtml(skin) +
        escapeHtml(skin.name) + '</span>' +
      // Only shown when there's actually something left to earn, so a
      // fully unlocked plant's card stays clean.
      (locked > 0
        ? '<span class="plant-card-locked">\uD83D\uDD12 ' + locked + ' locked</span>'
        : '');

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