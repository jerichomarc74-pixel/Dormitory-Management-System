
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

// GET FORM DATA
$student_id = trim($_POST["student_id"] ?? "");

$first_name = trim($_POST["first_name"] ?? "");
$middle_name = trim($_POST["middle_name"] ?? "");
$last_name = trim($_POST["last_name"] ?? "");
$age = trim($_POST["age"] ?? "");
$gender = trim($_POST["gender"] ?? "");
$email = trim($_POST["email"] ?? "");
$address = trim($_POST["address"] ?? "");
$room_assignment = trim($_POST["room_assignment"] ?? "");

// VALIDATE REQUIRED FIELDS
if (
    $student_id === "" ||
    $first_name === "" ||
    $last_name === "" ||
    $age === "" ||
    $gender === "" ||
    $email === "" ||
    $address === "" ||
    $room_assignment === ""
) {
    echo json_encode([
        "success" => false,
        "message" => "Please complete all required fields."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email address."
    ]);
    exit;
}

if (!ctype_digit($age) || (int)$age < 1) {
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid age."
    ]);
    exit;
}

try {

    // UPDATE VALIDATED DORMER
    $sql = "UPDATE validated_dormers SET
                first_name = ?,
                middle_name = ?,
                last_name = ?,
                age = ?,
                gender = ?,
                email = ?,
                address = ?,
                room_assignment = ?
            WHERE student_id = ?";

    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        throw new Exception("Unable to prepare update query.");
    }

    mysqli_stmt_bind_param(
        $stmt,
        "sssisssss",
        $first_name,
        $middle_name,
        $last_name,
        $age,
        $gender,
        $email,
        $address,
        $room_assignment,
        $student_id
    );

    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Unable to update student information.");
    }

    if (mysqli_stmt_affected_rows($stmt) === 0) {

        // Check whether the student exists.
        $check = "SELECT student_id
                  FROM validated_dormers
                  WHERE student_id = ?";

        $checkStmt = mysqli_prepare($conn, $check);
        mysqli_stmt_bind_param($checkStmt, "s", $student_id);
        mysqli_stmt_execute($checkStmt);

        $result = mysqli_stmt_get_result($checkStmt);
        $exists = mysqli_num_rows($result) > 0;

        mysqli_stmt_close($checkStmt);

        if (!$exists) {
            throw new Exception("Student account not found.");
        }
    }

    mysqli_stmt_close($stmt);

    echo json_encode([
        "success" => true,
        "message" => "Student information successfully updated."
    ]);

} catch (Throwable $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);

}
