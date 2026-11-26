/* =====================================================================
   Manage Students: works with your existing PHP files
   - unvalidated_accounts.php  (returns table rows)
   - validated_accounts.php    (returns table rows)
   - validate_account.php, update_account.php, delete_account.php (JSON)
   - reject_account.php        (new, JSON)
   Open this page through your server (for example http://localhost/...),
   not by double-clicking the file, or the PHP will not run.
   ===================================================================== */

var pending = [];   // students waiting for approval
var students = [];  // validated dormers


/* ---------- Helpers ---------- */
function $(id) { return document.getElementById(id); }

// Makes text safe before putting it into HTML
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function indexOfId(list, id) { return list.findIndex(function (x) { return String(x.id) === String(id); }); }
function findById(list, id) { return list[indexOfId(list, id)]; }

function fullName(s) {
  if (s.full_name) return s.full_name;
  var mid = s.middle_name ? s.middle_name.trim().charAt(0).toUpperCase() + '.' : '';
  return [s.first_name, mid, s.last_name].filter(Boolean).join(' ');
}

// "3 - 5" or "3-5" -> Floor 3 · Room 5. Older text such as "1st Floor - Room 101" is split on " - ".
function parseRoom(room) {
  var m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(room || '');
  if (m) return { floor: m[1], room: m[2], label: 'Floor ' + m[1] + ' \u00b7 Room ' + m[2] };
  var parts = (room || '').split(' - ');
  return { floor: parts[0] || 'Not available', room: parts.slice(1).join(' - ') || 'Not available', label: room || '' };
}

// Returns "3 - 5" for good input, "" for empty, or null when the format is wrong
function cleanRoom(value) {
  var v = (value || '').trim();
  if (!v) return '';
  var m = /^(\d+)\s*-\s*(\d+)$/.exec(v);
  return m ? m[1] + ' - ' + m[2] : null;
}

function safeUrl(u) { return u && !/^\s*(javascript|data|vbscript):/i.test(u) ? u : ''; }
function detail(label, value) { return value ? '<dt>' + label + '</dt><dd>' + esc(value) + '</dd>' : ''; }


/* ---------- Loading real data from your PHP ---------- */
function getText(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error('Failed to load ' + url);
    return r.text();
  });
}

// Your PHP sends <tr> rows, so wrap them in a table before reading them
function rowsFrom(html) {
  var doc = new DOMParser().parseFromString('<table><tbody>' + html + '</tbody></table>', 'text/html');
  var rows = Array.prototype.slice.call(doc.querySelectorAll('tr'));
  rows.forEach(function (tr) {
    if (/Database Error/i.test(tr.textContent)) throw new Error(tr.textContent.trim());
  });
  return rows;
}

function parsePending(html) {
  var list = [];
  rowsFrom(html).forEach(function (tr) {
    var b = tr.querySelector('.viewUnvalidatedBtn');
    if (!b) return;                       // "No pending student accounts" row
    list.push({
      id: b.dataset.studentId,
      full_name: b.dataset.name,
      email: b.dataset.email,
      age: tr.cells[2].textContent.trim(),
      gender: tr.cells[3].textContent.trim()
    });
  });
  return list;
}

function parseValidated(html) {
  var list = [];
  rowsFrom(html).forEach(function (tr) {
    var b = tr.querySelector('.viewValidatedBtn');
    if (!b) return;
    var d = b.dataset;
    list.push({
      id: d.id, first_name: d.firstname, middle_name: d.middlename, last_name: d.lastname,
      age: d.age, gender: d.gender, email: d.email, address: d.address, room: d.room
    });
  });
  return list;
}

function loadAccounts() {
  return Promise.all([getText('unvalidated_accounts.php'), getText('validated_accounts.php')])
    .then(function (r) {
      pending = parsePending(r[0]);
      students = parseValidated(r[1]);
      renderAll();
    })
    .catch(function (err) {
      console.error(err);
      var msg = '<tr><td class="empty" colspan="4">Unable to load accounts. ' + esc(err.message) + '</td></tr>';
      $('validatedTable').innerHTML = msg;
      $('enrolledTable').innerHTML = msg;
      $('pendingList').innerHTML = '<div class="pers-empty">Unable to load pending registrations.</div>';
    });
}


