'use strict';

/*
 * CycleCare database layer
 * Database: CycleCareDB
 * Object stores (similar to tables): cycles, symptoms, notifications
 *
 * This is a browser database (IndexedDB), so no PHP or MySQL is needed.
 * Run through localhost (for example, VS Code Live Server) for most reliable use.
 */

const DB_NAME = 'CycleCareDB';
const DB_VERSION = 1;
let db;

const $ = (id) => document.getElementById(id);

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function daysBetween(start, end) {
  const a = new Date(start + 'T12:00:00');
  const b = new Date(end + 'T12:00:00');
  return Math.floor((b - a) / 86400000);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function showMessage(elementId, message, isError = false) {
  const element = $(elementId);
  element.textContent = message;
  element.style.color = isError ? '#b62e55' : '#237650';
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support IndexedDB. Please use a recent version of Chrome, Edge, Firefox, or Safari.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains('cycles')) {
        const cycles = database.createObjectStore('cycles', {
          keyPath: 'id',
          autoIncrement: true
        });
        cycles.createIndex('startDate', 'startDate', { unique: false });
      }

      if (!database.objectStoreNames.contains('symptoms')) {
        const symptoms = database.createObjectStore('symptoms', {
          keyPath: 'id',
          autoIncrement: true
        });
        symptoms.createIndex('date', 'date', { unique: false });
        symptoms.createIndex('cycleId', 'cycleId', { unique: false });
      }

      if (!database.objectStoreNames.contains('notifications')) {
        const notifications = database.createObjectStore('notifications', {
          keyPath: 'id',
          autoIncrement: true
        });
        notifications.createIndex('scheduledDate', 'scheduledDate', { unique: false });
        notifications.createIndex('isRead', 'isRead', { unique: false });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      db.onversionchange = () => {
        db.close();
        alert('CycleCare database was updated. Please reload the page.');
      };
      resolve(db);
    };

    request.onerror = () => reject(request.error || new Error('Could not open the database.'));
    request.onblocked = () => reject(new Error('Database upgrade is blocked. Close other CycleCare tabs and reload.'));
  });
}

function dbRequest(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database is not connected yet.'));
      return;
    }
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let request;
    try {
      request = action(store);
    } catch (error) {
      reject(error);
      return;
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Database request failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Database transaction was aborted.'));
  });
}

function addRecord(storeName, record) {
  return dbRequest(storeName, 'readwrite', (store) => store.add(record));
}
function getAllRecords(storeName) {
  return dbRequest(storeName, 'readonly', (store) => store.getAll());
}
function deleteRecord(storeName, id) {
  return dbRequest(storeName, 'readwrite', (store) => store.delete(Number(id)));
}
function clearStore(storeName) {
  return dbRequest(storeName, 'readwrite', (store) => store.clear());
}

