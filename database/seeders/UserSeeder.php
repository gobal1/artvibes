<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Fahmi Algipari',
            'email' => 'fahmi@test.com',
            'password' => bcrypt('password'),
            'google_id' => null,
            'wallet_address' => null,
            'avatar' => null,
            'bio' => 'Digital Creator'
        ]);

        User::create([
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => bcrypt('password'),
            'google_id' => null,
            'wallet_address' => null,
            'avatar' => null,
            'bio' => 'Artist'
        ]);
    }
}
