<?php

use App\Models\AgentPresence;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(fn() => (new DatabaseSeeder)->run());

// Créer un incident qualifié pour les tests de mission
function createQualifiedIncident(): Incident
{
    return Incident::create([
        'reference'          => 'INC-2026-TEST01',
        'title'              => 'Test incident',
        'category'           => 'health',
        'severity'           => 'high',
        'priority'           => 'p1',
        'latitude'           => 14.7453,
        'longitude'          => -17.4660,
        'status'             => 'qualified',
        'created_by_user_id' => User::where('role', 'coordinator')->first()->id,
        'qualified_at'       => now(),
    ]);
}

describe('Agent — Toggle présence', function () {

    it('passe en available', function () {
        $token = loginAs('+221772000001');

        $this->patchJson('/api/v1/me/presence', [
            'status'    => 'available',
            'latitude'  => 14.7453,
            'longitude' => -17.4660,
        ], ['Authorization' => "Bearer $token"])
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'available');

        expect(AgentPresence::where('agent_id', User::where('phone', '+221772000001')->value('id'))->value('status'))
            ->toBe('available');
    });

    it('passe en offline', function () {
        $token  = loginAs('+221772000001');
        $agentId = User::where('phone', '+221772000001')->value('id');

        AgentPresence::updateOrCreate(['agent_id' => $agentId], ['status' => 'available']);

        $this->patchJson('/api/v1/me/presence',
            ['status' => 'offline'],
            ['Authorization' => "Bearer $token"]
        )
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'offline');
    });

    it('bloque le passage en offline avec une mission active', function () {
        $token   = loginAs('+221772000001');
        $agentId = User::where('phone', '+221772000001')->value('id');

        AgentPresence::updateOrCreate(['agent_id' => $agentId], ['status' => 'available']);

        // Créer une mission active
        Mission::create([
            'reference'           => 'MSN-TEST-001',
            'incident_id'         => createQualifiedIncident()->id,
            'created_by_user_id'  => User::where('role', 'coordinator')->first()->id,
            'assigned_to_user_id' => $agentId,
            'title'               => 'Mission test',
            'status'              => 'accepted',
            'latitude'            => 14.7453,
            'longitude'           => -17.4660,
        ]);

        $this->patchJson('/api/v1/me/presence',
            ['status' => 'offline'],
            ['Authorization' => "Bearer $token"]
        )
        ->assertStatus(422);
    });

});

describe('Agent — Cycle de mission complet', function () {

    it('accepte, part en route, arrive sur place et complète une mission', function () {
        $agentToken = loginAs('+221772000001');
        $coordToken = loginAs('+221771000001');
        $agentId    = User::where('phone', '+221772000001')->value('id');

        // Mettre l'agent disponible
        AgentPresence::updateOrCreate(['agent_id' => $agentId], ['status' => 'available']);

        $incident = createQualifiedIncident();

        // Dispatcher
        $missionId = test()->postJson('/api/v1/missions', [
            'incident_id'         => $incident->id,
            'assigned_to_user_id' => $agentId,
            'title'               => 'Test mission',
        ], ['Authorization' => "Bearer $coordToken"])->json('data.id');

        expect($missionId)->not->toBeNull();

        // Accept
        test()->postJson("/api/v1/missions/$missionId/accept", [],
            ['Authorization' => "Bearer $agentToken"]
        )->assertStatus(200);

        expect(Mission::find($missionId)->status)->toBe('accepted');

        // On route
        test()->postJson("/api/v1/missions/$missionId/on-route",
            ['latitude' => 14.7453, 'longitude' => -17.4660],
            ['Authorization' => "Bearer $agentToken"]
        )->assertStatus(200);

        // On site
        test()->postJson("/api/v1/missions/$missionId/on-site",
            ['latitude' => 14.7453, 'longitude' => -17.4660],
            ['Authorization' => "Bearer $agentToken"]
        )->assertStatus(200);

        // Complete
        test()->postJson("/api/v1/missions/$missionId/complete",
            ['outcome' => 'resolved', 'note' => 'Intervention terminée'],
            ['Authorization' => "Bearer $agentToken"]
        )->assertStatus(200);

        $mission = Mission::find($missionId);
        expect($mission->status)->toBe('completed');
        expect($mission->outcome)->toBe('resolved');

        // Incident résolu automatiquement
        expect(Incident::find($incident->id)->status)->toBe('resolved');

        // Agent remis available automatiquement
        expect(AgentPresence::where('agent_id', $agentId)->value('status'))->toBe('available');
    });

    it('refuse avec un motif', function () {
        $agentToken = loginAs('+221772000001');
        $coordToken = loginAs('+221771000001');
        $agentId    = User::where('phone', '+221772000001')->value('id');

        AgentPresence::updateOrCreate(['agent_id' => $agentId], ['status' => 'available']);

        $missionId = test()->postJson('/api/v1/missions', [
            'incident_id'         => createQualifiedIncident()->id,
            'assigned_to_user_id' => $agentId,
            'title'               => 'Mission à refuser',
        ], ['Authorization' => "Bearer $coordToken"])->json('data.id');

        test()->postJson("/api/v1/missions/$missionId/refuse",
            ['reason' => 'Déjà occupé sur un autre incident'],
            ['Authorization' => "Bearer $agentToken"]
        )->assertStatus(200);

        expect(Mission::find($missionId)->status)->toBe('refused');
    });

    it('bloque les transitions hors ordre (on-route avant accept)', function () {
        $agentToken = loginAs('+221772000001');
        $coordToken = loginAs('+221771000001');
        $agentId    = User::where('phone', '+221772000001')->value('id');

        AgentPresence::updateOrCreate(['agent_id' => $agentId], ['status' => 'available']);

        $missionId = test()->postJson('/api/v1/missions', [
            'incident_id'         => createQualifiedIncident()->id,
            'assigned_to_user_id' => $agentId,
            'title'               => 'Mission test ordre',
        ], ['Authorization' => "Bearer $coordToken"])->json('data.id');

        // Tenter on-route sans avoir accepté
        test()->postJson("/api/v1/missions/$missionId/on-route",
            ['latitude' => 14.7453, 'longitude' => -17.4660],
            ['Authorization' => "Bearer $agentToken"]
        )->assertStatus(422);
    });

    it('bloque un agent sur la mission d\'un autre agent', function () {
        $agentToken1 = loginAs('+221772000001');
        $agentToken2 = loginAs('+221772000002');
        $coordToken  = loginAs('+221771000001');
        $agentId1    = User::where('phone', '+221772000001')->value('id');

        AgentPresence::updateOrCreate(['agent_id' => $agentId1], ['status' => 'available']);

        $missionId = test()->postJson('/api/v1/missions', [
            'incident_id'         => createQualifiedIncident()->id,
            'assigned_to_user_id' => $agentId1,
            'title'               => 'Mission agent 1',
        ], ['Authorization' => "Bearer $coordToken"])->json('data.id');

        // Agent 2 tente d'accepter la mission d'agent 1
        test()->postJson("/api/v1/missions/$missionId/accept", [],
            ['Authorization' => "Bearer $agentToken2"]
        )->assertStatus(403);
    });

});
