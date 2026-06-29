import { supabase } from './supabaseClient.js';
import { getFinancialInsights } from './services/gemini.js';

// ==========================================
//  STORAGE KEYS (Legacy / Local)
// ==========================================
var STORAGE = {
  USER: "fintrack_user", // Legacy
  SESSION: "fintrack_session", // Legacy
  TRANSACTIONS: "fintrack_transactions",
  THEME: "fintrack_theme",
  CURRENCY: "fintrack_currency"
};

// ==========================================
//  SPLASH SCREEN & AUTH STATE
// ==========================================
var splashPage = document.querySelector(".splash-page");

if (splashPage) {
  setTimeout(async function () {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      window.location.href = "home.html";
    } else {
      window.location.href = "login.html";
    }
  }, 2000);
}

// Global Auth State Listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Redirect to login if signed out
    if (!window.location.href.includes("login.html") && !window.location.href.includes("register.html") && !window.location.href.includes("index.html")) {
      window.location.href = "login.html";
    }
  }
});

// ==========================================
//  PASSWORD TOGGLE (Register & Login)
// ==========================================
var passwordToggles = document.querySelectorAll(".toggle-password");

passwordToggles.forEach(function (toggle) {
  toggle.addEventListener("click", function () {
    var input = toggle.previousElementSibling;
    var icon = toggle.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.replace("fa-eye-slash", "fa-eye");
    }
  });
});

// ==========================================
//  REGISTER FORM
// ==========================================
var registerform = document.querySelector("#registerform");

if (registerform) {
  registerform.addEventListener("submit", async function (e) {
    e.preventDefault();

    var fullName = document.querySelector("#fullName").value.trim();
    var email = document.querySelector("#email").value.trim();
    var password = document.querySelector("#password").value.trim();
    var confirmPassword = document.querySelector("#confirmPassword").value.trim();
    var message = document.querySelector("#registerMessage");

    message.className = "message";

    if (!fullName || !email || !password || !confirmPassword) {
      message.textContent = "Please fill all fields.";
      message.classList.add("error");
      return;
    }

    if (password.length < 6) {
      message.textContent = "Password must be at least 6 characters.";
      message.classList.add("error");
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Passwords do not match.";
      message.classList.add("error");
      return;
    }

    message.textContent = "Creating account...";
    message.classList.add("success");

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      message.textContent = error.message;
      message.classList.remove("success");
      message.classList.add("error");
    } else {
      message.textContent = "Account created! Please verify your email to log in.";
      message.classList.remove("error");
      message.classList.add("success");
      registerform.reset();
      
      setTimeout(function () {
        window.location.href = "login.html";
      }, 3000);
    }
  });
}

// ==========================================
//  LOGIN FORM
// ==========================================
var loginForm = document.querySelector("#loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    var loginEmail = document.querySelector("#loginEmail").value.trim();
    var loginPassword = document.querySelector("#loginPassword").value.trim();
    var message = document.querySelector("#loginMessage");

    message.className = "message";

    if (!loginEmail || !loginPassword) {
      message.textContent = "Please fill all fields.";
      message.classList.add("error");
      return;
    }

    message.textContent = "Logging in...";
    message.classList.add("success");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      message.textContent = error.message;
      message.classList.remove("success");
      message.classList.add("error");
    } else {
      message.textContent = "Login successful!";
      message.classList.remove("error");
      message.classList.add("success");

      setTimeout(function () {
        window.location.href = "home.html";
      }, 600);
    }
  });
}

// ==========================================
//  HOME PAGE LOGIC
// ==========================================
var homePage = document.querySelector("#transactionModal");

