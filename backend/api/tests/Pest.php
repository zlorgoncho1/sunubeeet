<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

// Helper : login et retourner le token JWT
function loginAs(string $phone, string $password = null): string
{
    $passwords = [
        '+221700000001' => 'SuperAdmin123!',
        '+221700000002' => 'Admin123!',
        '+221771000001' => 'Coord123!',
        '+221772000001' => 'Agent123!',
        '+221772000002' => 'Agent123!',
        '+221772000003' => 'Agent123!',
    ];

    $res = test()->postJson('/api/v1/auth/login', [
        'phone'    => $phone,
        'password' => $password ?? $passwords[$phone] ?? 'password',
    ]);

    return $res->json('data.access_token');
}

// Helper : créer un QR code actif
function createActiveQr(): array
{
    $token = loginAs('+221700000002');

    $qr = test()->postJson('/api/v1/qr-codes', [
        'location_label' => 'Entrée Nord Test',
        'latitude'       => 14.7453,
        'longitude'      => -17.4660,
        'expires_at'     => '2026-08-15',
    ], ['Authorization' => "Bearer $token"])->json('data.qr');

    test()->postJson("/api/v1/qr-codes/{$qr['id']}/activate", [], ['Authorization' => "Bearer $token"]);

    // Récupérer le token depuis la DB
    $qrModel = \App\Models\QrCode::find($qr['id']);

    return ['id' => $qrModel->id, 'token' => $qrModel->token];
}
