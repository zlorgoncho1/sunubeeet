<?php

namespace App\Services;

use App\Models\QrCode;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Factory as JWTFactory;

class QrTokenService
{
    public function generateToken(QrCode $qr): string
    {
        $customClaims = [
            'kind'  => 'qr',
            'qr_id' => $qr->id,
            'loc'   => [
                'lat'   => (float) $qr->latitude,
                'lng'   => (float) $qr->longitude,
                'label' => $qr->location_label,
            ],
        ];

        // Token sans expiration pour les QR physiques
        return JWTAuth::factory()
            ->setTTL(null)
            ->customClaims($customClaims)
            ->make()
            ->get();
    }

    public function generateScanSession(QrCode $qr): string
    {
        $customClaims = [
            'kind'  => 'scan_session',
            'qr_id' => $qr->id,
            'loc'   => [
                'lat'   => (float) $qr->latitude,
                'lng'   => (float) $qr->longitude,
                'label' => $qr->location_label,
            ],
        ];

        // Session valable 15 minutes
        return JWTAuth::factory()
            ->setTTL(15)
            ->customClaims($customClaims)
            ->make()
            ->get();
    }

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
