<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ProdukController;

// Route Utama
Route::get('/', function () {
    return view('welcome');
});

// Route Studio (Dashboard)
Route::middleware(['auth'])->group(function () {
    Route::get('/studio', function () {
        return view('welcome'); // React akan mendeteksi path ini
    })->name('studio');
});

// Serve uploaded files from storage/app/public directly so avatars and backgrounds work on AWS even without public/storage symlink.
Route::get('/storage/{path}', function (string $path) {
    $safePath = str_replace(['\\', '..'], '/', $path);
    $fullPath = storage_path('app/public/' . ltrim($safePath, '/'));

    if (!is_file($fullPath) || !Storage::disk('public')->exists($safePath)) {
        abort(404);
    }

    $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

    return response()->file($fullPath, ['Content-Type' => $mimeType]);
})->where('path', '.+');

// Auth
Route::get('/login', function () {
    return view('welcome'); // React akan handle login via API
})->name('login');

Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);