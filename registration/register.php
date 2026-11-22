<?php
require_once 'connection/db_connect.php';

$last_name = $_POST['last_name'];
$first_name = $_POST['first_name'];
$middle_name = $_POST['middle_name'];
$age = $_POST['age'];
$gender = $_POST['gender'];
$student_id = $_POST['student_id'];
$email = $_POST['email'];
$address = $_POST['address'];

$sql = "INSERT INTO validation_dormers
        (last_name, first_name, middle_name, age, gender, student_id, email, address)
        VALUES (?,?,?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "sssisiss",
    $last_name,
    $first_name,
    $middle_name,
    $age,
    $gender,
    $student_id,
    $email,
    $address,
);

// Execute query
if ($stmt->execute()) {

    echo "Student registered successfully!";

} else {

    echo "Registration failed: " . $stmt->error;

}

$stmt->close();
$conn->close();



?>