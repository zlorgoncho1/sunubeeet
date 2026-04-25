<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(fn() => (new DatabaseSeeder)->run());

describe('Auth — Login', function () {

    it('connecte un coordinator avec les bons identifiants', function () {
        $this->postJson('/api/v1/auth/login', [
            'phone'    => '+221771000001',
            'password' => 'Coord123!',
        ])
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['access_token', 'token_type', 'expires_in', 'user' => ['id', 'role']],
        ])
        ->assertJsonPath('data.user.role', 'coordinator');
    });

    it('connecte un agent', function () {
        $this->postJson('/api/v1/auth/login', [
            'phone'    => '+221772000001',
            'password' => 'Agent123!',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.user.role', 'agent');
    });

    it('refuse un mot de passe incorrect', function () {
        $this->postJson('/api/v1/auth/login', [
            'phone'    => '+221771000001',
            'password' => 'mauvais',
        ])
        ->assertStatus(401)
        ->assertJsonPath('message', 'Identifiants invalides.');
    });

    it('refuse un compte désactivé', function () {
        User::where('phone', '+221772000001')->update(['is_active' => false]);

        $this->postJson('/api/v1/auth/login', [
            'phone'    => '+221772000001',
            'password' => 'Agent123!',
        ])
        ->assertStatus(401);
    });

    it('retourne 422 si le body est vide', function () {
        $this->postJson('/api/v1/auth/login', [])
            ->assertStatus(422)
            ->assertJsonStructure(['message', 'errors' => ['phone', 'password']]);
    });

});

describe('Auth — Refresh & Logout', function () {

    it('rafraîchit le token', function () {
        $token = loginAs('+221771000001');

        $this->postJson('/api/v1/auth/refresh', [], ['Authorization' => "Bearer $token"])
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['access_token']]);
    });

    it('invalide le token après logout', function () {
        $token = loginAs('+221771000001');

        $this->postJson('/api/v1/auth/logout', [], ['Authorization' => "Bearer $token"])
            ->assertStatus(200);

        $this->getJson('/api/v1/me/alertes', ['Authorization' => "Bearer $token"])
            ->assertStatus(401);
    });

});

describe('Auth — RBAC', function () {

    it('bloque un coordinateur sur une route admin', function () {
        $token = loginAs('+221771000001');

        $this->postJson('/api/v1/qr-codes', [
            'location_label' => 'Test',
            'latitude'       => 14.74,
            'longitude'      => -17.46,
            'expires_at'     => '2026-08-15',
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(403);
    });

    it('bloque un agent sur une route coordinateur', function () {
        $token = loginAs('+221772000001');

        $this->postJson('/api/v1/missions', [], ['Authorization' => "Bearer $token"])
            ->assertStatus(403);
    });

    it('bloque sans token JWT', function () {
        $this->getJson('/api/v1/me/alertes')
            ->assertStatus(401);
    });

});

describe('Auth — EnsurePasswordChanged', function () {

    it('bloque un agent avec must_change_password=true', function () {
        User::where('phone', '+221772000001')->update(['must_change_password' => true]);
        $token = loginAs('+221772000001');

        $this->patchJson('/api/v1/me/presence',
            ['status' => 'available', 'latitude' => 14.74, 'longitude' => -17.46],
            ['Authorization' => "Bearer $token"]
        )
        ->assertStatus(403)
        ->assertJsonPath('code', 'PASSWORD_CHANGE_REQUIRED');
    });

    it('laisse passer le changement de mot de passe même avec must_change_password=true', function () {
        User::where('phone', '+221772000001')->update(['must_change_password' => true]);
        $token = loginAs('+221772000001');

        $this->postJson('/api/v1/auth/password/change', [
            'current_password'      => 'Agent123!',
            'password'              => 'NouveauMdp1!',
            'password_confirmation' => 'NouveauMdp1!',
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(200);
    });

});