/* ---------- Sending actions to your PHP ---------- */
function api(url, fields) {
  var fd = new FormData();
  Object.keys(fields).forEach(function (k) { fd.append(k, fields[k]); });
  return fetch(url, { method: 'POST', body: fd }).then(function (r) {
    if (!r.ok) throw new Error('Server error');
    return r.json();
  });
}

// Runs an action, then refreshes the lists
function run(url, fields, onSuccess) {
  api(url, fields).then(function (data) {
    if (data.success) { if (onSuccess) onSuccess(data); loadAccounts(); }
    else alert(data.message || 'Something went wrong.');
  }).catch(function (err) {
    console.error(err);
    alert('Something went wrong. Please try again.');
  });
}

// update_account.php needs every field, so enrolling reuses it
function studentFields(s, room) {
  return { student_id: s.id, first_name: s.first_name, middle_name: s.middle_name || '', last_name: s.last_name,
           age: s.age, gender: s.gender, email: s.email, address: s.address, room_assignment: room };
}


/* ---------- Drawing the page ---------- */
function matches(s, q) {
  if (!q) return true;
  var h = [fullName(s), s.id, s.email, s.room].join(' ').toLowerCase(), ql = q.toLowerCase();
  return h.indexOf(ql) !== -1 || h.replace(/\s/g, '').indexOf(ql.replace(/\s/g, '')) !== -1;
}

function renderPending() {
  $('pendingList').innerHTML = pending.length ? pending.map(function (p) {
    return '<article class="pcard">' +
      '<div class="pcard-top"><h4>' + esc(fullName(p)) + '</h4><span class="status">PENDING</span></div>' +
      '<dl>' + detail('ID', p.id) + detail('Email', p.email) +
      detail('Age', [p.age, p.gender].filter(Boolean).join(' \u00b7 ')) + detail('Home', p.address) + '</dl>' +
      '<label class="lbl" for="room-' + esc(p.id) + '">Room</label>' +
      '<div class="room-row"><input class="field" id="room-' + esc(p.id) + '" placeholder="e.g. 3-5" autocomplete="off">' +
      '<button class="btn primary sm" type="button" data-action="approve" data-id="' + esc(p.id) + '">Approve</button></div>' +
      '<button class="btn sm" type="button" data-action="reject" data-id="' + esc(p.id) + '">Reject</button>' +
      '</article>';
  }).join('') : '<div class="pers-empty">No registrations waiting for approval.</div>';
}

function renderValidated() {
  var all = students.filter(function (s) { return !s.room; });
  var list = all.filter(function (s) { return matches(s, $('validatedSearch').value); });
  $('validatedSection').hidden = all.length === 0;
  $('validatedShowing').textContent = 'Showing ' + list.length + ' of ' + all.length;
  $('validatedTable').innerHTML = list.length ? list.map(function (s) {
    return '<tr><td class="strong">' + esc(fullName(s)) + '</td><td>' + esc(s.id) + '</td>' +
      '<td class="right"><button class="btn sm" type="button" data-action="open-enroll" data-id="' + esc(s.id) + '">View</button></td></tr>';
  }).join('') : '<tr><td class="empty" colspan="3">No students found.</td></tr>';
}

function renderEnrolled() {
  var all = students.filter(function (s) { return s.room; });
  var list = all.filter(function (s) { return matches(s, $('enrolledSearch').value); });
  $('enrolledShowing').textContent = 'Showing ' + list.length + ' of ' + all.length;
  $('enrolledTable').innerHTML = list.length ? list.map(function (s) {
    return '<tr><td class="strong">' + esc(fullName(s)) + '</td><td>' + esc(s.id) + '</td>' +
      '<td>' + esc(parseRoom(s.room).label) + '</td>' +
      '<td class="right"><button class="btn sm" type="button" data-action="open-view" data-id="' + esc(s.id) + '">View</button></td></tr>';
  }).join('') : '<tr><td class="empty" colspan="4">No enrolled students found.</td></tr>';
}

function renderAll() {
  renderPending(); renderValidated(); renderEnrolled();
  var notEnrolled = students.filter(function (s) { return !s.room; }).length;
  $('pendingCount').textContent = pending.length;
  $('heroPending').textContent = pending.length;
  $('heroValidated').textContent = notEnrolled;
  $('heroEnrolled').textContent = students.length - notEnrolled;
}


