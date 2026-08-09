// ============================================
// 09: DEV MODE — editable growth inspector (NOT SHIPPED)
// Part of DISCIPLANT — split out of 05-stats-app.js.
//
// THIS FILE IS NOT PART OF THE PUBLIC SITE.
// The <script> tag for it in index.html is commented out, and the
// filename is listed in .vercelignore so the deploy never uploads it
// at all. Both matter: a commented tag stops the browser running it,
// but a file that is still deployed can be fetched by anyone who
// guesses its name and pasted straight into a console. Ignoring it
// means there is nothing on the public site to fetch.
//
// TO USE IT
//   1. Serve the folder locally (any static server — VS Code Live
//      Server, `npx serve`, `python3 -m http.server`).
//   2. Uncomment the 09-dev-mode.js script tag at the bottom of
//      index.html. That one line is the whole switch.
//   3. Click DEV, or press Ctrl/Cmd + Shift + D.
//   Re-comment it before you push. If you forget, .vercelignore still
//   keeps the file itself off the deploy, so the tag just 404s and the
//   app carries on — the guard on renderDevPanel() in 05 means
//   nothing breaks when this file is absent.
//
// WHY IT INJECTS ITS OWN MARKUP
//   The panel and the DEV button used to sit in index.html. They now
//   get built here instead, so enabling dev mode is one uncommented
//   line rather than one line plus a block of HTML to un-comment in a
//   second file. The .dev-* styles are still in style.css, where they
//   cost a few hundred bytes and reveal nothing.
//
// WHAT IT CAN AND CANNOT DO
//   Streak and total-days edits are preview only: they change the
//   in-memory task and re-render, and never call saveData(). Be aware
//   that is a convention, not a guarantee — saveData() serialises the
//   whole tasks array, so if anything else triggers a save while you
//   have silly numbers on screen (ticking a habit, saving a garden
//   rearrangement, a midnight rollover) those numbers get written for
//   real, and clampGrowthDays() in 01 will cap them at MAX_GROWTH_DAYS
//   on the way out. Reload before you do anything that saves.
// ============================================


// ============================================
// Markup
// ============================================
// Built here rather than in index.html — see the note above. Appended
// to <body> at load, which is safe because this file loads last, after
// everything it sits on top of.
(function buildDevModeMarkup() {
  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<div id="devPanel" class="dev-panel hidden">' +
      '<div class="dev-panel-header">' +
        '<span class="dev-panel-title">Developer Mode</span>' +
        '<button id="devPanelClose" class="dev-panel-close" aria-label="Close developer panel">' +
          '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">' +
            '<path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" stroke-width="2.4" ' +
                  'stroke-linecap="round" fill="none"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="dev-panel-actions">' +
        '<button id="devActionRollover" class="dev-btn">Simulate day rollover</button>' +
        '<button id="devActionLog" class="dev-btn">Log to console</button>' +
        '<button id="devActionCopy" class="dev-btn">Copy state JSON</button>' +
      '</div>' +
      '<div id="devPanelBody" class="dev-panel-body"></div>' +
    '</div>' +
    '<button id="devModeToggle" class="dev-toggle-btn" ' +
            'title="Developer mode (Ctrl/Cmd+Shift+D)">DEV</button>';

  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
})();


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
// one card per task with its live-computed stage + scale, so the
// numbers you're editing and their visual effect are right next to
// each other.
function renderDevPanel() {
  if (!devModeEnabled || !devPanelBody) return;

  var summaryHtml =
    '<div class="dev-summary">' +
      '<span>garden</span><span>·</span>' +
      '<span>' + tasks.length + ' task' + (tasks.length === 1 ? '' : 's') + '</span><span>·</span>' +
      '<span>' + getTodayString() + '</span>' +
    '</div>' +
    '<p class="dev-note">Streak and total-days fields below are preview only — they update the garden live but aren\'t saved, so reloading restores your real progress. "Done today" is real and does save.</p>';

  var rowsHtml = tasks.map(function (t) {
    var cat            = getCategoryById(t.categoryId);
    var streak          = Math.max(0, t.streak || 0);
    var totalGrowthDays = Math.max(0, t.totalGrowthDays || 0);

    // One garden, so one pair of numbers. The separate "daily" pair
    // that used to sit beside these was computed off the streak with
    // a 1.35x bloom, and that whole second view no longer exists.
    var stageIdx = getStageIndexForDays(totalGrowthDays);
    var momentum = 1 + Math.min(streak, 60) * 0.004;
    var plantScale = computeScaleForDays(totalGrowthDays) * momentum;

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
          'Stage ' + stageIdx + ' · ' + plantScale.toFixed(2) + 'x' +
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
      currentPage: currentPage,
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
