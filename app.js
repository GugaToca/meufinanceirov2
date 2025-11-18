// app.js

// Referências dos elementos da interface
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const toRegisterBtn = document.getElementById("to-register");
const toLoginBtn = document.getElementById("to-login");

const loginErrorEl = document.getElementById("login-error");
const registerErrorEl = document.getElementById("register-error");

const userEmailEl = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

const transactionForm = document.getElementById("transaction-form");
const transactionErrorEl = document.getElementById("transaction-error");
const transactionSuccessEl = document.getElementById("transaction-success");
const transactionsBody = document.getElementById("transactions-body");
const emptyStateEl = document.getElementById("empty-state");

const balanceAmountEl = document.getElementById("balance-amount");
const incomeAmountEl = document.getElementById("income-amount");
const expenseAmountEl = document.getElementById("expense-amount");

const dateInput = document.getElementById("date");
const currentPeriodEl = document.getElementById("current-period");

// Resumo inteligente
const smartMonthLabelEl = document.getElementById("smart-month-label");
const smartMonthIncomeEl = document.getElementById("smart-month-income");
const smartMonthExpenseEl = document.getElementById("smart-month-expense");
const smartMonthSavingEl = document.getElementById("smart-month-saving");
const smartMonthChangeEl = document.getElementById("smart-month-change");
const smartTopCategoryEl = document.getElementById("smart-top-category");
const smartTopExpenseEl = document.getElementById("smart-top-expense");
const smartTxCountEl = document.getElementById("smart-tx-count");

// Metas financeiras
const goalForm = document.getElementById("goal-form");
const goalNameInput = document.getElementById("goal-name");
const goalTargetInput = document.getElementById("goal-target");
const goalCurrentInput = document.getElementById("goal-current");
const goalDeadlineInput = document.getElementById("goal-deadline");
const goalErrorEl = document.getElementById("goal-error");
const goalSuccessEl = document.getElementById("goal-success");
const goalsListEl = document.getElementById("goals-list");
const goalsEmptyEl = document.getElementById("goals-empty");

// Estado
let currentUser = null;
let unsubscribeTransactions = null;
let unsubscribeGoals = null;

/* Utilidades */

function formatMoney(value) {
  const number = Number(value) || 0;
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(date) {
  if (!(date instanceof Date)) return "";
  return date.toLocaleDateString("pt-BR");
}

function clearAuthErrors() {
  loginErrorEl.textContent = "";
  registerErrorEl.textContent = "";
}

function toggleLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Aguarde...";
    button.disabled = true;
  } else {
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
    button.disabled = false;
  }
}

// Define data padrão (hoje)
(function setDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;
  currentPeriodEl.textContent = `Hoje - ${dd}/${mm}/${yyyy}`;
})();

/* Tabs de login/cadastro */

function showLogin() {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  clearAuthErrors();
}

function showRegister() {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  clearAuthErrors();
}

tabLogin.addEventListener("click", showLogin);
tabRegister.addEventListener("click", showRegister);
toRegisterBtn.addEventListener("click", showRegister);
toLoginBtn.addEventListener("click", showLogin);

/* Autenticação */

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthErrors();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    loginErrorEl.textContent = "Preencha e-mail e senha.";
    return;
  }

  const submitBtn = loginForm.querySelector("button[type='submit']");
  toggleLoading(submitBtn, true);

  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginForm.reset();
  } catch (error) {
    console.error("Erro no login:", error);
    let message = "Não foi possível entrar. Verifique seus dados.";
    if (error.code === "auth/user-not-found") {
      message = "Usuário não encontrado.";
    } else if (error.code === "auth/wrong-password") {
      message = "Senha incorreta.";
    } else if (error.code === "auth/invalid-email") {
      message = "E-mail inválido.";
    }
    loginErrorEl.textContent = message;
  } finally {
    toggleLoading(submitBtn, false);
  }
});

