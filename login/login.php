
<?php
session_start();

require_once "../connection/db_connect.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $email = trim($_POST["email"]);
    $password = $_POST["password"];

    // STEP 1: Check if the account belongs to admin/personnel
    $sql = "SELECT * FROM dorm_personnel WHERE email = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {

        // Admin password is hashed
        if (password_verify($password, $row["password"])) {

            $_SESSION["admin_id"] = $row["personnel_id"];
            $_SESSION["admin_email"] = $row["email"];
            $_SESSION["admin_name"] = $row["first_name"];
            $_SESSION["admin_lastname"] = $row["last_name"];
            $_SESSION["personnel_type"] = $row["personnel_type"];

            $stmt->close();
            $conn->close();

            header("Location: ../admin/dashboard/dashboard.html");
            exit();

        } else {

            echo "Invalid email or password.";
            exit();
        }

    }

    $stmt->close();


    // STEP 2: If not admin, check if the account belongs to a student
    $sql = "SELECT * FROM validated_dormers WHERE email = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {

        // Student password is currently plaintext
        if ($password === $row["password"]) {

            $_SESSION["student_id"] = $row["student_id"];

            $stmt->close();
            $conn->close();

            header("Location: ../dormer/dashboard/dashboard.html");
            exit();

        } else {

            echo "Invalid email or password.";
            exit();
        }

    } else {

        echo "Account does not exist.";
    }

    $stmt->close();
    $conn->close();

}
?>
