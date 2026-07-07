<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Kategori;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Kategori::create(['name' => 'Musik & Suara', 'slug' => 'musik-suara']);
        Kategori::create(['name' => 'Fotografi', 'slug' => 'fotografi']);
        Kategori::create(['name' => 'Seni Digital', 'slug' => 'seni-digital']);
        Kategori::create(['name' => 'Desain Grafis', 'slug' => 'desain-grafis']);
        Kategori::create(['name' => 'Item Game', 'slug' => 'item-game']);
        Kategori::create(['name' => 'Populer', 'slug' => 'populer']);
    }
}
