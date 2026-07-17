<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    private function normalizeWalletAddress(string $address): string
    {
        return strtolower(trim($address));
    }

    private function buildWalletSignMessage(string $nonce): string
    {
        return "ArtVibes Wallet Verification\nNonce: {$nonce}";
    }

    private function normalizeEmail(?string $email): ?string
    {
        return $email ? strtolower(trim($email)) : null;
    }

    private function isWalletOnlyPlaceholder(User $user): bool
    {
        $email = $this->normalizeEmail($user->email);

        return $user->google_id === 'wallet_login'
            && $email
            && str_ends_with($email, '@artvibes.local');
    }
    // Cek User Login (Untuk Frontend)
    public function getAuthenticatedUser() {
        return response()->json(['user' => Auth::user()]);
    }

    public function walletChallenge(Request $request)
    {
        $request->validate([
            'wallet_address' => 'required|string|min:42|max:42',
        ]);

        $walletAddress = $this->normalizeWalletAddress($request->wallet_address);
        $nonce = Str::uuid()->toString();

        if (Auth::check()) {
            $user = Auth::user();
            $user->wallet_nonce = $nonce;
            $user->save();
        } else {
            $existingUser = User::where('wallet_address', $walletAddress)->first();
            if ($existingUser) {
                $existingUser->wallet_nonce = $nonce;
                $existingUser->save();
            } else {
                Cache::put("wallet_nonce_{$walletAddress}", $nonce, now()->addMinutes(10));
            }
        }

        return response()->json([
            'success' => true,
            'nonce' => $nonce,
            'message' => $this->buildWalletSignMessage($nonce),
        ]);
    }

    public function walletVerify(Request $request)
    {
        $request->validate([
            'wallet_address' => 'required|string|min:42|max:42',
            'signature' => 'required|string',
            'chain_id' => 'nullable|integer',
        ]);

        $walletAddress = $this->normalizeWalletAddress($request->wallet_address);
        $signature = trim($request->signature);

        if ($signature === '') {
            return response()->json(['success' => false, 'message' => 'Signature tidak valid'], 422);
        }

        if (Auth::check()) {
            $user = Auth::user();

            if (empty($user->wallet_nonce)) {
                return response()->json(['success' => false, 'message' => 'Nonce tidak ditemukan. Ulangi connect wallet.'], 422);
            }

            if (!empty($user->wallet_address) && $this->normalizeWalletAddress($user->wallet_address) !== $walletAddress) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun ini sudah terhubung dengan wallet utama lain. Lepas atau ganti wallet terlebih dahulu.',
                ], 409);
            }

            $alreadyUsedUser = User::where('wallet_address', $walletAddress)
                ->where('idUser', '!=', $user->idUser)
                ->first();

            if ($alreadyUsedUser) {
                if ($this->isWalletOnlyPlaceholder($alreadyUsedUser) && empty($user->wallet_address)) {
                    $alreadyUsedUser->wallet_address = null;
                    $alreadyUsedUser->wallet_nonce = null;
                    $alreadyUsedUser->wallet_chain_id = null;
                    $alreadyUsedUser->wallet_verified_at = null;
                    $alreadyUsedUser->save();
                } else {
                    return response()->json(['success' => false, 'message' => 'Wallet sudah terhubung ke akun lain'], 409);
                }
            }

            $user->wallet_address = $walletAddress;
            $user->wallet_verified_at = now();
            $user->wallet_chain_id = $request->chain_id;
            $user->wallet_nonce = null;
            $user->save();

            return response()->json(['success' => true, 'user' => $user, 'linked' => true, 'merged_wallet_placeholder' => (bool) $alreadyUsedUser]);
        }

        $user = User::where('wallet_address', $walletAddress)->first();
        $expectedNonce = $user?->wallet_nonce;

        if (!$expectedNonce) {
            $expectedNonce = Cache::get("wallet_nonce_{$walletAddress}");
        }

        if (!$expectedNonce) {
            return response()->json(['success' => false, 'message' => 'Nonce kedaluwarsa. Ulangi connect wallet.'], 422);
        }

        if (!$user) {
            $user = User::create([
                'name' => 'User_' . substr($walletAddress, 0, 8),
                'email' => 'wallet_' . substr($walletAddress, 2, 12) . '@artvibes.local',
                'password' => Hash::make(Str::random(32)),
                'google_id' => 'wallet_login',
                'wallet_address' => $walletAddress,
                'wallet_chain_id' => $request->chain_id,
                'wallet_verified_at' => now(),
                'wallet_nonce' => null,
            ]);
        } else {
            $user->wallet_verified_at = now();
            $user->wallet_chain_id = $request->chain_id;
            $user->wallet_nonce = null;
            $user->save();
        }

        Cache::forget("wallet_nonce_{$walletAddress}");

        Auth::login($user);

        return response()->json(['success' => true, 'user' => $user, 'redirect' => '/studio']);
    }

    // Login Manual
    public function loginBiasa(Request $request) {
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::firstOrCreate(['email' => $request->email], [
            'name' => explode('@', $request->email)[0],
            'password' => Hash::make($request->password),
            'google_id' => 'internal_auth',
        ]);
        Auth::login($user);
        return response()->json(['success' => true, 'redirect' => '/studio']);
    }

    // Google Login
    public function redirectToGoogle(Request $request)
    {
        $action = $request->query('action', 'login');
        session(['google_auth_action' => $action]);

        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request) {
        $googleUser = Socialite::driver('google')->user();
        $action = session()->pull('google_auth_action', 'login');
        $googleId = (string) $googleUser->getId();
        $email = $this->normalizeEmail($googleUser->getEmail());
        $name = $googleUser->getName() ?: ($email ? explode('@', $email)[0] : 'ArtVibes User');

        if ($action === 'link' && Auth::check()) {
            $currentUser = Auth::user();

            $conflict = User::where('idUser', '!=', $currentUser->idUser)
                ->where(function ($query) use ($googleId, $email) {
                    $query->where('google_id', $googleId);
                    if ($email) {
                        $query->orWhere('email', $email);
                    }
                })
                ->first();

            if ($conflict) {
                return redirect('/studio?google_link=conflict');
            }

            $currentUser->name = $name;
            if ($email) {
                $currentUser->email = $email;
            }
            $currentUser->google_id = $googleId;
            if (empty($currentUser->password)) {
                $currentUser->password = Hash::make(Str::random(32));
            }
            $currentUser->save();

            Auth::login($currentUser);

            return redirect('/studio?google_link=success');
        }

        $user = User::where('google_id', $googleId)
            ->orWhere(function ($query) use ($email) {
                if ($email) {
                    $query->where('email', $email);
                }
            })
            ->first();

        if ($user) {
            $user->name = $name;
            $user->google_id = $googleId;
            if ($email) {
                $user->email = $email;
            }
            if (empty($user->password)) {
                $user->password = Hash::make(Str::random(32));
            }
            $user->save();
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email ?: 'google_' . $googleId . '@artvibes.local',
                'password' => Hash::make(Str::random(32)),
                'google_id' => $googleId,
            ]);
        }

        Auth::login($user);
        return redirect('/studio');
    }

    // Logout
    public function logout(Request $request) {
        try {
            \Log::info('Logout attempt', ['user_id' => Auth::id()]);
            
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            \Log::info('Logout success');
            return response()->json(['success' => true, 'message' => 'Logout berhasil']);
        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // Login Email (untuk API)
    public function loginEmail(Request $request) {
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        
        // Check if user exists
        $user = User::where('email', $request->email)->first();
        
        // If user doesn't exist, create one
        if (!$user) {
            $user = User::create([
                'name' => explode('@', $request->email)[0],
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'google_id' => 'email_login'
            ]);
        } else {
            // If user exists, check password
            if (!Hash::check($request->password, $user->password)) {
                return response()->json(['success' => false, 'message' => 'Email atau password salah'], 401);
            }
        }
        
        Auth::login($user);
        return response()->json(['success' => true, 'user' => $user, 'redirect' => '/studio']);
    }

    // Login Wallet (untuk Web3)
    public function loginWallet(Request $request) {
        $request->validate(['wallet_address' => 'required']);
        $walletAddress = $this->normalizeWalletAddress($request->wallet_address);

        if (Auth::check()) {
            $currentUser = Auth::user();

            if (!empty($currentUser->wallet_address) && $this->normalizeWalletAddress($currentUser->wallet_address) !== $walletAddress) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wallet utama akun ini sudah terpasang. Gunakan wallet yang sama atau lepaskan wallet lama terlebih dahulu.',
                ], 409);
            }

            $currentUser->wallet_address = $walletAddress;
            $currentUser->wallet_verified_at = now();
            $currentUser->save();

            return response()->json(['success' => true, 'user' => $currentUser, 'redirect' => '/studio']);
        }

        $user = User::where('wallet_address', $walletAddress)->first();

        if (!$user) {
            $user = User::create([
                'name' => 'User_' . substr($walletAddress, 0, 6),
                'email' => 'wallet_' . substr($walletAddress, 2, 12) . '@artvibes.local',
                'password' => Hash::make(Str::random(32)),
                'google_id' => 'wallet_login',
                'wallet_address' => $walletAddress,
                'wallet_verified_at' => now(),
            ]);
        } else {
            $user->wallet_verified_at = now();
            $user->save();
        }

        Auth::login($user);
        return response()->json(['success' => true, 'user' => $user, 'redirect' => '/studio']);
    }

    public function updateAvatar(Request $request) {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User tidak terautentikasi'], 401);
        }

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        if (!$request->hasFile('avatar')) {
            return response()->json(['success' => false, 'message' => 'File avatar tidak ditemukan'], 400);
        }

        $avatarFile = $request->file('avatar');
        $path = $avatarFile->store('avatars', 'public');
        $user->avatar = $this->buildStorageUrl($path);
        $user->save();

        return response()->json(['success' => true, 'user' => $user]);
    }

    public function updateBio(Request $request) {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User tidak terautentikasi'], 401);
        }

        $request->validate([
            'bio' => 'required|string|max:200',
        ]);

        $user->bio = $request->bio;
        $user->save();

        return response()->json(['success' => true, 'user' => $user]);
    }

    protected function buildStorageUrl(string $path): string
    {
        $storageBaseUrl = rtrim(config('app.url', env('APP_URL', '')), '/');

        if (str_contains($path, 'http://') || str_contains($path, 'https://')) {
            return $path;
        }

        return $storageBaseUrl . '/storage/' . ltrim($path, '/');
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User tidak terautentikasi'], 401);
        }

        $request->validate([
            'bio' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'profile_background_file' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:4096',
            'profile_background_url' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('avatar')) {
            $avatarFile = $request->file('avatar');
            $path = $avatarFile->store('avatars', 'public');
            $user->avatar = $this->buildStorageUrl($path);
        }

        if ($request->hasFile('profile_background_file')) {
            $backgroundFile = $request->file('profile_background_file');
            $path = $backgroundFile->store('profile_backgrounds', 'public');
            $user->profile_background = $this->buildStorageUrl($path);
        } elseif ($request->filled('profile_background_url')) {
            $user->profile_background = $request->input('profile_background_url');
        }

        if ($request->has('bio')) {
            $user->bio = $request->input('bio');
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil disimpan.',
            'user' => $user,
        ]);
    }
}
