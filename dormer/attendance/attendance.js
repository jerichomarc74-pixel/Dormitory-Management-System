
let student = null;

// Load logged-in student's information
async function loadStudent() {

    try {
        const response = await fetch("./attendance.php");
        const result = await response.text();

        console.log("PHP Response:", result);

        let data;

        try {
            data = JSON.parse(result);
        } catch (error) {
            throw new Error(
                "PHP did not return JSON. Check attendance.php for PHP errors."
            );
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Student not found.");
        }

        student = data;
        console.log("FULL STUDENT DATA:", student);
        console.log("LAST NAME:", student.last_name);

        // Display student information on the page
        document.getElementById("studentName").textContent =
            student.last_name || "no last name";

        document.getElementById("studentID").textContent =
            student.student_id || "";

        document.getElementById("statusRoom").textContent =
            student.room_assignment || "";

        document.getElementById("statusAddress").textContent =
            student.address || "";

        document.getElementById("statusDate").textContent =
            new Date().toLocaleDateString();

        document.getElementById("statusTime").textContent =
            new Date().toLocaleTimeString();

        document.getElementById("studentID").textContent =
            student.student_id || "";

        displayStatusCard(); 
        console.log("Student loaded successfully:", student);

    } catch (error) {
        console.error("Loading Error:", error);
        alert("Unable to load student information: " + error.message);
    }


}

    async function loadAttendanceHistory() {

    const historyTable = document.getElementById("recentHistory");

    try {

        const response = await fetch("./attendance_logs.php");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load attendance history.");
        }

        // Clear existing table content
        historyTable.innerHTML = "";

        // Check if there are attendance records
        if (data.history.length === 0) {

            historyTable.innerHTML = `
                <tr>
                    <td colspan="2">No attendance records found.</td>
                </tr>
            `;

            return;
        }

        // Display attendance records
        data.history.forEach(record => {

            const row = document.createElement("tr");

            const dateCell = document.createElement("td");
            const typeCell = document.createElement("td");

            dateCell.textContent = record.scan_datetime;

            typeCell.textContent = record.attendance_type;

            row.appendChild(dateCell);
            row.appendChild(typeCell);

            historyTable.appendChild(row);

        });

    } catch (error) {

        console.error("Attendance History Error:", error);

        historyTable.innerHTML = `
            <tr>
                <td colspan="2">Unable to load attendance history.</td>
            </tr>
        `;
    }
}

// Open QR modal
function openModal(action) {

    if (!student) {
        alert("Student information is not yet loaded.");
        return;
    }

    document.getElementById("qrModal").style.display = "block";

    document.getElementById("actionTitle").textContent = action;

    // Display student information in the modal
    document.getElementById("modalStudentName").textContent =
        student.last_name || "no last name";

    document.getElementById("modalStudentID").textContent =
        student.student_id || "";

    document.getElementById("roomType").textContent =
        student.room_assignment || "";

    document.getElementById("address").textContent =
        student.address || "";

    // Display current date and time
    const today = new Date();

    document.getElementById("date").textContent =
        today.toLocaleDateString();

    document.getElementById("time").textContent =
        today.toLocaleTimeString();

    // Generate QR code
    const qrContainer = document.getElementById("qrcode");

    qrContainer.innerHTML = "";

    new QRCode(qrContainer, {
        text: String(student.student_id),
        width: 180,
        height: 180
    });
}

// Close QR modal
function closeModal() {
    document.getElementById("qrModal").style.display = "none";
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById("qrModal");

    if (event.target === modal) {
        closeModal();
    }
};

// Load student information once when page opens
document.addEventListener("DOMContentLoaded", function() {

      console.log("Attendance page loaded!");

    loadStudent();

    loadAttendanceHistory();

});

function displayStatusCard() {
    if (!student) return;

    const now = new Date();
    document.getElementById("statusDate").textContent = now.toLocaleDateString();
    document.getElementById("statusTime").textContent = now.toLocaleTimeString();

    const statusQR = document.getElementById("statusQR");
    statusQR.innerHTML = "";

    new QRCode(statusQR, {
        text: String(student.student_id),
        width: 150,
        height: 150
    });
}