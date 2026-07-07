<?php
// Simple test script to check messages functionality

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\Message;
use App\Models\User;

try {
    // Get all messages
    $messages = Message::all();
    echo "Total messages in database: " . count($messages) . "\n";
    
    foreach ($messages as $msg) {
        echo "---\n";
        echo "ID: " . $msg->idmessages . "\n";
        echo "From: {$msg->sender_id} To: {$msg->receiver_id}\n";
        echo "Text: " . substr($msg->messages_text, 0, 50) . "...\n";
        echo "Read: " . ($msg->is_read ? "Yes" : "No") . "\n";
        echo "Created: " . $msg->created_at . "\n";
    }
    
    // Check table structure
    echo "\n=== Messages Table Structure ===\n";
    $connection = \Illuminate\Support\Facades\DB::connection();
    $columns = $connection->getSchemaBuilder()->getColumns('messages');
    
    foreach ($columns as $col) {
        echo $col['name'] . " (" . $col['type'] . ")\n";
    }
    
    // Test insert
    echo "\n=== Testing Insert ===\n";
    
    $users = User::limit(2)->get();
    if (count($users) >= 2) {
        $sender = $users[0];
        $receiver = $users[1];
        
        $msg = Message::create([
            'sender_id' => $sender->idUser ?? $sender->id,
            'receiver_id' => $receiver->idUser ?? $receiver->id,
            'messages_text' => 'Test message at ' . now(),
            'is_read' => false,
            'created_at' => now(),
        ]);
        
        echo "Message created: " . $msg->idmessages . "\n";
    }
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
