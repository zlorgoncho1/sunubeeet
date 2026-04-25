<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'phone'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('phone', $credentials['phone'])->first();

        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        if (! $token = auth('api')->attempt([
            'phone'    => $credentials['phone'],
            'password' => $credentials['password'],
        ])) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        $user->update(['last_login_at' => now()]);

        return $this->tokenResponse($token, $user);
    }

    public function refresh(Request $request)
    {
        try {
            $token = JWTAuth::parseToken()->refresh();
            $user  = JWTAuth::setToken($token)->toUser();
            return $this->tokenResponse($token, $user);
        } catch (\Exception) {
            return response()->json(['message' => 'Token invalide ou expiré.'], 401);
        }
    }

    public function logout()
    {
        try {
            JWTAuth::parseToken()->invalidate();
        } catch (\Exception) {
            // Token déjà invalide, on ignore
        }

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    private function tokenResponse(string $token, User $user): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'data' => [
                'access_token'  => $token,
                'token_type'    => 'bearer',
                'expires_in'    => config('jwt.ttl') * 60,
                'must_change_password' => $user->must_change_password,
                'user' => [
                    'id'       => $user->id,
                    'fullname' => $user->fullname,
                    'phone'    => $user->phone,
                    'role'     => $user->role,
                    'zone_id'  => $user->zone_id,
                    'team_id'  => $user->team_id,
                ],
            ],
        ]);
    }
}
