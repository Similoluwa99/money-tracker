// Money Tracker - script.js

const STORAGE_KEY = 'money_tracker_spends';

// State
let spends = [];
let editingId = null;
let pendingDeleteId = null;
let currentFormType = 'expense'; // 'expense' or 'income'
let currentFilter = 'all'; // 'all', 'expense', or 'income'

// DOM Elements
const spendForm = document.getElementById('spendForm');
const spendIdInput = document.getElementById('spendId');
const transactionTypeInput = document.getElementById('transactionType');
const spendTitleInput = document.getElementById('spendTitle');
const titleLabel = document.getElementById('titleLabel');
const spendAmountInput = document.getElementById('spendAmount');
const spendDateInput = document.getElementById('spendDate');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');
const formCard = document.querySelector('.form-card');
const typeExpenseBtn = document.getElementById('typeExpenseBtn');
const typeIncomeBtn = document.getElementById('typeIncomeBtn');

const spendsList = document.getElementById('spendsList');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const emptyTitle = document.getElementById('emptyTitle');
const emptyMessage = document.getElementById('emptyMessage');
const noResultsState = document.getElementById('noResultsState');
const listHeading = document.getElementById('listHeading');
const filterTabBtns = document.querySelectorAll('.tab-btn');

// Stat Elements
const netBalanceEl = document.getElementById('netBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalAmountEl = document.getElementById('totalAmount');
const totalCountEl = document.getElementById('totalCount');

// Modal Elements
const deleteModal = document.getElementById('deleteModal');
const modalMessage = document.getElementById('modalMessage');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Initialize app
function init() {
  loadSpends();
  setDefaultDate();
  setupEventListeners();
  setFormType('expense');
  render();
}

// Set today's date as default in the date picker
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  spendDateInput.value = today;
}

// Load data from localStorage
function loadSpends() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      spends = Array.isArray(parsed) ? parsed.map(item => ({
        ...item,
        type: item.type || 'expense' // backward compatibility
      })) : [];
    } else {
      spends = [];
    }
  } catch (error) {
    console.error('Failed to parse data from localStorage:', error);
    spends = [];
  }
}

// Save data to localStorage
function saveSpends() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spends));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
}

// Set Form Type (Expense or Income)
function setFormType(type) {
  currentFormType = type;
  transactionTypeInput.value = type;

  if (type === 'income') {
    typeIncomeBtn.classList.add('active');
    typeExpenseBtn.classList.remove('active');
    titleLabel.textContent = 'Income source / description';
    spendTitleInput.placeholder = 'e.g., Salary, Client payment, Bonus, Gift';
    formTitle.textContent = editingId ? 'Edit Income' : 'Add New Income';
    submitBtn.textContent = editingId ? 'Update Income' : 'Add Income';
    submitBtn.className = 'btn btn-success';
  } else {
    typeExpenseBtn.classList.add('active');
    typeIncomeBtn.classList.remove('active');
    titleLabel.textContent = 'What did you spend on?';
    spendTitleInput.placeholder = 'e.g., Groceries, Fuel, Data subscription';
    formTitle.textContent = editingId ? 'Edit Spend' : 'Add New Spend';
    submitBtn.textContent = editingId ? 'Update Spend' : 'Add Spend';
    submitBtn.className = 'btn btn-primary';
  }
}

// Set up UI Event Listeners
function setupEventListeners() {
  // Form submission
  spendForm.addEventListener('submit', handleFormSubmit);

  // Cancel edit
  cancelEditBtn.addEventListener('click', cancelEditing);

  // Type Toggle Buttons
  typeExpenseBtn.addEventListener('click', () => setFormType('expense'));
  typeIncomeBtn.addEventListener('click', () => setFormType('income'));

  // Filter Tabs
  filterTabBtns.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabBtns.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      updateListHeading();
      render();
    });
  });

  // Search input filter
  searchInput.addEventListener('input', () => {
    render();
  });

  // Modal Cancel Button
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Modal Confirm Delete Button
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Close modal when clicking outside dialog (on overlay backdrop)
  deleteModal.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  });

  // Close modal on Escape key press
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && deleteModal.style.display !== 'none') {
      closeDeleteModal();
    }
  });
}

