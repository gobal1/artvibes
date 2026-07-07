<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Produk;

class ProdukSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Produk::create([
            'title' => 'The POSTREET',
            'deskripsi' => 'Ini merupakan karya digital yang indah',
            'price_crypto' => 0.5,
            'image_url' => 'https://via.placeholder.com/400x300',
            'voice_script' => '11223',
            'kategori_idkategori' => 1,
            'user_idUser' => 1,
            'status' => 'listing'
        ]);

        Produk::create([
            'title' => 'Digital Art Masterpiece',
            'deskripsi' => 'Karya seni digital berkualitas tinggi',
            'price_crypto' => 1.0,
            'image_url' => 'https://via.placeholder.com/400x300',
            'voice_script' => '22334',
            'kategori_idkategori' => 3,
            'user_idUser' => 2,
            'status' => 'listing'
        ]);

        Produk::create([
            'title' => 'Beautiful Photography',
            'deskripsi' => 'Fotografi pemandangan yang menakjubkan',
            'price_crypto' => 0.75,
            'image_url' => 'https://via.placeholder.com/400x300',
            'voice_script' => '33445',
            'kategori_idkategori' => 2,
            'user_idUser' => 1,
            'status' => 'listing'
        ]);
    }
}
