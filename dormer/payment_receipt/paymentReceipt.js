
// IMAGE PREVIEW
function initializeImagePreview() {

    const proofImage = document.getElementById("proofImage");

    if (!proofImage) return;

    proofImage.addEventListener("change", function(event) {

        const file = event.target.files[0];

        const previewContainer = document.getElementById("previewContainer");
        const previewImage = document.getElementById("previewImage");

        if (file) {

            if (!file.type.startsWith("image/")) {
                alert("Please select an image.");
                this.value = "";
                previewContainer.style.display = "none";
                return;
            }

            previewImage.src = URL.createObjectURL(file);
            previewContainer.style.display = "block";

        } else {

            previewContainer.style.display = "none";

        }

    });
}


// CURRENT DATE AND TIME
function updateDateTime() {

    const now = new Date();

    document.getElementById("currentDate").textContent =
        now.toLocaleDateString();

    document.getElementById("currentTime").textContent =
        now.toLocaleTimeString();

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

        if (!data.payments || data.payments.length === 0) {

            paymentList.innerHTML = `
                <p class="no-payments">
                    No payment proofs uploaded yet.
                </p>
            `;

            return;
        }

        data.payments.forEach(payment => {

            const record = document.createElement("div");
            record.className = "payment-record";

            const image = document.createElement("img");

            image.src = payment.proof_image;
            image.alt = "Proof of Payment";

            image.onerror = function() {
                console.error("Image failed to load:", payment.proof_image);
                this.alt = "Unable to load payment image";
            };

                      const details = document.createElement("div");
            details.className = "payment-details";

            const date = document.createElement("p");
            date.textContent = "Date: " + payment.date;

            const time = document.createElement("p");
            time.textContent = "Time: " + payment.time;

            // Status (Pending / Verified / Rejected)
            const status = payment.status || "Pending";

            const statusP = document.createElement("p");
            statusP.textContent = "Status: ";

            const badge = document.createElement("span");
            badge.className = "status-badge status-" + status.toLowerCase();
            badge.textContent = status;

            statusP.appendChild(badge);

            details.appendChild(date);
            details.appendChild(time);
            details.appendChild(statusP);

            record.appendChild(image);
            record.appendChild(details);

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

    setInterval(updateDateTime, 1000);

    loadPaymentHistory();

});
