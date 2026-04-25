<?php

use App\Models\Alerte;
use Database\Seeders\DatabaseSeeder;

beforeEach(fn() => (new DatabaseSeeder)->run());

describe('Flow App — Soumettre une alerte', function () {

    it('crée une alerte authentifiée avec description', function () {
        $token = loginAs('+221771000001'); // coordinator peut aussi alerter

        $this->postJson('/api/v1/alertes', [
            'category'    => 'security',
            'description' => 'Bagarre tribune Est',
            'latitude'    => 14.7460,
            'longitude'   => -17.4670,
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(201)
        ->assertJsonPath('data.status', 'received')
        ->assertJsonStructure(['data' => ['id', 'reference', 'status', 'is_potential_duplicate']]);

        expect(Alerte::count())->toBe(1);
    });

    it('refuse une alerte sans coordonnées GPS', function () {
        $token = loginAs('+221771000001');

        $this->postJson('/api/v1/alertes', [
            'category'    => 'health',
            'description' => 'Test',
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['latitude', 'longitude']]);
    });

    it('refuse une alerte non authentifiée', function () {
        $this->postJson('/api/v1/alertes', [
            'category'    => 'health',
            'description' => 'Test',
            'latitude'    => 14.74,
            'longitude'   => -17.46,
        ])
        ->assertStatus(401);
    });

    it('détecte le doublon anti-spam entre flow App et flow QR', function () {
        // Créer alerte QR sur le même lieu
        $qr          = createActiveQr(); // lat=14.7453, lng=-17.4660
        $scanSession = test()->postJson('/api/v1/qr/scan', ['token' => $qr['token']])
            ->json('data.scan_session_token');

        test()->postJson('/api/v1/qr/alertes',
            ['category' => 'crowd', 'description' => 'Foule dense'],
            ['X-Scan-Session' => $scanSession]
        )->assertStatus(201);

        // Alerte App depuis le même lieu
        $token = loginAs('+221771000001');

        test()->postJson('/api/v1/alertes', [
            'category'    => 'crowd',
            'description' => 'Foule dense côté App',
            'latitude'    => 14.7453,
            'longitude'   => -17.4660,
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(201)
        ->assertJsonPath('data.is_potential_duplicate', true);
    });

});

describe('Flow App — Historique et timeline', function () {

    it('retourne les alertes de l\'utilisateur connecté', function () {
        $token = loginAs('+221771000001');

        // Créer 2 alertes
        foreach (['health', 'security'] as $category) {
            test()->postJson('/api/v1/alertes', [
                'category'    => $category,
                'description' => "Alerte $category",
                'latitude'    => 14.7453,
                'longitude'   => -17.4660,
            ], ['Authorization' => "Bearer $token"]);
        }

        $this->getJson('/api/v1/me/alertes', ['Authorization' => "Bearer $token"])
            ->assertStatus(200)
            ->assertJsonPath('total', 2);
    });

    it('retourne la timeline d\'une alerte', function () {
        $token = loginAs('+221771000001');

        $alerteId = test()->postJson('/api/v1/alertes', [
            'category'    => 'health',
            'description' => 'Malaise',
            'latitude'    => 14.7453,
            'longitude'   => -17.4660,
        ], ['Authorization' => "Bearer $token"])->json('data.id');

        $this->getJson("/api/v1/me/alertes/$alerteId/timeline",
            ['Authorization' => "Bearer $token"]
        )
        ->assertStatus(200)
        ->assertJsonStructure(['data' => ['alerte', 'timeline']]);
    });

    it('refuse la timeline d\'une alerte d\'un autre utilisateur', function () {
        $tokenCoord = loginAs('+221771000001');
        $tokenAgent = loginAs('+221772000001');

        $alerteId = test()->postJson('/api/v1/alertes', [
            'category'    => 'health',
            'description' => 'Mon alerte',
            'latitude'    => 14.7453,
            'longitude'   => -17.4660,
        ], ['Authorization' => "Bearer $tokenCoord"])->json('data.id');

        $this->getJson("/api/v1/me/alertes/$alerteId/timeline",
            ['Authorization' => "Bearer $tokenAgent"]
        )
        ->assertStatus(403);
    });

});