/* ---------- Buttons and dialogs ---------- */
var selectedId = null;

document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var id = btn.dataset.id, action = btn.dataset.action;

  if (action === 'approve') {
    var room = cleanRoom($('room-' + id).value);
    if (!room) { alert('Enter the room as floor-room, for example 3-5.'); return; }
    var r = parseRoom(room);
    run('validate_account.php', { student_id: id, floor: r.floor, room: r.room }, function (data) {
      $('resultMessage').textContent = (data.message || 'The dormer\u2019s account is ready.') +
        (data.room_assignment ? ' Room: ' + parseRoom(data.room_assignment).label + '.' : '');
      $('generatedPassword').value = data.password || '';
      $('resultModal').showModal();
    });
  }

  if (action === 'reject') {
    if (confirm('Reject this registration? This removes it from the pending list.')) {
      run('reject_account.php', { student_id: id });
    }
  }

  if (action === 'open-enroll') {
    var s = findById(students, id);
    selectedId = id;
    $('enrollName').textContent = fullName(s);
    $('enrollEmail').textContent = s.email;
    $('enrollAddress').textContent = s.address;
    $('enrollRoom').value = '';
    $('enrollModal').showModal();
  }

  if (action === 'open-view') {
    var v = findById(students, id), rm = parseRoom(v.room);
    selectedId = id;
    $('viewStudentName').textContent = fullName(v);
    $('viewStudentId').textContent = v.id;
    $('viewStudentEmail').textContent = v.email;
    $('viewStudentAge').textContent = v.age + ' \u00b7 ' + v.gender;
    $('viewStudentAddress').textContent = v.address;
    $('viewStudentFloor').textContent = rm.floor;
    $('viewStudentRoom').textContent = rm.room;
    $('accountViewModal').showModal();
  }
});

// Enroll a validated student who has no room yet
$('enrollBtn').addEventListener('click', function () {
  var room = cleanRoom($('enrollRoom').value);
  if (!room) { alert('Enter the room as floor-room, for example 3-5.'); return; }
  run('update_account.php', studentFields(findById(students, selectedId), room), function () { $('enrollModal').close(); });
});
$('enrollCloseBtn').addEventListener('click', function () { $('enrollModal').close(); });

// View, modify, delete
$('viewCloseBtn').addEventListener('click', function () { $('accountViewModal').close(); });

$('viewModifyBtn').addEventListener('click', function () {
  var s = findById(students, selectedId);
  if (!s) { alert('No student selected.'); return; }
  $('editStudentId').value = s.id;
  $('editFirstName').value = s.first_name;
  $('editMiddleName').value = s.middle_name || '';
  $('editLastName').value = s.last_name;
  $('editAge').value = s.age;
  $('editGender').value = s.gender;
  $('editEmail').value = s.email;
  $('editAddress').value = s.address;
  $('editRoomAssignment').value = s.room;
  $('accountViewModal').close();
  $('modifyAccountModal').showModal();
});

$('cancelModifyBtn').addEventListener('click', function () { $('modifyAccountModal').close(); });

$('modifyAccountForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var fields = Object.fromEntries(new FormData(this));
  var room = cleanRoom(fields.room_assignment);
  fields.room_assignment = room === null ? fields.room_assignment.trim() : room;  // older room text is kept as typed
  if (!fields.room_assignment) { alert('Please enter a room.'); return; }
  run('update_account.php', fields, function (data) {
    $('modifyAccountModal').close();
    if (data.message) alert(data.message);
  });
});

$('viewDeleteBtn').addEventListener('click', function () {
  if (!confirm('Are you sure you want to delete this dormer account?')) return;
  run('delete_account.php', { student_id: selectedId }, function () {
    $('accountViewModal').close();
    selectedId = null;
  });
});

$('resultCloseBtn').addEventListener('click', function () {
  $('generatedPassword').value = '';
  $('resultModal').close();
});

// Search boxes and Refresh buttons
$('validatedSearch').addEventListener('input', renderValidated);
$('enrolledSearch').addEventListener('input', renderEnrolled);
document.querySelectorAll('[data-refresh]').forEach(function (b) { b.addEventListener('click', loadAccounts); });


/* ---------- Menu and theme ---------- */
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

document.addEventListener('DOMContentLoaded', loadAccounts);
