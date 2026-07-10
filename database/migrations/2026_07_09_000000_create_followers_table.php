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
        Schema::create('followers', function (Blueprint $table) {
            $table->id();
            $table->integer('follower_id');
            $table->integer('followed_id');
            $table->timestamps();

            $table->foreign('follower_id')->references('idUser')->on('user')->onDelete('cascade');
            $table->foreign('followed_id')->references('idUser')->on('user')->onDelete('cascade');
            $table->unique(['follower_id', 'followed_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('followers');
    }
};
