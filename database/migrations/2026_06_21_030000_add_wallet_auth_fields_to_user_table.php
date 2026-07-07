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
        Schema::table('user', function (Blueprint $table) {
            if (!Schema::hasColumn('user', 'wallet_nonce')) {
                $table->string('wallet_nonce')->nullable()->after('wallet_address');
            }

            if (!Schema::hasColumn('user', 'wallet_chain_id')) {
                $table->unsignedInteger('wallet_chain_id')->nullable()->after('wallet_nonce');
            }

            if (!Schema::hasColumn('user', 'wallet_verified_at')) {
                $table->dateTime('wallet_verified_at')->nullable()->after('wallet_chain_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user', function (Blueprint $table) {
            if (Schema::hasColumn('user', 'wallet_verified_at')) {
                $table->dropColumn('wallet_verified_at');
            }

            if (Schema::hasColumn('user', 'wallet_chain_id')) {
                $table->dropColumn('wallet_chain_id');
            }

            if (Schema::hasColumn('user', 'wallet_nonce')) {
                $table->dropColumn('wallet_nonce');
            }
        });
    }
};
