<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Nft extends Model
{
    use HasFactory;

    protected $table = 'nfts';

    protected $primaryKey = 'idnfts';

    protected $fillable = [
        'token_id',
        'contract_address',
        'metadata_url',
        'produk_idproduk',
    ];

    public $timestamps = false;

    // Relasi balik ke Produk
    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_idproduk', 'idproduk');
    }
}