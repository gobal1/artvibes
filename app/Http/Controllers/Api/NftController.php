<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nft;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NftController extends Controller
{
    public function linkToProduct(Request $request)
    {
        $request->validate([
            'produk_idproduk' => 'required|integer',
            'token_id' => 'required|string|max:255',
            'contract_address' => 'required|string|min:42|max:42',
            'metadata_url' => 'required|string|max:1000',
        ]);

        $produk = Produk::findOrFail($request->produk_idproduk);
        if ((int) $produk->user_idUser !== (int) Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $nft = Nft::updateOrCreate(
            ['produk_idproduk' => $produk->idproduk],
            [
                'token_id' => (string) $request->token_id,
                'contract_address' => strtolower($request->contract_address),
                'metadata_url' => $request->metadata_url,
            ]
        );

        return response()->json(['success' => true, 'nft' => $nft]);
    }
}
