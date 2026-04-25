<?php

use App\Models\AgentPresence;
use App\Models\Alerte;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\Site;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(fn() => (new DatabaseSeeder)->run());

describe('Coordinateur — Incidents', function () {

    it('liste les incidents avec filtres', function () {
        $token = loginAs('+221771000001');

        Incident::create([
            'reference' => 'INC-TEST-001', 'title' => 'Test', 'category' => 'health',
            'severity' => 'high', 'priority' => 'p1', 'latitude' => 14.74, 'longitude' => -17.46,
            'status' => 'open',
            'created_by_user_id' => User::where('role', 'coordinator')->first()->id,
        ]);

        $this->getJson('/api/v1/incidents?status=open', ['Authorization' => "Bearer $token"])
            ->assertStatus(200)
            ->assertJsonPath('total', 1);
    });

    it('qualifie un incident', function () {
        $token = loginAs('+221771000001');

        $inc = Incident::create([
            'reference' => 'INC-TEST-002', 'title' => 'Test', 'category' => 'security',
            'severity' => 'medium', 'priority' => 'p3', 'latitude' => 14.74, 'longitude' => -17.46,
            'status' => 'open',
            'created_by_user_id' => User::where('role', 'coordinator')->first()->id,
        ]);

        $this->patchJson("/api/v1/incidents/{$inc->id}", [
            'status'   => 'qualified',
            'severity' => 'high',
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(200)
        ->assertJsonPath('data.severity', 'high');
    });

});

describe('Coordinateur — Dispatch', function () {

    it('dispatche une mission à un agent disponible', function () {
        $coordToken = loginAs('+221771000001');
        $agentId    = User::where('phone', '+221772000001')->value('id');

        AgentPresence::updateOrCreate(['agent_id' => $agentId], ['status' => 'available']);

        $incident = Incident::create([
            'reference' => 'INC-DISPATCH-001', 'title' => 'Dispatch test',
            'category' => 'health', 'severity' => 'high', 'priority' => 'p1',
            'latitude' => 14.74, 'longitude' => -17.46, 'status' => 'qualified',
            'created_by_user_id' => User::where('role', 'coordinator')->first()->id,
        ]);

        $this->postJson('/api/v1/missions', [
            'incident_id'         => $incident->id,
            'assigned_to_user_id' => $agentId,
            'title'               => 'Prise en charge',
        ], ['Authorization' => "Bearer $coordToken"])
        ->assertStatus(201)
        ->assertJsonPath('data.status', 'assigned');

        expect(Incident::find($incident->id)->status)->toBe('mission_assigned');
    });

    it('refuse de dispatcher si l\'agent a déjà une mission active', function () {
        $coordToken = loginAs('+221771000001');
        $agentId    = User::where('phone', '+221772000001')->value('id');
        $coordId    = User::where('role', 'coordinator')->first()->id;

        AgentPresence::updateOrCreate(['agent_id' => $agentId], ['status' => 'available']);

        $inc1 = Incident::create([
            'reference' => 'INC-CONFLICT-001', 'title' => 'Inc1', 'category' => 'health',
            'severity' => 'high', 'priority' => 'p1', 'latitude' => 14.74, 'longitude' => -17.46,
            'status' => 'qualified', 'created_by_user_id' => $coordId,
        ]);
        $inc2 = Incident::create([
            'reference' => 'INC-CONFLICT-002', 'title' => 'Inc2', 'category' => 'security',
            'severity' => 'high', 'priority' => 'p1', 'latitude' => 14.74, 'longitude' => -17.46,
            'status' => 'qualified', 'created_by_user_id' => $coordId,
        ]);

        // Première mission
        test()->postJson('/api/v1/missions', [
            'incident_id' => $inc1->id, 'assigned_to_user_id' => $agentId, 'title' => 'Mission 1',
        ], ['Authorization' => "Bearer $coordToken"])->assertStatus(201);

        // Deuxième mission sur le même agent → 409
        test()->postJson('/api/v1/missions', [
            'incident_id' => $inc2->id, 'assigned_to_user_id' => $agentId, 'title' => 'Mission 2',
        ], ['Authorization' => "Bearer $coordToken"])->assertStatus(409);
    });

});

describe('Coordinateur — Dashboard', function () {

    it('retourne les KPIs', function () {
        $token = loginAs('+221771000001');

        $this->getJson('/api/v1/dashboard/kpis', ['Authorization' => "Bearer $token"])
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [
                'incidents_open', 'incidents_critical',
                'avg_response_minutes', 'agents_available', 'agents_total',
            ]]);
    });

    it('retourne les incidents live', function () {
        $token = loginAs('+221771000001');

        $this->getJson('/api/v1/dashboard/incidents/live', ['Authorization' => "Bearer $token"])
            ->assertStatus(200)
            ->assertJsonStructure(['data']);
    });

    it('retourne les agents live', function () {
        $token = loginAs('+221771000001');

        $this->getJson('/api/v1/dashboard/agents/live', ['Authorization' => "Bearer $token"])
            ->assertStatus(200)
            ->assertJsonStructure(['data']);
    });

});

describe('Coordinateur — Sites', function () {

    it('crée un site', function () {
        $token = loginAs('+221700000002');

        $this->postJson('/api/v1/sites', [
            'name'      => 'Hôpital Test',
            'type'      => 'hopital',
            'latitude'  => 14.6711,
            'longitude' => -17.4400,
            'is_24_7'   => true,
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(201)
        ->assertJsonPath('data.type', 'hopital');
    });

    it('retourne les sites à proximité', function () {
        $token = loginAs('+221771000001');

        Site::create([
            'name' => 'Poste de secours Arena', 'type' => 'point_secours',
            'latitude' => 14.7455, 'longitude' => -17.4662, 'is_active' => true,
        ]);

        $this->getJson('/api/v1/sites/nearby?lat=14.7453&lng=-17.4660&radius=500',
            ['Authorization' => "Bearer $token"]
        )
        ->assertStatus(200)
        ->assertJsonPath('data.0.name', 'Poste de secours Arena');
    });

});
