<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class ValidateTrackingToken
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('X-Tracking-Token');

        if (! $token) {
            return response()->json(['message' => 'Token de suivi manquant.'], 401);
        }

        try {
            $payload = JWTAuth::manager()->decode(
                new \PHPOpenSourceSaver\JWTAuth\Token($token)
            );

            if (($payload->get('kind') ?? '') !== 'tracking') {
                return response()->json(['message' => 'Token de suivi invalide.'], 401);
            }

            $request->merge(['tracking_phone_hash' => $payload->get('phone_hash')]);

        } catch (\Exception) {
            return response()->json(['message' => 'Token de suivi invalide ou expiré.'], 401);
        }

        return $next($request);
    }
}
