<?php

session_start();

require_once __DIR__ . '/../../connection/db_connect.php';

// Check if student is logged in
if (!isset($_SESSION['student_id'])) {
    die("Please log in first.");
}

// Get logged-in student's ID
$student_id = $_SESSION['student_id'];

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die("Invalid request.");
}

// Check if an image was uploaded
if (!isset($_FILES['proof_image'])) {
    die("No payment proof uploaded.");
}

$file = $_FILES['proof_image'];

// Check upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    die("Image upload failed.");
}

// Maximum file size: 5MB
if ($file['size'] > 5 * 1024 * 1024) {
    die("Image must not exceed 5MB.");
}

// Validate actual image type
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

$allowed_types = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png'
];

if (!isset($allowed_types[$mime])) {
    die("Only JPG and PNG images are allowed.");
}

// Read the image contents
$image_data = file_get_contents($file['tmp_name']);

if ($image_data === false) {
    die("Unable to read uploaded image.");
}

// Insert record into database
$sql = "INSERT INTO payment_proofs
        (student_id, proof_image, upload_datetime)
        VALUES (?, ?, NOW())";

$stmt = $conn->prepare($sql);

$null = null;
$stmt->bind_param("ib", $student_id, $null);

// Send the file contents to the blob parameter (index 1)
$stmt->send_long_data(1, $image_data);

if ($stmt->execute()) {

    echo "<script>
        alert('Payment proof uploaded successfully!');
        window.location.href = 'paymentReceipt.html';
    </script>";

} else {

    echo 'Database error: ' . htmlspecialchars($stmt->error);

}

$stmt->close();
$conn->close();

?>