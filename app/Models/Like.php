<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Like extends Model
{
    use HasFactory;

    // Daftarkan nama tabel secara eksplisit karena bukan bentuk jamak bahasa Inggris (users -> user)
    protected $table = 'likes';

    // Kolom yang boleh diisi secara massal
    protected $fillable = [
        'user_idUser',
        'produk_idproduk'
    ];

    // Jika kamu tidak membuat kolom updated_at dan hanya ada created_at, matikan timestamps otomatis Laravel
    // Tapi karena tadi di query SQL ada created_at, kita set true atau false sesuai kebutuhan. 
    // Biar aman tanpa kolom updated_at, kita set false dan urus created_at manual/otomatis dari MySQL.
    public $timestamps = false;

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_idUser', 'idUser');
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_idproduk', 'idproduk');
    }
}