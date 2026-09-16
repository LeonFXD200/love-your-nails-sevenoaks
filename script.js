const booking = { service: '', duration: '', date: '', dateLabel: '', time: '' };
const storageKey = 'love-your-nails-demo-bookings';

const hours = [
  'Closed today',
  '9:30 — 18:30',
  '9:30 — 18:30',
  '9:30 — 18:30',
  '9:30 — 19:00',
  '9:30 — 19:00',
  '9:00 — 18:00'
];

document.getElementById('today-hours').textContent = hours[new Date().getDay()];
document.getElementById('year').textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

function selectService(value, duration) {
  booking.service = value;
  booking.duration = duration;
  document.querySelectorAll('.service-options button').forEach((button) => {
    const selected = button.dataset.value === value;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-checked', String(selected));
  });
  document.getElementById('service-error').textContent = '';
}

document.querySelectorAll('.service-options button').forEach((button) => {
  button.addEventListener('click', () => selectService(button.dataset.value, button.dataset.duration));
});

document.querySelectorAll('.service-link').forEach((button) => {
  button.addEventListener('click', () => {
    const match = document.querySelector(`.service-options button[data-value="${button.dataset.service}"]`);
    selectService(match.dataset.value, match.dataset.duration);
    document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
  });
});

function upcomingOpenDays() {
  const days = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (days.length < 5) {
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function renderDates() {
  const strip = document.getElementById('date-strip');
  strip.innerHTML = '';
  upcomingOpenDays().forEach((date, index) => {
    const iso = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = iso;
    button.setAttribute('aria-label', label);
    button.innerHTML = `<span>${date.toLocaleDateString('en-GB', { weekday: 'short' })}</span><b>${date.getDate()}</b><span>${date.toLocaleDateString('en-GB', { month: 'short' })}</span>`;
    button.addEventListener('click', () => {
      booking.date = iso;
      booking.dateLabel = label;
      booking.time = '';
      strip.querySelectorAll('button').forEach((item) => item.classList.toggle('selected', item === button));
      renderTimes(date);
      document.getElementById('time-error').textContent = '';
    });
    strip.appendChild(button);
    if (index === 0) button.click();
  });
}

function getBookings() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || []; }
  catch { return []; }
}

function renderTimes(date) {
  const grid = document.getElementById('time-grid');
  const late = date.getDay() === 4 || date.getDay() === 5;
  const times = ['09:30', '10:45', '12:00', '13:30', '15:00', '16:30'];
  if (late) times.push('17:45');
  const reserved = getBookings().filter((item) => item.date === booking.date).map((item) => item.time);
  grid.innerHTML = '';
  times.forEach((time) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = time;
    button.dataset.value = time;
    if (reserved.includes(time)) {
      button.disabled = true;
      button.textContent += ' · held';
    }
    button.setAttribute('aria-checked', 'false');
    button.addEventListener('click', () => {
      booking.time = time;
      grid.querySelectorAll('button').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-checked', String(selected));
      });
      document.getElementById('time-error').textContent = '';
    });
    grid.appendChild(button);
  });
}

function showStep(step) {
  document.querySelectorAll('.booking-step').forEach((panel) => panel.classList.toggle('active', Number(panel.dataset.step) === step));
  document.querySelectorAll('[data-progress]').forEach((indicator) => {
    const value = Number(indicator.dataset.progress);
    indicator.classList.toggle('active', value === step);
    indicator.classList.toggle('complete', value < step);
    indicator.textContent = value < step ? '✓' : String(value);
  });
  if (step === 2 && !document.getElementById('date-strip').children.length) renderDates();
  if (step === 3) {
    document.getElementById('appointment-summary').innerHTML = `<div><strong>${booking.service}</strong><span>${booking.dateLabel} at ${booking.time} · approx. ${booking.duration} min</span></div><button type="button" id="edit-time">Edit</button>`;
    document.getElementById('edit-time').addEventListener('click', () => showStep(2));
  }
  document.querySelector('.booking-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => {
  const next = Number(button.dataset.next);
  if (next === 2 && !booking.service) {
    document.getElementById('service-error').textContent = 'Choose a treatment to continue.';
    return;
  }
  if (next === 3 && (!booking.date || !booking.time)) {
    document.getElementById('time-error').textContent = 'Choose an available time to continue.';
    return;
  }
  showStep(next);
}));

document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.back))));

const form = document.getElementById('booking-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    document.getElementById('details-error').textContent = 'Complete the required details above.';
    return;
  }
  const data = new FormData(form);
  const reference = `LYN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const request = {
    ...booking,
    name: data.get('name').trim(),
    phone: data.get('phone').trim(),
    notes: data.get('notes').trim(),
    reference,
    createdAt: new Date().toISOString()
  };
  const bookings = getBookings();
  bookings.push(request);
  localStorage.setItem(storageKey, JSON.stringify(bookings));
  document.querySelectorAll('.booking-step, .booking-progress').forEach((item) => item.style.display = 'none');
  document.getElementById('success-copy').textContent = `${request.name}, your ${request.service.toLowerCase()} request is ready for ${request.dateLabel} at ${request.time}.`;
  document.getElementById('success-reference').textContent = `Demo reference · ${reference}`;
  document.getElementById('booking-success').classList.add('active');
});

document.getElementById('another-booking').addEventListener('click', () => {
  booking.service = ''; booking.duration = ''; booking.date = ''; booking.dateLabel = ''; booking.time = '';
  form.reset();
  document.querySelectorAll('.service-options button').forEach((button) => { button.classList.remove('selected'); button.setAttribute('aria-checked', 'false'); });
  document.getElementById('date-strip').innerHTML = '';
  document.getElementById('booking-success').classList.remove('active');
  document.querySelector('.booking-progress').style.display = 'grid';
  document.querySelectorAll('.booking-step').forEach((item) => item.style.display = '');
  showStep(1);
});

const staffDialog = document.getElementById('staff-dialog');
function renderStaffView() {
  const bookings = getBookings().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  document.getElementById('request-count').textContent = bookings.length;
  document.getElementById('seat-count').textContent = bookings.length;
  const list = document.getElementById('staff-bookings');
  if (!bookings.length) {
    list.innerHTML = '<p class="empty-bookings">No demo requests yet. Complete the booking flow to see one here.</p>';
  } else {
    list.innerHTML = bookings.map((item) => `<div class="staff-booking"><time>${escapeHtml(item.time)}<span>${escapeHtml(item.dateLabel)}</span></time><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.service)} · ${escapeHtml(item.phone)}</span>${item.notes ? `<span>“${escapeHtml(item.notes)}”</span>` : ''}</div><b>To confirm</b></div>`).join('');
  }
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function openStaffView() { renderStaffView(); staffDialog.showModal(); }
document.getElementById('open-staff-view').addEventListener('click', openStaffView);
document.getElementById('footer-staff-view').addEventListener('click', openStaffView);
document.getElementById('close-staff-view').addEventListener('click', () => staffDialog.close());
staffDialog.addEventListener('click', (event) => { if (event.target === staffDialog) staffDialog.close(); });
