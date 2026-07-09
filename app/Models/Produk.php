<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Produk extends Model
{
    use HasFactory;

    // 1. Kunci nama tabel karena namanya 'produk' (bukan 'products')
    protected $table = 'produk';

    // 2. Kunci nama primary key karena di database kamu namanya 'idproduk'
    protected $primaryKey = 'idproduk';

    // 3. MATIKAN TIMESTAMP karena tabelmu tidak punya kolom created_at & updated_at
    public $timestamps = false;

    // 4. Daftarkan kolom yang boleh diisi
    protected $fillable = [
        'title',
        'deskripsi',
        'price_crypto',
        'image_url',
        'voice_script',
        'kategori_idkategori',
        'user_idUser',
        'status',
    ];

    public function getImageUrlAttribute($value)
    {
        if (!$value) {
            return $value;
        }

        if (Str::startsWith($value, ['http://', 'https://', '/storage/'])) {
            $url = Str::startsWith($value, '/storage/') ? url($value) : $value;
            return $this->normalizeUrl($url);
        }

        $url = Storage::disk('public')->url($value);
        return $this->normalizeUrl($url);
    }

    protected function normalizeUrl(string $url): string
    {
        $parsed = parse_url($url);
        if ($parsed === false || !isset($parsed['path'])) {
            return $url;
        }

        $path = implode('/', array_map('rawurlencode', explode('/', ltrim($parsed['path'], '/'))));
        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'] ?? request()->getHost();
        $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

        return "{$scheme}://{$host}{$port}/{$path}{$query}";
    }

    /**
     * 🔥 RELASI UNTUK MENGAMBIL DATA PEMILIK KARYA
     * Menghubungkan kolom user_idUser di tabel produk ke kolom idUser di tabel user
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_idUser', 'idUser');
    }

    /**
     * 🔥 RELASI UNTUK MENGAMBIL DATA KATEGORI
     * Menghubungkan kolom kategori_idkategori di tabel produk ke kolom idkategori di tabel kategori
     */
    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'kategori_idkategori', 'idkategori');
    }
    
    /**
     * 🔥 RELASI UNTUK MENGAMBIL DATA NFT YANG TERKAIT
     * Menghubungkan produk ke tabel nfts melalui produk_idproduk
     */
    public function nft()
    {
        return $this->hasOne(Nft::class, 'produk_idproduk', 'idproduk');
    }
}