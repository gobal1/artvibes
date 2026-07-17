<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Like;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LikeController extends Controller
{
    /**
     * Get all liked products by a user
     */
    public function getUserLikes($userId)
    {
        try {
            $likes = Like::where('user_idUser', $userId)
                        ->with('produk')
                        ->get();
            
            // Transform the response to include id_produk as a top-level field
            $formattedLikes = $likes->map(function($like) {
                return [
                    'id' => $like->id,
                    'user_idUser' => $like->user_idUser,
                    'produk_idproduk' => $like->produk_idproduk,
                    'id_produk' => $like->produk_idproduk, // Add this field for frontend compatibility
                    'created_at' => $like->created_at,
                    'produk' => $like->produk
                ];
            });
            
            return response()->json($formattedLikes);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Like a product
     */
    public function likeProduct(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_produk' => 'required|integer',
                'user_idUser' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }

            $userId = (int) $request->user_idUser;
            $produkId = (int) $request->id_produk;

            $authenticatedUserId = Auth::id();
            if ($authenticatedUserId) {
                $userId = (int) $authenticatedUserId;
            }

            // Check if already liked
            $existingLike = Like::where('user_idUser', $userId)
                                ->where('produk_idproduk', $produkId)
                                ->first();

            if ($existingLike) {
                return response()->json(['message' => 'Produk sudah disukai'], 200);
            }

            // Create new like
            $like = Like::create([
                'user_idUser' => $userId,
                'produk_idproduk' => $produkId
            ]);

            return response()->json(['message' => 'Produk berhasil disukai', 'data' => $like], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Unlike a product
     */
    public function unlikeProduct($userId, $produkId)
    {
        try {
            $like = Like::where('user_idUser', $userId)
                       ->where('produk_idproduk', $produkId)
                       ->first();

            if (!$like) {
                return response()->json(['message' => 'Like tidak ditemukan'], 404);
            }

            $like->delete();
            return response()->json(['message' => 'Produk batal disukai'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function toggleLike(Request $request)
    {
        // Validasi input data dari React
        $validator = Validator::make($request->all(), [
            'user_idUser' => 'required|integer',
            'produk_idproduk' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $userId = (int) $request->user_idUser;
        $produkId = (int) $request->produk_idproduk;

        $authenticatedUserId = Auth::id();
        if ($authenticatedUserId) {
            $userId = (int) $authenticatedUserId;
        }

        // Cek apakah user ini sudah pernah menyukai produk ini sebelumnya
        $existingLike = Like::where('user_idUser', $userId)
                            ->where('produk_idproduk', $produkId)
                            ->first();

        if ($existingLike) {
            // Jika sudah ada data, berarti user melakukan "Unlike" -> Hapus data dari tabel
            $existingLike->delete();
            return response()->json([
                'status' => 'unliked',
                'message' => 'Batal menyukai karya ini.'
            ]);
        } else {
            // Jika belum ada data, berarti user melakukan "Like" -> Tambah data ke tabel
            Like::create([
                'user_idUser' => $userId,
                'produk_idproduk' => $produkId
            ]);
            return response()->json([
                'status' => 'liked',
                'message' => 'Karya berhasil ditambahkan ke daftar disukai!'
            ]);
        }
    }

    // Fungsi untuk mengambil semua daftar ID produk yang disukai oleh 1 user tertentu
    public function getUserLikesIds($userId)
    {
        $likedProductIds = Like::where('user_idUser', $userId)
                               ->pluck('produk_idproduk'); // Mengambil array angka saja, contoh: [1, 3, 4]

        return response()->json([
            'status' => 'success',
            'data' => $likedProductIds
        ]);
    }
}