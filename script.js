const STORAGE_KEY = "taskly.tasks";
const THEME_KEY = "taskly.theme";

const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const dueInput = document.getElementById("dueInput");
const list = document.getElementById("taskList");
const empty = document.getElementById("empty");
const stats = document.getElementById("stats");
const remaining = document.getElementById("remaining");
const clearDone = document.getElementById("clearDone");
const themeToggle = document.getElementById("themeToggle");
const filterButtons = document.querySelectorAll(".filter");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render() {
  list.innerHTML = "";

  const visible = tasks.filter((task) => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const body = document.createElement("div");
    body.className = "task-body";

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;
    body.appendChild(span);

    if (task.due) {
      body.appendChild(createDueBadge(task));
    }

    const del = document.createElement("button");
    del.className = "task-delete";
    del.type = "button";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Delete task");
    del.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, body, del);
    list.appendChild(li);
  });

  empty.classList.toggle("hidden", visible.length > 0);

  const doneCount = tasks.filter((t) => t.done).length;
  const activeCount = tasks.length - doneCount;
  stats.innerHTML = `
    <span><strong>${tasks.length}</strong> total</span>
    <span><strong>${activeCount}</strong> active</span>
    <span><strong>${doneCount}</strong> done</span>
  `;
  remaining.textContent = `${activeCount} task${activeCount === 1 ? "" : "s"} left`;

  saveTasks();
}

function todayStr() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatDue(due, today) {
  if (due === today) return "Due today";

  const date = new Date(due + "T00:00:00");
  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });

  return due < today ? `Overdue · ${label}` : `Due ${label}`;
}

function createDueBadge(task) {
  const today = todayStr();
  const overdue = !task.done && task.due < today;
  const isToday = !task.done && task.due === today;

  const badge = document.createElement("span");
  badge.className =
    "task-due" + (overdue ? " overdue" : isToday ? " today" : "");
  badge.textContent = formatDue(task.due, today);
  return badge;
}

function addTask(text, due) {
  tasks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text,
    due: due || null,
    done: false,
  });
  render();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTask(text, dueInput.value);
  input.value = "";
  dueInput.value = "";
  input.focus();
});

clearDone.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    render();
  });
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener("click", () => {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
});

applyTheme(localStorage.getItem(THEME_KEY) || "light");
render();
