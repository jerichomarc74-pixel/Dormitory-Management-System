
<?php

session_start();

header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db_connect.php';

// Check student session
if (!isset($_SESSION['student_id'])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in first."
    ]);

    exit();
}

$student_id = $_SESSION['student_id'];

// Get only this student's payment proofs
$sql = "SELECT proof_image, upload_datetime, status
        FROM payment_proofs
        WHERE student_id = ?
        ORDER BY upload_datetime DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $student_id);
$stmt->execute();

$result = $stmt->get_result();

$payments = [];

while ($row = $result->fetch_assoc()) {

    $timestamp = strtotime($row['upload_datetime']);
    $payments[] = [
        "proof_image" => $row['proof_image'],
        "date" => date("F d, Y", $timestamp),
        "time" => date("h:i:s A", $timestamp),
        "status" => $row['status'] ?? "Pending"
    ];

}

echo json_encode([
    "success" => true,
    "payments" => $payments
]);

$stmt->close();
$conn->close();

?>
