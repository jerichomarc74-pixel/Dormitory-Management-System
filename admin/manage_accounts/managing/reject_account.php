<?php

header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db_connect.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request."
    ]);
    exit;
}

// GET STUDENT ID
$student_id = trim($_POST["student_id"] ?? "");

if ($student_id === "") {
    echo json_encode([
        "success" => false,
        "message" => "Student ID is required."
    ]);
    exit;
}

// REJECT = REMOVE FROM UNVALIDATED DORMERS
$sql = "DELETE FROM unvalidated_dormers WHERE student_id = ?";

$stmt = mysqli_prepare($conn, $sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare reject query."
    ]);
    exit;
}

mysqli_stmt_bind_param($stmt, "s", $student_id);

if (mysqli_stmt_execute($stmt)) {

    if (mysqli_stmt_affected_rows($stmt) === 1) {

        echo json_encode([
            "success" => true,
            "message" => "Registration rejected."
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Registration not found."
        ]);

    }

} else {

    echo json_encode([
        "success" => false,
        "message" => "Unable to reject registration."
    ]);

}

mysqli_stmt_close($stmt);
mysqli_close($conn);

?>
