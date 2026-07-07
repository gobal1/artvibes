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
        Schema::create('transaksi', function (Blueprint $table) {
            $table->integer('idtransaksi', true);
            $table->integer('produk_idproduk')->index('fk_transaksi_produk');
            $table->integer('buyer_id')->index('fk_transaksi_buyer');
            $table->string('tx_hash', 66)->unique('tx_hash');
            $table->decimal('amount', 30, 18);
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi');
    }
};
