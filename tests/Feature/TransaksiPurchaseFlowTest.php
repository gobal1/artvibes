<?php

namespace Tests\Feature;

use App\Http\Controllers\TransaksiController;
use App\Models\Nft;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TransaksiPurchaseFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        Schema::create('user', function ($table) {
            $table->increments('idUser');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
        });

        Schema::create('kategori', function ($table) {
            $table->increments('idkategori');
            $table->string('name');
        });

        Schema::create('produk', function ($table) {
            $table->increments('idproduk');
            $table->string('title');
            $table->text('deskripsi')->nullable();
            $table->decimal('price_crypto', 30, 18)->default(0);
            $table->string('image_url')->nullable();
            $table->text('voice_script')->nullable();
            $table->integer('kategori_idkategori')->default(0);
            $table->integer('user_idUser')->default(0);
            $table->string('status')->default('listing');
        });

        Schema::create('nfts', function ($table) {
            $table->increments('idnfts');
            $table->integer('produk_idproduk')->unique();
            $table->string('token_id');
            $table->string('contract_address', 42);
            $table->string('metadata_url');
        });

        Schema::create('transaksi', function ($table) {
            $table->increments('idtransaksi');
            $table->integer('produk_idproduk');
            $table->integer('buyer_id');
            $table->string('tx_hash', 66);
            $table->decimal('amount', 30, 18);
            $table->string('status')->default('success');
        });
    }

    public function test_purchase_endpoint_transfers_ownership_and_creates_transaction(): void
    {
        $sellerId = 10;
        $buyerId = 20;

        Auth::shouldReceive('id')->andReturn($buyerId);

        $product = Produk::create([
            'title' => 'Test NFT',
            'deskripsi' => 'A test NFT',
            'price_crypto' => 1.23,
            'image_url' => 'produk/test.png',
            'voice_script' => 'Hello',
            'kategori_idkategori' => 1,
            'user_idUser' => $sellerId,
            'status' => 'listing',
        ]);

        Nft::create([
            'produk_idproduk' => $product->idproduk,
            'token_id' => '7',
            'contract_address' => '0x1234567890123456789012345678901234567890',
            'metadata_url' => 'ipfs://metadata',
        ]);

        $controller = new TransaksiController();
        $request = Request::create('/api/transaksi/purchase', 'POST', [
            'produk_id' => $product->idproduk,
            'tx_hash' => '0xabc123',
            'amount' => '1.23',
        ]);

        $response = $controller->store($request);
        fwrite(STDERR, $response->getContent() . PHP_EOL);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(true, json_decode($response->getContent(), true)['success']);

        $product->refresh();
        $this->assertSame($buyerId, $product->user_idUser);
        $this->assertSame('unlisted', $product->status);

        $this->assertDatabaseHas('transaksi', [
            'produk_idproduk' => $product->idproduk,
            'buyer_id' => $buyerId,
            'tx_hash' => '0xabc123',
            'status' => 'success',
        ]);
    }
}
