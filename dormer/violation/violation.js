
document.addEventListener("DOMContentLoaded", loadViolations);

async function loadViolations() {

    const curfewTable = document.getElementById("curfewRecords");

    try {

        const response = await fetch("./violation.php");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load violations.");
        }

        // Display offenses
        document.getElementById("offenses").textContent =
            data.offenses || "No offenses";

        // Display absent count
        document.getElementById("absent").textContent =
            data.absent ?? 0;

        // Clear curfew table
        curfewTable.innerHTML = "";

        if (!data.records || data.records.length === 0) {

            curfewTable.innerHTML = `
                <tr>
                    <td colspan="2">No curfew records found.</td>
                </tr>
            `;

            return;
        }

        // Display curfew records
        data.records.forEach(record => {

            const row = document.createElement("tr");

            const dateCell = document.createElement("td");
            const timeCell = document.createElement("td");

            if (record.curfew) {

                const parts = record.curfew.split(" ");
                const date = parts[0];
                const time = parts[1];

                dateCell.textContent = date;

                // Convert 24-hour time to 12-hour time
                const [hour, minute] = time.split(":");

                const hourNumber = Number(hour);

                const period = hourNumber >= 12 ? "PM" : "AM";

                const formattedHour =
                    (hourNumber % 12 || 12).toString().padStart(2, "0");

                timeCell.textContent =
                    `${formattedHour}:${minute} ${period}`;

            } else {

                dateCell.textContent = "No curfew record";
                timeCell.textContent = "-";

            }

            row.appendChild(dateCell);
            row.appendChild(timeCell);

            curfewTable.appendChild(row);

        });

        console.log("Violations loaded successfully!");

    } catch (error) {

        console.error("Violations Error:", error);

        document.getElementById("offenses").textContent = "Unable to load";
        document.getElementById("absent").textContent = "Unable to load";

        curfewTable.innerHTML = `
            <tr>
                <td colspan="2">Unable to load curfew records.</td>
            </tr>
        `;
    }
}
