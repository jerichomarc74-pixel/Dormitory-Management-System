<?php
$host = "localhost";
$user = "root";
$password = "";
$database = "lnudormatorysystem";

// Create database connection
$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Database Connection Failed: " . $conn->connect_error);
}

?>
