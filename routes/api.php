<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IpfsController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NftController;
use App\Http\Controllers\Api\PriceController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\API\LikeController;
use App\Http\Controllers\API\PinController;
use App\Models\Kategori;
use App\Http\Controllers\TransaksiController;

Route::post('/transaksi/purchase', [TransaksiController::class, 'store']);
// Crypto Price API (no CORS issues - backend fetch)
Route::get('/crypto/price', [PriceController::class, 'getCryptoPrice']);
// 1. PUBLIC ROUTES (Tanpa Login)
Route::post('/login', [AuthController::class, 'loginEmail']);
Route::post('/login-wallet', [AuthController::class, 'loginWallet']);
Route::post('/wallet/challenge', [AuthController::class, 'walletChallenge']);
Route::post('/wallet/verify', [AuthController::class, 'walletVerify']);
Route::get('/produk', [ProdukController::class, 'index']); 
// PERBAIKAN: Tambah validasi angka agar tidak bentrok dengan endpoint lain
Route::get('/produk/{id}', [ProdukController::class, 'show'])->where('id', '[0-9]+');
Route::get('/kategori', fn() => response()->json(Kategori::all()));

// Check current user (dapat diakses baik login maupun tidak)
Route::get('/me', function (Request $request) {
    if ($request->user()) {
        return response()->json(['user' => $request->user()]);
    }
    return response()->json(['user' => null]);
});

// DEBUG: Check database directly
Route::get('/debug/produk-all', fn() => response()->json(\App\Models\Produk::all()));
Route::get('/debug/produk-count', fn() => response()->json(['count' => \App\Models\Produk::count()]));
Route::get('/debug/produk-user/{userId}', function ($userId) {
    return response()->json(\App\Models\Produk::where('user_idUser', $userId)->get());
});

// DEBUG: Messages
Route::get('/debug/messages-count', fn() => response()->json(['count' => \App\Models\Message::count()]));
Route::get('/debug/messages-all', fn() => response()->json(\App\Models\Message::select('idmessages', 'sender_id', 'receiver_id', 'messages_text', 'is_read')->limit(10)->get()));
Route::get('/debug/users', fn() => response()->json(\App\Models\User::select('idUser', 'name', 'email')->limit(5)->get()));

