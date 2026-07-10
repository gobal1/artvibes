<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    public function pinnedBy()
    {
        return $this->belongsToMany(
            User::class,
            'pins',
            'produk_idproduk',
            'user_idUser'
        );
    }
}