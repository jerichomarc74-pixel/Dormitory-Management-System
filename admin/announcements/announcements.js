/* =====================================================================
   Announcements page

   Backend files this page calls (change the paths here if yours differ):
   - list    GET                 -> get_announcements.php
   - create  POST JSON           -> post_announcement.php
   - remove  POST JSON {id}      -> delete_announcement.php

   Expected JSON
   list:   { success, announcements:[ { id, title, message, created_at, expires_at } ] }
   create: sent as { title, message, expires_at }
           expires_at is "YYYY-MM-DDTHH:MM" in the app timezone, or null.
           reply { success, message }
   remove: reply { success, message }
   ===================================================================== */
(function () {
"use strict";

var API = {
  list: "get_announcements.php",
  create: "post_announcement.php",
  remove: "delete_announcement.php"
};
var MAX = 2000;

function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function parseDate(v) { return new Date(String(v).replace(" ", "T")); }
function fmtDate(v) {
  var d = parseDate(v);
  return isNaN(d) ? "" : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

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

function setOffline(off) { $("offline").hidden = !off; }

/* ---------- history ---------- */
function showList(html) {
  $("skel").hidden = true;
  $("annList").hidden = false;
  $("annList").innerHTML = html;
}

function loadList() {
  $("skel").hidden = false;
  $("annList").hidden = true;
  return getJson(API.list).then(function (data) {
    setOffline(false);
    var list = (data && data.announcements) || [];
    showList(list.length ? list.map(function (a) {
      var exp = a.expires_at ? fmtDate(a.expires_at) : "";
      return '<li class="ann-item">' +
        '<div class="ann-top"><h3>' + esc(a.title || "Announcement") + '</h3>' +
        '<button class="btn danger sm" type="button" data-del="' + esc(a.id) + '" aria-label="Delete announcement">Delete</button></div>' +
        '<p class="body">' + esc(a.message) + '</p>' +
        '<div class="ann-meta"><span>Posted ' + esc(fmtDate(a.created_at)) + '</span>' +
        (exp ? '<span class="badge other">Expires ' + esc(exp) + '</span>' : '<span class="tag">No expiry</span>') + '</div></li>';
    }).join("") : '<li class="ann-empty">No announcements yet. Posts you submit will appear here.</li>');
  }).catch(function () {
    setOffline(true);
    showList('<li class="ann-empty">Unavailable while the server is offline.</li>');
  });
}

$("refreshBtn").addEventListener("click", loadList);

$("annList").addEventListener("click", function (e) {
  var btn = e.target.closest("[data-del]");
  if (!btn) return;
  if (!confirm("Delete this announcement? Dormers will no longer see it.")) return;
  btn.disabled = true;
  getJson(API.remove, { id: btn.dataset.del }).then(function (res) {
    if (!res.success) { alert(res.message || "Could not delete this announcement."); btn.disabled = false; return; }
    loadList();
  }).catch(function () {
    alert("Could not reach the server. Please try again.");
    btn.disabled = false;
  });
});

/* ---------- form ---------- */
var body = $("annBody");
function updateCount() {
  var n = body.value.length;
  $("count").textContent = n;
  $("annCount").classList.toggle("over", n > MAX);
}
body.addEventListener("input", updateCount);

function message(text, bad) {
  var el = $("formMsg");
  el.textContent = text || "";
  el.classList.toggle("bad", !!bad);
}

$("postForm").addEventListener("submit", function (e) {
  e.preventDefault();
  message("");
  $("bodyErr").textContent = "";
  $("dateErr").textContent = "";

  var title = $("annTitle").value.trim(),
      text = body.value.trim(),
      exp = $("annExpires").value,
      ok = true;

  if (!text) { $("bodyErr").textContent = "Write the announcement before submitting."; ok = false; }
  else if (text.length > MAX) { $("bodyErr").textContent = "Keep the announcement under " + MAX + " characters."; ok = false; }
  if (exp && new Date(exp) <= new Date()) { $("dateErr").textContent = "Pick an expiry time that is in the future."; ok = false; }
  if (!ok) return;

  var btn = $("submitBtn");
  btn.disabled = true;
  btn.textContent = "Submitting\u2026";
  getJson(API.create, { title: title, message: text, expires_at: exp || null }).then(function (res) {
    setOffline(false);
    if (!res.success) { message(res.message || "Could not post the announcement.", true); return; }
    $("postForm").reset();
    updateCount();
    message(res.message || "Announcement posted.");
    loadList();
  }).catch(function () {
    setOffline(true);
    message("Could not reach the server. Your text is still here, try again.", true);
  }).then(function () {
    btn.disabled = false;
    btn.textContent = "Submit announcements";
  });
});

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

updateCount();
loadList();
})();
