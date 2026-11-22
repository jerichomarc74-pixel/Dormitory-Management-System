<?php
session_start();
require_once '../connection/db_connect.php';

$email = $_POST['username'];
$password = $_POST['password'];

$sql = "SELECT * FROM validated_dormers
        WHERE email = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param("s", $email);

$stmt->execute();

$result = $stmt->get_result();

// Check if account exists
if ($result->num_rows > 0) {

    $user = $result->fetch_assoc();

    // Verify password
    if ($password === $user['password']) {
      
        $_SESSION['student_id'] = $user['student_id'];
        header("Location: ../dormer/dashboard/dashboard.html");

    } else {

        echo "Incorrect password!";

    }

} else {

    echo "Account does not exist!";

}

$stmt->close();
$conn->close();


?>