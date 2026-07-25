// ============================================
// GROW — now saving to Firebase (Firestore)
// instead of localStorage.
//
// How it works:
// 1. Each visitor is signed in "anonymously" —
//    Firebase quietly gives them a unique ID,
//    no login form needed yet.
// 2. All of that person's tasks are stored in
//    ONE Firestore document, keyed by their ID:
//      gardens/<their-unique-id>  ->  { tasks: [...] }
// 3. We use onSnapshot(), which means Firestore
//    automatically pushes updates to the page in
//    real time — no manual refresh needed, and
//    this is also what will let two people see
//    live updates later (e.g. friends' gardens).
// ============================================

let tasks = [];
let nextId = 1;
let currentUserId = null;

// Grab the HTML elements we'll need to update
const loadingState = document.getElementById('loadingState');
const mainContent = document.getElementById('mainContent');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const plantStage = document.getElementById('plantStage');
const growthFill = document.getElementById('growthFill');
const growthLabel = document.getElementById('growthLabel');

// The plant emojis, from "just planted" to "fully grown"
const STAGES = [
  { min: 0,   emoji: '🌱' },
  { min: 1,   emoji: '🌿' },
  { min: 25,  emoji: '🪴' },
  { min: 50,  emoji: '🌷' },
  { min: 75,  emoji: '🌸' },
  { min: 100, emoji: '🌳' },
];

// ---------- Step 1: Sign the visitor in anonymously ----------
// This runs once when the page loads.
auth.signInAnonymously().catch(function (error) {
  console.error('Sign-in failed:', error);
});

// This fires once sign-in succeeds (and again automatically
// if they return later — Firebase remembers them in this browser).
auth.onAuthStateChanged(function (user) {
  if (!user) return;

  currentUserId = user.uid;
  console.log('Signed in as:', currentUserId);

  // ---------- Step 2: Listen to this user's data in real time ----------
  // onSnapshot fires immediately with current data, then again
  // every time the data changes (from this device or any other).
  db.collection('gardens').doc(currentUserId)
    .onSnapshot(function (docSnapshot) {
      if (docSnapshot.exists) {
        tasks = docSnapshot.data().tasks || [];
      } else {
        tasks = [];
      }
      nextId = getNextId(tasks);
      render();

      // Only the FIRST snapshot needs to trigger this swap —
      // doing it every time is harmless, but unnecessary.
      loadingState.classList.add('hidden');
      mainContent.classList.remove('hidden');
    }, function (error) {
      console.error('Error loading tasks:', error);
    });
});

// ---------- Saving to Firestore ----------
function saveTasks() {
  if (!currentUserId) return; // not signed in yet — nothing to save to

  db.collection('gardens').doc(currentUserId).set({
    tasks: tasks
  }).catch(function (error) {
    console.error('Error saving tasks:', error);
  });
}

// Make sure new tasks always get a unique id
function getNextId(taskArray) {
  if (taskArray.length === 0) return 1;
  const maxId = Math.max(...taskArray.map(function (t) { return t.id; }));
  return maxId + 1;
}

// ---------- Adding a task ----------
taskForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (text === '') return;

  tasks.push({ id: nextId, text: text, completed: false });
  nextId++;

  taskInput.value = '';
  saveTasks();
  render(); // instant local feedback; onSnapshot will also confirm shortly after
});

// ---------- Rendering the task list ----------
function render() {
  taskList.innerHTML = '';

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

  let currentStage = STAGES[0];
  STAGES.forEach(function (stage) {
    if (percent >= stage.min) currentStage = stage;
  });

  plantStage.textContent = currentStage.emoji;
}

// Note: no render() call at the very bottom anymore —
// rendering now happens inside onSnapshot, once data
// actually arrives from Firestore.