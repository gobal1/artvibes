<?php

namespace Tests\Feature;

use App\Http\Controllers\API\PinController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class PinControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_pin_product_can_create_record(): void
    {
        $controller = new PinController();
        $request = new Request([
            'id_produk' => 42,
            'user_idUser' => 7,
        ]);

        $response = $controller->pinProduct($request);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertDatabaseHas('pins', [
            'user_idUser' => 7,
            'produk_idproduk' => 42,
        ]);
    }
}
