// DOM Elements Selection
const cursorGlow = document.getElementById("cursor-glow");

// Cursor Glow Effect
document.addEventListener("mousemove", (e) => {
  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top = e.clientY + "px";
});

// Modals Setup
const navItems = document.querySelectorAll(".nav-item");
const summaryCards = document.querySelectorAll(".summary-card");
const quickBtns = document.querySelectorAll(".quick-btn");
const modals = document.querySelectorAll(".feature-modal");
const closeBtns = document.querySelectorAll(".close-btn");

function openModal(targetId) {
  if (!targetId) return;

  modals.forEach((m) => {
    if (m.id !== targetId) {
      m.classList.remove("show");
      m.classList.add("hidden");
    }
  });

  const targetModal = document.getElementById(targetId);
  if (targetModal) {
    targetModal.classList.remove("hidden");
    setTimeout(() => targetModal.classList.add("show"), 10);
  }
}

// Attach event listeners for Modals
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    openModal(item.getAttribute("data-target"));
  });
});

summaryCards.forEach((card) =>
  card.addEventListener("click", () =>
    openModal(card.getAttribute("data-target")),
  ),
);
quickBtns.forEach((btn) =>
  btn.addEventListener("click", () =>
    openModal(btn.getAttribute("data-target")),
  ),
);

closeBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const modal = e.target.closest(".feature-modal");
    modal.classList.remove("show");
    setTimeout(() => modal.classList.add("hidden"), 300);
  });
});

// Click outside to close modals
document.addEventListener("click", (e) => {
  if (
    e.target.closest(".feature-modal") ||
    e.target.closest(".quick-btn") ||
    e.target.closest(".summary-card") ||
    e.target.closest(".nav-item")
  ) {
    return;
  }

  modals.forEach((m) => {
    if (m.classList.contains("show")) {
      m.classList.remove("show");
      setTimeout(() => m.classList.add("hidden"), 300);
    }
  });
});

// Todo List Logic
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
let todos = JSON.parse(localStorage.getItem("todos")) || [];

