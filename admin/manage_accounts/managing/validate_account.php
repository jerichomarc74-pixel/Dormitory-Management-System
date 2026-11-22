
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
$student_id = $_POST["student_id"] ?? "";
$floor = trim($_POST["floor"] ?? "");
$room = trim($_POST["room"] ?? "");

if ($student_id === "" || $floor === "" || $room === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please provide the student ID, floor, and room."
    ]);
    exit;
}

// COMBINE FLOOR AND ROOM
$room_assignment = $floor . " - " . $room;

// GENERATE RANDOM PASSWORD
function generatePassword() {

    $words = [
        "Tiger", "Cloud", "River", "Eagle",
        "Apple", "Ocean", "Moon", "Forest",
        "Silver", "Mountain", "Star", "Crystal",
        "Dragon", "Sunrise", "Thunder", "Garden"
    ];

    $word1 = $words[random_int(0, count($words) - 1)];
    $word2 = $words[random_int(0, count($words) - 1)];
    $numbers = random_int(1000, 9999);

    return $word1 . "-" . $word2 . "-" . $numbers;
}

$password = generatePassword();

// GENERATE UNIQUE QR TOKEN
$qr_token = bin2hex(random_bytes(32));

try {

    mysqli_begin_transaction($conn);

    // GET STUDENT INFORMATION
    $sql = "SELECT
                student_id,
                last_name,
                first_name,
                middle_name,
                age,
                gender,
                email,
                address
            FROM unvalidated_dormers
            WHERE student_id = ?
            FOR UPDATE";

    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "s", $student_id);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $student = mysqli_fetch_assoc($result);

    mysqli_stmt_close($stmt);

    if (!$student) {
        throw new Exception("Student account not found.");
    }

    // INSERT INTO VALIDATED DORMERS
    $insert = "INSERT INTO validated_dormers (
                    student_id,
                    last_name,
                    first_name,
                    middle_name,
                    age,
                    gender,
                    email,
                    address,
                    password,
                    qr_token,
                    room_assignment
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = mysqli_prepare($conn, $insert);

    mysqli_stmt_bind_param(
        $stmt,
        "ssssissssss",
        $student["student_id"],
        $student["last_name"],
        $student["first_name"],
        $student["middle_name"],
        $student["age"],
        $student["gender"],
        $student["email"],
        $student["address"],
        $password,
        $qr_token,
        $room_assignment
    );

    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Unable to validate student account.");
    }

    mysqli_stmt_close($stmt);

    // DELETE FROM UNVALIDATED DORMERS
    $delete = "DELETE FROM unvalidated_dormers
               WHERE student_id = ?";

    $stmt = mysqli_prepare($conn, $delete);
    mysqli_stmt_bind_param($stmt, "s", $student_id);
    mysqli_stmt_execute($stmt);

    if (mysqli_stmt_affected_rows($stmt) !== 1) {
        throw new Exception("Unable to remove the original student record.");
    }

    mysqli_stmt_close($stmt);

    // SAVE BOTH OPERATIONS
    mysqli_commit($conn);

    echo json_encode([
        "success" => true,
        "message" => "Student account successfully validated.",
        "password" => $password,
        "room_assignment" => $room_assignment
    ]);

} catch (Throwable $e) {

    mysqli_rollback($conn);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);

}
