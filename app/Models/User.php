<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    // Kunci nama tabel agar menggunakan 'user' (huruf kecil) sesuai ERD kamu
    protected $table = 'user'; 

    // Kunci Primary Key agar menggunakan 'idUser' sesuai ERD kamu
    protected $primaryKey = 'idUser'; 

    // Matikan timestamps karena di tabel ERD user tidak ada kolom created_at & updated_at
    public $timestamps = false; 

    // Kolom-kolom yang boleh diisi data
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'wallet_address',
        'wallet_nonce',
        'wallet_chain_id',
        'wallet_verified_at',
        'avatar',
        'bio',
        'profile_background',
    ];

    // Menyembunyikan password saat data user di-panggil
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Pastikan idUser selalu disertakan dalam serialisasi JSON
    protected $appends = ['id']; // Tambahkan 'id' alias untuk kompatibilitas

    public function getIdAttribute()
    {
        return $this->idUser;
    }

    // Override toArray untuk memastikan idUser selalu termasuk
    public function toArray()
    {
        $array = parent::toArray();
        // Pastikan idUser ada di output JSON
        if (!isset($array['idUser']) && isset($this->idUser)) {
            $array['idUser'] = $this->idUser;
        }
        return $array;
    }

    public function followers()
    {
        return $this->belongsToMany(
            User::class,
            'followers',
            'followed_id',
            'follower_id'
        );
    }

    public function following()
    {
        return $this->belongsToMany(
            User::class,
            'followers',
            'follower_id',
            'followed_id'
        );
    }

    public function pinnedProducts()
    {
        return $this->belongsToMany(
            Produk::class,
            'pins',
            'user_idUser',
            'produk_idproduk'
        );
    }
}
