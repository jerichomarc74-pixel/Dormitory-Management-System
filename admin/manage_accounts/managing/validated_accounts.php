<?php

require_once __DIR__ . '/../../../connection/db_connect.php';

// GET VALIDATED DORMERS
$sql = "SELECT
            student_id,
            first_name,
            middle_name,
            last_name,
            age,
            gender,
            email,
            address,
            room_assignment
        FROM validated_dormers
        ORDER BY last_name ASC";

$result = mysqli_query($conn, $sql);

?>

<?php if (!$result): ?>

    <tr>
        <td colspan="6" align="center">
            Database Error:
            <?php echo htmlspecialchars(mysqli_error($conn)); ?>
        </td>
    </tr>

<?php elseif (mysqli_num_rows($result) === 0): ?>

    <tr>
        <td colspan="6" align="center">
            No validated student accounts.
        </td>
    </tr>

<?php else: ?>

    <?php while ($student = mysqli_fetch_assoc($result)): ?>

        <?php
            $fullName = trim(
                $student['first_name'] . ' ' .
                ($student['middle_name'] ?? '') . ' ' .
                $student['last_name']
            );
        ?>

        <tr>

            <td>
                <?php echo htmlspecialchars($student['student_id']); ?>
            </td>

            <td>
                <?php echo htmlspecialchars($fullName); ?>
            </td>

            <td>
                <?php echo htmlspecialchars($student['age']); ?>
            </td>

            <td>
                <?php echo htmlspecialchars($student['gender']); ?>
            </td>

            <td>
                <?php echo htmlspecialchars($student['email']); ?>
            </td>

            <td>
                
                <button
                    type="button"
                    class="viewValidatedBtn"

                    data-id="<?php echo htmlspecialchars($student['student_id'], ENT_QUOTES, 'UTF-8'); ?>"
                    data-firstname="<?php echo htmlspecialchars($student['first_name'], ENT_QUOTES, 'UTF-8'); ?>"
                    data-middlename="<?php echo htmlspecialchars($student['middle_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"
                    data-lastname="<?php echo htmlspecialchars($student['last_name'], ENT_QUOTES, 'UTF-8'); ?>"
                    data-age="<?php echo htmlspecialchars($student['age'], ENT_QUOTES, 'UTF-8'); ?>"
                    data-gender="<?php echo htmlspecialchars($student['gender'], ENT_QUOTES, 'UTF-8'); ?>"
                    data-email="<?php echo htmlspecialchars($student['email'], ENT_QUOTES, 'UTF-8'); ?>"
                    data-address="<?php echo htmlspecialchars($student['address'], ENT_QUOTES, 'UTF-8'); ?>"
                    data-room="<?php echo htmlspecialchars($student['room_assignment'], ENT_QUOTES, 'UTF-8'); ?>">

                    View

                </button>

            </td>

        </tr>

    <?php endwhile; ?>

<?php endif; ?>