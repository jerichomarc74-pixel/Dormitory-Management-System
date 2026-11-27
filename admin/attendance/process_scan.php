<?php
// IMPORTANT: no blank line or space before the opening php tag above.
header('Content-Type: application/json');

require_once '../../connection/db_connect.php';

// TODO: check that an admin is logged in (session) before continuing.

$data  = json_decode(file_get_contents('php://input'), true);
$token = trim($data['token'] ?? '');

if ($token === '') {
    echo json_encode(["success" => false, "message" => "QR token is missing."]);
    exit;
}

// Find the dormer using the QR token
$stmt = $conn->prepare(
    "SELECT student_id, first_name, last_name, room_assignment
     FROM validated_dormers
     WHERE qr_token = ?"
);
$stmt->bind_param("s", $token);
$stmt->execute();
$dormer = $stmt->get_result()->fetch_assoc();

if (!$dormer) {
    echo json_encode(["success" => false, "message" => "Invalid QR code."]);
    exit;
}

$student_id = $dormer['student_id'];

// Latest scan today. The 30-second check is done by MySQL itself so PHP and
// MySQL timezones can never disagree.
$stmt = $conn->prepare(
    "SELECT attendance_type, scan_datetime,
            TIMESTAMPDIFF(SECOND, scan_datetime, NOW()) AS seconds_ago
     FROM attendance_logs
     WHERE student_id = ? AND DATE(scan_datetime) = CURDATE()
     ORDER BY id DESC
     LIMIT 1"
);
$stmt->bind_param("s", $student_id);   // "s" works for int and text IDs
$stmt->execute();
$last = $stmt->get_result()->fetch_assoc();

if ($last) {
    if ((int)$last['seconds_ago'] < 30) {
        echo json_encode(["success" => false, "message" => "Please wait before scanning again."]);
        exit;
    }
    $type = ($last['attendance_type'] === 'IN') ? 'OUT' : 'IN';
} else {
    $type = 'IN';   // first scan of the day
}

$stmt = $conn->prepare(
    "INSERT INTO attendance_logs (student_id, attendance_type, scan_datetime)
     VALUES (?, ?, NOW())"
);
$stmt->bind_param("ss", $student_id, $type);

if ($stmt->execute()) {
    echo json_encode([
        "success"         => true,
        "message"         => "Attendance recorded successfully!",
        "name"            => $dormer['first_name'] . " " . $dormer['last_name'],
        "student_id"      => $student_id,
        "room"            => $dormer['room_assignment'],
        "attendance_type" => $type,
        "scan_time"       => date('Y-m-d H:i:s')
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to record attendance."]);
}
