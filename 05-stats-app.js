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
//    day's intensity is the % of the habits believed to have existed
//    on that day which were completed on it, plus garden-wide summary
//    cards. "Believed to have existed" is doing real work in that
//    sentence - see computeOverallDayStats() below.
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

// Counted back from the garden's today (getTodayString in 01), not the
// device clock, so the Stats page and the rest of the app always agree
// about which day it is - including while a westward flight is holding
// the day.
function getDateNDaysAgo(n) {
  return shiftDate(getTodayString(), -n);
}

// Builds a GitHub-style grid: an array of weeks, each an array of 7
// date strings (Sun–Sat), covering the last ~53 weeks up through
// today. The very first week is aligned back to the preceding Sunday
// so columns line up as real calendar weeks; the last week is padded
// with nulls past today so it's always exactly 7 cells.
function buildYearGrid() {
  var today = new Date(getTodayString() + 'T00:00:00');

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

// WHAT THE DENOMINATOR IS
//
// A cell's colour is completed/due for that day. The numerator was
// always exact - history records precisely which days each habit was
// ticked. The denominator was the hard half, and it has now been
// answered properly rather than guessed at.
//
// WHAT IT USED TO BE. The live task count, for every date in the
// year. That had one loud failure: add a habit today and every cell
// in the preceding year diluted, because a day where you completed
// three of three became three of four, then three of five. Your
// history visibly faded every time you took up something new, which
// is precisely backwards as an encouragement. A first-completion
// date was inferred per habit to patch the worst of it.
//
// WHAT IT IS NOW. Two stored fields do the work the inference used to
// approximate:
//
//   createdAt  when the task entered the garden. Exact for anything
//              planted since the task model landed; still inferred
//              from the first completed day for anything older, so
//              the old approximation survives only where there is
//              genuinely nothing better. See taskStartDate() in 01.
//
//   schedule   which weekdays the habit is actually due on. This is
//              the one that changes the picture: a school-days habit
//              used to read as two missed days every weekend, all
//              year, for as long as it existed.
//
// Neither costs a read. Both were already being written and both are
// already in memory, which is what made this worth doing - the
// alternative always on the table was a per-day active count, and
// that means a new field on a document rewritten on every tick,
// which is the exact cost the packed history exists to avoid.
//
// A day where NOTHING was due is not a day scored zero. It has no
// fraction at all, and the grid draws it as an outline rather than
// as an empty square, so the months before a garden existed stop
// looking like months of failure.

// One task, one day. The rule has two halves and both are load-
// bearing:
//
//   a day the task was DUE counts, done or not;
//   a day the task was DONE counts, due or not.
//
// The second half is what stops a bonus completion falling out of
// both sides of the fraction and leaving the day looking empty - a
// school-days habit ticked anyway on a Sunday, or an assignment,
// which is never "due" on a past day but is very much done on one.
// Extra credit can never lower a score: the same completion adds one
// to each side.
function dayTally(task, dateStr) {
  var done = histGet(task.history, dateStr);
  return { counted: done || wasDueOn(task, dateStr), done: done };
}

function computeOverallDayStats(dateStr) {
  var due       = 0;
  var completed = 0;

  tasks.forEach(function (t) {
    var tally = dayTally(t, dateStr);
    if (!tally.counted) return;
    due++;
    if (tally.done) completed++;
  });

  var percent = due > 0 ? (completed / due) * 100 : 0;
  return { completed: completed, total: due, percent: percent };
}

// Completions and the days they were owed on, over a window. Used by
// both sets of summary cards so "4 completions last week" can finally
// say what it was out of.
function tallyWindow(list, dates) {
  var done = 0;
  var due  = 0;
  list.forEach(function (t) {
    dates.forEach(function (d) {
      var tally = dayTally(t, d);
      if (!tally.counted) return;
      due++;
      if (tally.done) done++;
    });
  });
  return { done: done, due: due };
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

// Places the tooltip near the cursor without letting it leave the
// viewport.
//
// It used to sit unconditionally at (clientX + 14, clientY + 14),
// which is fine until the cursor is near an edge: the label is
// position:fixed and white-space:nowrap, so hovering the last few
// columns of the heatmap pushed it off the right side of the screen
// and the text was simply cut off. December was unreadable.
//
// Nudging it further left would only move where that happens - the
// label would then clip on the LEFT when hovering January. So the
// side is chosen instead of fixed: preferred position is below-right
// of the cursor, and it flips to the other side of the pointer when
// there is not room. Flipping rather than sliding is what keeps the
// label clear of the cursor; sliding would eventually park it under
// the pointer, which on a grid of 3px cells means covering the very
// thing being inspected.
//
// Measured with offsetWidth/offsetHeight, which forces a layout - so
// this is called only while a tooltip is actually visible, and the
// element is unhidden BEFORE measuring or both come back zero.
//
// The final clamp is the backstop for the case flipping cannot solve:
// a label wider than the viewport itself, which can happen on a
// narrow phone. It keeps the left edge on screen so the start of the
// text is always readable, and the CSS lets the label wrap at that
// width rather than run off.
var HEATMAP_TIP_GAP    = 14;   // distance from the cursor
var HEATMAP_TIP_MARGIN = 8;    // smallest gap to a viewport edge

function positionHeatmapTooltip(clientX, clientY) {
  if (!heatmapTooltipEl) return;

  var vw = document.documentElement.clientWidth;
  var vh = document.documentElement.clientHeight;
  var w  = heatmapTooltipEl.offsetWidth;
  var h  = heatmapTooltipEl.offsetHeight;

  var left = clientX + HEATMAP_TIP_GAP;
  if (left + w > vw - HEATMAP_TIP_MARGIN) left = clientX - HEATMAP_TIP_GAP - w;
  if (left < HEATMAP_TIP_MARGIN)          left = HEATMAP_TIP_MARGIN;

  var top = clientY + HEATMAP_TIP_GAP;
  if (top + h > vh - HEATMAP_TIP_MARGIN)  top = clientY - HEATMAP_TIP_GAP - h;
  if (top < HEATMAP_TIP_MARGIN)           top = HEATMAP_TIP_MARGIN;

  heatmapTooltipEl.style.left = left + 'px';
  heatmapTooltipEl.style.top  = top  + 'px';
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
    // Positioned here too, not only on mousemove. Without this the
    // label appears for one frame wherever the PREVIOUS one was left,
    // which reads as a flicker across the page when moving between
    // two distant cells - and never corrects itself at all if the
    // pointer arrives on a cell and stops dead.
    positionHeatmapTooltip(e.clientX, e.clientY);
  });

  containerEl.addEventListener('mousemove', function (e) {
    if (heatmapTooltipEl.classList.contains('hidden')) return;
    positionHeatmapTooltip(e.clientX, e.clientY);
  });

  containerEl.addEventListener('mouseout', function (e) {
    if (!e.target.closest('.heatmap-cell')) return;
    heatmapTooltipEl.classList.add('hidden');
  });

  // Leaving the grid entirely. mouseout above fires per cell and is
  // enough in normal use, but it can be missed when the pointer exits
  // fast or the page scrolls out from under it, stranding the label
  // on screen with nothing under the cursor.
  containerEl.addEventListener('mouseleave', function () {
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
      // Nothing due and nothing done is an ABSENCE, not a zero. The
      // 'off' stage is drawn as an outline; scoring it 0% would paint
      // every day before the garden existed, and every weekend of a
      // school-days-only garden, as failure.
      return {
        stage: d.total ? heatStageForPercent(d.percent) : 'off',
        data:  d,
      };
    },
    function (dateStr, info) {
      var d = info.data;
      if (!d.total) return dateStr + ': nothing due';
      return dateStr + ': ' + Math.round(d.percent) + '% done (' +
        d.completed + ' of ' + d.total + ' due)';
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

  // Three states rather than two. A day this habit was never
  // scheduled for is not a miss, and drawing it as one was the whole
  // complaint: a weekday-only habit spent its year looking like it
  // failed twice a week.
  renderHeatmapGrid(
    container,
    weeks,
    function (dateStr) {
      var tally = dayTally(task, dateStr);
      return {
        stage: tally.done ? 3 : (tally.counted ? 0 : 'off'),
        data:  tally,
      };
    },
    function (dateStr, info) {
      if (info.data.done)     return dateStr + ': completed';
      if (info.data.counted)  return dateStr + ': missed';
      return dateStr + ': not scheduled';
    }
  );
}

// ============================================
// C5: growth over time
//
// WHY A CHART AND NOT THE GARDEN. The day-to-day change in a plant is
// sub-perceptual by design - that is what the growth curve is FOR,
// and flattening it would make a two-year-old oak the same size as a
// two-month-old one. So the garden cannot show a trend, and the
// height tag can only show one week of it. A chart shows the shape.
//
// The y-axis is HEIGHT, not days, on purpose. Days grown is a
// straight line for anyone keeping a habit, which is true and tells
// you nothing. Height is the S-curve, so the chart shows the thing
// the number under the plant is actually doing: nearly flat for a
// fortnight, then a spurt, then a long slow climb.
// ============================================

var STATS_GROWTH_RANGES = [30, 90, 365];
var statsGrowthRange    = 90;

var GROWTH_CHART_W = 700;
var GROWTH_CHART_H = 200;
// Wide enough for the longest label an axis can produce. A garden of
// ten mature plants runs to four digits of days grown, and the label
// is right-aligned into this gutter, so too little of it clips the
// number rather than wrapping it. Sized against the 12-unit axis
// type in the stylesheet - shrink one and this can come in with it.
var GROWTH_PAD_L   = 50;
var GROWTH_PAD_R   = 10;
var GROWTH_PAD_T   = 12;
var GROWTH_PAD_B   = 22;

var STATS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function growthShortDate(dateStr) {
  var p = String(dateStr).split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return d.getUTCDate() + ' ' + STATS_MONTHS[d.getUTCMonth()];
}

// points: [{ date, value }], oldest first.
//
// formatAxis is separate from formatValue because the two are read
// differently: the headline says '+71 days', which needs its unit,
// while three repetitions of that unit stacked up the left edge are
// just noise that pushes the chart around. Defaults to the same
// formatter when a caller has no reason to split them.
function growthChartSvg(points, formatValue, formatAxis) {
  if (!points || points.length < 2) return '';
  formatAxis = formatAxis || formatValue;

  var vals = points.map(function (p) { return p.value; });
  var lo   = Math.min.apply(null, vals);
  var hi   = Math.max.apply(null, vals);

  // A FLAT LINE IS A REAL ANSWER - nothing grew - and it needs its
  // own treatment. Left alone the range collapses and the line lands
  // on the floor of the box under two gridlines labelled with values
  // that never occurred, which reads as a chart that failed rather
  // than as a plant that stood still. So the line is centred and it
  // gets ONE gridline, at the level it actually sat at.
  var flat = (hi - lo) < 1e-9;
  if (flat) { lo = lo - 1; hi = lo + 2; }

  var innerW = GROWTH_CHART_W - GROWTH_PAD_L - GROWTH_PAD_R;
  var innerH = GROWTH_CHART_H - GROWTH_PAD_T - GROWTH_PAD_B;
  var baseY  = GROWTH_PAD_T + innerH;

  function px(i) { return GROWTH_PAD_L + (i / (points.length - 1)) * innerW; }
  function py(v) { return GROWTH_PAD_T + innerH - ((v - lo) / (hi - lo)) * innerH; }

  var line = points.map(function (p, i) {
    return (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(p.value).toFixed(1);
  }).join(' ');

  // No fill under a flat line. The area is there to give the climb
  // weight, and under a line that never climbed it is half a box of
  // green implying growth that did not happen.
  var area = flat ? '' : (line +
    ' L' + px(points.length - 1).toFixed(1) + ' ' + baseY.toFixed(1) +
    ' L' + px(0).toFixed(1) + ' ' + baseY.toFixed(1) + ' Z');

  var grid = '';
  var lines = flat ? [1] : [0, 1, 2];
  lines.forEach(function (g) {
    var gv = lo + (hi - lo) * (g / 2);
    var gy = py(gv).toFixed(1);
    grid +=
      '<line class="growth-grid" x1="' + GROWTH_PAD_L + '" y1="' + gy +
      '" x2="' + (GROWTH_CHART_W - GROWTH_PAD_R) + '" y2="' + gy + '"/>' +
      '<text class="growth-ylabel" x="' + (GROWTH_PAD_L - 9) + '" y="' + gy +
      '" text-anchor="end" dominant-baseline="middle">' +
      escapeHtml(formatAxis(gv)) + '</text>';
  });

  var ticks = '';
  var tickAt = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  tickAt.forEach(function (i, n) {
    ticks += '<text class="growth-xlabel" x="' + px(i).toFixed(1) + '" y="' +
      (GROWTH_CHART_H - 6) + '" text-anchor="' +
      (n === 0 ? 'start' : (n === 2 ? 'end' : 'middle')) + '">' +
      escapeHtml(growthShortDate(points[i].date)) + '</text>';
  });

  return (
    '<svg class="growth-chart" viewBox="0 0 ' + GROWTH_CHART_W + ' ' +
      GROWTH_CHART_H + '" role="img" aria-label="Growth over time">' +
      grid +
      (area ? '<path class="growth-area" d="' + area + '"/>' : '') +
      '<path class="growth-line" d="' + line + '"/>' +
      '<circle class="growth-dot" cx="' + px(points.length - 1).toFixed(1) +
        '" cy="' + py(points[points.length - 1].value).toFixed(1) + '" r="4"/>' +
      ticks +
    '</svg>'
  );
}

function growthRangeHtml() {
  return '<div class="growth-range">' + STATS_GROWTH_RANGES.map(function (n) {
    return '<button type="button" class="growth-range-btn' +
      (n === statsGrowthRange ? ' active' : '') + '" data-range="' + n + '">' +
      (n >= 365 ? '1 year' : n + ' days') + '</button>';
  }).join('') + '</div>';
}

function renderGrowthCard(hostId, points, formatValue, emptyMsg, formatAxis) {
  var host = document.getElementById(hostId);
  if (!host) return;

  if (!points || points.length < 2) {
    host.innerHTML = '<p class="empty-state">' + escapeHtml(emptyMsg) + '</p>';
    return;
  }

  var gain = points[points.length - 1].value - points[0].value;
  var label = gain > 0
    ? '+' + formatValue(gain)
    : 'no growth';

  host.innerHTML =
    '<div class="growth-head">' +
      '<span class="growth-gain' + (gain > 0 ? ' is-up' : '') + '">' +
        escapeHtml(label) + '</span>' +
      '<span class="growth-window">over ' +
        (statsGrowthRange >= 365 ? 'the last year' : 'the last ' + statsGrowthRange + ' days') +
      '</span>' +
      growthRangeHtml() +
    '</div>' +
    growthChartSvg(points, formatValue, formatAxis);
}

function renderIndividualGrowth(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;

  var points = buildGrowthSeries(task, statsGrowthRange).map(function (p) {
    return { date: p.date, value: computeHeightMeters(p.days) };
  });
  renderGrowthCard('statsIndividualGrowth', points, formatHeightMeters,
    'Not enough history yet.');
}

// The garden as a whole. Summed heights would be a meaningless
// number, so this one counts DAYS GROWN across every plant: it only
// ever goes up, and its slope is how much the garden is being kept.
function renderOverallGrowth() {
  if (!tasks.length) {
    renderGrowthCard('statsOverallGrowth', null, null,
      'No plants yet - add one on the Tasks page.');
    return;
  }

  var totals = null;
  tasks.forEach(function (t) {
    var series = buildGrowthSeries(t, statsGrowthRange);
    if (!totals) {
      totals = series.map(function (p) { return { date: p.date, value: p.days }; });
      return;
    }
    series.forEach(function (p, i) { totals[i].value += p.days; });
  });

  renderGrowthCard(
    'statsOverallGrowth',
    totals,
    function (v) { return Math.round(v) + ' days'; },
    'Not enough history yet.',
    function (v) { return String(Math.round(v)); }
  );
}

// One delegated listener for both cards, bound once. The card bodies
// are rebuilt on every render, so nothing inside them can hold a
// listener of its own.
document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('.growth-range-btn');
  if (!btn) return;
  var next = parseInt(btn.getAttribute('data-range'), 10);
  if (!next || next === statsGrowthRange) return;
  statsGrowthRange = next;
  renderStatsView();
});

// ---- Summary metric cards ----

function computeOverallStats() {
  var maxGrowthTask    = null;
  var allTimeMaxStreak = 0;
  var currentMaxStreak = 0;

  var last7  = []; for (var i = 0; i < 7;  i++) last7.push(getDateNDaysAgo(i));
  var last30 = []; for (var j = 0; j < 30; j++) last30.push(getDateNDaysAgo(j));

  tasks.forEach(function (t) {
    var totalGrowthDays = t.totalGrowthDays || 0;
    if (!maxGrowthTask || totalGrowthDays > (maxGrowthTask.totalGrowthDays || 0)) {
      maxGrowthTask = t;
    }
    allTimeMaxStreak = Math.max(allTimeMaxStreak, t.maxStreak || 0, t.streak || 0);
    currentMaxStreak = Math.max(currentMaxStreak, t.streak || 0);

  });

  // Out of how many. Same rule as the heatmap - see dayTally().
  var week  = tallyWindow(tasks, last7);
  var month = tallyWindow(tasks, last30);

  return {
    maxGrowthTask:    maxGrowthTask,
    allTimeMaxStreak: allTimeMaxStreak,
    currentMaxStreak: currentMaxStreak,
    weeklyGrowth:     week.done,
    weeklyDue:        week.due,
    monthlyGrowth:    month.done,
    monthlyDue:       month.due,
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

  var week  = tallyWindow([task], last7);
  var month = tallyWindow([task], last30);

  return {
    task:            task,
    cat:             cat,
    stageIdx:        stageIdx,
    heightMeters:    heightMeters,
    streak:          streak,
    maxStreak:       maxStreak,
    weekCompletions:  week.done,
    weekDue:          week.due,
    monthCompletions: month.done,
    monthDue:         month.due,
  };
}

// "4 of 5" rather than "4 completions", now that there is something
// to be out of. A window where nothing was ever due says so instead
// of reporting a zero out of zero.
function completionRatio(done, due) {
  if (!due) return 'nothing due';
  return done + ' of ' + due;
}

// The subtitle carries the window, and says what the denominator
// actually counted - which is scheduled days across every habit, not
// calendar days, and would otherwise be a puzzle when a garden of
// school-days habits reports 25 due in the last 7.
function dueSubtitle(due, windowDays) {
  if (!due) return 'last ' + windowDays + ' days';
  return 'scheduled days, last ' + windowDays;
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
      maxCat ? (formatGrowthPoints(s.maxGrowthTask.totalGrowthDays) + ' days grown · ' + maxCat.species) : ''
    ) +
    statCardHtml('🏆', 'All-Time Max Streak',    s.allTimeMaxStreak + ' day' + (s.allTimeMaxStreak === 1 ? '' : 's'), '') +
    statCardHtml('🔥', 'Current Highest Streak', s.currentMaxStreak + ' day' + (s.currentMaxStreak === 1 ? '' : 's'), '') +
    statCardHtml('📅', 'Weekly Growth',  completionRatio(s.weeklyGrowth,  s.weeklyDue),  dueSubtitle(s.weeklyDue,  7)) +
    statCardHtml('📈', 'Monthly Growth', completionRatio(s.monthlyGrowth, s.monthlyDue), dueSubtitle(s.monthlyDue, 30));
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
      s.cat.species + ' · ' + formatGrowthPoints(s.task.totalGrowthDays) + ' days grown'
    ) +
    statCardHtml('🔥', 'Current Streak',    s.streak + ' day' + (s.streak === 1 ? '' : 's'), '') +
    statCardHtml('🏆', 'Max Streak',        s.maxStreak + ' day' + (s.maxStreak === 1 ? '' : 's'), '') +
    statCardHtml('📅', 'Growth This Week',  completionRatio(s.weekCompletions,  s.weekDue),  dueSubtitle(s.weekDue,  7)) +
    statCardHtml('📈', 'Growth This Month', completionRatio(s.monthCompletions, s.monthDue), dueSubtitle(s.monthDue, 30));
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
    renderIndividualGrowth(taskId);
    renderIndividualCards(taskId);
  } else {
    if (overallViewEl)    overallViewEl.classList.remove('hidden');
    if (individualViewEl) individualViewEl.classList.add('hidden');

    renderOverallHeatmap();
    renderOverallGrowth();
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
        '<div class="profile-quick-stat-value">' + formatGrowthPoints(lifetimeGrowthDays) + '</div>' +
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
  if (currentPage === 'guide' && typeof renderGuidePage === 'function') renderGuidePage();
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