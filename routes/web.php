<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProdukController; 
use App\Http\Controllers\Api\AuthController; 
use Illuminate\Support\Facades\Auth;

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

// Auth
Route::get('/login', function () {
    return view('welcome'); // React akan handle login via API
})->name('login');

Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);