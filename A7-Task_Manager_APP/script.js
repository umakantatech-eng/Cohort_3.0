const taskInput = document.querySelector("#taskInput");
const categorySelect = document.querySelector(".categorySelect");
const addBtn = document.querySelector("#addBtn");
const taskList = document.querySelector("#taskList");

// Counters Elements
const pendingCount = document.querySelector("#pendingCount");
const completedCount = document.querySelector("#completedCount");
const totalCount = document.querySelector("#totalCount");

// dark theme
const themeBtn = document.querySelector(".theme-btn");

const savedTheme = localStorage.getItem("theme");

// Dark theme check
if (savedTheme === "light") {
  document.body.classList.add("light-mode");
}

// darkTheme
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});

let tasks = [];
let taskId = 1;
let editTaskId = null;

const savedTasks = JSON.parse(localStorage.getItem("tasks"));

if (savedTasks) {
  tasks = savedTasks;

  if (tasks.length > 0) {
    taskId = Math.max(...tasks.map((task) => task.id)) + 1;
  } else {
    taskId = 1;
  }

  tasks.forEach((task) => {
    createTaskCard(task);
  });

  updateStats();
}

addBtn.addEventListener("click", addTask);
function addTask() {

  const title = taskInput.value.trim();
  const category = categorySelect.value;

  if (title === "") {
    alert("Enter Task");
    return;
  }

  // Edit Mode
  if (editTaskId !== null) {

    const task = tasks.find(
      task => task.id === editTaskId
    );

    task.title = title;
    task.category = category;

    localStorage.setItem(
      "tasks",
      JSON.stringify(tasks)
    );

    taskList.innerHTML = "";

    tasks.forEach(task => {
      createTaskCard(task);
    });

    updateStats();

    editTaskId = null;

    addBtn.textContent = "Add Task";

    taskInput.value = "";
    categorySelect.value = "Work";
    taskInput.focus();

    return;
  }

  // Add Mode
  const task = {
    id: taskId,
    title,
    category,
    status: "pending",
  };

  tasks.push(task);

  localStorage.setItem(
    "tasks",
    JSON.stringify(tasks)
  );

  createTaskCard(task);

  updateStats();

  taskId++;

  taskInput.value = "";
  categorySelect.value = "Work";
  taskInput.focus();
}

function createTaskCard(task) {
  // Create task-card
  const card = document.createElement("div");
  card.classList.add("task-card");

  // Create task-top
  const taskTop = document.createElement("div");
  taskTop.classList.add("task-top");

  // Create task-icon
  const taskIcon = document.createElement("div");
  taskIcon.classList.add("task-icon");

  const icon = document.createElement("i");
  icon.classList.add("fa-solid", "fa-briefcase");

  // Create task-content
  const taskContent = document.createElement("div");
  taskContent.classList.add("task-content");

  // Heading
  const heading = document.createElement("h3");
  const text = document.createTextNode(task.title);

  // Tags
  const tags = document.createElement("div");
  tags.classList.add("tags");

  const workSpan = document.createElement("span");
  workSpan.classList.add("work");
  workSpan.textContent = task.category;

  const pendingSpan = document.createElement("span");
  pendingSpan.classList.add("pending-tag");
  pendingSpan.textContent = task.status;

  // Actions
  const actions = document.createElement("div");
  actions.classList.add("actions");

  const editBtn = document.createElement("button");
  editBtn.classList.add("edit");
  editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';

  const completeBtn = document.createElement("button");
  completeBtn.classList.add("complete");
  completeBtn.innerHTML = '<i class="fa-solid fa-check"></i>';

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete");
  deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';

  if (task.status === "completed") {
    pendingSpan.textContent = "Completed";

    pendingSpan.style.background = "green";

    completeBtn.disabled = true;

    heading.style.textDecoration = "line-through";
  }

  // Append
  heading.appendChild(text);

  taskIcon.appendChild(icon);

  tags.append(workSpan, pendingSpan);

  taskContent.append(heading, tags);

  taskTop.append(taskIcon, taskContent);

  actions.append(editBtn, completeBtn, deleteBtn);

  card.append(taskTop, actions);

  taskList.appendChild(card);

  card.setAttribute("data-id", task.id);

  card.setAttribute("data-status", task.status);

  card.setAttribute("data-category", task.category);

  // Action deleteBtn
  //   deleteBtn.addEventListener("click", () => {
  //     card.remove();

  //     tasks = tasks.filter((t) => t.id !== task.id);
  //     localStorage.setItem("tasks", JSON.stringify(tasks));

  //     updateStats();
  //   });

  // Action completeBtn
  //   completeBtn.addEventListener("click", () => {
  //     if (task.status === "completed") {
  //       return;
  //     }

  //     pendingSpan.textContent = "Completed";

  //     pendingSpan.style.background = "green";

  //     task.status = "completed";

  //     localStorage.setItem("tasks", JSON.stringify(tasks));

  //     completeBtn.disabled = true;

  //     heading.style.textDecoration = "line-through";

  //     updateStats();
  //   });

  // Action editBtn
  //   editBtn.addEventListener("click", () => {
  //     const newTitle = prompt("Edit Task", heading.textContent);

  //     if (newTitle === null || newTitle.trim() === "") return;

  //     heading.textContent = newTitle;
  //     task.title = newTitle;

  //     localStorage.setItem("tasks", JSON.stringify(tasks));
  //   });
}

function updateStats() {
  const total = tasks.length;

  const completed = tasks.filter((task) => task.status === "completed").length;

  const pending = total - completed;

  pendingCount.textContent = pending;

  completedCount.textContent = completed;

  totalCount.textContent = total;
}

// Bubbling Demo
const grandparent = document.querySelector("#grandparent");

const parent = document.querySelector("#parent");

const childBtn = document.querySelector("#childBtn");

// true use karne se capturing hota hai
grandparent.addEventListener("click", () => {
  console.log("Grandparent");
});

parent.addEventListener("click", () => {
  console.log("Parent");
});

childBtn.addEventListener("click", () => {
  console.log("Child");
});


taskList.addEventListener("click", (e) => {
  if (e.target.closest(".delete")) {
    const card = e.target.closest(".task-card");

    const id = Number(card.dataset.id);

    tasks = tasks.filter((task) => task.id !== id);

    localStorage.setItem("tasks", JSON.stringify(tasks));

    card.remove();
    updateStats();
  } 
  else if (e.target.closest(".complete")) {
    const card = e.target.closest(".task-card");

    const id = Number(card.dataset.id);

    const task = tasks.find((task) => task.id === id);

    task.status = "completed";

    localStorage.setItem("tasks", JSON.stringify(tasks));

    const badge = card.querySelector(".pending-tag");
    const heading = card.querySelector("h3");
    const completeBtn = card.querySelector(".complete");

    badge.textContent = "Completed";
    badge.style.background = "green";
    heading.style.textDecoration = "line-through";

    completeBtn.disabled = true;

    updateStats();
  }
   else if (e.target.closest(".edit")) {
    const card = e.target.closest(".task-card");

    const id = Number(card.dataset.id);

    const task = tasks.find((task) => task.id === id);

    taskInput.value = task.title;

    categorySelect.value = task.category;

    editTaskId = id;

    addBtn.textContent = "Update Task";
    
  }
});
