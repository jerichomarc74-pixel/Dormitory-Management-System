/* =====================================================================
   Attendance and curfew page

   Backend files this page calls (change the paths here if yours differ):
   - scan      POST {token}  -> process_scan.php (you already have it)
   - curfew    POST {token}  -> process_curfew_scan.php (still to be written)
   - attendance GET          -> get_attendance.php
   - violations GET          -> get_curfew_violations.php

   Expected JSON
   scan / curfew: { success, message, name, student_id, room:'3-5',
                    attendance_type:'IN'|'OUT', late:true|false, scan_time }
   attendance:    { success, dormers:[ { name, year_level, room, attendance_type } ] }
   violations:    { success, total, violations:[ { name, year_level, room,
                    scan_time, minutes_late } ] }
   ===================================================================== */
(function () {
"use strict";

var API = {
  scan: "process_scan.php",
  curfew: "process_curfew_scan.php",
  attendance: "get_attendance.php",
  violations: "get_curfew_violations.php"
};
var COOLDOWN_MS = 2500;

function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function roomLabel(room) {
  var m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(room || "");
  return m ? "Floor " + m[1] + " \u00b7 Room " + m[2] : (room || "");
}
function nameOf(r) {
  return r.name || r.full_name || [r.first_name, r.last_name].filter(Boolean).join(" ");
}
function fmtTime(v) {
  var d = new Date(String(v).replace(" ", "T"));
  return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

$("today").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

/* ---------- server calls ---------- */
function getJson(url, body) {
  var opts = body === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
  return fetch(url, opts).then(function (r) { return r.text(); }).then(function (t) {
    try { return JSON.parse(t); }
    catch (e) { console.error("Invalid JSON from " + url + ":", t); throw new Error("bad-json"); }
  });
}

/* ---------- tables ---------- */
function setOffline(off) { $("offline").hidden = !off; }

function loadAttendance() {
  return getJson(API.attendance).then(function (data) {
    setOffline(false);
    var list = (data && data.dormers) || [];
    $("attSub").textContent = list.length + (list.length === 1 ? " dormer" : " dormers") + " present today.";
    $("attTable").innerHTML = list.length ? list.map(function (r) {
      var inn = String(r.attendance_type).toUpperCase() === "IN";
      return "<tr><td class=\"strong\">" + esc(nameOf(r)) + "</td><td>" + esc(r.year_level || r.year || "") +
        "</td><td>" + esc(roomLabel(r.room)) + "</td><td><span class=\"badge " + (inn ? "in" : "out") + "\">" + (inn ? "In" : "Out") + "</span></td></tr>";
    }).join("") : "<tr><td class=\"empty\" colspan=\"4\">No attendance recorded yet today.</td></tr>";
  }).catch(function () {
    setOffline(true);
    $("attSub").textContent = "\u2014 dormers present today.";
    $("attTable").innerHTML = "<tr><td class=\"empty\" colspan=\"4\">Unavailable while the server is offline.</td></tr>";
  });
}

function loadViolations() {
  return getJson(API.violations).then(function (data) {
    setOffline(false);
    var list = (data && data.violations) || [], total = data && data.total != null ? data.total : list.length;
    $("curSub").textContent = list.length + " late of " + total + " curfew check-ins.";
    $("curTable").innerHTML = list.length ? list.map(function (r) {
      var t = fmtTime(r.scan_time), mins = r.minutes_late;
      return "<tr><td class=\"strong\">" + esc(nameOf(r)) + "</td><td>" + esc(r.year_level || r.year || "") +
        "</td><td>" + esc(roomLabel(r.room)) + "</td><td><span class=\"badge late\">Late" + (mins ? " " + esc(mins) + " min" : "") + "</span> " +
        "<span class=\"muted\">" + (t ? "scanned " + esc(t) + " \u00b7 " : "") + "curfew 10:00 PM</span></td></tr>";
    }).join("") : "<tr><td class=\"empty\" colspan=\"4\">No late check-ins tonight.</td></tr>";
  }).catch(function () {
    setOffline(true);
    $("curSub").textContent = "\u2014 late of \u2014 curfew check-ins.";
    $("curTable").innerHTML = "<tr><td class=\"empty\" colspan=\"4\">Unavailable while the server is offline.</td></tr>";
  });
}

$("refreshAtt").addEventListener("click", loadAttendance);
$("refreshCur").addEventListener("click", loadViolations);

/* ---------- scanners ---------- */
var scanners = {
  scan:   { reader: "readerScan",   box: "camScan",   off: "offScan",   start: "startScan",   stop: "stopScan",   res: "resScan",   url: API.scan,   inst: null, busy: false },
  curfew: { reader: "readerCurfew", box: "camCurfew", off: "offCurfew", start: "startCurfew", stop: "stopCurfew", res: "resCurfew", url: API.curfew, inst: null, busy: false }
};

function showResult(key, kind, title, text, details) {
  var el = $(scanners[key].res);
  el.className = "result" + (kind ? " " + kind : "");
  var dl = "";
  if (details && details.length) {
    dl = "<dl>" + details.map(function (d) { return d[1] ? "<dt>" + esc(d[0]) + "</dt><dd>" + esc(d[1]) + "</dd>" : ""; }).join("") + "</dl>";
  }
  el.innerHTML = "<h3>" + esc(title) + "</h3>" + (text ? "<p>" + esc(text) + "</p>" : "") + dl;
}

function syncButtons(key) {
  var s = scanners[key], on = !!s.inst;
  $(s.box).hidden = !on;
  $(s.off).hidden = on;
  $(s.start).hidden = on;
  $(s.stop).hidden = !on;
}

function stopCam(key) {
  var s = scanners[key];
  if (!s.inst) return Promise.resolve();
  var inst = s.inst;
  s.inst = null;
  return inst.stop().catch(function () {}).then(function () {
    try { inst.clear(); } catch (e) {}
    syncButtons(key);
  });
}

function startCam(key) {
  var s = scanners[key], other = key === "scan" ? "curfew" : "scan";
  if (typeof Html5Qrcode === "undefined") {
    showResult(key, "bad", "Scanner library not loaded", "Check your internet connection and reload the page.");
    return Promise.resolve();
  }
  if (s.inst) return Promise.resolve();
  // Only one camera can run at a time
  return stopCam(other).then(function () {
    $(s.box).hidden = false;
    $(s.off).hidden = true;
    var inst = new Html5Qrcode(s.reader);
    s.inst = inst;
    return inst.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
      function (text) { onRead(key, text); }, function () {})
      .then(function () { syncButtons(key); })
      .catch(function (err) {
        console.error(err);
        s.inst = null;
        syncButtons(key);
        showResult(key, "bad", "Camera could not start", "Allow camera access in the browser and make sure no other app is using it.");
      });
  });
}

function onRead(key, token) {
  var s = scanners[key];
  if (s.busy) return;
  s.busy = true;
  showResult(key, "", "Processing\u2026", "");
  getJson(s.url, { token: token }).then(function (d) {
    setOffline(false);
    if (!d.success) { showResult(key, "bad", d.message || "Scan failed", ""); return; }
    var inn = String(d.attendance_type || "").toUpperCase();
    var kind = d.late ? "warn" : "ok";
    var title = nameOf(d) || "Recorded";
    var text = d.late ? "Late for curfew. A warning was added." :
      (key === "curfew" ? "Curfew check-in recorded." : (d.message || "Attendance recorded."));
    showResult(key, kind, title, text, [
      ["Student ID", d.student_id],
      ["Room", d.room ? roomLabel(d.room) : "Not assigned"],
      ["Attendance", key === "scan" ? (inn === "IN" ? "Time in" : inn === "OUT" ? "Time out" : "") : ""],
      ["Time", fmtTime(d.scan_time) || new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })]
    ]);
    loadAttendance();
    loadViolations();
  }).catch(function (e) {
    console.error(e);
    showResult(key, "bad", e.message === "bad-json" ? "Server error" : "Could not reach the server",
      e.message === "bad-json" ? "The server sent an unexpected reply. Check the browser console." : "Please try again.");
  }).then(function () {
    setTimeout(function () { s.busy = false; }, COOLDOWN_MS);
  });
}

["scan", "curfew"].forEach(function (key) {
  $(scanners[key].start).addEventListener("click", function () { startCam(key); });
  $(scanners[key].stop).addEventListener("click", function () { stopCam(key); });
});
$("heroScan").addEventListener("click", function () { startCam("scan"); $("camScan").scrollIntoView({ behavior: "smooth", block: "center" }); });
$("heroCurfew").addEventListener("click", function () { startCam("curfew"); $("camCurfew").scrollIntoView({ behavior: "smooth", block: "center" }); });

/* ---------- menu and theme (same as the other pages) ---------- */
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

loadAttendance();
loadViolations();
})();