if (homePage) {
  (async function() {

  // --- Variables ---
  var cashFlowChart = null;      // will hold the Chart.js instance
  var currentFilter = "all";     // "all", "income", "expense"
  var selectedType = "income";   // type chosen in the modal

  // --- Security Utility ---
  window.escapeHTML = function(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(match) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
    });
  };

  // --- Load user name & greeting ---
  var greetingEl = document.querySelector('#greetingText');
  if (greetingEl) {
    var hour = new Date().getHours();
    var greeting = 'Welcome 👋';
    if (hour < 12) greeting = 'Good Morning ☀️';
    else if (hour < 17) greeting = 'Good Afternoon 🌤️';
    else greeting = 'Good Evening 🌙';
    greetingEl.textContent = greeting;
  }

  // --- Load user name ---
  var userNameEl = document.querySelector("#userName");
  var desktopUserNameEl = document.querySelector("#desktopUserName");
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    const fullName = session.user.user_metadata?.full_name || session.user.email;
    if (userNameEl) userNameEl.textContent = fullName;
    if (desktopUserNameEl) desktopUserNameEl.textContent = fullName;
  }

  // --- Apply saved theme on page load ---
  var savedTheme = localStorage.getItem(STORAGE.THEME);
  var desktopDarkToggle = document.querySelector("#desktopDarkToggle");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    if (desktopDarkToggle) desktopDarkToggle.checked = true;
  }

  // --- Theme Toggle Button (Mobile) ---
  var themeBtn = document.querySelector("#themeBtn");

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      toggleDarkMode();
    });
  }

  // Common toggle function
  window.toggleDarkMode = function() {
    document.body.classList.toggle("dark");

    var isDark = document.body.classList.contains("dark");
    if (isDark) {
      localStorage.setItem(STORAGE.THEME, "dark");
    } else {
      localStorage.setItem(STORAGE.THEME, "light");
    }

    // sync desktop toggle if it exists
    var dtToggle = document.querySelector("#desktopDarkToggle");
    if (dtToggle) dtToggle.checked = isDark;

    // Redraw charts with new colors
    renderChart();
    renderDesktopChart();
  };

  // --- Profile Button (go to settings) ---
  var profileBtn = document.querySelector("#profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", function () {
      window.location.href = "settings.html";
    });
  }

  // ==========================================
  //  GET / SAVE TRANSACTIONS
  // ==========================================

  // Supabase Transactions Cache
  var _transactionsCache = [];

  window.fetchTransactionsFromDB = async function() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: true });
      
    if (error) {
      console.error("Fetch Error:", error);
    } else if (data) {
      _transactionsCache = data;
    }
  };

  function loadTransactions() {
    return _transactionsCache;
  }

  // Get filtered transactions based on Month Filter
  function getDisplayTransactions() {
    var list = loadTransactions();
    var monthFilterEl = document.querySelector("#monthFilter");
    var monthFilter = monthFilterEl ? monthFilterEl.value : "all";
    
    if (monthFilter !== "all") {
      var now = new Date();
      var targetMonth = now.getMonth();
      var targetYear = now.getFullYear();
      
      if (monthFilter === "last") {
        targetMonth -= 1;
        if (targetMonth < 0) {
          targetMonth = 11;
          targetYear -= 1;
        }
      }
      
      var filteredList = [];
      for(var i=0; i<list.length; i++) {
        var d = new Date(list[i].date);
        if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
          filteredList.push(list[i]);
        }
      }
      return filteredList;
    }
    return list;
  }

  // (Removed LocalStorage saveTransactions)

  // ==========================================
  //  GET CURRENCY SYMBOL
  // ==========================================
  function getCurrency() {
    var saved = localStorage.getItem(STORAGE.CURRENCY);
    if (saved) {
      return saved;
    }
    return "₹";
  }

  // ==========================================
  //  FORMAT AMOUNT with currency
  // ==========================================
  function formatAmount(amount) {
    var symbol = getCurrency();
    return symbol + parseFloat(amount).toFixed(2);
  }

  // ==========================================
  //  CALCULATE TOTALS
  // ==========================================
  function calculateTotals(list) {
    var totalIncome = 0;
    var totalExpense = 0;

    for (var i = 0; i < list.length; i++) {
      if (list[i].type === "income") {
        totalIncome = totalIncome + parseFloat(list[i].amount);
      } else {
        totalExpense = totalExpense + parseFloat(list[i].amount);
      }
    }

    var balance = totalIncome - totalExpense;

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: balance
    };
  }

  // ==========================================
  //  UPDATE SUMMARY CARDS
  // ==========================================
  function updateCards() {
    var list = getDisplayTransactions();
    var totals = calculateTotals(list);

    // Mobile
    var balEl = document.querySelector("#balance");
    var incEl = document.querySelector("#income");
    var expEl = document.querySelector("#expense");
    var totEl = document.querySelector("#totalTransaction");

    if (balEl) balEl.textContent = formatAmount(totals.balance);
    if (incEl) incEl.textContent = formatAmount(totals.income);
    if (expEl) expEl.textContent = formatAmount(totals.expense);
    if (totEl) totEl.textContent = list.length;

    // Desktop
    var dBalEl = document.querySelector("#desktopBalance");
    var dIncEl = document.querySelector("#desktopIncome");
    var dExpEl = document.querySelector("#desktopExpense");
    var dTotEl = document.querySelector("#desktopTotal");

    if (dBalEl) dBalEl.textContent = formatAmount(totals.balance);
    if (dIncEl) dIncEl.textContent = formatAmount(totals.income);
    if (dExpEl) dExpEl.textContent = formatAmount(totals.expense);
    if (dTotEl) dTotEl.textContent = list.length;

    // Badges
    var badgeDesktop = document.querySelector(".nav-badge-desktop");
    var badgeMobile = document.querySelector(".nav-badge-mobile");
    if (badgeDesktop) badgeDesktop.textContent = list.length;
    if (badgeMobile) badgeMobile.textContent = list.length;

    // Budget Check
    var budgetAlert = document.querySelector("#budgetAlert");
    var savedBudget = localStorage.getItem("fintrack_budget");
    if (budgetAlert && savedBudget) {
      if (totals.expense > parseFloat(savedBudget)) {
        budgetAlert.style.display = "block";
      } else {
        budgetAlert.style.display = "none";
      }
    }
  }

  // ==========================================
  //  RENDER TRANSACTION LIST (MOBILE)
  // ==========================================
  
  var categoryEmojis = {
    "Salary": "💰",
    "Business": "💼",
    "Investments": "📈",
    "Food": "🍔",
    "Transport": "🚗",
    "Shopping": "🛍️",
    "Bills": "🧾",
    "Entertainment": "🎬",
    "Health": "💊",
    "Education": "📚",
    "Other": "📦"
  };

  function renderTransactions() {
    var list = getDisplayTransactions();
    var listEl = document.querySelector("#transactionList");
    if (!listEl) return;

    var searchInput = document.querySelector("#mobileSearch");
    var searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    // Filter the list based on currentFilter and search
    var filtered = [];
    for (var i = 0; i < list.length; i++) {
      var txn = list[i];
      var matchType = false;

      if (currentFilter === "all") {
        matchType = true;
      } else if (currentFilter === "income" && txn.type === "income") {
        matchType = true;
      } else if (currentFilter === "expense" && txn.type === "expense") {
        matchType = true;
      }

      var matchSearch = (txn.description.toLowerCase().includes(searchTerm) || txn.category.toLowerCase().includes(searchTerm));

      if (matchType && matchSearch) {
        filtered.push(txn);
      }
    }

    listEl.innerHTML = "";

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="empty-state" id="emptyState">' +
        '<i class="fa-solid fa-receipt"></i>' +
        '<p>No transactions yet</p>' +
        '<small>Tap + to add your first one</small>' +
        '</div>';
      return;
    }

    var reversed = filtered.slice().reverse();

    for (var j = 0; j < reversed.length; j++) {
      var txn = reversed[j];
      var txnDate = new Date(txn.date);
      var dateStr = txnDate.toLocaleDateString("en-IN", {
        day: "numeric", month: "short"
      });

      var row = document.createElement("div");
      row.className = "txn-item";
      row.innerHTML =
        '<div class="txn-icon-wrap ' + txn.type + '">' +
          '<i class="fa-solid fa-arrow-' + (txn.type === "income" ? "down" : "up") + '"></i>' +
        '</div>' +
        '<div class="txn-info">' +
          '<h4>' + window.escapeHTML(txn.description) + '</h4>' +
          '<div class="txn-meta">' +
            '<span>' + dateStr + '</span>' +
            '<span class="dot"></span>' +
            '<span class="txn-type-badge ' + txn.type + '">' + (txn.type === "income" ? "Income" : "Expense") + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="txn-right">' +
          '<div class="txn-amount ' + txn.type + '">' +
            (txn.type === "income" ? "+" : "-") + formatAmount(txn.amount) +
          '</div>' +
          '<div class="txn-category">' + (categoryEmojis[txn.category] || "📦") + ' ' + window.escapeHTML(txn.category) + '</div>' +
        '</div>' +
        '<button class="txn-delete-btn" onclick="deleteTransaction(\'' + txn.id + '\')">' +
          '<i class="fa-solid fa-trash"></i>' +
        '</button>';

      listEl.appendChild(row);
    }
  }

  // ==========================================
  //  RENDER DESKTOP TRANSACTIONS TABLE
  // ==========================================
  window.filterDesktopTable = function() {
    renderDesktopTransactions();
  };

  function renderDesktopTransactions() {
    var list = getDisplayTransactions();
    var tbody = document.querySelector("#desktopTableBody");
    if (!tbody) return;

    var searchInput = document.querySelector("#desktopSearch");
    var typeFilter = document.querySelector("#desktopTypeFilter");

    var searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    var selectedType = typeFilter ? typeFilter.value : "all";

    var filtered = [];
    for (var i = 0; i < list.length; i++) {
      var txn = list[i];
      var matchType = (selectedType === "all" || txn.type === selectedType);
      var matchSearch = (txn.description.toLowerCase().includes(searchTerm) || txn.category.toLowerCase().includes(searchTerm));

      if (matchType && matchSearch) {
        filtered.push(txn);
      }
    }

    tbody.innerHTML = "";

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="dt-empty">No transactions found</td></tr>';
      return;
    }

    var reversed = filtered.slice().reverse();

    for (var j = 0; j < reversed.length; j++) {
      var txn = reversed[j];
      var txnDate = new Date(txn.date);
      var dateStr = txnDate.toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      });

      var tr = document.createElement("tr");

      var amountClass = txn.type === "income" ? "dt-income" : "dt-expense";
      var amountPrefix = txn.type === "income" ? "+" : "-";

      tr.innerHTML =
        '<td>' + dateStr + '</td>' +
        '<td><strong>' + window.escapeHTML(txn.description) + '</strong></td>' +
        '<td>' + (categoryEmojis[txn.category] || "📦") + ' ' + window.escapeHTML(txn.category) + '</td>' +
        '<td class="' + amountClass + '">' + amountPrefix + formatAmount(txn.amount) + '</td>' +
        '<td>' +
          '<button class="dt-delete-btn" onclick="deleteTransaction(\'' + txn.id + '\')">' +
            '<i class="fa-solid fa-trash"></i> Delete' +
          '</button>' +
        '</td>';

      tbody.appendChild(tr);
    }
  }

  // ==========================================
  //  RENDER CHART
  // ==========================================
  async function renderChart() {
    const { Chart } = await import('chart.js/auto');
    var list = getDisplayTransactions();
    var canvas = document.querySelector("#cashFlowChart");

    // Group by date
    var dateMap = {};

    for (var i = 0; i < list.length; i++) {
      var txn = list[i];
      var d = txn.date;

      if (!dateMap[d]) {
        dateMap[d] = { income: 0, expense: 0 };
      }

      if (txn.type === "income") {
        dateMap[d].income = dateMap[d].income + parseFloat(txn.amount);
      } else {
        dateMap[d].expense = dateMap[d].expense + parseFloat(txn.amount);
      }
    }

    // Sort dates
    var dates = Object.keys(dateMap).sort();

    // Format labels
    var labels = [];
    for (var k = 0; k < dates.length; k++) {
      var d2 = new Date(dates[k]);
      labels.push(d2.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
    }

    var incomeData = [];
    var expenseData = [];

    for (var m = 0; m < dates.length; m++) {
      incomeData.push(dateMap[dates[m]].income);
      expenseData.push(dateMap[dates[m]].expense);
    }

    // If no data, show empty chart with placeholder
    if (dates.length === 0) {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      incomeData = [0, 0, 0, 0, 0, 0, 0];
      expenseData = [0, 0, 0, 0, 0, 0, 0];
    }

    // Destroy old chart before drawing a new one
    if (cashFlowChart) {
      cashFlowChart.destroy();
    }

    // Detect dark mode
    var isDark = document.body.classList.contains("dark");
    var gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
    var labelColor = isDark ? "#94a3b8" : "#6b7280";

    // Create new chart
    cashFlowChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            backgroundColor: "rgba(34, 197, 94, 0.85)",
            borderRadius: 6,
            barPercentage: 0.5
          },
          {
            label: "Expense",
            data: expenseData,
            backgroundColor: "rgba(239, 68, 68, 0.85)",
            borderRadius: 6,
            barPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: labelColor,
              font: { size: 11 }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: labelColor,
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  // ==========================================
  //  MASTER REFRESH
  // ==========================================
  // Call this whenever data changes
  function refreshUI() {
    updateCards();
    renderTransactions();
    renderDesktopTransactions();
    renderChart();
    renderDesktopChart();
  }
  window.refreshUI = refreshUI;

  // ==========================================
  //  RENDER DESKTOP CHART
  // ==========================================
  var desktopChartInstance = null;
  async function renderDesktopChart() {
    const { Chart } = await import('chart.js/auto');
    var list = getDisplayTransactions();
    var canvas = document.querySelector("#cashFlowChartDesktop");
    if (!canvas) return;

    var dateMap = {};
    for (var i = 0; i < list.length; i++) {
      var txn = list[i];
      var d = txn.date;
      if (!dateMap[d]) dateMap[d] = { income: 0, expense: 0 };
      if (txn.type === "income") dateMap[d].income += parseFloat(txn.amount);
      else dateMap[d].expense += parseFloat(txn.amount);
    }

    var dates = Object.keys(dateMap).sort();
    var labels = [];
    var incomeData = [];
    var expenseData = [];

    for (var k = 0; k < dates.length; k++) {
      var d2 = new Date(dates[k]);
      labels.push(d2.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
      incomeData.push(dateMap[dates[k]].income);
      expenseData.push(dateMap[dates[k]].expense);
    }

    var isDark = document.body.classList.contains("dark");
    var textColor = isDark ? "#94a3b8" : "#6b7280";
    var gridColor = isDark ? "#334155" : "#e5e7eb";

    if (desktopChartInstance) {
      desktopChartInstance.destroy();
    }

    desktopChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            backgroundColor: "#22c55e",
            borderRadius: 4
          },
          {
            label: "Expense",
            data: expenseData,
            backgroundColor: "#ef4444",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: "Inter", size: 12 } }
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: "Inter", size: 12 },
              callback: function(value) {
                var sym = getCurrency();
                if (value >= 1000) return sym + (value / 1000) + "k";
                return sym + value;
              }
            }
          }
        }
      }
    });
  }

  // ==========================================
  //  FILTER BUTTONS
  // ==========================================
  window.setFilter = function (filter) {
    currentFilter = filter;

    // Update active button styling
    document.querySelector("#filterAll").classList.remove("active");
    document.querySelector("#filterIncome").classList.remove("active");
    document.querySelector("#filterExpense").classList.remove("active");

    if (filter === "all") {
      document.querySelector("#filterAll").classList.add("active");
    } else if (filter === "income") {
      document.querySelector("#filterIncome").classList.add("active");
    } else {
      document.querySelector("#filterExpense").classList.add("active");
    }

    renderTransactions();
  };

  // ==========================================
  //  DELETE TRANSACTION
  // ==========================================
  window.deleteTransaction = async function (id) {
    var confirmed = confirm("Are you sure you want to delete this transaction?");
    if (!confirmed) return;

    await supabase.from('transactions').delete().eq('id', id);
    await window.fetchTransactionsFromDB();
    refreshUI();
  };

  // ==========================================
  //  MODAL - Open / Close
  // ==========================================
  var modal = document.querySelector("#transactionModal");
  var overlay = document.querySelector("#modalOverlay");
  var addBtn = document.querySelector("#addTransactionBtn");

  // Open modal
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      if (typeof window.openModal === "function") window.openModal();
    });
  }

  window.openModal = function() {
    modal.classList.add("show");
    overlay.classList.add("show");

    // Set today's date as default
    var today = new Date().toISOString().split("T")[0];
    document.querySelector("#txnDate").value = today;

    // Reset form
    document.querySelector("#transactionForm").reset();
    document.querySelector("#txnDate").value = today;
    var recurringInput = document.querySelector("#txnRecurring");
    if (recurringInput) recurringInput.checked = false;
    document.querySelector("#formMessage").textContent = "";

    // Reset type selection to income
    if (typeof window.selectType === "function") window.selectType("income");
  };

  window.closeModal = function () {
    modal.classList.remove("show");
    overlay.classList.remove("show");
  };

  // ==========================================
  //  TYPE SELECTION (income / expense)
  // ==========================================
  window.selectType = function (type) {
    selectedType = type;

    var incomeBtn = document.querySelector("#incomeTypeBtn");
    var expenseBtn = document.querySelector("#expenseTypeBtn");

    incomeBtn.classList.remove("active", "income-btn", "expense-btn");
    expenseBtn.classList.remove("active", "income-btn", "expense-btn");

    if (type === "income") {
      incomeBtn.classList.add("active", "income-btn");
    } else {
      expenseBtn.classList.add("active", "expense-btn");
    }
  };

  // ==========================================
  //  ADD TRANSACTION FORM SUBMIT
  // ==========================================
  var txnForm = document.querySelector("#transactionForm");

  if (txnForm) {
    txnForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var description = document.querySelector("#txnDescription").value.trim();
      var amount = document.querySelector("#txnAmount").value.trim();
      var date = document.querySelector("#txnDate").value;
      var category = document.querySelector("#txnCategory").value;
      var recurringInput = document.querySelector("#txnRecurring");
      var recurring = recurringInput ? recurringInput.checked : false;
      var msgEl = document.querySelector("#formMessage");

      msgEl.textContent = "";

      // Validate - all fields must be filled
      if (!description) {
        msgEl.textContent = "Please enter a description.";
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        msgEl.textContent = "Please enter a valid amount.";
        return;
      }

      if (!date) {
        msgEl.textContent = "Please select a date.";
        return;
      }

      if (!category) {
        msgEl.textContent = "Please select a category.";
        return;
      }

      var submitBtn = txnForm.querySelector("button[type='submit']");
      var originalBtnHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Saving... <i class="fa-solid fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;

      // Optimistic UI Update
      var tempTxn = {
        id: "temp-" + Date.now(),
        type: selectedType,
        description: description,
        amount: parseFloat(amount),
        date: date,
        category: category,
        recurring: recurring
      };
      
      var list = typeof loadTransactions === 'function' ? loadTransactions() : [];
      list.push(tempTxn);
      refreshUI();
      closeModal();

      // Insert into Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.from('transactions').insert({
          user_id: session.user.id,
          type: selectedType,
          description: description,
          amount: parseFloat(amount),
          date: date,
          category: category,
          recurring: recurring
        });
        
        if (error) {
          console.error("Insert Error:", error);
          alert("Error saving transaction: " + error.message);
        }
      }

      await window.fetchTransactionsFromDB();
      refreshUI(); // Re-render with actual DB data

      // Reset Button State
      submitBtn.innerHTML = originalBtnHtml;
      submitBtn.disabled = false;
    });
  }

  // ==========================================
  //  NAVIGATION
  // ==========================================
  window.goHome = function () {
    window.location.href = "home.html";
  };

  window.goSettings = function () {
    window.location.href = "settings.html";
  };

  // --- Process Recurring Transactions ---
  async function processRecurringTransactions() {
    var list = loadTransactions();
    var hasNew = false;
    
    var now = new Date();
    var currentMonth = now.getMonth();
    var currentYear = now.getFullYear();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    for (var i = 0; i < list.length; i++) {
      var txn = list[i];
      if (txn.recurring) {
        var origDate = new Date(txn.date);
        
        // If the transaction is from a previous month (or year)
        if (origDate.getMonth() !== currentMonth || origDate.getFullYear() !== currentYear) {
          
          // Check if we already created a clone this month
          var alreadyCloned = false;
          for (var j = 0; j < list.length; j++) {
            var checkDate = new Date(list[j].date);
            if (checkDate.getMonth() === currentMonth && checkDate.getFullYear() === currentYear &&
                list[j].description === txn.description && list[j].amount === txn.amount && list[j].type === txn.type) {
              alreadyCloned = true;
              break;
            }
          }
          
          if (!alreadyCloned) {
            // Create a new clone for this month, at today's date
            await supabase.from('transactions').insert({
              user_id: session.user.id,
              type: txn.type,
              description: txn.description,
              amount: txn.amount,
              date: now.toISOString().split("T")[0],
              category: txn.category,
              recurring: true // Keep it recurring for future months
            });
            hasNew = true;
          }
        }
      }
    }
    
    if (hasNew) {
      await window.fetchTransactionsFromDB();
    }
  }

  // --- Initial load (Non-blocking) ---
  refreshUI(); // Render instantly with cache/empty state
  
  (async function initDB() {
    await window.fetchTransactionsFromDB();
    await processRecurringTransactions();
    refreshUI(); // Re-render once data arrives
  })();

  // ==========================================
  //  AI ASSISTANT (Injected dynamically)
  // ==========================================
  function injectAIUI() {
    // Inject floating AI button
    const aiBtn = document.createElement('button');
    aiBtn.id = 'aiAssistantBtn';
    aiBtn.innerHTML = '<i class="fa-solid fa-sparkles"></i> AI Insights';
    aiBtn.style.cssText = 'position: fixed; bottom: 85px; right: 20px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; border: none; border-radius: 20px; padding: 10px 16px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); z-index: 100; display: flex; gap: 8px; align-items: center; transition: transform 0.2s;';
    
    // Inject AI Modal
    const aiModal = document.createElement('div');
    aiModal.id = 'aiModal';
    aiModal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9); opacity: 0; pointer-events: none; width: 90%; max-width: 500px; max-height: 85vh; background: var(--card-bg); border-radius: var(--radius-lg); z-index: 500; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow-y: auto; transition: all 0.3s ease; color: var(--text-dark);';
    aiModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="font-size: 18px; color: var(--text-dark); margin:0;"><i class="fa-solid fa-sparkles" style="color: #8b5cf6;"></i> AI Financial Insights</h2>
        <button id="closeAiModalBtn" style="background: none; border: none; font-size: 20px; color: var(--text-light); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div id="aiContent" style="font-size: 14px; line-height: 1.6;">
        <p style="text-align: center; color: var(--text-light); padding: 20px 0;"><i class="fa-solid fa-spinner fa-spin"></i> Generating your personalized insights...</p>
      </div>
    `;

    // Inject AI Modal Styles
    const aiStyles = document.createElement('style');
    aiStyles.innerHTML = `
      #aiContent { font-family: var(--font-family); color: var(--text-dark); }
      #aiContent p { font-size: 14.5px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.6; }
      #aiContent ul { margin: 0 0 16px 0; padding-left: 20px; color: var(--text-muted); }
      #aiContent li { margin-bottom: 12px; font-size: 14.5px; line-height: 1.6; }
      #aiContent strong { color: var(--text-dark); font-weight: 700; }
      body.dark #aiContent { color: var(--text-light); }
      body.dark #aiContent p, body.dark #aiContent ul { color: #a1a1aa; }
      body.dark #aiContent strong { color: #f4f4f5; }
    `;
    document.head.appendChild(aiStyles);

    document.body.appendChild(aiBtn);
    document.body.appendChild(aiModal);

    const overlay = document.getElementById('modalOverlay');

    aiBtn.addEventListener('click', async () => {
      // Show modal
      overlay.classList.add('show');
      aiModal.style.opacity = '1';
      aiModal.style.pointerEvents = 'auto';
      aiModal.style.transform = 'translate(-50%, -50%) scale(1)';
      
      const contentDiv = document.getElementById('aiContent');
      contentDiv.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px 0; font-size: 16px;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--primary); margin-bottom: 12px; display: block;"></i> Analyzing your finances...</p>';
      
      try {
        const list = typeof loadTransactions === 'function' ? loadTransactions() : [];
        const insights = await getFinancialInsights(list);
        contentDiv.innerHTML = insights;
      } catch (err) {
        contentDiv.innerHTML = `<div style="background: #fee2e2; color: #ef4444; padding: 16px; border-radius: 8px;">
          <p style="margin:0; font-weight: 600;">Oops! Something went wrong.</p>
          <p style="margin: 4px 0 0 0; font-size: 13px;">${err.message}</p>
        </div>`;
      }
    });

    document.getElementById('closeAiModalBtn').addEventListener('click', () => {
      overlay.classList.remove('show');
      aiModal.style.opacity = '0';
      aiModal.style.pointerEvents = 'none';
      aiModal.style.transform = 'translate(-50%, -50%) scale(0.9)';
    });
  }

  injectAIUI();

  })();
} // end if(homePage)

// ==========================================
//  SETTINGS PAGE LOGIC
// ==========================================
var settingsPage = document.querySelector("#settingsName");

if (settingsPage) {

  // --- Apply saved theme ---
  var savedThemeSettings = localStorage.getItem(STORAGE.THEME);
  if (savedThemeSettings === "dark") {
    document.body.classList.add("dark");
    document.querySelector("#darkModeToggle").checked = true;
  }

  // --- Load saved name ---
  var savedUser = JSON.parse(localStorage.getItem(STORAGE.USER));
  if (savedUser) {
    document.querySelector("#settingsName").value = savedUser.fullName;
  }

  // --- Load saved currency ---
  var savedCurrency = localStorage.getItem(STORAGE.CURRENCY);
  if (savedCurrency) {
    document.querySelector("#currencySelect").value = savedCurrency;
  }

  // --- Theme Button in Header ---
  var themeBtnSettings = document.querySelector("#themeBtn");
  if (themeBtnSettings) {
    themeBtnSettings.addEventListener("click", function () {
      document.body.classList.toggle("dark");

      var toggle = document.querySelector("#darkModeToggle");

      if (document.body.classList.contains("dark")) {
        localStorage.setItem(STORAGE.THEME, "dark");
        toggle.checked = true;
      } else {
        localStorage.setItem(STORAGE.THEME, "light");
        toggle.checked = false;
      }
    });
  }

  // --- Profile Button ---
  var profileBtnSettings = document.querySelector("#profileBtn");
  if (profileBtnSettings) {
    profileBtnSettings.addEventListener("click", function () {
      // Already on settings, do nothing
    });
  }

  // Save Name
  window.saveName = async function () {
    var nameInput = document.querySelector("#settingsName").value.trim();

    if (!nameInput) {
      alert("Please enter a name.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: nameInput }
      });

      if (error) throw error;

      // Update the user object in localStorage
      var currentUser = JSON.parse(localStorage.getItem(STORAGE.USER));
      if (currentUser) {
        currentUser.fullName = nameInput;
        localStorage.setItem(STORAGE.USER, JSON.stringify(currentUser));
      }

      // Automatically update DOM element so the user doesn't need to refresh to see the change
      var userNameEl = document.querySelector("#userName");
      if (userNameEl) userNameEl.textContent = nameInput;
      var desktopUserNameEl = document.querySelector("#desktopUserName");
      if (desktopUserNameEl) desktopUserNameEl.textContent = nameInput;

      alert("Name saved successfully!");
    } catch (err) {
      alert("Error saving name: " + err.message);
    }
  };

  // Save Currency
  window.saveCurrency = function () {
    var selected = document.querySelector("#currencySelect").value;
    localStorage.setItem(STORAGE.CURRENCY, selected);
  };

  // Save Budget
  window.saveBudget = function () {
    var budget = document.querySelector("#monthlyBudget").value;
    if (budget && parseFloat(budget) >= 0) {
      localStorage.setItem("fintrack_budget", budget);
      alert("Budget saved successfully!");
    } else {
      alert("Please enter a valid amount.");
    }
  };

  // Load settings on page load
  window.addEventListener("DOMContentLoaded", async function () {
    var currInput = document.querySelector("#currencySelect");
    if (currInput) currInput.value = getCurrency();
    
    var savedTheme = localStorage.getItem(STORAGE.THEME);
    var darkModeToggle = document.querySelector("#darkModeToggle");
    if (savedTheme === "dark" && darkModeToggle) {
      darkModeToggle.checked = true;
    }
    
    var nameInput = document.querySelector("#settingsName");
    const { data: { session } } = await supabase.auth.getSession();
    if (nameInput && session && session.user) {
      nameInput.value = session.user.user_metadata?.full_name || session.user.email;
    }
    var budgetInput = document.querySelector("#monthlyBudget");
    var savedBudget = localStorage.getItem("fintrack_budget");
    if (budgetInput && savedBudget) budgetInput.value = savedBudget;
  });

  // Dark Mode Toggle (the switch)
  window.toggleDarkMode = function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem(STORAGE.THEME, "dark");
    } else {
      localStorage.setItem(STORAGE.THEME, "light");
    }
  };

  // Logout
  window.logoutUser = async function () {
    var confirmed = confirm("Are you sure you want to logout?");

    if (confirmed) {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    }
  };

  // Navigation
  window.goHome = function () {
    window.location.href = "home.html";
  };

  window.goSettings = function () {
    // Already on settings
  };

} // end if(settingsPage)

// ==========================================
//  GLOBAL DATA UTILITIES
// ==========================================

// Reset All Data
window.resetAllData = async function () {
  var confirmed = confirm("Are you sure? This will delete ALL your transactions and cannot be undone.");

  if (confirmed) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.from('transactions').delete().eq('user_id', session.user.id);
        if (error) throw error;
        
        if (typeof window.fetchTransactionsFromDB === 'function') {
          await window.fetchTransactionsFromDB();
        }
        if (typeof refreshUI === 'function') {
          refreshUI();
        }
        alert("All data has been reset.");
      }
    } catch (err) {
      console.error("Reset Error:", err);
      alert("Failed to reset data: " + err.message);
    }
  }
};

// ==========================================
//  EXPORT DATA TO CSV
// ==========================================
window.exportToCSV = async function () {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please login to export data.");
      return;
    }
    
    const { data: list, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: true });
      
    if (error) throw error;

    if (!list || list.length === 0) {
      alert("No transactions to export.");
      return;
    }

    var csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Description,Category,Type,Amount\n";

    list.forEach(function (txn) {
      // Escape commas in description or category
      var desc = '"' + txn.description.replace(/"/g, '""') + '"';
      var cat = '"' + txn.category.replace(/"/g, '""') + '"';
      var row = [txn.date, desc, cat, txn.type, txn.amount].join(",");
      csvContent += row + "\n";
    });

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FinTrack_Pro_Transactions.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Export Error:", err);
    alert("Failed to export data: " + err.message);
  }
};