// Cadastro
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthErrors();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  if (!email || !password) {
    registerErrorEl.textContent = "Preencha e-mail e senha.";
    return;
  }
  if (password.length < 6) {
    registerErrorEl.textContent = "A senha deve ter pelo menos 6 caracteres.";
    return;
  }

  const submitBtn = registerForm.querySelector("button[type='submit']");
  toggleLoading(submitBtn, true);

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    registerForm.reset();
  } catch (error) {
    console.error("Erro no cadastro:", error);
    let message = "Não foi possível criar a conta.";
    if (error.code === "auth/email-already-in-use") {
      message = "Este e-mail já está em uso.";
    } else if (error.code === "auth/invalid-email") {
      message = "E-mail inválido.";
    }
    registerErrorEl.textContent = message;
  } finally {
    toggleLoading(submitBtn, false);
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

/* Observa estado de autenticação */

auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    // Logado
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    userEmailEl.textContent = user.email || "";
    userEmailEl.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    subscribeToTransactions();
    subscribeToGoals();
  } else {
    // Não logado
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    userEmailEl.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    userEmailEl.textContent = "";
    clearTransactionsUI();
    clearGoalsUI();
    if (unsubscribeTransactions) {
      unsubscribeTransactions();
      unsubscribeTransactions = null;
    }
    if (unsubscribeGoals) {
      unsubscribeGoals();
      unsubscribeGoals = null;
    }
  }
});

/* Firestore: referências */

function getUserTransactionsRef() {
  if (!currentUser) return null;
  return db.collection("users").doc(currentUser.uid).collection("transactions");
}

function getUserGoalsRef() {
  if (!currentUser) return null;
  return db.collection("users").doc(currentUser.uid).collection("goals");
}

/* Transações */

function clearTransactionsUI() {
  transactionsBody.innerHTML = "";
  emptyStateEl.classList.remove("hidden");
  balanceAmountEl.textContent = "R$ 0,00";
  incomeAmountEl.textContent = "R$ 0,00";
  expenseAmountEl.textContent = "R$ 0,00";

  if (smartMonthLabelEl) {
    smartMonthIncomeEl.textContent = "R$ 0,00";
    smartMonthExpenseEl.textContent = "R$ 0,00";
    smartMonthSavingEl.textContent = "R$ 0,00";
    smartMonthChangeEl.textContent = "—";
    smartTopCategoryEl.textContent = "—";
    smartTopExpenseEl.textContent = "—";
    smartTxCountEl.textContent = "0";
  }
}

// Escuta em tempo real as transações
function subscribeToTransactions() {
  if (!currentUser) return;
  const ref = getUserTransactionsRef();

  if (unsubscribeTransactions) {
    unsubscribeTransactions();
  }

  unsubscribeTransactions = ref
    .orderBy("date", "desc")
    .onSnapshot(
      (snapshot) => {
        const docs = snapshot.docs;
        renderTransactions(docs);
      },
      (error) => {
        console.error("Erro ao ouvir transações:", error);
      }
    );
}

