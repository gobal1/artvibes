<?php
// Helper script untuk test messages
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simple database test
$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'art_vibes_creative';

try {
    $conn = new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    echo "=== DATABASE TEST ===\n";
    
    // Check if messages table exists
    $result = $conn->query("SHOW TABLES LIKE 'messages'");
    if ($result->num_rows > 0) {
        echo "✓ Messages table exists\n";
        
        // Get table structure
        echo "\n=== Messages Table Structure ===\n";
        $result = $conn->query("DESC messages");
        while ($row = $result->fetch_assoc()) {
            echo $row['Field'] . " (" . $row['Type'] . ")" . ($row['Null'] === 'NO' ? " NOT NULL" : "") . "\n";
        }
        
        // Count messages
        echo "\n=== Messages Count ===\n";
        $result = $conn->query("SELECT COUNT(*) as count FROM messages");
        $row = $result->fetch_assoc();
        echo "Total messages: " . $row['count'] . "\n";
        
        // Show recent messages
        echo "\n=== Recent Messages ===\n";
        $result = $conn->query("SELECT * FROM messages ORDER BY created_at DESC LIMIT 5");
        while ($row = $result->fetch_assoc()) {
            echo "ID: {$row['idmessages']}, From: {$row['sender_id']} To: {$row['receiver_id']}, Text: " . substr($row['messages_text'], 0, 30) . "...\n";
        }
        
    } else {
        echo "✗ Messages table NOT found!\n";
    }
    
    // Check users
    echo "\n=== Users ===\n";
    $result = $conn->query("SELECT idUser, id, name, email FROM user LIMIT 3");
    while ($row = $result->fetch_assoc()) {
        echo "idUser: {$row['idUser']}, id: {$row['id']}, name: {$row['name']}\n";
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
