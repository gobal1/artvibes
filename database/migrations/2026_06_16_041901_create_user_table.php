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
        Schema::create('user', function (Blueprint $table) {
            $table->integer('idUser', true);
            $table->string('google_id')->nullable();
            $table->string('name');
            $table->string('email')->unique('email');
            $table->string('wallet_address', 42)->nullable()->unique('wallet_address');
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->string('password')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};
