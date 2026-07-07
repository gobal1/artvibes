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
        Schema::table('likes', function (Blueprint $table) {
            $table->foreign(['user_idUser'], 'likes_ibfk_1')->references(['idUser'])->on('user')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['produk_idproduk'], 'likes_ibfk_2')->references(['idproduk'])->on('produk')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('likes', function (Blueprint $table) {
            $table->dropForeign('likes_ibfk_1');
            $table->dropForeign('likes_ibfk_2');
        });
    }
};
