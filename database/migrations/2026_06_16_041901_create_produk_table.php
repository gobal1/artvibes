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
        Schema::create('produk', function (Blueprint $table) {
            $table->integer('idproduk', true);
            $table->integer('user_idUser')->index('fk_produk_user');
            $table->integer('kategori_idkategori')->index('fk_produk_kategori');
            $table->string('title');
            $table->text('deskripsi')->nullable();
            $table->text('voice_script')->nullable();
            $table->decimal('price_crypto', 30, 18);
            $table->string('image_url');
            $table->enum('status', ['listing', 'sold', 'unlisted'])->default('listing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produk');
    }
};
