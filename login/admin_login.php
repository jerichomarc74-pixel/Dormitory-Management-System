
<?php
session_start();

require_once "../connection/db_connect.php";

$message = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Retrieve login credentials
    $email = trim($_POST["email"]);
    $password = $_POST["password"];

    // Find personnel using email
    $sql = "SELECT * FROM dorm_personnel WHERE email = ?";

    $stmt = mysqli_prepare($conn, $sql);

    if ($stmt) {

        mysqli_stmt_bind_param($stmt, "s", $email);
        mysqli_stmt_execute($stmt);

        $result = mysqli_stmt_get_result($stmt);

        if ($row = mysqli_fetch_assoc($result)) {

            // Verify hashed password
            if (password_verify($password, $row["password"])) {

                // Store session information
                $_SESSION["admin_id"] = $row["personnel_id"];
                $_SESSION["admin_email"] = $row["email"];
                $_SESSION["admin_name"] = $row["first_name"];
                $_SESSION["admin_lastname"] = $row["last_name"];
                $_SESSION["personnel_type"] = $row["personnel_type"];

                // Redirect to admin dashboard
                header("Location: ../admin/dashboard.html");
                exit();

            } else {

                $message = "Invalid email or password.";

            }

        } else {

            $message = "Invalid email or password.";

        }

        mysqli_stmt_close($stmt);

    } else {

        $message = "Database query failed.";

    }
}
?>
