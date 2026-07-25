// ============================================
// GROW — starter skeleton
// Tasks are now saved to localStorage, so they
// survive a page refresh (but only on this one
// browser/device — a real database, like
// Firebase, is the next step after this).
// ============================================

// The key we'll save/load our data under.
// (Using a specific name avoids clashing with other sites' data.)
const STORAGE_KEY = 'grow-app-tasks';

// Each task is an object: { id, text, completed }
// On page load, try to load saved tasks; otherwise start empty.
let tasks = loadTasks();
let nextId = getNextId(tasks);

// ---------- Saving & loading ----------
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    // If the saved data is ever corrupted, don't crash — just start fresh
    return [];
  }
}

// Make sure new tasks always get a unique id, even after a reload
function getNextId(taskArray) {
  if (taskArray.length === 0) return 1;
  const maxId = Math.max(...taskArray.map(function (t) { return t.id; }));
  return maxId + 1;
}

// Grab the HTML elements we'll need to update
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const plantStage = document.getElementById('plantStage');
const growthFill = document.getElementById('growthFill');
const growthLabel = document.getElementById('growthLabel');

// The plant emojis, from "just planted" to "fully grown"
// We pick one based on % of tasks completed today.
const STAGES = [
  { min: 0,   emoji: '🌱' }, // seed
  { min: 1,   emoji: '🌿' }, // sprout
  { min: 25,  emoji: '🪴' }, // young plant
  { min: 50,  emoji: '🌷' }, // budding
  { min: 75,  emoji: '🌸' }, // blooming
  { min: 100, emoji: '🌳' }, // fully grown
];

// ---------- Adding a task ----------
taskForm.addEventListener('submit', function (event) {
  event.preventDefault(); // stop the page from reloading

  const text = taskInput.value.trim();
  if (text === '') return;

  tasks.push({ id: nextId, text: text, completed: false });
  nextId++;

  taskInput.value = '';
  saveTasks();
  render();
});

// ---------- Rendering the task list ----------
function render() {
  taskList.innerHTML = ''; // clear and rebuild each time (simple approach)

  tasks.forEach(function (task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', function () {
      task.completed = checkbox.checked;
      saveTasks();
      render();
    });

    const span = document.createElement('span');
    span.textContent = task.text;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', function () {
      tasks = tasks.filter(function (t) {
        return t.id !== task.id;
      });
      saveTasks();
      render();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(removeBtn);
    taskList.appendChild(li);
  });

  emptyState.classList.toggle('hidden', tasks.length > 0);
  updateGarden();
}

// ---------- Updating the garden based on progress ----------
function updateGarden() {
  const total = tasks.length;
  const completed = tasks.filter(function (t) {
    return t.completed;
  }).length;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  growthFill.style.width = percent + '%';
  growthLabel.textContent = percent + '% grown today';

  // Pick the highest stage whose "min" threshold we've passed
  let currentStage = STAGES[0];
  STAGES.forEach(function (stage) {
    if (percent >= stage.min) currentStage = stage;
  });

  plantStage.textContent = currentStage.emoji;
}

// Initial render on page load
render();