function updateListHeading() {
  if (currentFilter === 'expense') {
    listHeading.textContent = 'Spendings';
  } else if (currentFilter === 'income') {
    listHeading.textContent = 'Income Records';
  } else {
    listHeading.textContent = 'All Transactions';
  }
}

// Handle Form Submission (Add or Update)
function handleFormSubmit(event) {
  event.preventDefault();

  const title = spendTitleInput.value.trim();
  const amount = parseFloat(spendAmountInput.value);
  const date = spendDateInput.value;
  const type = transactionTypeInput.value || 'expense';

  if (!title || isNaN(amount) || amount <= 0 || !date) {
    alert('Please fill out all fields with valid information.');
    return;
  }

  if (editingId) {
    // Update existing transaction
    spends = spends.map((item) => {
      if (item.id === editingId) {
        return {
          ...item,
          title,
          amount,
          date,
          type,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    cancelEditing();
  } else {
    // Add new transaction
    const newTransaction = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title,
      amount,
      date,
      type,
      createdAt: new Date().toISOString()
    };
    spends.unshift(newTransaction); // Add to top
    resetForm();
  }

  saveSpends();
  render();
}

// Reset form to default add state
function resetForm() {
  spendForm.reset();
  spendIdInput.value = '';
  editingId = null;
  setDefaultDate();
  setFormType(currentFormType);
  cancelEditBtn.style.display = 'none';
  formCard.classList.remove('is-editing');
}

// Start editing an item
function startEditing(id) {
  const item = spends.find((s) => s.id === id);
  if (!item) return;

  editingId = id;
  spendIdInput.value = item.id;
  spendTitleInput.value = item.title;
  spendAmountInput.value = item.amount;
  spendDateInput.value = item.date;

  setFormType(item.type || 'expense');
  cancelEditBtn.style.display = 'inline-flex';
  formCard.classList.add('is-editing');

  // Scroll to form smoothly
  formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  spendTitleInput.focus();
}

// Cancel edit mode
function cancelEditing() {
  resetForm();
}

// Open custom confirmation modal for deletion
function openDeleteModal(id) {
  const item = spends.find((s) => s.id === id);
  if (!item) return;

  pendingDeleteId = id;
  const itemCategory = item.type === 'income' ? 'income record' : 'spend';
  modalMessage.textContent = `Are you sure you want to delete this ${itemCategory}: "${item.title}"? This action cannot be undone.`;
  deleteModal.style.display = 'flex';
  confirmDeleteBtn.focus();
}

// Close confirmation modal
function closeDeleteModal() {
  deleteModal.style.display = 'none';
  pendingDeleteId = null;
}

// Handle confirmed deletion from modal
function handleConfirmDelete() {
  if (!pendingDeleteId) return;

  const idToDelete = pendingDeleteId;

  // If currently editing the deleted item, reset the form
  if (editingId === idToDelete) {
    cancelEditing();
  }

  spends = spends.filter((s) => s.id !== idToDelete);
  saveSpends();
  render();
  closeDeleteModal();
}

// Format currency as Naira (₦)
function formatCurrency(num) {
  const val = Math.abs(Number(num) || 0);
  return '₦' + val.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format date nicely (e.g. Nov 6, 2026)
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Render UI
function render() {
  // Compute Stats
  const totalIncome = spends
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalExpenses = spends
    .filter(item => (item.type || 'expense') === 'expense')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const netBalance = totalIncome - totalExpenses;
  const totalSpendsCount = spends.filter(item => (item.type || 'expense') === 'expense').length;

  // Update Stats UI
  netBalanceEl.textContent = (netBalance < 0 ? '-' : '') + formatCurrency(netBalance);
  if (netBalance > 0) {
    netBalanceEl.className = 'stat-value text-success';
  } else if (netBalance < 0) {
    netBalanceEl.className = 'stat-value text-danger';
  } else {
    netBalanceEl.className = 'stat-value';
  }

  totalIncomeEl.textContent = '+' + formatCurrency(totalIncome);
  totalAmountEl.textContent = '-' + formatCurrency(totalExpenses);
  totalCountEl.textContent = totalSpendsCount;

  // Filter based on search query and tab filter
  const query = searchInput.value.trim().toLowerCase();
  const filteredList = spends.filter((item) => {
    // Type tab filter
    const itemType = item.type || 'expense';
    if (currentFilter !== 'all' && itemType !== currentFilter) {
      return false;
    }

    // Search query filter
    if (!query) return true;
    const matchesTitle = item.title.toLowerCase().includes(query);
    const matchesDate = item.date.includes(query) || formatDate(item.date).toLowerCase().includes(query);
    const matchesAmount = item.amount.toString().includes(query);
    return matchesTitle || matchesDate || matchesAmount;
  });

  // Handle Empty States
  const totalInCurrentFilter = spends.filter(item => currentFilter === 'all' || (item.type || 'expense') === currentFilter).length;

  if (totalInCurrentFilter === 0) {
    spendsList.innerHTML = '';
    emptyState.style.display = 'flex';
    noResultsState.style.display = 'none';

    if (currentFilter === 'income') {
      emptyTitle.textContent = 'No income recorded yet';
      emptyMessage.textContent = 'Track your earnings by switching to Income and adding one above!';
    } else if (currentFilter === 'expense') {
      emptyTitle.textContent = 'No spendings recorded yet';
      emptyMessage.textContent = 'Start tracking your expenses by adding your first spend above!';
    } else {
      emptyTitle.textContent = 'No transactions recorded yet';
      emptyMessage.textContent = 'Start tracking by adding your first spend or income above!';
    }
    return;
  }

  emptyState.style.display = 'none';

  if (filteredList.length === 0) {
    spendsList.innerHTML = '';
    noResultsState.style.display = 'flex';
    return;
  }

  noResultsState.style.display = 'none';

  // Render list items safely using DOM elements
  spendsList.innerHTML = '';
  filteredList.forEach((item) => {
    const isIncome = item.type === 'income';
    const li = document.createElement('li');
    li.className = `spend-item ${isIncome ? 'item-income' : 'item-expense'}`;
    li.dataset.id = item.id;

    // Info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'spend-info';

    const titleRow = document.createElement('div');
    titleRow.className = 'spend-title-row';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'spend-title';
    titleSpan.textContent = item.title;

    const badgeSpan = document.createElement('span');
    badgeSpan.className = `type-badge ${isIncome ? 'badge-income' : 'badge-expense'}`;
    badgeSpan.textContent = isIncome ? 'Income' : 'Spend';

    titleRow.appendChild(titleSpan);
    titleRow.appendChild(badgeSpan);

    const dateSpan = document.createElement('span');
    dateSpan.className = 'spend-date';
    dateSpan.textContent = formatDate(item.date);

    infoDiv.appendChild(titleRow);
    infoDiv.appendChild(dateSpan);

    // Meta section (amount + actions)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'spend-meta';

    const amountSpan = document.createElement('span');
    amountSpan.className = `spend-amount ${isIncome ? 'is-income' : 'is-expense'}`;
    amountSpan.textContent = (isIncome ? '+' : '-') + formatCurrency(item.amount);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'spend-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-icon';
    editBtn.title = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${item.title}`);
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => startEditing(item.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-icon btn-delete';
    deleteBtn.title = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete ${item.title}`);
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', () => openDeleteModal(item.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    metaDiv.appendChild(amountSpan);
    metaDiv.appendChild(actionsDiv);

    li.appendChild(infoDiv);
    li.appendChild(metaDiv);

    spendsList.appendChild(li);
  });
}

// Run on page load immediately or when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