// DEBUG: Create sessions table
Route::get('/debug/create-sessions-table', function() {
    try {
        \Illuminate\Support\Facades\DB::statement("
            CREATE TABLE IF NOT EXISTS `sessions` (
                `id` VARCHAR(255) NOT NULL PRIMARY KEY,
                `user_id` BIGINT UNSIGNED NULL,
                `ip_address` VARCHAR(45) NULL,
                `user_agent` TEXT NULL,
                `payload` LONGTEXT NOT NULL,
                `last_activity` INT NOT NULL,
                INDEX `sessions_user_id_index` (`user_id`),
                INDEX `sessions_last_activity_index` (`last_activity`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        return response()->json(['success' => true, 'message' => 'Sessions table created or already exists']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// DEBUG: Create second test user for chat testing
Route::get('/debug/create-second-user', function() {
    try {
        $user = \App\Models\User::firstOrCreate(
            ['email' => 'user2@example.com'],
            [
                'name' => 'User Two',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'google_id' => 'email_login'
            ]
        );
        return response()->json(['success' => true, 'user' => $user, 'message' => 'Second user created or already exists']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// DEBUG: Create test message from user 1 to user 2
Route::get('/debug/create-test-message', function() {
    try {
        // Create message from user 19 (test@example.com) to user 20 (user2@example.com)
        $message = \App\Models\Message::create([
            'sender_id' => 19,
            'receiver_id' => 20,
            'messages_text' => 'Hello from user 1! This is a test message.',
            'is_read' => false,
            'created_at' => now(),
        ]);
        return response()->json(['success' => true, 'message' => $message, 'info' => 'Test message created from user 19 to user 20']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// DEBUG: Get conversations for a specific user (without auth required)
Route::get('/debug/conversations/{userId}', function($userId) {
    try {
        \Log::info('DEBUG: Getting conversations for user: ' . $userId);

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
        ", [$userId, $userId, $userId, $userId, $userId]);
        
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

        return response()->json(['success' => true, 'conversations' => $result, 'debug' => ['userId' => $userId, 'rawCount' => count($conversations)]]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
    }
});

// 2. PROTECTED ROUTES (Wajib Login / Punya Cookie Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    
    // User Info (Sinkronisasi React)
    Route::get('/user', function (Request $request) {
        return response()->json(['user' => $request->user()]);
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Produk CRUD
    // PERBAIKAN: Pindahkan handle-pembelian ke atas sebelum `{id}`
    Route::post('/produk/handle-pembelian', [ProdukController::class, 'handlePembelian']);
    Route::post('/produk', [ProdukController::class, 'store']); 
    Route::post('/transaksi/purchase', [TransaksiController::class, 'store']);
    Route::get('/transaksi/my-purchases', [TransaksiController::class, 'myPurchases']);
    Route::get('/transaksi/finance-analytics', [TransaksiController::class, 'financeAnalytics']);
    Route::get('/produk/user/my-products', [ProdukController::class, 'getUserProducts']);
    
    // PERBAIKAN: Tambahkan validasi angka di sini juga
    Route::put('/produk/{id}', [ProdukController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/produk/{id}', [ProdukController::class, 'destroy'])->where('id', '[0-9]+');
    
    // Like System
    Route::post('/like/toggle', [LikeController::class, 'toggleLike']);
    Route::get('/user/{userId}/likes', [LikeController::class, 'getUserLikes']);
    Route::post('/likes', [LikeController::class, 'likeProduct']);
    Route::delete('/likes/{userId}/{produkId}', [LikeController::class, 'unlikeProduct']);
    Route::get('/likes/user/{userId}', [LikeController::class, 'getUserLikes']);

    // Message System
    Route::post('/messages/send', [MessageController::class, 'sendMessage']);
    Route::get('/messages/conversation/{userId}', [MessageController::class, 'getConversation']);
    Route::get('/messages/conversations', [MessageController::class, 'getConversations']);
    Route::put('/messages/read/{userId}', [MessageController::class, 'markAsRead']);
    Route::get('/messages/unread-count', [MessageController::class, 'getUnreadCount']);
    Route::post('/nfts/buy-success', [App\Http\Controllers\ProdukController::class, 'buySuccess']);
    
    // User profile avatar upload
    Route::post('/user/avatar', [AuthController::class, 'updateAvatar']);
    Route::post('/user/bio', [AuthController::class, 'updateBio']);
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);

    // IPFS Upload (Pinata)
    Route::post('/ipfs/upload-asset', [IpfsController::class, 'uploadAsset']);
    Route::post('/ipfs/upload-metadata', [IpfsController::class, 'uploadMetadata']);

    // NFT Link to Product
    Route::post('/nfts/link', [NftController::class, 'linkToProduct']);

    // Follow / Unfollow
    Route::post('/user/{userId}/follow', [\App\Http\Controllers\FollowController::class, 'follow']);
    Route::delete('/user/{userId}/follow', [\App\Http\Controllers\FollowController::class, 'unfollow']);

    // Pin / Sematkan Produk
    Route::post('/pins', [PinController::class, 'pinProduct']);
    Route::delete('/pins/{userId}/{produkId}', [PinController::class, 'unpinProduct']);
    Route::get('/pins/user/{userId}', [PinController::class, 'getUserPins']);
});

// Public read-only endpoints for followers/following (visible tanpa login)
Route::get('/user/{userId}/followers', [\App\Http\Controllers\FollowController::class, 'followers']);
Route::get('/user/{userId}/following', [\App\Http\Controllers\FollowController::class, 'following']);