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
        Schema::table('transaksi', function (Blueprint $table) {
            $table->foreign(['buyer_id'], 'fk_transaksi_buyer')->references(['idUser'])->on('user')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['produk_idproduk'], 'fk_transaksi_produk')->references(['idproduk'])->on('produk')->onUpdate('cascade')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropForeign('fk_transaksi_buyer');
            $table->dropForeign('fk_transaksi_produk');
        });
    }
};
