<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class UserModel extends Authenticatable
{
    use Notifiable;

    protected $table = 'user';
    protected $primaryKey = 'idUser';
    public $timestamps = false; // Set false jika tidak ada kolom created_at/updated_at

    protected $fillable = ['name', 'email', 'password', 'avatar_url', 'bio'];

    protected $hidden = ['password'];
}