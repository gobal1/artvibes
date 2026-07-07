<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            $table->foreign(['kategori_idkategori'], 'fk_produk_kategori')->references(['idkategori'])->on('kategori')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['user_idUser'], 'fk_produk_user')->references(['idUser'])->on('user')->onUpdate('cascade')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            $table->dropForeign('fk_produk_kategori');
            $table->dropForeign('fk_produk_user');
        });
    }
};
