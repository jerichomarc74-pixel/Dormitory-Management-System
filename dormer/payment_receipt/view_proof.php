<?php
ob_start();

session_start();

require_once __DIR__ . '/../../connection/db_connect.php';

if (!isset($_SESSION['student_id'])) {
    http_response_code(401);
    exit();
}

$id = (int)($_GET['id'] ?? 0);

$stmt = $conn->prepare(
    "SELECT proof_image FROM payment_proofs WHERE proof_id = ? AND student_id = ?"
);
$stmt->bind_param("ii", $id, $_SESSION['student_id']);
$stmt->execute();

$result = $stmt->get_result();
$row = $result->fetch_assoc();

if ($row && $row['proof_image'] !== null) {

    $image = $row['proof_image'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);

    // Discard any stray output (spaces or warnings) so the image isn't corrupted
    ob_clean();

    header("Content-Type: " . $finfo->buffer($image));
    header("Content-Length: " . strlen($image));
    echo $image;

} else {

    http_response_code(404);

}

$stmt->close();
$conn->close();