
// LOAD UNVALIDATED ACCOUNTS
function loadUnvalidatedAccounts() {

    fetch("unvalidated_accounts.php")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load unvalidated accounts.");
            }

            return response.text();
        })
        .then(data => {
            document.getElementById("unvalidatedTable").innerHTML = data;
        })
        .catch(error => {
            document.getElementById("unvalidatedTable").innerHTML =
                `<tr>
                    <td colspan="5" align="center">
                        Unable to load unvalidated accounts.
                    </td>
                </tr>`;

            console.error(error);
        });

}


// LOAD VALIDATED ACCOUNTS
function loadValidatedAccounts() {

    fetch("validated_accounts.php")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load validated accounts.");
            }

            return response.text();
        })
        .then(data => {
            document.getElementById("validatedTable").innerHTML = data;
        })
        .catch(error => {
            document.getElementById("validatedTable").innerHTML =
                `<tr>
                    <td colspan="4" align="center">
                        Unable to load validated accounts.
                    </td>
                </tr>`;

            console.error(error);
        });

}


// LOAD BOTH TABLES WHEN THE PAGE IS READY
document.addEventListener("DOMContentLoaded", function() {

    loadUnvalidatedAccounts();

    loadValidatedAccounts();

});


// VIEW UNVALIDATED STUDENT
document.addEventListener("click", function(event) {

    if (event.target.classList.contains("viewUnvalidatedBtn")) {

        const name = event.target.dataset.name;
        const email = event.target.dataset.email;

        document.getElementById("viewName").value = name;
        document.getElementById("viewEmail").value = email;

        document.getElementById("viewModal").style.display = "block";

    }

});

// CLOSE MODAL
document.getElementById("closeModal").addEventListener("click", function() {

    document.getElementById("viewModal").style.display = "none";

});


// OPEN STUDENT MODAL
document.addEventListener("click", function(event) {

    if (event.target.classList.contains("viewUnvalidatedBtn")) {

        document.getElementById("validateStudentId").value =
            event.target.dataset.studentId;

        document.getElementById("viewName").value =
            event.target.dataset.name;

        document.getElementById("viewEmail").value =
            event.target.dataset.email;

        document.getElementById("validationResult").style.display = "none";
        document.getElementById("validateForm").style.display = "block";

        document.getElementById("viewModal").style.display = "block";

    }

});




// VIEW VALIDATED ACCOUNT
document.addEventListener("click", function(event) {

    const button = event.target.closest(".viewValidatedBtn");

    if (!button) return;

    // GET STUDENT INFORMATION
    document.getElementById("viewStudentId").value =
        button.dataset.id;

    document.getElementById("viewStudentName").textContent =
        button.dataset.name;

    document.getElementById("viewStudentEmail").textContent =
        button.dataset.email;

    document.getElementById("viewStudentRoom").textContent =
        button.dataset.room;

    document.getElementById("viewStudentFloor").textContent =
        "Not available";

    // OPEN ACCOUNT VIEW MODAL
    document.getElementById("accountViewModal").showModal();

});


// CLOSE ACCOUNT VIEW MODAL
document.getElementById("viewCloseBtn").addEventListener("click", function() {

    document.getElementById("accountViewModal").close();

});





// SELECTED STUDENT
let selectedValidatedButton = null;


// VIEW VALIDATED ACCOUNT
document.addEventListener("click", function(event) {

    const button = event.target.closest(".viewValidatedBtn");

    if (!button) return;

    // SAVE SELECTED BUTTON
    selectedValidatedButton = button;

    const student = button.dataset;

    // GET FULL NAME
    const fullName = [
        student.firstname,
        student.middlename,
        student.lastname
    ].filter(Boolean).join(" ");

    // SPLIT FLOOR AND ROOM
    const assignment = student.room || "";

    const roomParts = assignment.split(" - ");

    const floor = roomParts[0] || "Not available";
    const room = roomParts.slice(1).join(" - ") || "Not available";

    // DISPLAY INFORMATION
    document.getElementById("viewStudentId").value = student.id;

    document.getElementById("viewStudentName").textContent = fullName;

    document.getElementById("viewStudentEmail").textContent = student.email;

    document.getElementById("viewStudentFloor").textContent = floor;

    document.getElementById("viewStudentRoom").textContent = room;

    // OPEN ACCOUNT MODAL
    document.getElementById("accountViewModal").showModal();

});


// OPEN MODIFY ACCOUNT MODAL
document.getElementById("viewModifyBtn").addEventListener("click", function() {

    if (!selectedValidatedButton) {
        alert("No student selected.");
        return;
    }

    const student = selectedValidatedButton.dataset;

    // POPULATE MODIFY FORM
    document.getElementById("editStudentId").value = student.id;

    document.getElementById("editFirstName").value = student.firstname;

    document.getElementById("editMiddleName").value = student.middlename;

    document.getElementById("editLastName").value = student.lastname;

    document.getElementById("editAge").value = student.age;

    document.getElementById("editGender").value = student.gender;

    document.getElementById("editEmail").value = student.email;

    document.getElementById("editAddress").value = student.address;

    document.getElementById("editRoomAssignment").value = student.room;

    // CLOSE VIEW MODAL
    document.getElementById("accountViewModal").close();

    // OPEN MODIFY MODAL
    document.getElementById("modifyAccountModal").showModal();

});


// CLOSE MODIFY MODAL
document.getElementById("cancelModifyBtn").addEventListener("click", function() {

    document.getElementById("modifyAccountModal").close();

});


// UPDATE VALIDATED DORMER
document.getElementById("modifyAccountForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const formData = new FormData(this);

    fetch("update_account.php", {
        method: "POST",
        body: formData
    })

    .then(response => {
        if (!response.ok) {
            throw new Error("Server error while updating account.");
        }

        return response.json();
    })

    .then(data => {

        if (data.success) {

            alert(data.message);

            // CLOSE MODIFY MODAL
            document.getElementById("modifyAccountModal").close();

            // REFRESH VALIDATED ACCOUNTS TABLE
            loadValidatedAccounts();

        } else {

            alert(data.message);

        }

    })

    .catch(error => {

        console.error(error);

        alert("Something went wrong while updating the account.");

    });

});



// DELETE VALIDATED DORMER
document.getElementById("viewDeleteBtn").addEventListener("click", function() {

    if (!selectedValidatedButton) {
        alert("No student selected.");
        return;
    }

    // GET SELECTED STUDENT ID
    const studentId = selectedValidatedButton.dataset.id;

    // CONFIRM DELETION
    const confirmDelete = confirm(
        "Are you sure you want to delete this dormer account?"
    );

    if (!confirmDelete) {
        return;
    }

    const formData = new FormData();

    formData.append("student_id", studentId);

    fetch("delete_account.php", {
        method: "POST",
        body: formData
    })

    .then(response => response.json())

    .then(data => {

        if (data.success) {

            alert(data.message);

            // CLOSE VIEW MODAL
            document.getElementById("accountViewModal").close();

            // CLEAR SELECTED STUDENT
            selectedValidatedButton = null;

            // REFRESH VALIDATED TABLE
            loadValidatedAccounts();

        } else {

            alert(data.message);

        }

    })

    .catch(error => {

        console.error(error);

        alert("Something went wrong while deleting the account.");

    });

});

