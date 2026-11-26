/* =====================================================================
   Student Violation page

   There is no backend yet, so the page starts empty. Records you log
   and registrations you approve are kept in the browser only and are
   lost when the page is refreshed.

   To connect a database later, change ONLY the four functions in
   section 2 (loadData, saveRecord, approvePending, rejectPending).
   The rest of the page keeps working as it is.
   ===================================================================== */


/* =====================================================================
   1. DATA  (these fill up when you connect a backend)
   ===================================================================== */
var adminName = '';   // for example 'Ms. Reyes'; leave empty to hide "Signed in as"

// One dormer looks like:
// { id, first_name, middle_name, last_name, year, room: '3-5',
//   records: [ { type: 'violation' | 'absence', category: 'major' | 'minor' | 'curfew' | 'cleanup' | 'payment', date: '2026-11-26', note } ] }
var dormers = [];

// One pending registration looks like:
// { id, full_name (or first_name/middle_name/last_name), email, age, gender, address, year, created_at, slip }
var pending = [];


/* =====================================================================
   2. BACKEND HOOKS  (REPLACE the bodies with fetch() calls to your PHP)
   ===================================================================== */
// Load dormers and pending registrations into the two lists above.
function loadData() {
  return Promise.resolve();
}

// Save one conduct record for a dormer.
function saveRecord(dormerId, record) {
  var d = findById(dormers, dormerId);
  if (!d) return Promise.resolve({ success: false, message: 'Dormer not found.' });
  d.records = (d.records || []).concat([record]);
  return Promise.resolve({ success: true });
}

// Approve a pending registration. room may be empty.
function approvePending(id, room) {
  var i = indexOfId(pending, id);
  if (i === -1) return Promise.resolve({ success: false, message: 'Registration not found.' });
  var p = pending.splice(i, 1)[0];
  p.room = room;
  p.records = [];
  dormers.push(p);
  return Promise.resolve({ success: true });
}

// Reject a pending registration.
function rejectPending(id) {
  var i = indexOfId(pending, id);
  if (i !== -1) pending.splice(i, 1);
  return Promise.resolve({ success: true });
}


/* =====================================================================
   3. HELPERS  (KEEP)
   ===================================================================== */
function $(id) { return document.getElementById(id); }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function indexOfId(list, id) { return list.findIndex(function (x) { return String(x.id) === String(id); }); }
function findById(list, id) { return list[indexOfId(list, id)]; }
function recs(d) { return d.records || []; }

function fullName(s) {
  if (s.full_name) return s.full_name;
  var mid = s.middle_name ? s.middle_name.trim().charAt(0).toUpperCase() + '.' : '';
  return [s.first_name, mid, s.last_name].filter(Boolean).join(' ');
}

// "3-5" -> Floor 3 · Room 5
function roomLabel(room) {
  var m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(room || '');
  return m ? 'Floor ' + m[1] + ' \u00b7 Room ' + m[2] : (room || '');
}

// Returns "3-5" for good input, "" for empty, or null when the format is wrong
function cleanRoom(value) {
  var v = (value || '').trim();
  if (!v) return '';
  var m = /^(\d+)\s*-\s*(\d+)$/.exec(v);
  return m ? m[1] + '-' + m[2] : null;
}

