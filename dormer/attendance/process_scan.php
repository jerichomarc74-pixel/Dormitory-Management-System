
<?php

header('Content-Type: application/json');

// Connect to your database
require_once '../../connection/db_connect.php';

// Receive the QR token
$data = json_decode(file_get_contents("php://input"), true);

$token = $data['token'] ?? '';

if (empty($token)) {
    echo json_encode([
        "success" => false,
        "message" => "QR token is missing."
    ]);
    exit;
}

// Find the dormer using the QR token
$sql = "SELECT student_id, first_name, last_name,
               room_assignment
        FROM validated_dormers
        WHERE qr_token = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $token);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid QR code."
    ]);
    exit;
}

$dormer = $result->fetch_assoc();

$student_id = $dormer['student_id'];

// Get the dormer's latest attendance TODAY
$sql = "SELECT attendance_type, scan_datetime
        FROM attendance_logs
        WHERE student_id = ?
        AND DATE(scan_datetime) = CURDATE()
        ORDER BY id DESC
        LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $student_id);
$stmt->execute();

$last = $stmt->get_result()->fetch_assoc();

// Prevent accidental repeated scans within 30 seconds
if ($last) {

    $last_time = strtotime($last['scan_datetime']);

    if (time() - $last_time < 30) {
        echo json_encode([
            "success" => false,
            "message" => "Please wait before scanning again."
        ]);
        exit;
    }

    // Alternate between IN and OUT
    $attendance_type =
        ($last['attendance_type'] === 'IN') ? 'OUT' : 'IN';

} else {

    // First scan of the day
    $attendance_type = 'IN';

}

// Insert attendance record
$sql = "INSERT INTO attendance_logs
        (student_id, attendance_type)
        VALUES (?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $student_id, $attendance_type);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "Attendance recorded successfully!",
        "name" => $dormer['first_name'] . " " . $dormer['last_name'],
        "student_id" => $student_id,
        "room" => $dormer['room_assignment'],
        "attendance_type" => $attendance_type
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Failed to record attendance."
    ]);

}

?>
