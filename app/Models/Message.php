<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $table = 'messages';

    protected $primaryKey = 'idmessages';

    protected $fillable = [
        'messages_text',
        'is_read',
        'sender_id',
        'receiver_id',
    ];

    public $timestamps = false;

    // Relasi ke User sebagai Pengirim
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id', 'idUser');
    }

    // Relasi ke User sebagai Penerima
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id', 'idUser');
    }
}