<?php

require_once '../connection/db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve form data
    $lastName = $_POST["LastName"];
    $firstName = $_POST["FirstName"];
    $middleInitial = $_POST["MiddleInitial"];
    $age = $_POST["age"];
    $gender = $_POST["gender"];
    $personnelType = $_POST["personnel_type"];
    $email = $_POST["email"];
    $password = $_POST["password"];
    $reEnterPassword = $_POST["Re_EnterPassword"];


}

 // Check if passwords match
    if ($password !== $reEnterPassword) {

        $message = "Passwords do not match!";

    } 
    else {

        // Hash password before saving
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Insert data into dorm_personnel table
        $sql = "INSERT INTO dorm_personnel
                (last_name, first_name, middle_initial, age, gender,
                 personnel_type, email, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {

            mysqli_stmt_bind_param(
                $stmt,
                "sssissss",
                $lastName,
                $firstName,
                $middleInitial,
                $age,
                $gender,
                $personnelType,
                $email,
                $hashedPassword
            );

            if (mysqli_stmt_execute($stmt)) {

                $message = "Personnel registered successfully!";
                header("Location: ../login/login.html");
                exit();
            } else {

                $message = "Error: " . mysqli_stmt_error($stmt);

            }

            mysqli_stmt_close($stmt);

        } else {

            $message = "Database error: " . mysqli_error($conn);

        }
    }

?>