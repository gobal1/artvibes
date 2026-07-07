<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    use HasFactory;

    // Nama tabel di database Filess.io
    protected $table = 'kategori';

    // Custom Primary Key sesuai ERD
    protected $primaryKey = 'idkategori';

    // Kolom yang boleh diisi mass-assignment
    protected $fillable = [
        'name',
        'slug',
    ];

    // Nonaktifkan timestamps jika tabel tidak memiliki kolom created_at & updated_at
    public $timestamps = false;

    // Relasi ke tabel Produk (Satu kategori punya banyak produk)
    public function produks()
    {
        return $this->hasMany(Produk::class, 'kategori_idkategori', 'idkategori');
    }
}