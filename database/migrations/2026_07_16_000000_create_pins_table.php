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
        Schema::create('pins', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_idUser');
            $table->unsignedInteger('produk_idproduk');
            $table->timestamps(false);

            $table->unique(['user_idUser', 'produk_idproduk'], 'pins_user_produk_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pins');
    }
};
