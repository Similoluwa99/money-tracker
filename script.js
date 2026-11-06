// Money Tracker - script.js

const STORAGE_KEY = 'money_tracker_spends';

// State
let spends = [];
let editingId = null;
let pendingDeleteId = null;

// DOM Elements
const spendForm = document.getElementById('spendForm');
const spendIdInput = document.getElementById('spendId');
const spendTitleInput = document.getElementById('spendTitle');
const spendAmountInput = document.getElementById('spendAmount');
const spendDateInput = document.getElementById('spendDate');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');
const formCard = document.querySelector('.form-card');

const spendsList = document.getElementById('spendsList');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const noResultsState = document.getElementById('noResultsState');
const totalCountEl = document.getElementById('totalCount');
const totalAmountEl = document.getElementById('totalAmount');

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
      spends = Array.isArray(parsed) ? parsed : [];
    } else {
      spends = [];
    }
  } catch (error) {
    console.error('Failed to parse spends from localStorage:', error);
    spends = [];
  }
}

// Save data to localStorage
function saveSpends() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spends));
  } catch (error) {
    console.error('Failed to save spends to localStorage:', error);
  }
}

// Set up UI Event Listeners
function setupEventListeners() {
  // Form submission
  spendForm.addEventListener('submit', handleFormSubmit);

  // Cancel edit
  cancelEditBtn.addEventListener('click', cancelEditing);

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

// Handle Form Submission (Add or Update)
function handleFormSubmit(event) {
  event.preventDefault();

  const title = spendTitleInput.value.trim();
  const amount = parseFloat(spendAmountInput.value);
  const date = spendDateInput.value;

  if (!title || isNaN(amount) || amount <= 0 || !date) {
    alert('Please fill out all fields with valid information.');
    return;
  }

  if (editingId) {
    // Update existing spend
    spends = spends.map((item) => {
      if (item.id === editingId) {
        return {
          ...item,
          title,
          amount,
          date,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    cancelEditing();
  } else {
    // Add new spend
    const newSpend = {
      id: 'spend_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title,
      amount,
      date,
      createdAt: new Date().toISOString()
    };
    spends.unshift(newSpend); // Add to top
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
  submitBtn.textContent = 'Add Spend';
  cancelEditBtn.style.display = 'none';
  formTitle.textContent = 'Add New Spend';
  formCard.classList.remove('is-editing');
}

// Start editing a spend
function startEditing(id) {
  const item = spends.find((s) => s.id === id);
  if (!item) return;

  editingId = id;
  spendIdInput.value = item.id;
  spendTitleInput.value = item.title;
  spendAmountInput.value = item.amount;
  spendDateInput.value = item.date;

  submitBtn.textContent = 'Update Spend';
  cancelEditBtn.style.display = 'inline-flex';
  formTitle.textContent = 'Edit Spend';
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
  modalMessage.textContent = `Are you sure you want to delete "${item.title}"? This action cannot be undone.`;
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

// Format currency
function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
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
  // Update Top Stats
  const totalCount = spends.length;
  const totalAmount = spends.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  totalCountEl.textContent = totalCount;
  totalAmountEl.textContent = formatCurrency(totalAmount);

  // Filter based on search query
  const query = searchInput.value.trim().toLowerCase();
  const filteredSpends = spends.filter((item) => {
    if (!query) return true;
    const matchesTitle = item.title.toLowerCase().includes(query);
    const matchesDate = item.date.includes(query) || formatDate(item.date).toLowerCase().includes(query);
    const matchesAmount = item.amount.toString().includes(query);
    return matchesTitle || matchesDate || matchesAmount;
  });

  // Handle Empty States
  if (spends.length === 0) {
    spendsList.innerHTML = '';
    emptyState.style.display = 'flex';
    noResultsState.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';

  if (filteredSpends.length === 0) {
    spendsList.innerHTML = '';
    noResultsState.style.display = 'flex';
    return;
  }

  noResultsState.style.display = 'none';

  // Render list items safely using DOM elements
  spendsList.innerHTML = '';
  filteredSpends.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'spend-item';
    li.dataset.id = item.id;

    // Info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'spend-info';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'spend-title';
    titleSpan.textContent = item.title;

    const dateSpan = document.createElement('span');
    dateSpan.className = 'spend-date';
    dateSpan.textContent = formatDate(item.date);

    infoDiv.appendChild(titleSpan);
    infoDiv.appendChild(dateSpan);

    // Meta section (amount + actions)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'spend-meta';

    const amountSpan = document.createElement('span');
    amountSpan.className = 'spend-amount';
    amountSpan.textContent = formatCurrency(item.amount);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'spend-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-icon';
    editBtn.title = 'Edit spend';
    editBtn.setAttribute('aria-label', `Edit spend ${item.title}`);
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => startEditing(item.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-icon btn-delete';
    deleteBtn.title = 'Delete spend';
    deleteBtn.setAttribute('aria-label', `Delete spend ${item.title}`);
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
