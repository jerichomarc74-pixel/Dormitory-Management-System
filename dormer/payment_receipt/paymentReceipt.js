
 // IMAGE PREVIEW
function initializeImagePreview() {

    const proofImage = document.getElementById("proofImage");

    if (!proofImage) return;

    proofImage.addEventListener("change", function(event) {

        const file = event.target.files[0];

        const previewContainer = document.getElementById("previewContainer");
        const previewImage = document.getElementById("previewImage");

        if (!previewContainer || !previewImage) return;

        if (file) {

            if (!file.type.startsWith("image/")) {
                alert("Please select an image.");
                this.value = "";
                previewContainer.style.display = "none";
                return;
            }

            // Remove previous preview URL
            if (previewImage.dataset.objectUrl) {
                URL.revokeObjectURL(previewImage.dataset.objectUrl);
            }

            // Create new preview
            const objectUrl = URL.createObjectURL(file);

            previewImage.src = objectUrl;
            previewImage.dataset.objectUrl = objectUrl;

            previewContainer.style.display = "block";

        } else {

            previewContainer.style.display = "none";

        }

    });
}


// CURRENT DATE AND TIME
function updateDateTime() {

    const currentDate = document.getElementById("currentDate");
    const currentTime = document.getElementById("currentTime");

    const now = new Date();

    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString();
    }

    if (currentTime) {
        currentTime.textContent = now.toLocaleTimeString();
    }

}


// LOAD PAYMENT HISTORY
async function loadPaymentHistory() {

    const paymentList = document.getElementById("paymentProofList");

    if (!paymentList) {
        console.error("Payment history container not found.");
        return;
    }

    try {

        const response = await fetch("./paymentDisplay.php");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load payment history.");
        }

        paymentList.innerHTML = "";

        // No payment records
        if (!data.payments || data.payments.length === 0) {

            paymentList.innerHTML = `
                <p class="no-payments">
                    No payment proofs uploaded yet.
                </p>
            `;

            return;
        }

        // Display each payment record
        data.payments.forEach(payment => {

            const record = document.createElement("div");
            record.className = "payment-record";

            // PAYMENT IMAGE (FROM DATABASE BLOB)
            const image = document.createElement("img");

            image.alt = "Proof of Payment";
            image.loading = "lazy";

            // Use image_url provided by paymentDisplay.php
            image.src = payment.image_url;

            image.onerror = function() {
                console.error("Payment image failed to load:", payment.image_url);
                this.alt = "Unable to load payment image";
            };

            image.onload = function() {
                console.log("Payment image loaded successfully:", payment.image_url);
            };

            // PAYMENT DETAILS
            const details = document.createElement("div");
            details.className = "payment-details";

            const date = document.createElement("p");
            date.textContent = "Date: " + (payment.date || "N/A");

            const time = document.createElement("p");
            time.textContent = "Time: " + (payment.time || "N/A");

            // PAYMENT STATUS
            const status = payment.status || "Pending";

            const statusP = document.createElement("p");
            statusP.textContent = "Status: ";

            const badge = document.createElement("span");

            badge.className = "status-badge status-" +
                status.toLowerCase().replace(/[^a-z0-9-]/g, "");

            badge.textContent = status;

            statusP.appendChild(badge);

            // Append details
            details.appendChild(date);
            details.appendChild(time);
            details.appendChild(statusP);

            // Append image and details to record
            record.appendChild(image);
            record.appendChild(details);

            // Append record to page
            paymentList.appendChild(record);

        });

        console.log("Payment history loaded successfully.");

    } catch (error) {

        console.error("Payment History Error:", error);

        paymentList.innerHTML = `
            <p class="no-payments">
                Unable to load payment history.
            </p>
        `;

    }

}


// INITIALIZE EVERYTHING
document.addEventListener("DOMContentLoaded", function() {

    console.log("Payment Receipt Page Loaded!");

    initializeImagePreview();

    updateDateTime();

    // Update date and time every second
    setInterval(updateDateTime, 1000);

    // Load payment history
    loadPaymentHistory();

});
