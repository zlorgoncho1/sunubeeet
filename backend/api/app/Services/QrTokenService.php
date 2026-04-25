<?php

namespace App\Services;

use App\Models\QrCode;
use Carbon\Carbon;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class QrTokenService
{
    /**
     * Génère le token JWT du QR physique.
     * Expiration calée sur la date de fin de l'événement (expires_at du QrCode).
     * Si pas de expires_at → durée de 1 an par défaut.
     */
    public function generateToken(QrCode $qr): string
    {
        $expiresAt = $qr->expires_at ?? now()->addYear();

        // TTL en minutes pour le JWT
        $ttlMinutes = (int) now()->diffInMinutes($expiresAt, false);

        if ($ttlMinutes <= 0) {
            throw new \InvalidArgumentException('La date d\'expiration du QR est déjà dépassée.');
        }

        return JWTAuth::factory()
            ->setTTL($ttlMinutes)
            ->customClaims([
                'kind'       => 'qr',
                'qr_id'      => $qr->id,
                'loc'        => [
                    'lat'   => (float) $qr->latitude,
                    'lng'   => (float) $qr->longitude,
                    'label' => $qr->location_label,
                ],
                'expires_at' => $expiresAt->toIso8601String(),
            ])
            ->make()
            ->get();
    }

    /**
     * Génère un scan session token (15 min) après validation du QR physique.
     */
    public function generateScanSession(QrCode $qr): string
    {
        return JWTAuth::factory()
            ->setTTL(15)
            ->customClaims([
                'kind'  => 'scan_session',
                'qr_id' => $qr->id,
                'loc'   => [
                    'lat'   => (float) $qr->latitude,
                    'lng'   => (float) $qr->longitude,
                    'label' => $qr->location_label,
                ],
            ])
            ->make()
            ->get();
    }

    /**
     * Décode et valide un token QR physique.
     * Lance une exception si le token est invalide, expiré, ou pas de kind 'qr'.
     */
    public function decodeQrToken(string $token): array
    {
        $payload = JWTAuth::manager()->decode(
            new \PHPOpenSourceSaver\JWTAuth\Token($token)
        );

        if ($payload->get('kind') !== 'qr') {
            throw new \InvalidArgumentException('Token QR invalide.');
        }

        return [
            'qr_id' => $payload->get('qr_id'),
            'loc'   => $payload->get('loc'),
        ];
    }
}
