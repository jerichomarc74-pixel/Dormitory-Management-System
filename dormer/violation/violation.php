
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../../connection/db_connect.php';

// Check student login
$student_id = $_SESSION['student_id'] ?? null;

if ($student_id === null) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in first."
    ]);

    exit();
}

// Retrieve violation records
$sql = "SELECT violation_id, offenses, absent, curfew
        FROM dormer_violation
        WHERE student_id = ?
        ORDER BY violation_id DESC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Database query failed."
    ]);

    exit();
}

$stmt->bind_param("i", $student_id);
$stmt->execute();

$result = $stmt->get_result();

$records = $result->fetch_all(MYSQLI_ASSOC);

$offenses = $records[0]['offenses'] ?? 'No offenses';
$absent = $records[0]['absent'] ?? 0;

echo json_encode([
    "success" => true,
    "offenses" => $offenses,
    "absent" => $absent,
    "records" => $records
]);

$stmt->close();
$conn->close();
?>