function safeUrl(u) { return u && !/^\s*(javascript|data|vbscript):/i.test(u) ? u : ''; }
function detail(label, value) { return value ? '<dt>' + label + '</dt><dd>' + esc(value) + '</dd>' : ''; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function todayISO() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtDate(iso) {
  var d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? esc(iso) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


/* =====================================================================
   4. DRAWING THE PAGE  (KEEP)
   ===================================================================== */
var filter = 'all';
var selectedId = null;

function matches(d, q) {
  if (!q) return true;
  var h = [fullName(d), d.id, d.room].join(' ').toLowerCase(), ql = q.toLowerCase();
  return h.indexOf(ql) !== -1 || h.replace(/\s/g, '').indexOf(ql.replace(/\s/g, '')) !== -1;
}

function passesFilter(d) {
  var r = recs(d);
  if (filter === 'all') return true;
  if (filter === 'records') return r.length > 0;
  if (filter === 'absence') return r.some(function (x) { return x.type === 'absence'; });
  return r.some(function (x) { return x.type === 'violation' && x.category === filter; });
}

function badgesFor(d) {
  var r = recs(d);
  var major = r.filter(function (x) { return x.type === 'violation' && x.category === 'major'; }).length;
  var other = r.filter(function (x) { return x.type === 'violation' && x.category !== 'major'; }).length;
  var abs = r.filter(function (x) { return x.type === 'absence'; }).length;
  if (!major && !other && !abs) return '<span class="badge ok">Clear</span>';
  return '<div class="badges">' +
    (major ? '<span class="badge major">' + major + ' Major</span>' : '') +
    (other ? '<span class="badge other">' + other + ' Other</span>' : '') +
    (abs ? '<span class="badge absence">' + abs + ' Absence' + (abs > 1 ? 's' : '') + '</span>' : '') + '</div>';
}

function renderDormers() {
  var list = dormers.filter(function (d) { return passesFilter(d) && matches(d, $('dormerSearch').value); });
  $('dormerShowing').textContent = 'Showing ' + list.length + ' of ' + dormers.length + ' dormers';
  var emptyMsg = dormers.length ? 'No dormers match your search.' : 'No dormers yet. Approved students will appear here.';
  $('dormerTable').innerHTML = list.length ? list.map(function (d) {
    return '<tr><td class="strong">' + esc(fullName(d)) + '</td>' +
      '<td>' + esc(d.id) + '</td>' +
      '<td>' + (d.year ? esc(d.year) : '<span class="muted">Not set</span>') + '</td>' +
      '<td>' + (d.room ? esc(roomLabel(d.room)) : '<span class="tag">None</span>') + '</td>' +
      '<td>' + badgesFor(d) + '</td>' +
      '<td class="right"><button class="btn sm" type="button" data-action="log" data-id="' + esc(d.id) + '">Log</button></td></tr>';
  }).join('') : '<tr><td class="empty" colspan="6">' + emptyMsg + '</td></tr>';
}

function renderPending() {
  $('pendingList').innerHTML = pending.length ? pending.map(function (p) {
    var when = [p.created_at, p.year].filter(Boolean).map(esc).join('<i></i>');
    var slip = safeUrl(p.slip);
    return '<article class="pcard">' +
      '<div class="pcard-top"><h4>' + esc(fullName(p)) + '</h4><span class="status">PENDING</span></div>' +
      (when ? '<div class="when">' + when + '</div>' : '') +
      '<dl>' + detail('ID', p.id) + detail('Email', p.email) +
      detail('Age', [p.age, p.gender].filter(Boolean).join(' \u00b7 ')) + detail('Home', p.address) +
      '<dt>Slip</dt><dd>' + (slip ? '<a href="' + esc(slip) + '" target="_blank" rel="noopener">View slip</a>' : 'Not uploaded') + '</dd></dl>' +
      '<label class="lbl" for="room-' + esc(p.id) + '">Room (optional)</label>' +
      '<div class="room-row"><input class="field" id="room-' + esc(p.id) + '" placeholder="e.g. 3-5" autocomplete="off">' +
      '<button class="btn primary sm" type="button" data-action="approve" data-id="' + esc(p.id) + '">Approve</button></div>' +
      '<button class="btn sm" type="button" data-action="reject" data-id="' + esc(p.id) + '">Reject</button>' +
      '</article>';
  }).join('') : '<div class="pers-empty">No registrations waiting for approval.</div>';
}

function renderAll() {
  renderDormers();
  renderPending();
  $('heroDormers').textContent = dormers.length;
  $('heroPending').textContent = pending.length;
  $('pendingCount').textContent = pending.length;
  $('adminName').textContent = adminName;
  $('signedIn').hidden = !adminName;
}

function refresh() { return loadData().then(renderAll); }


/* =====================================================================
   5. LOG DIALOG  (KEEP)
   ===================================================================== */
function recordLabel(r) { return r.type === 'absence' ? 'Absence' : cap(r.category || 'other') + ' violation'; }

function renderHistory() {
  var d = findById(dormers, selectedId);
  var list = d ? recs(d).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }) : [];
  $('logHistory').innerHTML = list.length ? list.map(function (r) {
    return '<li><div class="h-top"><b>' + esc(recordLabel(r)) + '</b><span>' + fmtDate(r.date) + '</span></div>' +
           (r.note ? '<p>' + esc(r.note) + '</p>' : '') + '</li>';
  }).join('') : '<li class="muted">No records yet.</li>';
}

