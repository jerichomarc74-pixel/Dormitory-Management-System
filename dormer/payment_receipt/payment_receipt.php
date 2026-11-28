
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
    'image/png' => 'png'
];

if (!isset($allowed_types[$mime])) {
    die("Only JPG and PNG images are allowed.");
}

// Create upload folder if it does not exist
$upload_dir = __DIR__ . '/uploads/payment_proofs/';

if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Generate unique filename
$extension = $allowed_types[$mime];

$filename = 'proof_' . $student_id . '_' .
            bin2hex(random_bytes(8)) . '.' . $extension;

$file_path = $upload_dir . $filename;

// Move uploaded image
if (!move_uploaded_file($file['tmp_name'], $file_path)) {
    die("Unable to save uploaded image.");
}

// Save relative image path
$image_path = 'uploads/payment_proofs/' . $filename;

// Insert record into database
$sql = "INSERT INTO payment_proofs
        (student_id, proof_image, upload_datetime)
        VALUES (?, ?, NOW())";

$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $student_id, $image_path);

if ($stmt->execute()) {

    echo "
    <script>
        alert('Payment proof uploaded successfully!');
        window.location.href = 'paymentReceipt.html';
    </script>
    ";

} else {

    // Remove uploaded image if database insertion fails
    unlink($file_path);

    echo 'Database error: ' . htmlspecialchars($stmt->error);
}

$stmt->close();
$conn->close();

?>
