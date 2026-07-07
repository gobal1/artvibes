<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PriceController extends Controller
{
    /**
     * Get cryptocurrency price from CoinGecko
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCryptoPrice(Request $request)
    {
        try {
            $cryptoId = $request->query('id', 'polygon');
            $vsCurrency = $request->query('vs_currency', 'usd');
            
            // Call CoinGecko API from backend (no CORS issues)
            $response = Http::timeout(5)->get('https://api.coingecko.com/api/v3/simple/price', [
                'ids' => $cryptoId,
                'vs_currencies' => $vsCurrency,
            ]);
            
            if ($response->successful()) {
                return response()->json($response->json());
            }
            
            return response()->json(['error' => 'Failed to fetch price'], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
