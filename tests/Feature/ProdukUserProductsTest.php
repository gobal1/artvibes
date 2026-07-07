<?php

namespace Tests\Feature;

use App\Models\Produk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProdukUserProductsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_products_are_returned_even_when_status_is_not_listing(): void
    {
        $user = User::factory()->create();

        Produk::create([
            'title' => 'Karya unlisted',
            'deskripsi' => 'test',
            'price_crypto' => '1.5',
            'image_url' => 'produk/test.png',
            'voice_script' => 'test',
            'kategori_idkategori' => 1,
            'user_idUser' => $user->idUser,
            'status' => 'unlisted',
        ]);

        $response = $this->actingAs($user, 'web')->getJson('/api/produk/user/my-products');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['title' => 'Karya unlisted']);
    }
}
