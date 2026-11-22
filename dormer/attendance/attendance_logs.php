
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../../connection/db_connect.php';

// Check student login
if (!isset($_SESSION['student_id'])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Student not logged in."
    ]);

    exit();
}

// Get logged-in student ID
$student_id = $_SESSION['student_id'];

// Get attendance history
$sql = "SELECT attendance_type, scan_datetime
        FROM attendance_logs
        WHERE student_id = ?
        ORDER BY scan_datetime DESC
        LIMIT 10";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Database query failed."
    ]);

    exit();
}

$stmt->bind_param("s", $student_id);
$stmt->execute();

$result = $stmt->get_result();

$history = [];

while ($row = $result->fetch_assoc()) {
    $history[] = $row;
}

echo json_encode([
    "success" => true,
    "history" => $history
]);

$stmt->close();
$conn->close();
?>
