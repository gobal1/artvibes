<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    // Get all messages between two users
    public function getConversation($userId)
    {
        $authUser = auth()->user();
        
        // Get correct auth user ID (use idUser if available, fallback to id)
        $authUserId = $authUser->idUser ?? $authUser->id;
        $receiverId = $userId;
        
        $messages = Message::where(function ($query) use ($authUserId, $receiverId) {
            $query->where('sender_id', $authUserId)
                  ->where('receiver_id', $receiverId);
        })->orWhere(function ($query) use ($authUserId, $receiverId) {
            $query->where('sender_id', $receiverId)
                  ->where('receiver_id', $authUserId);
        })->with(['sender', 'receiver'])
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json($messages);
    }

    // Send a message
    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:user,idUser',
            'messages_text' => 'required|string',
        ]);

        $authUser = auth()->user();
        
        // Get correct auth user ID (use idUser if available, fallback to id)
        $authUserId = $authUser->idUser ?? $authUser->id;

        $message = Message::create([
            'sender_id' => $authUserId,
            'receiver_id' => $request->receiver_id,
            'messages_text' => $request->messages_text,
            'is_read' => false,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $message->load(['sender', 'receiver']),
        ], 201);
    }

    // Mark message as read
    public function markAsRead($userId)
    {
        $authUser = auth()->user();
        
        // Get correct auth user ID (use idUser if available, fallback to id)
        $authUserId = $authUser->idUser ?? $authUser->id;

        Message::where('sender_id', $userId)
                ->where('receiver_id', $authUserId)
                ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    // Get all conversations with last message
    public function getConversations()
    {
        $authUser = auth()->user();
        
        // Get correct auth user ID (use idUser if available, fallback to id)
        $authUserId = $authUser->idUser ?? $authUser->id;
        
        \Log::info('Getting conversations for user: ' . $authUserId);

        $conversations = DB::select("
            SELECT DISTINCT 
                CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END as user_id,
                (SELECT messages_text FROM messages m2 
                 WHERE (m2.sender_id = m.sender_id AND m2.receiver_id = m.receiver_id)
                    OR (m2.sender_id = m.receiver_id AND m2.receiver_id = m.sender_id)
                 ORDER BY CASE WHEN m2.created_at IS NULL THEN 0 ELSE 1 END DESC, m2.idmessages DESC LIMIT 1) as last_message,
                (SELECT m2.idmessages FROM messages m2 
                 WHERE (m2.sender_id = m.sender_id AND m2.receiver_id = m.receiver_id)
                    OR (m2.sender_id = m.receiver_id AND m2.receiver_id = m.sender_id)
                 ORDER BY CASE WHEN m2.created_at IS NULL THEN 0 ELSE 1 END DESC, m2.idmessages DESC LIMIT 1) as last_message_id,
                (SELECT COUNT(*) FROM messages m3 
                 WHERE m3.sender_id = ? AND m3.receiver_id = 
                 CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
                 AND is_read = 0) as unread_count
            FROM messages m
            WHERE sender_id = ? OR receiver_id = ?
            ORDER BY last_message_id DESC
        ", [$authUserId, $authUserId, $authUserId, $authUserId, $authUserId]);
        
        \Log::info('Raw conversations data: ' . json_encode($conversations));

        $result = [];
        foreach ($conversations as $conv) {
            try {
                $user = \App\Models\User::find($conv->user_id);
                if ($user) {
                    $result[] = [
                        'other_user_id' => $conv->user_id,
                        'other_user' => $user,
                        'last_message' => $conv->last_message,
                        'unread_count' => (int)$conv->unread_count,
                    ];
                }
            } catch (\Exception $e) {
                \Log::error('Error getting user for conversation: ' . $e->getMessage());
            }
        }
        
        \Log::info('Final conversations result: ' . json_encode($result));

        return response()->json($result);
    }

    // Get unread message count
    public function getUnreadCount()
    {
        $authUser = auth()->user();
        
        // Get correct auth user ID (use idUser if available, fallback to id)
        $authUserId = $authUser->idUser ?? $authUser->id;

        $unreadCount = Message::where('receiver_id', $authUserId)
                              ->where('is_read', false)
                              ->count();

        return response()->json(['unread_count' => $unreadCount]);
    }
}
