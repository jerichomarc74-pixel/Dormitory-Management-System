<?php
session_start();

header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db_connect.php';

// Check if student is logged in
if (!isset($_SESSION['student_id'])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Student not logged in."
    ]);

    exit();
}
// Get the logged-in student's ID
$student_id = $_SESSION['student_id'];

// Get ONLY the information belonging to this student
$sql = "SELECT student_id, last_name, room_assignment, address
        FROM validated_dormers
        WHERE student_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_id);
$stmt->execute();

$result = $stmt->get_result();

$student = $result->fetch_assoc();

if ($student) {

    echo json_encode([
        "success" => true,
        "student_id" => $student['student_id'],
        "last_name" => $student['last_name'],
        "room_assignment" => $student['room_assignment'],
        "address" => $student['address'],

        // Temporary debugging
        "debug_data" => $student
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Student not found."
    ]);

}
?>