function syncTypeFields() {
  var isViolation = $('logType').value === 'violation';
  $('catWrap').hidden = !isViolation;
  $('logNote').required = isViolation;
  $('logNoteLabel').textContent = isViolation ? 'What happened' : 'Reason (optional)';
}

function openLog(id) {
  var d = findById(dormers, id);
  if (!d) return;
  selectedId = id;
  $('logSub').textContent = fullName(d) + (d.room ? ' \u00b7 ' + roomLabel(d.room) : '');
  $('logType').value = 'violation';
  $('logCategory').value = 'major';
  $('logDate').value = todayISO();
  $('logNote').value = '';
  syncTypeFields();
  renderHistory();
  $('logModal').showModal();
}

$('logType').addEventListener('change', syncTypeFields);
$('logCloseBtn').addEventListener('click', function () { $('logModal').close(); });

$('logForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var isViolation = $('logType').value === 'violation';
  var record = {
    type: $('logType').value,
    category: isViolation ? $('logCategory').value : '',
    date: $('logDate').value,
    note: $('logNote').value.trim()
  };
  saveRecord(selectedId, record).then(function (res) {
    if (!res.success) { alert(res.message || 'Could not save the record.'); return; }
    $('logNote').value = '';
    renderAll();
    renderHistory();
  }).catch(function (err) {
    console.error(err);
    alert('Something went wrong. Please try again.');
  });
});


/* =====================================================================
   6. BUTTONS, SEARCH AND FILTERS  (KEEP)
   ===================================================================== */
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var id = btn.dataset.id, action = btn.dataset.action;

  if (action === 'log') openLog(id);

  if (action === 'approve') {
    var room = cleanRoom($('room-' + id).value);
    if (room === null) { alert('Enter the room as floor-room, for example 3-5.'); return; }
    approvePending(id, room).then(function (res) {
      if (res.success) renderAll(); else alert(res.message || 'Could not approve.');
    });
  }

  if (action === 'reject') {
    if (!confirm('Reject this registration? This removes it from the pending list.')) return;
    rejectPending(id).then(function (res) {
      if (res.success) renderAll(); else alert(res.message || 'Could not reject.');
    });
  }
});

$('dormerSearch').addEventListener('input', renderDormers);

$('chips').addEventListener('click', function (e) {
  var chip = e.target.closest('[data-filter]');
  if (!chip) return;
  filter = chip.dataset.filter;
  document.querySelectorAll('#chips .chip').forEach(function (c) {
    c.setAttribute('aria-pressed', String(c === chip));
  });
  renderDormers();
});

document.querySelectorAll('[data-refresh]').forEach(function (b) { b.addEventListener('click', refresh); });


/* =====================================================================
   7. MENU AND THEME  (KEEP)
   ===================================================================== */
var toggle = $('manageToggle'), submenu = $('manageMenu');
toggle.addEventListener('click', function () {
  var open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  submenu.hidden = open;
});

var sidebar = $('sidebar'), menuBtn = $('menuBtn');
menuBtn.addEventListener('click', function () {
  var open = sidebar.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', function (e) {
  if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

var root = document.documentElement;
try { var saved = localStorage.getItem('dorm-theme'); if (saved) root.setAttribute('data-theme', saved); } catch (err) {}
$('themeBtn').addEventListener('click', function () {
  var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('dorm-theme', next); } catch (err) {}
});

refresh();
