<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FollowController extends Controller
{
    public function follow($userId)
    {
        $me = Auth::user();
        if (!$me) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        if ($me->idUser == $userId) {
            return response()->json(['success' => false, 'message' => 'Tidak bisa follow diri sendiri'], 400);
        }

        $target = User::findOrFail($userId);
        $me->following()->syncWithoutDetaching([$target->idUser]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil follow user.',
        ]);
    }

    public function unfollow($userId)
    {
        $me = Auth::user();
        if (!$me) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $target = User::findOrFail($userId);
        $me->following()->detach($target->idUser);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil unfollow user.',
        ]);
    }

    public function followers($userId)
    {
        $user = User::findOrFail($userId);

        return response()->json([
            'success' => true,
            'count' => $user->followers()->count(),
            'data' => $user->followers()->get(['idUser', 'name', 'email', 'avatar', 'bio']),
        ]);
    }

    public function following($userId)
    {
        $user = User::findOrFail($userId);

        return response()->json([
            'success' => true,
            'count' => $user->following()->count(),
            'data' => $user->following()->get(['idUser', 'name', 'email', 'avatar', 'bio']),
        ]);
    }
}