function renderTodos() {
  todoList.innerHTML = "";
  let pendingCount = 0;

  todos.forEach((todo, index) => {
    if (!todo.completed) pendingCount++;

    const li = document.createElement("li");
    if (todo.completed) li.classList.add("completed");

    const iconClass = todo.completed
      ? "fa-solid fa-square-check text-green"
      : "fa-regular fa-square";

    li.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; cursor:pointer;" onclick="toggleTodo(${index})">
                <i class="${iconClass}" style="font-size:20px;"></i>
                <span>${todo.text}</span>
            </div>
            <i class="fa-regular fa-trash-can" style="cursor:pointer; color:var(--text-muted);" onclick="deleteTodo(${index})"></i>
        `;
    todoList.appendChild(li);
  });

  const statsEl = document.getElementById("todo-stats");
  if (statsEl) statsEl.innerText = pendingCount;
  localStorage.setItem("todos", JSON.stringify(todos));
}

document.getElementById("add-todo-btn").addEventListener("click", () => {
  const text = todoInput.value.trim();
  if (text !== "") {
    todos.push({ text: text, completed: false });
    todoInput.value = "";
    renderTodos();
  }
});

window.toggleTodo = (index) => {
  todos[index].completed = !todos[index].completed;
  renderTodos();
};

window.deleteTodo = (index) => {
  todos.splice(index, 1);
  renderTodos();
};
renderTodos();

// Pomodoro Timer Logic
let timerInterval;
let customMinutes = 25;
let timeLeft = customMinutes * 60;
let isTimerRunning = false;
const timerDisplay = document.getElementById("timer");
const timerSummary = document.getElementById("timer-summary");

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  timerDisplay.innerText = formatted;
  if (timerSummary) timerSummary.innerText = formatted;
}

const alarmSound = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
);
alarmSound.loop = true;

document.getElementById("stop-alarm-btn").addEventListener("click", () => {
  alarmSound.pause();
  alarmSound.currentTime = 0;
  document.getElementById("alarm-overlay").classList.add("hidden");
});

document.getElementById("set-timer-btn").addEventListener("click", () => {
  const inputMins = parseInt(document.getElementById("pomodoro-minutes").value);
  if (inputMins > 0) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    customMinutes = inputMins;
    timeLeft = customMinutes * 60;
    updateTimerDisplay();
    document.getElementById("timer-status").innerText =
      `${customMinutes} Min Session Ready`;
  }
});

document.getElementById("start-timer").addEventListener("click", () => {
  if (!isTimerRunning && timeLeft > 0) {
    isTimerRunning = true;
    document.getElementById("timer-status").innerText = "Session Running...";
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        alarmSound.play();
        document.getElementById("alarm-overlay").classList.remove("hidden");
        isTimerRunning = false;
        document.getElementById("timer-status").innerText = "Session Completed";
      }
    }, 1000);
  }
});

document.getElementById("pause-timer").addEventListener("click", () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  document.getElementById("timer-status").innerText = "Session Paused";
});

document.getElementById("reset-timer").addEventListener("click", () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timeLeft = customMinutes * 60;
  updateTimerDisplay();
  document.getElementById("timer-status").innerText =
    `${customMinutes} Min Session Ready`;
});
updateTimerDisplay();

// Clock Logic
function updateClock() {
  const now = new Date();

  document.getElementById("clock").innerText = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("date").innerText = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const hour = now.getHours();
  const greeting = document.getElementById("greeting");
  if (hour < 12) greeting.innerHTML = "Good Morning, Umakant! ☀️";
  else if (hour < 17) greeting.innerHTML = "Good Afternoon, Umakant! 👋";
  else if (hour < 21) greeting.innerHTML = "Good Evening, Umakant! 🌙";
  else greeting.innerHTML = "Good Night, Umakant! 💤";
}
setInterval(updateClock, 1000);

// Background and Theme Logic
const darkBackgrounds = [
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1501862700950-18382cd41497?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
];
const lightBackgrounds = [
  "https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1618005192384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1508615039623-a25605d2b022?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
];

let bgIndex = 0;
let currentTheme = localStorage.getItem("theme") || "dark";
document.body.setAttribute("data-theme", currentTheme);

const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) themeToggle.checked = currentTheme === "light";

function updateBackgroundImage() {
  const activeArray =
    currentTheme === "light" ? lightBackgrounds : darkBackgrounds;
  document.getElementById("bg-layer").style.backgroundImage =
    `url('${activeArray[bgIndex % activeArray.length]}')`;
}

function switchTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", currentTheme);
  localStorage.setItem("theme", currentTheme);
  if (themeToggle) themeToggle.checked = currentTheme === "light";

  bgIndex = 0;
  updateBackgroundImage();
}

if (themeToggle) themeToggle.addEventListener("change", switchTheme);
document
  .getElementById("theme-change-btn")
  .addEventListener("click", switchTheme);
document.getElementById("bg-change-btn").addEventListener("click", () => {
  const activeArray =
    currentTheme === "light" ? lightBackgrounds : darkBackgrounds;
  bgIndex = (bgIndex + 1) % activeArray.length;
  updateBackgroundImage();
});
updateBackgroundImage();

// Weather Logic
document.getElementById("weather-change-btn").addEventListener("click", () => {
  document.getElementById("weather-desc").innerText = "Locating...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
          );
          const data = await res.json();
          document.getElementById("weather-temp").innerText =
            `${Math.round(data.current_weather.temperature)}°C`;

          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          );
          const geoData = await geoRes.json();
          let city =
            geoData.address.city ||
            geoData.address.town ||
            geoData.address.state ||
            "Your Location";
          document.getElementById("weather-desc").innerText = city;
        } catch (error) {
          document.getElementById("weather-desc").innerText = "Failed";
        }
      },
      () => {
        document.getElementById("weather-desc").innerText = "Denied";
      },
    );
  }
});

// Motivational Quotes Logic
async function fetchQuote() {
  try {
    const res = await fetch("https://dummyjson.com/quotes/random");
    const data = await res.json();
    document.getElementById("quote-text").innerText = `"${data.quote}"`;
    document.getElementById("quote-author").innerText = `- ${data.author}`;
  } catch (error) {
    document.getElementById("quote-text").innerText =
      '"Stay positive, work hard, make it happen."';
    document.getElementById("quote-author").innerText = "- System";
  }
}
document.getElementById("new-quote-btn").addEventListener("click", fetchQuote);
setInterval(fetchQuote, 30000);
fetchQuote();

// Daily Planner Logic
const plannerSlots = document.getElementById("planner-slots");
let plannerData = JSON.parse(localStorage.getItem("plannerData")) || {};

function updatePlannerStats() {
  let eventCount = 0;
  for (let key in plannerData) {
    if (plannerData[key] && plannerData[key].trim() !== "") eventCount++;
  }
  const statEl = document.getElementById("planner-stats");
  if (statEl) statEl.innerText = eventCount;
}

for (let i = 9; i <= 17; i++) {
  const timeLabel = i > 12 ? `${i - 12} PM` : i === 12 ? "12 PM" : `${i} AM`;
  const div = document.createElement("div");
  div.classList.add("input-group");
  div.innerHTML = `
        <span style="width:70px; display:flex; align-items:center; font-weight:600; color:var(--text-muted);">${timeLabel}</span>
        <input type="text" id="slot-${i}" value="${plannerData[i] || ""}" placeholder="Plan for ${timeLabel}..." style="background:rgba(255,255,255,0.05);">
    `;
  plannerSlots.appendChild(div);

  document.getElementById(`slot-${i}`).addEventListener("input", (e) => {
    plannerData[i] = e.target.value;
    localStorage.setItem("plannerData", JSON.stringify(plannerData));
    updatePlannerStats();
  });
}
updatePlannerStats();

// Daily Goals Logic
const goalInput = document.getElementById("goal-input");
const goalList = document.getElementById("goal-list");
let goals = JSON.parse(localStorage.getItem("goals")) || [];

function renderGoals() {
  if (!goalList) return;
  goalList.innerHTML = "";
  let completedCount = 0;

  goals.forEach((goal, index) => {
    if (goal.completed) completedCount++;

    const li = document.createElement("li");
    if (goal.completed) li.classList.add("completed");

    const iconClass = goal.completed
      ? "fa-solid fa-circle-check text-green"
      : "fa-regular fa-circle";

    li.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; cursor:pointer;" onclick="toggleGoal(${index})">
                <i class="${iconClass}" style="font-size:20px;"></i>
                <span>${goal.text}</span>
            </div>
            <i class="fa-solid fa-xmark" style="cursor:pointer; color:var(--text-muted);" onclick="deleteGoal(${index})"></i>
        `;
    goalList.appendChild(li);
  });

  const total = goals.length;
  const goalFraction = document.getElementById("goal-fraction");
  if (goalFraction) goalFraction.innerText = `${completedCount} / ${total}`;

  const progressFill = document.getElementById("goal-progress-fill");
  let percent = total > 0 ? (completedCount / total) * 100 : 0;
  if (progressFill) progressFill.style.width = `${percent}%`;

  localStorage.setItem("goals", JSON.stringify(goals));
}

if (document.getElementById("add-goal-btn")) {
  document.getElementById("add-goal-btn").addEventListener("click", () => {
    const text = goalInput.value.trim();
    if (text) {
      goals.push({ text, completed: false });
      goalInput.value = "";
      renderGoals();
    }
  });
}

window.toggleGoal = (index) => {
  goals[index].completed = !goals[index].completed;
  renderGoals();
};
window.deleteGoal = (index) => {
  goals.splice(index, 1);
  renderGoals();
};
renderGoals();
