<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class LoginController extends Controller
{
    /**
     * POST /api/v1/auth/login
     *
     * Authentifie un utilisateur (spectateur, agent, coordinateur, admin)
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'phone'       => ['required', 'string'],
            'password'    => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $user = User::where('phone', $credentials['phone'])->first();

        if (! $user || ! $user->is_active) {
            return response()->json([
                'message' => 'Identifiants invalides.',
                'code'    => 'AUTH_INVALID_CREDENTIALS',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (! $accessToken = auth('api')->attempt([
            'phone'    => $credentials['phone'],
            'password' => $credentials['password'],
        ])) {
            return response()->json([
                'message' => 'Identifiants invalides.',
                'code'    => 'AUTH_INVALID_CREDENTIALS',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $user->update(['last_login_at' => now()]);

        // Générer aussi un refresh token (pour simplifier on utilise un second JWT)
        $refreshToken = $this->generateRefreshToken($user);

        return response()->json([
            'data' => [
                'user' => [
                    'id'       => $user->id,
                    'fullname' => $user->fullname,
                    'phone'    => $user->phone,
                    'role'     => $user->role,
                    'zone_id'  => $user->zone_id,
                    'team_id'  => $user->team_id,
                ],
                'tokens' => [
                    'access_token'        => $accessToken,
                    'access_expires_at'   => now()->addMinutes(config('jwt.ttl'))->toIso8601String(),
                    'refresh_token'       => $refreshToken,
                    'refresh_expires_at'  => now()->addDays(7)->toIso8601String(),
                ],
            ],
        ], Response::HTTP_OK);
    }

    /**
     * POST /api/v1/auth/refresh
     *
     * Réactualise l'access token à partir du refresh token
     */
    public function refresh(Request $request)
    {
        try {
            $token = JWTAuth::parseToken()->refresh();
            $user  = JWTAuth::setToken($token)->toUser();

            $refreshToken = $this->generateRefreshToken($user);

            return response()->json([
                'data' => [
                    'access_token'        => $token,
                    'access_expires_at'   => now()->addMinutes(config('jwt.ttl'))->toIso8601String(),
                    'refresh_token'       => $refreshToken,
                    'refresh_expires_at'  => now()->addDays(7)->toIso8601String(),
                    'user' => [
                        'id'       => $user->id,
                        'fullname' => $user->fullname,
                        'phone'    => $user->phone,
                        'role'     => $user->role,
                    ],
                ],
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token invalide ou expiré.',
                'code'    => 'AUTH_TOKEN_EXPIRED',
            ], Response::HTTP_UNAUTHORIZED);
        }
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout()
    {
        try {
            JWTAuth::parseToken()->invalidate();
        } catch (\Exception) {
            // Token déjà invalide, on ignore
        }

        return response()->json([
            'message' => 'Déconnecté avec succès.',
        ], Response::HTTP_OK);
    }

    /**
     * Générer un JWT utilisé comme refresh token
     *
     * Dans une implémentation plus complète, on stockerait ces tokens en base
     * avec uuid unique pour permettre la révocation.
     */
    private function generateRefreshToken(User $user): string
    {
        return JWTAuth::claims([
            'type'  => 'refresh',
            'phone' => $user->phone,
        ])->fromUser($user);
    }
}
