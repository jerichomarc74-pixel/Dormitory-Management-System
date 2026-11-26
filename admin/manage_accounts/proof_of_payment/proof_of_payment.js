/* =====================================================================
   Proof of Payment page

   There is no backend yet, so the page starts empty. Marking a proof
   as recorded is kept in the browser only and is lost on refresh.

   To connect a database later, change ONLY the two functions in
   section 2 (loadData and setRecorded). The rest keeps working.
   ===================================================================== */


/* =====================================================================
   1. DATA  (this fills up when you connect a backend)
   ===================================================================== */
// One dormer looks like:
// { id, first_name, middle_name, last_name, room: '3-5',
//   proofs: [ { id, date: '2026-11-26', amount, note, file: 'uploads/slip.jpg', recorded: false } ] }
// A dormer with an empty (or missing) proofs list is shown as "No proof".
var dormers = [];


/* =====================================================================
   2. BACKEND HOOKS  (REPLACE the bodies with fetch() calls to your PHP)
   ===================================================================== */
// Load all dormers with their uploaded proofs into `dormers`.
function loadData() {
  return Promise.resolve();
}

// Mark one proof as recorded (true) or unrecorded (false).
function setRecorded(dormerId, proofId, recorded) {
  var d = findById(dormers, dormerId);
  var p = d && (d.proofs || []).filter(function (x) { return String(x.id) === String(proofId); })[0];
  if (!p) return Promise.resolve({ success: false, message: 'Proof not found.' });
  p.recorded = recorded;
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
function findById(list, id) { return list.filter(function (x) { return String(x.id) === String(id); })[0]; }
function proofsOf(d) { return d.proofs || []; }

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

function safeUrl(u) { return u && !/^\s*(javascript|data|vbscript):/i.test(u) ? u : ''; }
function isImage(u) { return /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(u); }
function detail(label, value) { return value ? '<dt>' + label + '</dt><dd>' + esc(value) + '</dd>' : ''; }

function fmtDate(iso) {
  var d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? esc(iso || '') : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// The status follows the dormer's latest upload
function latestProof(d) {
  var best = null;
  proofsOf(d).forEach(function (p) { if (!best || (p.date || '') >= (best.date || '')) best = p; });
  return best;
}
function isRecorded(d) { var p = latestProof(d); return !!(p && p.recorded); }


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
  if (filter === 'recorded') return isRecorded(d);
  if (filter === 'unrecorded') return !isRecorded(d);
  return true;
}

function statusBadge(recorded) {
  return recorded ? '<span class="badge ok">Recorded</span>' : '<span class="badge other">Unrecorded</span>';
}

function renderTable() {
  var list = dormers.filter(function (d) { return passesFilter(d) && matches(d, $('proofSearch').value); });
  $('proofShowing').textContent = 'Showing ' + list.length + ' of ' + dormers.length + ' dormers';
  var emptyMsg = dormers.length ? 'No dormers match your search.' : 'No dormers yet. Dormers and their proofs will appear here.';
  $('proofTable').innerHTML = list.length ? list.map(function (d) {
    return '<tr><td class="strong">' + esc(fullName(d)) + '</td>' +
      '<td>' + (d.room ? esc(roomLabel(d.room)) : '<span class="tag">None</span>') + '</td>' +
      '<td><div class="status-cell">' + statusBadge(isRecorded(d)) +
      (proofsOf(d).length ? '' : '<span class="tag">No proof</span>') + '</div></td>' +
      '<td class="right"><button class="btn sm" type="button" data-action="view" data-id="' + esc(d.id) + '">View</button></td></tr>';
  }).join('') : '<tr><td class="empty" colspan="4">' + emptyMsg + '</td></tr>';
}

function renderAll() {
  renderTable();
  var recorded = dormers.filter(isRecorded).length;
  $('heroRecorded').textContent = recorded;
  $('heroUnrecorded').textContent = dormers.length - recorded;
}

function refresh() { return loadData().then(renderAll); }


/* =====================================================================
   5. PROOF DIALOG  (KEEP)
   ===================================================================== */
function renderProofs() {
  var d = findById(dormers, selectedId);
  if (!d) return;
  var list = proofsOf(d).slice().sort(function (a, b) { return (a.date || '') < (b.date || '') ? 1 : -1; });
  $('proofList').innerHTML = list.length ? list.map(function (p) {
    var file = safeUrl(p.file);
    return '<li class="proof-item">' +
      '<div class="proof-top"><b>' + fmtDate(p.date) + '</b>' + statusBadge(!!p.recorded) + '</div>' +
      '<dl>' + detail('Amount', p.amount) + detail('Note', p.note) + '</dl>' +
      (file ? (isImage(file)
        ? '<a href="' + esc(file) + '" target="_blank" rel="noopener"><img class="proof-img" src="' + esc(file) + '" alt="Uploaded proof of payment"></a>'
        : '<p style="margin-top:12px"><a href="' + esc(file) + '" target="_blank" rel="noopener" class="btn sm">Open file</a></p>') : '') +
      '<div class="actions"><button class="btn ' + (p.recorded ? '' : 'primary ') + 'sm" type="button" data-action="toggle" data-proof="' + esc(p.id) + '">' +
      (p.recorded ? 'Mark as unrecorded' : 'Mark as recorded') + '</button></div></li>';
  }).join('') : '<li class="proof-empty">This dormer has not uploaded a proof yet.</li>';
}

function openProofs(id) {
  var d = findById(dormers, id);
  if (!d) return;
  selectedId = id;
  $('proofSub').textContent = fullName(d) + (d.room ? ' \u00b7 ' + roomLabel(d.room) : '');
  renderProofs();
  $('proofModal').showModal();
}

$('proofCloseBtn').addEventListener('click', function () { $('proofModal').close(); });


/* =====================================================================
   6. BUTTONS, SEARCH AND FILTERS  (KEEP)
   ===================================================================== */
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;

  if (btn.dataset.action === 'view') openProofs(btn.dataset.id);

  if (btn.dataset.action === 'toggle') {
    var d = findById(dormers, selectedId);
    var p = d && proofsOf(d).filter(function (x) { return String(x.id) === String(btn.dataset.proof); })[0];
    if (!p) return;
    setRecorded(selectedId, p.id, !p.recorded).then(function (res) {
      if (!res.success) { alert(res.message || 'Could not update this proof.'); return; }
      renderProofs();
      renderAll();
    }).catch(function (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    });
  }
});

$('proofSearch').addEventListener('input', renderTable);

$('chips').addEventListener('click', function (e) {
  var chip = e.target.closest('[data-filter]');
  if (!chip) return;
  filter = chip.dataset.filter;
  document.querySelectorAll('#chips .chip').forEach(function (c) {
    c.setAttribute('aria-pressed', String(c === chip));
  });
  renderTable();
});

$('refreshBtn').addEventListener('click', refresh);


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