async function getCycles() {
  const records = await getAllRecords('cycles');
  return records.sort((a, b) => b.startDate.localeCompare(a.startDate) || b.id - a.id);
}
async function getSymptoms() {
  const records = await getAllRecords('symptoms');
  return records.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
async function latestCycle() {
  return (await getCycles())[0] || null;
}

async function renderDashboard() {
  const today = todayISO();
  $('todayLabel').textContent = new Date(today + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });

  const cycle = await latestCycle();
  if (!cycle) {
    $('cycleDay').textContent = 'No cycle logged';
    $('phaseName').textContent = 'Add your period start date';
    $('phaseDescription').textContent = 'Your estimated cycle phase will appear here after you save a period date.';
    $('nextPeriod').textContent = 'Not available yet';
    $('daysUntil').textContent = '';
    $('cycleProgress').style.width = '0%';
    $('lastStart').textContent = '—';
    $('usualCycle').textContent = '28 days';
    $('usualPeriod').textContent = '5 days';
    return;
  }

  const difference = daysBetween(cycle.startDate, today);
  const length = Number(cycle.cycleLength);
  const periodLength = Number(cycle.periodLength);

  $('lastStart').textContent = formatDate(cycle.startDate);
  $('usualCycle').textContent = length + ' days';
  $('usualPeriod').textContent = periodLength + ' days';

  if (difference < 0) {
    $('cycleDay').textContent = 'Date needs checking';
    $('phaseName').textContent = 'Saved date is in the future';
    $('phaseDescription').textContent = 'Please check the period start date in your history.';
    $('nextPeriod').textContent = 'Not available';
    $('daysUntil').textContent = '';
    $('cycleProgress').style.width = '0%';
    return;
  }

  const cycleDay = (difference % length) + 1;
  const daysUntil = length - (difference % length);
  const nextDate = new Date(cycle.startDate + 'T12:00:00');
  nextDate.setDate(nextDate.getDate() + Math.ceil((difference + 1) / length) * length);

  let phase, description;
  if (cycleDay <= periodLength) {
    phase = 'Menstruation';
    description = 'Your cycle day falls within your recorded usual period length. Actual bleeding days may vary.';
  } else if (cycleDay <= 13) {
    phase = 'Follicular phase';
    description = 'This is a calendar estimate for the time after the period begins and before estimated ovulation.';
  } else if (cycleDay <= 16) {
    phase = 'Estimated ovulation window';
    description = 'Ovulation timing varies. Calendar calculations cannot confirm that ovulation is occurring.';
  } else {
    phase = 'Luteal phase';
    description = 'This is the estimated later part of the cycle before the next period.';
  }

  $('cycleDay').textContent = 'Day ' + cycleDay + ' of ' + length;
  $('phaseName').textContent = phase;
  $('phaseDescription').textContent = description;
  $('nextPeriod').textContent = formatDate(
    nextDate.getFullYear() + '-' +
    String(nextDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(nextDate.getDate()).padStart(2, '0')
  );
  $('daysUntil').textContent = 'About ' + daysUntil + ' day(s) until the next estimated period';
  $('cycleProgress').style.width = Math.min(100, (cycleDay / length) * 100) + '%';
}

async function renderHistory() {
  const cycles = await getCycles();
  const symptoms = await getSymptoms();

  $('cycleHistory').innerHTML = cycles.map((cycle) => `
    <tr>
      <td>${escapeHTML(formatDate(cycle.startDate))}</td>
      <td>${escapeHTML(cycle.cycleLength)} days</td>
      <td>${escapeHTML(cycle.periodLength)} days</td>
      <td>${escapeHTML(cycle.notes || '—')}</td>
      <td><button type="button" data-delete-cycle="${Number(cycle.id)}">Delete</button></td>
    </tr>`).join('');

  $('symptomHistory').innerHTML = symptoms.map((item) => `
    <tr>
      <td>${escapeHTML(formatDate(item.date))}</td>
      <td>${escapeHTML(item.symptom)}</td>
      <td>${escapeHTML(item.notes || '—')}</td>
      <td><button type="button" data-delete-symptom="${Number(item.id)}">Delete</button></td>
    </tr>`).join('');

  $('emptyCycles').hidden = cycles.length > 0;
  $('emptySymptoms').hidden = symptoms.length > 0;
}

async function refresh() {
  await renderDashboard();
  await renderHistory();
}

$('cycleForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const startDate = $('startDate').value;
  const cycleLength = Number($('cycleLength').value);
  const periodLength = Number($('periodLength').value);
  const notes = $('cycleNotes').value.trim();

  if (!startDate || startDate > todayISO()) {
    showMessage('cycleMessage', 'Choose a valid date that is not in the future.', true);
    return;
  }
  if (!Number.isInteger(cycleLength) || cycleLength < 21 || cycleLength > 45 ||
      !Number.isInteger(periodLength) || periodLength < 2 || periodLength > 10) {
    showMessage('cycleMessage', 'Cycle length must be 21–45 days and period length 2–10 days.', true);
    return;
  }

  try {
    await addRecord('cycles', {
      startDate,
      cycleLength,
      periodLength,
      notes,
      createdAt: new Date().toISOString()
    });
    $('cycleForm').reset();
    $('startDate').value = todayISO();
    $('cycleLength').value = '28';
    $('periodLength').value = '5';
    showMessage('cycleMessage', 'Period date saved to the CycleCare database.');
    await refresh();
  } catch (error) {
    console.error(error);
    showMessage('cycleMessage', 'Could not save this record. Please reload and try again.', true);
  }
});