function renderTransactions(docs) {
  transactionsBody.innerHTML = "";

  if (!docs || docs.length === 0) {
    emptyStateEl.classList.remove("hidden");
    balanceAmountEl.textContent = "R$ 0,00";
    incomeAmountEl.textContent = "R$ 0,00";
    expenseAmountEl.textContent = "R$ 0,00";

    if (smartMonthLabelEl) {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      smartMonthLabelEl.textContent = `Mês atual (${mm}/${yyyy})`;
      smartMonthIncomeEl.textContent = "R$ 0,00";
      smartMonthExpenseEl.textContent = "R$ 0,00";
      smartMonthSavingEl.textContent = "R$ 0,00";
      smartMonthChangeEl.textContent = "—";
      smartTopCategoryEl.textContent = "—";
      smartTopExpenseEl.textContent = "—";
      smartTxCountEl.textContent = "0";
    }

    return;
  }

  emptyStateEl.classList.add("hidden");

  let totalIncome = 0;
  let totalExpense = 0;

  // Para resumo inteligente
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const prevMonthDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();

  let monthIncome = 0;
  let monthExpense = 0;
  let prevMonthIncome = 0;
  let prevMonthExpense = 0;
  let txCount = docs.length;
  const categoryTotals = {};
  let maxExpenseValue = 0;
  let maxExpenseLabel = null;

  docs.forEach((doc) => {
    const data = doc.data();
    const type = data.type;
    const category = data.category || "-";
    const description = data.description || "-";
    const value = Number(data.value) || 0;
    const date = data.date && data.date.toDate ? data.date.toDate() : null;

    if (type === "entrada") {
      totalIncome += value;
    } else if (type === "saida") {
      totalExpense += value;
    }

    // HTML da tabela
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.textContent = date ? formatDate(date) : "-";

    const tdType = document.createElement("td");
    tdType.textContent = type === "entrada" ? "Entrada" : "Saída";
    tdType.style.color = type === "entrada" ? "#16a34a" : "#ef4444";
    tdType.style.fontWeight = "500";

    const tdCategory = document.createElement("td");
    tdCategory.textContent = category;

    const tdDesc = document.createElement("td");
    tdDesc.textContent = description;

    const tdValue = document.createElement("td");
    tdValue.textContent = formatMoney(value);
    tdValue.classList.add("right");
    tdValue.style.fontWeight = "500";

    tr.appendChild(tdDate);
    tr.appendChild(tdType);
    tr.appendChild(tdCategory);
    tr.appendChild(tdDesc);
    tr.appendChild(tdValue);

    transactionsBody.appendChild(tr);

    // Cálculos para resumo inteligente
    if (date) {
      const m = date.getMonth();
      const y = date.getFullYear();

      if (y === curYear && m === curMonth) {
        if (type === "entrada") {
          monthIncome += value;
        } else if (type === "saida") {
          monthExpense += value;
          categoryTotals[category] =
            (categoryTotals[category] || 0) + value;

          if (value > maxExpenseValue) {
            maxExpenseValue = value;
            maxExpenseLabel = `${category} (${formatMoney(value)})`;
          }
        }
      } else if (y === prevYear && m === prevMonth) {
        if (type === "entrada") {
          prevMonthIncome += value;
        } else if (type === "saida") {
          prevMonthExpense += value;
        }
      }
    }
  });

  const balance = totalIncome - totalExpense;

  incomeAmountEl.textContent = formatMoney(totalIncome);
  expenseAmountEl.textContent = formatMoney(totalExpense);
  balanceAmountEl.textContent = formatMoney(balance);

  // Atualiza resumo inteligente
  if (smartMonthLabelEl) {
    const mm = String(curMonth + 1).padStart(2, "0");
    smartMonthLabelEl.textContent = `Mês atual (${mm}/${curYear})`;

    const monthSaving = monthIncome - monthExpense;
    const prevSaving = prevMonthIncome - prevMonthExpense;

    smartMonthIncomeEl.textContent = formatMoney(monthIncome);
    smartMonthExpenseEl.textContent = formatMoney(monthExpense);
    smartMonthSavingEl.textContent = formatMoney(monthSaving);

    let changeText = "—";
    if (prevSaving !== 0) {
      const diff = monthSaving - prevSaving;
      const perc = (diff / Math.abs(prevSaving)) * 100;
      const sign = perc > 0 ? "+" : "";
      changeText = `${sign}${perc.toFixed(1)}%`;
    }
    smartMonthChangeEl.textContent = changeText;

    // Categoria com mais gastos
    let topCategory = "—";
    let topCategoryValue = 0;
    Object.keys(categoryTotals).forEach((cat) => {
      if (categoryTotals[cat] > topCategoryValue) {
        topCategoryValue = categoryTotals[cat];
        topCategory = `${cat} (${formatMoney(categoryTotals[cat])})`;
      }
    });

    smartTopCategoryEl.textContent = topCategory;
    smartTopExpenseEl.textContent = maxExpenseLabel || "—";
    smartTxCountEl.textContent = String(txCount);
  }
}

/* Formulário de nova transação */

transactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  transactionErrorEl.textContent = "";
  transactionSuccessEl.textContent = "";

  if (!currentUser) {
    transactionErrorEl.textContent = "Você precisa estar logado para salvar.";
    return;
  }

  const type = document.getElementById("type").value;
  const dateStr = dateInput.value;
  const category = document.getElementById("category").value.trim();
  const description = document.getElementById("description").value.trim();
  const valueStr = document.getElementById("value").value;

  if (!dateStr || !category || !valueStr) {
    transactionErrorEl.textContent = "Preencha data, categoria e valor.";
    return;
  }

  const value = parseFloat(valueStr.replace(",", ".")); // caso digite vírgula
  if (isNaN(value) || value <= 0) {
    transactionErrorEl.textContent = "Informe um valor válido maior que zero.";
    return;
  }

  // Converte data (YYYY-MM-DD) para Date
  const [yyyy, mm, dd] = dateStr.split("-");
  const jsDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));

  const submitBtn = transactionForm.querySelector("button[type='submit']");
  toggleLoading(submitBtn, true);

  try {
    const ref = getUserTransactionsRef();
    await ref.add({
      type,
      category,
      description,
      value,
      date: jsDate,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    transactionSuccessEl.textContent = "Transação salva com sucesso!";
    transactionForm.reset();
    // Recoloca data atual e tipo entrada como padrão
    document.getElementById("type").value = "entrada";
    const today = new Date();
    const yyyyNow = today.getFullYear();
    const mmNow = String(today.getMonth() + 1).padStart(2, "0");
    const ddNow = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyyNow}-${mmNow}-${ddNow}`;

    setTimeout(() => {
      transactionSuccessEl.textContent = "";
    }, 2500);
  } catch (error) {
    console.error("Erro ao salvar transação:", error);
    transactionErrorEl.textContent =
      "Não foi possível salvar. Tente novamente.";
  } finally {
    toggleLoading(submitBtn, false);
  }
});

/* Metas financeiras */

function clearGoalsUI() {
  if (!goalsListEl || !goalsEmptyEl) return;
  goalsListEl.innerHTML = "";
  goalsEmptyEl.classList.remove("hidden");
}

function subscribeToGoals() {
  if (!currentUser || !goalsListEl) return;
  const ref = getUserGoalsRef();

  if (unsubscribeGoals) {
    unsubscribeGoals();
  }

  unsubscribeGoals = ref
    .orderBy("createdAt", "asc")
    .onSnapshot(
      (snapshot) => {
        const docs = snapshot.docs;
        renderGoals(docs);
      },
      (error) => {
        console.error("Erro ao ouvir metas:", error);
      }
    );
}

function renderGoals(docs) {
  if (!goalsListEl || !goalsEmptyEl) return;

  goalsListEl.innerHTML = "";

  if (!docs || docs.length === 0) {
    goalsEmptyEl.classList.remove("hidden");
    return;
  }

  goalsEmptyEl.classList.add("hidden");

  docs.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;
    const name = data.name || "Meta sem nome";
    const targetValue = Number(data.targetValue) || 0;
    const currentValue = Number(data.currentValue) || 0;
    const deadline =
      data.deadline && data.deadline.toDate ? data.deadline.toDate() : null;

    const percent =
      targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;

    const goalItem = document.createElement("div");
    goalItem.classList.add("goal-item");
    if (percent >= 100) {
      goalItem.classList.add("completed");
    }

    const header = document.createElement("div");
    header.classList.add("goal-item-header");

    const nameEl = document.createElement("div");
    nameEl.classList.add("goal-name");
    nameEl.textContent = name;

    const deadlineEl = document.createElement("div");
    deadlineEl.classList.add("goal-deadline");
    deadlineEl.textContent = deadline
      ? `Até ${formatDate(deadline)}`
      : "Sem data limite";

    header.appendChild(nameEl);
    header.appendChild(deadlineEl);

    const progressText = document.createElement("div");
    progressText.classList.add("goal-progress-text");
    progressText.textContent = `${formatMoney(
      currentValue
    )} de ${formatMoney(targetValue)} (${percent.toFixed(1)}%)`;

    const bar = document.createElement("div");
    bar.classList.add("goal-progress-bar");

    const fill = document.createElement("div");
    fill.classList.add("goal-progress-fill");
    fill.style.width = `${percent}%`;
    bar.appendChild(fill);

    const footer = document.createElement("div");
    footer.classList.add("goal-meta-footer");

    const status = document.createElement("div");
    status.classList.add("goal-status");
    if (percent >= 100) {
      status.classList.add("completed");
      status.textContent = "Meta concluída 🎉";
    } else {
      status.textContent = "Em andamento";
    }

    const editBtn = document.createElement("button");
    editBtn.classList.add("goal-delete-btn");
    editBtn.textContent = "Editar";
    editBtn.dataset.editId = id;


    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("goal-delete-btn");
    deleteBtn.textContent = "Excluir";
    deleteBtn.dataset.id = id;

    footer.appendChild(status);
    footer.appendChild(editBtn);   // editar primeiro
    footer.appendChild(deleteBtn); // excluir depois



    goalItem.appendChild(header);
    goalItem.appendChild(progressText);
    goalItem.appendChild(bar);
    goalItem.appendChild(footer);

    goalsListEl.appendChild(goalItem);
  });
}

// Formulário de nova meta
if (goalForm) {
  goalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      goalErrorEl.textContent = "Você precisa estar logado para salvar.";
      return;
    }

    goalErrorEl.textContent = "";
    goalSuccessEl.textContent = "";

    const name = goalNameInput.value.trim();
    const targetStr = goalTargetInput.value;
    const currentStr = goalCurrentInput.value;
    const deadlineStr = goalDeadlineInput.value;

    if (!name || !targetStr) {
      goalErrorEl.textContent = "Preencha o nome da meta e o valor objetivo.";
      return;
    }

    const targetValue = parseFloat(targetStr.replace(",", "."));
    let currentValue = 0;
    if (currentStr) {
      currentValue = parseFloat(currentStr.replace(",", "."));
    }

    if (isNaN(targetValue) || targetValue <= 0) {
      goalErrorEl.textContent = "Informe um valor objetivo válido maior que zero.";
      return;
    }
    if (isNaN(currentValue) || currentValue < 0) {
      goalErrorEl.textContent = "Informe um valor atual válido.";
      return;
    }

    let deadlineDate = null;
    if (deadlineStr) {
      const [yyyy, mm, dd] = deadlineStr.split("-");
      deadlineDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }

    const submitBtn = goalForm.querySelector("button[type='submit']");
    toggleLoading(submitBtn, true);

    try {
      const ref = getUserGoalsRef();
      await ref.add({
        name,
        targetValue,
        currentValue,
        deadline: deadlineDate || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      goalSuccessEl.textContent = "Meta salva com sucesso!";
      goalForm.reset();

      setTimeout(() => {
        goalSuccessEl.textContent = "";
      }, 2500);
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      goalErrorEl.textContent =
        "Não foi possível salvar a meta. Tente novamente.";
    } finally {
      toggleLoading(submitBtn, false);
    }
  });
}

  // Delegação de eventos para EDITAR e EXCLUIR
goalsListEl.addEventListener("click", async (e) => {
  const target = e.target;

  // 👉 BOTÃO EDITAR
  if (target.dataset.editId) {
    const id = target.dataset.editId;
    editingGoalId = id;

    const ref = getUserGoalsRef().doc(id);
    const docSnap = await ref.get();
    const data = docSnap.data();

    editGoalName.value = data.name;
    editGoalTarget.value = data.targetValue;
    editGoalCurrent.value = data.currentValue;

    if (data.deadline && data.deadline.toDate) {
      const d = data.deadline.toDate();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      editGoalDeadline.value = `${yyyy}-${mm}-${dd}`;
    } else {
      editGoalDeadline.value = "";
    }

    modal.classList.remove("hidden");
    return;
  }

  // 👉 BOTÃO EXCLUIR
  if (target.dataset.id) {
    const id = target.dataset.id;
    const confirmar = confirm("Deseja realmente excluir esta meta?");

    if (confirmar) {
      await getUserGoalsRef().doc(id).delete();
    }
  }
});


// ===== EDIÇÃO DE METAS ===== //

const modal = document.getElementById("goal-edit-modal");
const editGoalName = document.getElementById("edit-goal-name");
const editGoalTarget = document.getElementById("edit-goal-target");
const editGoalCurrent = document.getElementById("edit-goal-current");
const editGoalDeadline = document.getElementById("edit-goal-deadline");
const editSaveBtn = document.getElementById("edit-goal-save");
const editCancelBtn = document.getElementById("edit-goal-cancel");

let editingGoalId = null;



// Fechar modal
editCancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Salvar meta editada
editSaveBtn.addEventListener("click", async () => {
  if (!editingGoalId) return;

  const name = editGoalName.value.trim();
  const targetValue = Number(editGoalTarget.value);
  const currentValue = Number(editGoalCurrent.value);
  const deadlineStr = editGoalDeadline.value;

  let deadlineDate = null;
  if (deadlineStr) {
    const [yyyy, mm, dd] = deadlineStr.split("-");
    deadlineDate = new Date(yyyy, mm - 1, dd);
  }

  await getUserGoalsRef().doc(editingGoalId).update({
    name,
    targetValue,
    currentValue,
    deadline: deadlineDate || null
  });

  modal.classList.add("hidden");
});

// ===== DARK MODE ===== //
const themeToggle = document.getElementById("theme-toggle");

function applyTheme() {
  const theme = localStorage.getItem("theme") || "light";
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙";
  }
}

themeToggle.addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("theme", next);
  applyTheme();
});

// Aplicar tema ao iniciar
applyTheme();
