<?php

use App\Models\Alerte;
use App\Models\QrCode;
use Database\Seeders\DatabaseSeeder;

beforeEach(fn() => (new DatabaseSeeder)->run());

describe('Flow QR — Scan', function () {

    it('refuse un token QR invalide', function () {
        $this->postJson('/api/v1/qr/scan', ['token' => 'token_bidon'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'QR code invalide.');
    });

    it('refuse un QR non activé', function () {
        $adminToken = loginAs('+221700000002');

        $qr = $this->postJson('/api/v1/qr-codes', [
            'location_label' => 'Test',
            'latitude'       => 14.7453,
            'longitude'      => -17.4660,
            'expires_at'     => '2026-08-15',
        ], ['Authorization' => "Bearer $adminToken"])->json('data.qr');

        $qrToken = QrCode::find($qr['id'])->token;

        $this->postJson('/api/v1/qr/scan', ['token' => $qrToken])
            ->assertStatus(422)
            ->assertJsonPath('message', "Ce QR code n'est pas encore activé.");
    });

    it('retourne un scan_session_token après scan valide', function () {
        $qr = createActiveQr();

        $this->postJson('/api/v1/qr/scan', ['token' => $qr['token']])
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['qr_id', 'location', 'scan_session_token', 'active_alerts_nearby']]);
    });

});

describe('Flow QR — Soumettre une alerte', function () {

    it('crée une alerte via QR avec description', function () {
        $qr          = createActiveQr();
        $scanSession = $this->postJson('/api/v1/qr/scan', ['token' => $qr['token']])
            ->json('data.scan_session_token');

        $this->postJson('/api/v1/qr/alertes',
            ['category' => 'health', 'description' => 'Malaise entrée nord'],
            ['X-Scan-Session' => $scanSession]
        )
        ->assertStatus(201)
        ->assertJsonStructure(['data' => ['alerte' => ['id', 'reference', 'status']]])
        ->assertJsonPath('data.alerte.status', 'received');

        expect(Alerte::count())->toBe(1);
    });

    it('refuse une alerte sans contenu (ni description, photo, audio)', function () {
        $qr          = createActiveQr();
        $scanSession = $this->postJson('/api/v1/qr/scan', ['token' => $qr['token']])
            ->json('data.scan_session_token');

        $this->postJson('/api/v1/qr/alertes',
            ['category' => 'health'],
            ['X-Scan-Session' => $scanSession]
        )
        ->assertStatus(422);
    });

    it('refuse une alerte sans X-Scan-Session', function () {
        $this->postJson('/api/v1/qr/alertes', ['category' => 'health', 'description' => 'Test'])
            ->assertStatus(401);
    });

});

describe('Flow QR — Anti-spam', function () {

    it('marque la 2ème alerte comme doublon potentiel (même lieu, < 2 min)', function () {
        $qr          = createActiveQr();
        $scanSession = $this->postJson('/api/v1/qr/scan', ['token' => $qr['token']])
            ->json('data.scan_session_token');

        // Alerte 1
        $this->postJson('/api/v1/qr/alertes',
            ['category' => 'health', 'description' => 'Première alerte'],
            ['X-Scan-Session' => $scanSession]
        )->assertStatus(201);

        // Alerte 2 — même catégorie, même lieu (position du QR)
        $this->postJson('/api/v1/qr/alertes',
            ['category' => 'health', 'description' => 'Deuxième alerte'],
            ['X-Scan-Session' => $scanSession]
        )
        ->assertStatus(201)
        ->assertJsonPath('data.alerte.is_potential_duplicate', true);

        expect(Alerte::count())->toBe(2);
        expect(Alerte::where('is_potential_duplicate', true)->count())->toBe(1);
    });

    it('ne marque pas comme doublon si catégorie différente', function () {
        $qr          = createActiveQr();
        $scanSession = $this->postJson('/api/v1/qr/scan', ['token' => $qr['token']])
            ->json('data.scan_session_token');

        $this->postJson('/api/v1/qr/alertes',
            ['category' => 'health', 'description' => 'Malaise'],
            ['X-Scan-Session' => $scanSession]
        )->assertStatus(201);

        $this->postJson('/api/v1/qr/alertes',
            ['category' => 'security', 'description' => 'Bagarre'],
            ['X-Scan-Session' => $scanSession]
        )
        ->assertStatus(201)
        ->assertJsonPath('data.alerte.is_potential_duplicate', false);
    });

});

describe('Flow QR — Tracking par téléphone', function () {

    it('attache un numéro à une alerte et retourne 202', function () {
        $qr          = createActiveQr();
        $scanSession = $this->postJson('/api/v1/qr/scan', ['token' => $qr['token']])
            ->json('data.scan_session_token');

        $alerteId = $this->postJson('/api/v1/qr/alertes',
            ['category' => 'health', 'description' => 'Test'],
            ['X-Scan-Session' => $scanSession]
        )->json('data.alerte.id');

        $this->postJson("/api/v1/qr/alertes/$alerteId/attach-phone",
            ['phone' => '+221771234567'],
            ['X-Scan-Session' => $scanSession]
        )
        ->assertStatus(202);
    });

    it('retourne un tracking_token après vérification OTP', function () {
        // Simuler l'OTP en le récupérant du cache directement
        $this->postJson('/api/v1/qr/tracking/request-otp', ['phone' => '+221771234567'])
            ->assertStatus(200);

        // OTP en cache (clé sha256 du téléphone)
        $cacheKey = 'otp:' . hash('sha256', '+221771234567');
        $cached   = \Illuminate\Support\Facades\Cache::get($cacheKey);

        expect($cached)->not->toBeNull();

        $this->postJson('/api/v1/qr/tracking/verify-otp', [
            'phone' => '+221771234567',
            'otp'   => $cached['otp'],
        ])
        ->assertStatus(200)
        ->assertJsonStructure(['data' => ['tracking_token', 'expires_in']]);
    });

});