$('symptomForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const date = $('symptomDate').value;
  const symptom = $('symptom').value;
  const notes = $('symptomNotes').value.trim();

  if (!date || date > todayISO() || !symptom) {
    showMessage('symptomMessage', 'Choose a valid date and symptom.', true);
    return;
  }

  try {
    const cycle = await latestCycle();
    await addRecord('symptoms', {
      cycleId: cycle ? cycle.id : null,
      date,
      symptom,
      notes,
      createdAt: new Date().toISOString()
    });
    $('symptomForm').reset();
    $('symptomDate').value = todayISO();
    showMessage('symptomMessage', 'Symptom note saved to the CycleCare database.');
    await refresh();
  } catch (error) {
    console.error(error);
    showMessage('symptomMessage', 'Could not save this note. Please reload and try again.', true);
  }
});

$('history').addEventListener('click', async (event) => {
  const cycleId = event.target.dataset.deleteCycle;
  const symptomId = event.target.dataset.deleteSymptom;
  try {
    if (cycleId) await deleteRecord('cycles', cycleId);
    if (symptomId) await deleteRecord('symptoms', symptomId);
    await refresh();
  } catch (error) {
    console.error(error);
    alert('Could not delete the record. Please try again.');
  }
});

const dialog = $('confirmDialog');
let confirmAction = null;

$('clearDataButton').addEventListener('click', () => {
  confirmAction = async () => {
    await clearStore('cycles');
    await clearStore('symptoms');
    await clearStore('notifications');
    await refresh();
    showMessage('cycleMessage', 'All database records have been cleared.');
    showMessage('symptomMessage', 'All database records have been cleared.');
  };

  $('confirmText').textContent = 'Delete all period records, symptom notes, and reminders from this browser database? This cannot be undone.';
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else if (window.confirm($('confirmText').textContent)) {
    confirmAction().catch((error) => {
      console.error(error);
      alert('Could not clear the database.');
    });
    confirmAction = null;
  }
});

$('cancelConfirm').addEventListener('click', () => {
  confirmAction = null;
  dialog.close();
});

$('acceptConfirm').addEventListener('click', async () => {
  try {
    if (confirmAction) await confirmAction();
  } catch (error) {
    console.error(error);
    alert('Could not clear the database. Please try again.');
  } finally {
    confirmAction = null;
    dialog.close();
  }
});

$('menuButton').addEventListener('click', () => {
  const nav = $('mainNav');
  const isOpen = nav.classList.toggle('open');
  $('menuButton').setAttribute('aria-expanded', String(isOpen));
});

$('mainNav').addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    $('mainNav').classList.remove('open');
    $('menuButton').setAttribute('aria-expanded', 'false');
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link === event.target);
    });
  }
});

async function startApp() {
  $('startDate').max = todayISO();
  $('symptomDate').max = todayISO();
  $('startDate').value = todayISO();
  $('symptomDate').value = todayISO();

  try {
    await openDatabase();
    await refresh();
    console.info('Connected to IndexedDB database:', DB_NAME);
  } catch (error) {
    console.error('Database connection error:', error);
    const message = document.createElement('p');
    message.className = 'database-error';
    message.setAttribute('role', 'alert');
    message.textContent = 'Could not connect to the browser database. Try opening this project with VS Code Live Server or another localhost web server, then reload.';
    document.querySelector('main').prepend(message);
  }
}

startApp();
