
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dormitory QR Scanner</title>

    <script src="https://unpkg.com/html5-qrcode"></script>

    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            padding: 30px;
        }

        .scanner-container {
            background: white;
            max-width: 500px;
            margin: auto;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }

        #reader {
            width: 100%;
            margin-top: 20px;
        }

        #result {
            margin-top: 20px;
            font-weight: bold;
        }
    </style>
</head>

<body>

<div class="scanner-container">

    <h2>Dormitory Attendance Scanner</h2>

    <p>Scan the dormer's QR code to record attendance.</p>

    <div id="reader"></div>

    <div id="result">
        Waiting for QR code...
    </div>

</div>

<script>

    
let processing = false;

async function onScanSuccess(decodedText) {

    // Prevent multiple requests from the same scan
    if (processing) return;

    processing = true;

    // Stop the camera after detecting a QR code
    await scanner.clear();

    const resultDiv = document.getElementById("result");

    resultDiv.innerText = "Processing attendance...";

    try {

        const response = await fetch("process_scan.php", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                token: decodedText
            })
        });

      
const responseText = await response.text();

console.log("HTTP STATUS:", response.status);
console.log("PHP RESPONSE:", responseText);

let data;

try {
    data = JSON.parse(responseText);
} catch (error) {

    resultDiv.innerText = "PHP ERROR! Check browser console.";

    console.error("Invalid JSON returned by PHP:");
    console.error(responseText);

    return;
}

if (data.success) {

    resultDiv.innerText =
        data.message +
        "\nName: " + data.name +
        "\nStudent ID: " + data.student_id +
        "\nRoom: " + (data.room || "Not assigned") +
        "\nAttendance: " + data.attendance_type;

} else {

    resultDiv.innerText = data.message;

}


    } catch (error) {

        resultDiv.innerText =
            "Something went wrong. Please try again.";

        console.error(error);

    }

}


    const scanner = new Html5QrcodeScanner(
        "reader",
        {
            fps: 10,
            qrbox: {
                width: 250,
                height: 250
            }
        }
    );

    scanner.render(onScanSuccess);

</script>

</body>
</html>
