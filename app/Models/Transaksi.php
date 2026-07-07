<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'transaksi';

    protected $primaryKey = 'idtransaksi';

    protected $fillable = [
        'tx_hash',
        'amount',
        'status',
        'produk_idproduk',
        'buyer_id',
        'seller_id',
        'created_at',
        'updated_at',
    ];

    public $timestamps = false;

    // Relasi balik ke Produk yang dibeli
    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_idproduk', 'idproduk');
    }

    // Relasi balik ke User yang membeli/bertransaksi
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id', 'idUser');
    }
}