<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class ValidateQrSession
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('X-Scan-Session');

        if (! $token) {
            return response()->json(['message' => 'Session QR manquante.'], 401);
        }

        try {
            $payload = JWTAuth::manager()->decode(
                new \PHPOpenSourceSaver\JWTAuth\Token($token)
            );

            if (($payload->get('kind') ?? '') !== 'scan_session') {
                return response()->json(['message' => 'Token QR invalide.'], 401);
            }

            $request->merge(['qr_session' => $payload]);

        } catch (\Exception) {
            return response()->json(['message' => 'Session QR invalide ou expirée.'], 401);
        }

        return $next($request);
    }
}
