(function () {
"use strict";
var KEY = "lnu-rooms-v1", CAP = 4, FLOORS = [1, 2, 3], PER = 10;
var db = { students: [], checks: {} }, cur = null, open = { "1": true };
var $ = function (i) { return document.getElementById(i); };

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function today() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function load() {
  try {
    var r = localStorage.getItem(KEY);
    if (r) {
      var j = JSON.parse(r);
      db.students = Array.isArray(j.students) ? j.students : [];
      db.checks = j.checks && typeof j.checks === "object" ? j.checks : {};
    }
  } catch (e) {}
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { $("alert").hidden = false; $("alert").textContent = "Changes could not be saved in this browser."; }
}
function rooms() {
  var a = [];
  FLOORS.forEach(function (f) { for (var r = 1; r <= PER; r++) a.push({ k: f + "-" + r, f: f, r: r }); });
  return a;
}
function occ(k) { return db.students.filter(function (s) { return s.room === k; }); }
function checked(k) { return !!db.checks[k] && db.checks[k].date === today(); }
function badge(k) {
  return checked(k) ? '<span class="badge ok">Checked</span>' : '<span class="badge other">Unchecked</span>';
}
function fmt(ts) { return new Date(ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }

function summary() {
  var all = rooms(), c = all.filter(function (x) { return checked(x.k); }).length;
  $("mc").textContent = c;
  $("mu").textContent = all.length - c;
  $("mt").textContent = all.length;
  $("mo").textContent = db.students.length;
}

function render() {
  summary();
  $("floors").innerHTML = FLOORS.map(function (f) {
    var rs = rooms().filter(function (x) { return x.f === f; }),
        un = rs.filter(function (x) { return !checked(x.k); }).length;
    return '<details class="floor" data-f="' + f + '"' + (open[f] ? " open" : "") + '>' +
      '<summary><h3>Floor ' + f + '</h3><span class="badge ' + (un ? "other" : "ok") + '">' + (un ? un + " unchecked" : "All checked") + '</span></summary>' +
      '<div class="tbl-wrap"><table><thead><tr><th>Room</th><th>Occupants</th><th>Status</th><th class="right"><span class="sr">Actions</span></th></tr></thead><tbody>' +
      rs.map(function (x) {
        return '<tr><td class="strong">Room ' + x.r + '</td><td>' + occ(x.k).length + ' / ' + CAP + '</td><td>' + badge(x.k) +
          '</td><td class="right"><button class="btn sm" type="button" data-v="' + x.k + '" aria-label="View floor ' + x.f + ' room ' + x.r + '">View</button></td></tr>';
      }).join("") + '</tbody></table></div></details>';
  }).join("");
}

function fillDialog() {
  var k = cur, list = occ(k), c = db.checks[k], full = list.length >= CAP;
  $("dm").innerHTML = badge(k) + '<span>Occupants <strong>' + list.length + ' / ' + CAP + '</strong></span>' +
    (c ? '<span>Last checked <strong>' + esc(fmt(c.at)) + '</strong></span>' : '<span>Never checked</span>');
  $("ds").innerHTML = list.length
    ? '<ul class="occ">' + list.map(function (s) {
        return '<li><span><strong>' + esc(s.name) + '</strong><small>' + esc(s.year) + ' \u00b7 ID ' + esc(s.sid) +
          '</small></span><button class="btn danger sm" type="button" data-rm="' + esc(s.sid) + '" aria-label="Remove ' + esc(s.name) + '">Remove</button></li>';
      }).join("") + '</ul>'
    : '<p class="occ-empty">No students live in this room yet.</p>';
  $("note").textContent = checked(k) ? "This room has been checked today." : "Please click Check if room is clean.";
  $("chk").disabled = checked(k);
  $("chk").textContent = checked(k) ? "Checked" : "Check";
  $("addbtn").disabled = full;
  $("addbtn").textContent = full ? "Room is full" : "Add student";
}

function view(k) {
  cur = k;
  var p = k.split("-");
  $("de").textContent = "Floor " + p[0];
  $("dt").textContent = "Room " + p[1];
  $("err").textContent = "";
  $("af").reset();
  fillDialog();
  $("dlg").showModal();
}

$("floors").addEventListener("click", function (e) { var b = e.target.closest("[data-v]"); if (b) view(b.dataset.v); });
$("floors").addEventListener("toggle", function (e) { var d = e.target; if (d.dataset && d.dataset.f) open[d.dataset.f] = d.open; }, true);

$("chk").onclick = function () {
  if (!cur || checked(cur)) return;
  db.checks[cur] = { date: today(), at: Date.now() };
  save(); fillDialog(); render();
};

$("ds").addEventListener("click", function (e) {
  var b = e.target.closest("[data-rm]"); if (!b) return;
  db.students = db.students.filter(function (s) { return !(s.room === cur && s.sid === b.dataset.rm); });
  save(); fillDialog(); render();
});

$("af").addEventListener("submit", function (e) {
  e.preventDefault();
  var f = e.target, n = f.elements.name.value.trim(), id = f.elements.sid.value.trim(), er = "";
  if (occ(cur).length >= CAP) er = "This room is full.";
  else if (n.length < 2 || !/^[\p{L} .'-]+$/u.test(n)) er = "Enter the student\u2019s full name using letters only.";
  else if (!/^[A-Za-z0-9-]{3,20}$/.test(id)) er = "Student ID must be 3 to 20 letters, numbers or dashes.";
  else if (db.students.some(function (s) { return s.sid.toLowerCase() === id.toLowerCase(); })) er = "That student ID is already assigned to a room.";
  $("err").textContent = er;
  if (er) return;
  db.students.push({ name: n, sid: id, year: f.elements.year.value, room: cur });
  save(); f.reset(); fillDialog(); render();
});

$("dx").onclick = $("dc").onclick = function () { $("dlg").close(); };
$("dlg").addEventListener("close", function () { cur = null; });
$("refresh").onclick = function () { load(); render(); };
document.addEventListener("visibilitychange", function () { if (!document.hidden) { load(); render(); } });

/* MENU AND THEME (same as the other pages) */
var toggle = $("manageToggle"), submenu = $("manageMenu");
toggle.addEventListener("click", function () {
  var o = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!o));
  submenu.hidden = o;
});

var sidebar = $("sidebar"), menuBtn = $("menuBtn");
menuBtn.addEventListener("click", function () {
  var o = sidebar.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(o));
});
document.addEventListener("click", function (e) {
  if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

var root = document.documentElement;
try { var saved = localStorage.getItem("dorm-theme"); if (saved) root.setAttribute("data-theme", saved); } catch (err) {}
$("theme").addEventListener("click", function () {
  var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("dorm-theme", next); } catch (err) {}
});

load(); render();
})();
