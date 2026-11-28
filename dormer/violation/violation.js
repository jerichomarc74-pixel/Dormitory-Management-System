// violation.js
// Loads the logged-in student's violation record from violation.php
// and shows it on violation.html.
//
// Flow:  page loads -> loadViolations() -> fetch data -> fill the page
//        (if anything fails, showError() tells the student what happened)

const API_URL = "./violation.php";

// violation.php sends this exact text when a student has no offenses
const NO_OFFENSES_TEXT = "No offenses";

// ---------- Page elements (looked up once, used everywhere) ----------
const el = {
    status:      document.getElementById("status"),
    statusTitle: document.getElementById("statusTitle"),
    statusText:  document.getElementById("statusText"),
    retryBtn:    document.getElementById("retryBtn"),
    offenses:    document.getElementById("offenses"),
    absent:      document.getElementById("absent"),
    curfewTable: document.getElementById("curfewRecords"),
    curfewCount: document.getElementById("curfewCount"),
};

document.addEventListener("DOMContentLoaded", loadViolations);
el.retryBtn.addEventListener("click", loadViolations);


// =====================================================
// MAIN FUNCTION
// =====================================================
async function loadViolations() {
    setStatus("loading", "Checking your record...", "");

    try {
        const data = await fetchViolations();

        // Only records that actually have a curfew date/time belong in the table
        const curfewRecords = (data.records || []).filter(record => record.curfew);

        showSummary(data);
        showCurfewRecords(curfewRecords);
        showStatus(data, curfewRecords.length);

        console.log("Violations loaded successfully!");

    } catch (error) {
        console.error("Violations Error:", error);
        showError(error);
    }
}

// Ask the server for the data. Throws an error if the request fails.
async function fetchViolations() {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load violations.");
    }
    return data;
}


// =====================================================
// SHOW THE DATA
// =====================================================

// Offenses and absences cards
function showSummary(data) {
    el.offenses.textContent = data.offenses || NO_OFFENSES_TEXT;
    el.absent.textContent = data.absent ?? 0;
}

// Curfew table (one row per curfew record)
function showCurfewRecords(records) {
    el.curfewTable.innerHTML = "";
    el.curfewCount.textContent = `(${records.length})`;

    if (records.length === 0) {
        el.curfewTable.appendChild(makeMessageRow("No curfew violations on record."));
        return;
    }

    records.forEach(record => {
        // record.curfew looks like "2026-11-12 22:45:00"
        const [date, time] = record.curfew.split(/[ T]/);

        const row = document.createElement("tr");
        row.appendChild(makeCell(formatDate(date)));
        row.appendChild(makeCell(formatTime(time)));
        el.curfewTable.appendChild(row);
    });
}

// The banner at the top: tells the student at a glance how they are doing
function showStatus(data, curfewCount) {
    const hasOffense = data.offenses && data.offenses !== NO_OFFENSES_TEXT;
    const absences = Number(data.absent) || 0;

    // Build a list of what is on the record
    const issues = [];
    if (hasOffense)       issues.push("an offense");
    if (absences > 0)     issues.push(`${absences} ${absences === 1 ? "absence" : "absences"}`);
    if (curfewCount > 0)  issues.push(`${curfewCount} curfew ${curfewCount === 1 ? "record" : "records"}`);

    if (issues.length === 0) {
        setStatus("clear", "You're all clear", "You have no violations on record. Keep it up!");
    } else {
        setStatus(
            "attention",
            "You have violations on record",
            `Your record shows: ${issues.join(", ")}. Talk to your dorm manager if you have questions.`
        );
    }
}

// Shown when loading fails (not logged in, server down, no internet...)
function showError(error) {
    // Network problems and bad server replies give technical messages,
    // so replace those with something a student can understand.
    const isTechnical = error instanceof TypeError || error instanceof SyntaxError;
    const message = isTechnical
        ? "We couldn't reach the server. Check your connection and try again."
        : error.message;

    el.offenses.textContent = "Unable to load";
    el.absent.textContent = "Unable to load";
    el.curfewCount.textContent = "";
    el.curfewTable.innerHTML = "";
    el.curfewTable.appendChild(makeMessageRow("Unable to load curfew records."));

    setStatus("error", "Something went wrong", message);
}


// =====================================================
// SMALL HELPERS
// =====================================================

// Updates the status banner. type = "loading" | "clear" | "attention" | "error"
function setStatus(type, title, text) {
    el.status.className = `status status-${type}`;
    el.statusTitle.textContent = title;
    el.statusText.textContent = text;
    el.retryBtn.hidden = type !== "error";   // "Try again" only appears on errors
}

// A table cell with plain text
function makeCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

// A table row with one message that spans both columns
function makeMessageRow(message) {
    const row = document.createElement("tr");
    const cell = makeCell(message);
    cell.colSpan = 2;
    row.appendChild(cell);
    return row;
}

// "2026-11-12" -> "Nov 12, 2026"  (keeps the original text if it can't be read)
function formatDate(dateText) {
    const date = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateText;

    return date.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

// "22:45:00" -> "10:45 PM"  (24-hour time to 12-hour time)
function formatTime(timeText) {
    if (!timeText) return "-";

    const [hour, minute] = timeText.split(":");
    const hourNumber = Number(hour);
    if (Number.isNaN(hourNumber)) return timeText;

    const period = hourNumber >= 12 ? "PM" : "AM";
    const hour12 = (hourNumber % 12 || 12).toString().padStart(2, "0");

    return `${hour12}:${minute} ${period}`;
}