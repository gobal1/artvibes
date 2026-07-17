<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pin;
use Illuminate\Support\Facades\Validator;

class PinController extends Controller
{
    public function getUserPins($userId)
    {
        try {
            $pins = Pin::where('user_idUser', $userId)
                ->with('produk')
                ->get();

            $formatted = $pins->map(function ($pin) {
                return [
                    'id' => $pin->id,
                    'user_idUser' => $pin->user_idUser,
                    'produk_idproduk' => $pin->produk_idproduk,
                    'id_produk' => $pin->produk_idproduk,
                    'produk' => $pin->produk,
                ];
            });

            return response()->json($formatted);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function pinProduct(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_idUser' => 'required|integer',
                'id_produk' => 'nullable|integer',
                'produk_idproduk' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }

            $userId = (int) $request->input('user_idUser');
            $produkId = $request->input('id_produk', $request->input('produk_idproduk'));

            if ($produkId === null || $produkId === '') {
                return response()->json(['error' => 'id_produk wajib diisi'], 400);
            }

            $produkId = (int) $produkId;

            $existingPin = Pin::where('user_idUser', $userId)
                ->where('produk_idproduk', $produkId)
                ->first();

            if ($existingPin) {
                return response()->json(['message' => 'Produk sudah disematkan'], 200);
            }

            $pin = Pin::create([
                'user_idUser' => $userId,
                'produk_idproduk' => $produkId,
            ]);

            return response()->json(['message' => 'Produk berhasil disematkan', 'data' => $pin], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function unpinProduct($userId, $produkId)
    {
        try {
            $pin = Pin::where('user_idUser', $userId)
                ->where('produk_idproduk', $produkId)
                ->first();

            if (! $pin) {
                return response()->json(['message' => 'Pin tidak ditemukan'], 404);
            }

            $pin->delete();
            return response()->json(['message' => 'Produk berhasil dilepas dari sematan'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
