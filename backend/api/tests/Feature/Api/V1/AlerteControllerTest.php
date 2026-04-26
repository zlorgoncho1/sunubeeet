<?php

namespace Tests\Feature\Api\V1;

use App\Models\Alerte;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlerteControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => 'spectator'
        ]);
    }

    public function test_user_can_create_alerte()
    {
        $payload = [
            'category' => 'health',
            'sub_category' => ['type' => 'malaise'],
            'description' => 'Personne âgée semble avoir un malaise',
            'latitude' => 14.7234567,
            'longitude' => -17.5431234,
            'client_fingerprint' => 'abc123',
        ];

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/alertes', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'reference',
                    'category',
                    'status',
                    'is_potential_duplicate',
                    'created_at',
                ]
            ]);

        $this->assertDatabaseHas('alertes', [
            'source_user_id' => $this->user->id,
            'category' => 'health',
            'status' => 'received',
        ]);
    }

    public function test_validation_fails_with_invalid_data()
    {
        $payload = [
            'category' => 'invalid_category',
            'latitude' => 91, // Invalid latitude
            'longitude' => -17.5431234,
        ];

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/alertes', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category', 'latitude']);
    }

    public function test_unauthenticated_user_cannot_create_alerte()
    {
        $payload = [
            'category' => 'health',
            'latitude' => 14.7234567,
            'longitude' => -17.5431234,
        ];

        $response = $this->postJson('/api/v1/alertes', $payload);

        $response->assertStatus(401);
    }

    public function test_alerte_reference_is_generated()
    {
        $alerte = Alerte::factory()->create([
            'source_user_id' => $this->user->id,
        ]);

        $reference = $alerte->generateReference();

        $this->assertStringStartsWith('AL-2026-', $reference);
        $this->assertEquals(13, strlen($reference)); // AL-2026-XXXXXXX
    }
}
