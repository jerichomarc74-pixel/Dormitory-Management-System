/* ---------- Sample data: replace with real data from your backend ---------- */
var adminName = 'Demo';
var totalRooms = 30;

var state = {
  awaiting:  [{ name: 'Liza Navarro', email: 'liza.navarro@lnu.edu.ph', year: '1st year', date: 'Nov 26, 2026', slip: false }],
  validated: [
    { name: 'Grace Bautista', email: 'grace.bautista@lnu.edu.ph', year: '1st year' },
    { name: 'Mark Cruz', email: 'mark.cruz@lnu.edu.ph', year: '2nd year' }
  ],
  announcements: [
    { when: 'Nov 23, 2026 \u00b7 08:22 AM', title: 'Curfew reminder', body: 'Curfew is 10:00 PM. Please be back before the gates close; late arrivals receive warnings.' },
    { when: 'Nov 25, 2026 \u00b7 08:22 AM', title: 'Dorm fee reminder', body: 'The monthly dorm fee is due on or before the 5th. Upload your proof of payment in the Payment tab.' },
    { when: 'Nov 26, 2026 \u00b7 07:22 AM', title: '', body: 'Floor 3 Room 1 and 3 please clean your rooms' }
  ],
  personnel: [{ name: 'Rosa M. Garcia', date: 'Nov 26, 2026', role: 'Security Personnel', email: 'rosa.garcia@lnu.edu.ph', age: 29, sex: 'Female' }],
  present: 2,
  proofs: 2,
  roomsUnchecked: 18,
  enrolled: 4
};

var roles = ['Security Personnel', 'Dorm Manager', 'Maintenance Staff', 'Dorm Assistant'];

/* ---------- Helpers ---------- */
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ---------- Render ---------- */
function renderStats() {
  var toApprove = state.awaiting.length, toEnroll = state.validated.length;
  $('statManage').textContent = toApprove + toEnroll;
  $('statManageSub').textContent = toApprove + ' to approve \u00b7 ' + toEnroll + ' to enroll';
  $('statAttend').textContent = state.present;
  $('statAnn').textContent = state.announcements.length;
  $('statProof').textContent = state.proofs;
  $('statRooms').textContent = state.roomsUnchecked;
  $('statRoomsSub').textContent = 'Not checked today, of ' + totalRooms + ' rooms';
  $('statEnrolled').textContent = state.enrolled;
  $('heroReg').textContent = toApprove;
  $('heroPers').textContent = state.personnel.length;
  $('persCount').textContent = state.personnel.length;
}

function renderStudents() {
  $('awaitingList').innerHTML = state.awaiting.length
    ? state.awaiting.map(function (s) {
        return '<li><div><b>' + esc(s.name) + '</b><small>' + esc(s.email) + ' \u00b7 ' + esc(s.year) + ' \u00b7 ' + esc(s.date) + '</small></div>' +
               (s.slip ? '' : '<span class="tag">No slip</span>') + '</li>';
      }).join('')
    : '<li><span class="empty-row">No registrations waiting.</span></li>';

  $('validatedList').innerHTML = state.validated.length
    ? state.validated.map(function (s, i) {
        return '<li><div><b>' + esc(s.name) + '</b><small>' + esc(s.email) + ' \u00b7 ' + esc(s.year) + '</small></div>' +
               '<button class="btn" type="button" data-enroll="' + i + '">Enroll</button></li>';
      }).join('')
    : '<li><span class="empty-row">Everyone validated is enrolled.</span></li>';
}

function renderAnnouncements() {
  $('annList').innerHTML = state.announcements.map(function (a) {
    return '<li><div class="when">' + esc(a.when) + '<i></i>' + adminName + ' Dorm Administrator</div>' +
           (a.title ? '<h4>' + esc(a.title) + '</h4><p>' + esc(a.body) + '</p>' : '<h4 style="font-weight:400">' + esc(a.body) + '</h4>') + '</li>';
  }).join('');
}

function renderPersonnel() {
  $('persList').innerHTML = state.personnel.length
    ? state.personnel.map(function (p, i) {
        var opts = roles.map(function (r) {
          return '<option' + (r === p.role ? ' selected' : '') + '>' + esc(r) + '</option>';
        }).join('');
        return '<article class="pcard">' +
          '<div class="pcard-top"><h4>' + esc(p.name) + '</h4><span class="status">PENDING</span></div>' +
          '<div class="when">' + esc(p.date) + '</div>' +
          '<div class="role"><i></i>' + esc(p.role) + '</div>' +
          '<dl><dt>Email</dt><dd>' + esc(p.email) + '</dd><dt>Age</dt><dd>' + esc(p.age) + ' \u00b7 ' + esc(p.sex) + '</dd></dl>' +
          '<label for="role' + i + '">Approve as</label><select id="role' + i + '">' + opts + '</select>' +
          '<div class="actions"><button class="btn primary sm" type="button" data-approve="' + i + '">Approve</button>' +
          '<button class="btn sm" type="button" data-reject="' + i + '">Reject</button></div></article>';
      }).join('')
    : '<div class="pers-empty">No personnel registrations waiting.</div>';
}

function renderAll() { renderStats(); renderStudents(); renderAnnouncements(); renderPersonnel(); }

/* ---------- Actions ---------- */
$('validatedList').addEventListener('click', function (e) {
  var b = e.target.closest('[data-enroll]');
  if (!b) return;
  state.validated.splice(+b.dataset.enroll, 1);
  state.enrolled += 1;
  renderStats(); renderStudents();
});

$('persList').addEventListener('click', function (e) {
  var a = e.target.closest('[data-approve]'), r = e.target.closest('[data-reject]');
  if (!a && !r) return;
  state.personnel.splice(+(a || r).dataset[a ? 'approve' : 'reject'], 1);
  renderStats(); renderPersonnel();
});

$('refreshBtn').addEventListener('click', function () { renderAll(); });

/* ---------- Header, menu, theme ---------- */
$('adminName').textContent = adminName;
$('today').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

renderAll();
