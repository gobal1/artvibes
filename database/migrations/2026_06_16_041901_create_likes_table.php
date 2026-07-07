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
        Schema::create('likes', function (Blueprint $table) {
            $table->bigInteger('id', true);
            $table->integer('user_idUser');
            $table->integer('produk_idproduk')->index('produk_idproduk');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_idUser', 'produk_idproduk'], 'user_product_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};
