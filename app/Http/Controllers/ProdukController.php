<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\Nft;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProdukController extends Controller
{
    /**
     * GET /api/produk - Ambil semua produk publik untuk Explore
     * FIX: Hanya menampilkan produk dengan status 'listing'
     */
    public function index()
    {
        $produk = Produk::where('status', 'listing')
            ->with([
                'user:idUser,name,email,avatar,bio,profile_background', 
                'kategori:idkategori,name', 
                'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk'
            ])
            ->get();

        return response()->json($produk);
    }

    /**
     * GET /api/produk/user/my-products - Ambil produk milik user login
     */
    public function getUserProducts()
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $produk = Produk::where('user_idUser', $userId)
            ->with([
                'user:idUser,name,email,avatar,bio,profile_background',
                'kategori:idkategori,name',
                'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk'
            ])
            ->orderByDesc('idproduk')
            ->get();

        return response()->json($produk);
    }

    /**
     * POST /api/produk - Simpan produk baru
     */
    public function store(Request $request) 
    {
        $request->validate([
            'title' => 'required|string',
            'kategori_idkategori' => 'required',
            'price_crypto' => 'required',
            'gambar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('gambar')) {
            $path = $request->file('gambar')->store('produk', 'public');
            $imagePath = $path;
        } else {
            return response()->json(['message' => 'File gambar tidak ditemukan'], 400);
        }

        $produk = new Produk();
        $produk->title = $request->title;
        $produk->kategori_idkategori = $request->kategori_idkategori;
        $produk->price_crypto = $request->price_crypto;
        $produk->image_url = $imagePath;
        $produk->deskripsi = $request->deskripsi;
        $produk->voice_script = $request->voice_script;
        $produk->status = $request->status ?? 'listing';
        $produk->user_idUser = Auth::id(); 
        
        $produk->save();

        $produk->load('user:idUser,name,email,avatar,bio,profile_background', 'kategori:idkategori,name', 'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk');

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil ditambahkan!',
            'produk' => $produk
        ], 201);
    }

    /**
     * PUT /api/produk/{id} - Update produk
     */
    public function update(Request $request, $id)
    {
        $produk = Produk::findOrFail($id);
        
        if ($produk->user_idUser != Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string',
            'kategori_idkategori' => 'required',
            'price_crypto' => 'required',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $produk->title = $request->title;
        $produk->kategori_idkategori = $request->kategori_idkategori;
        $produk->price_crypto = $request->price_crypto;
        $produk->deskripsi = $request->deskripsi;
        $produk->voice_script = $request->voice_script;
        $produk->status = $request->status;

        if ($request->hasFile('gambar')) {
            $path = $request->file('gambar')->store('produk', 'public');
            $produk->image_url = $path;
        }

        $produk->save();
        $produk->load('user:idUser,name,email,avatar,bio,profile_background', 'kategori:idkategori,name', 'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk');

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil diperbarui!',
            'produk' => $produk
        ]);
    }

    /**
     * GET /api/produk/{id} - Detail produk
     */
    public function show($id)
    {
        $produk = Produk::with('user:idUser,name,email,avatar,bio,profile_background', 'kategori:idkategori,name', 'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk')->findOrFail($id);
        return response()->json($produk);
    }

    /**
     * DELETE /api/produk/{id} - Hapus produk
     */
    public function destroy($id)
    {
        $produk = Produk::findOrFail($id);
        
        if ($produk->user_idUser != Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $produk->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil dihapus!'
        ]);
    }

    /**
     * POST /api/produk/buy-success
     * FIX: Menangani kegagalan pencarian token_id & validasi login user pembeli
     */
    public function buySuccess(Request $request)
    {
        // 1. Validasi input (Bisa menerima token_id atau produk_id sebagai cadangan data dari React)
        $request->validate([
            'token_id' => 'required_without:produk_id',
            'produk_id' => 'nullable'
        ]);

        // Cek apakah pembeli sudah login di sistem Laravel (Menggunakan token bearer/sanctum/session)
        $buyerId = Auth::id();
        if (!$buyerId) {
            return response()->json([
                'success' => false,
                'message' => 'Sinkronisasi gagal: User pembeli tidak terdeteksi login di backend. Pastikan Token Auth dikirim di header React.'
            ], 401);
        }

        $produk = null;

        // 2. Cari NFT berdasarkan token_id
        if ($request->filled('token_id')) {
            $nft = Nft::where('token_id', $request->token_id)->first();
            if ($nft) {
                $produk = Produk::find($nft->produk_idproduk);
            }
        }

        // Cadangan: Jika mapping token_id di DB belum sempurna, cari langsung via produk_id dari React
        if (!$produk && $request->filled('produk_id')) {
            $produk = Produk::find($request->produk_id);
        }

        // Jika data tidak ditemukan di database lokal sama sekali
        if (!$produk) {
            return response()->json([
                'success' => false,
                'message' => 'Data NFT/Produk dengan Token ID ' . $request->token_id . ' tidak ditemukan di database local.'
            ], 404);
        }

        try {
            // 3. Eksekusi perpindahan kepemilikan
            $produk->user_idUser = $buyerId; // Owner berubah menjadi ID Pembeli
            $produk->status = 'unlisted';    // Otomatis unlisted agar hilang dari halaman Explore
            $produk->save();

            return response()->json([
                'success' => true,
                'message' => 'Database berhasil disinkronkan. NFT berpindah tangan!'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Gagal update buySuccess: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah data internal database: ' . $e->getMessage()
            ], 500);
        }
        
    }

    public function handlePembelian(Request $request)
    {
        // Kita langsung arahkan datanya ke fungsi buySuccess yang sudah kamu buat dengan rapi di atas!
        // Dan kita tambahkan mapping 'produk_id' secara otomatis dari 'idproduk' yang dikirim React
        if ($request->has('idproduk')) {
            $request->merge(['produk_id' => $request->idproduk]);
        }
        
        return $this->buySuccess($request);
    }
}