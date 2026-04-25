<?php

namespace Database\Seeders;

use App\Models\Alerte;
use App\Models\AgentPresence;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\QrCode;
use App\Models\Site;
use App\Models\TrackingEvent;
use App\Models\User;
use App\Models\Zone;
use App\Services\QrTokenService;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $coordinator = User::where('role', 'coordinator')->first();
        $agents      = User::where('role', 'agent')->get();
        $arena       = Zone::where('slug', 'dakar-arena')->first();
        $qrService   = app(QrTokenService::class);

        // ----------------------------------------------------------------
        // Sites de référence réalistes
        // ----------------------------------------------------------------
        $sites = [
            ['name' => 'Hôpital Principal de Dakar',    'type' => 'hopital',       'lat' => 14.6711, 'lng' => -17.4400, 'phone' => '+221338891010', 'is_24_7' => true],
            ['name' => 'SAMU Sénégal',                  'type' => 'samu',          'lat' => 14.6850, 'lng' => -17.4350, 'phone' => '+22115',         'is_24_7' => true],
            ['name' => 'Commissariat Dakar Plateau',    'type' => 'commissariat',  'lat' => 14.6939, 'lng' => -17.4441, 'phone' => '+221338234567',   'is_24_7' => true],
            ['name' => 'Brigade Sapeurs-Pompiers Dakar','type' => 'pompiers',      'lat' => 14.6972, 'lng' => -17.4481, 'phone' => '+22118',          'is_24_7' => true],
            ['name' => 'Poste de secours Dakar Arena — Nord', 'type' => 'point_secours', 'lat' => 14.7460, 'lng' => -17.4665, 'phone' => null, 'is_24_7' => false],
            ['name' => 'Poste de secours Dakar Arena — Sud',  'type' => 'point_secours', 'lat' => 14.7440, 'lng' => -17.4658, 'phone' => null, 'is_24_7' => false],
            ['name' => 'PC Opérationnel Dakar Arena',   'type' => 'evenement_pc',  'lat' => 14.7453, 'lng' => -17.4655, 'phone' => '+221773000000',   'is_24_7' => false],
            ['name' => 'Point eau & repos — Entrée Est','type' => 'point_eau',     'lat' => 14.7455, 'lng' => -17.4648, 'phone' => null, 'is_24_7' => false],
        ];

        foreach ($sites as $s) {
            Site::updateOrCreate(['name' => $s['name']], [
                'type'      => $s['type'],
                'latitude'  => $s['lat'],
                'longitude' => $s['lng'],
                'phone'     => $s['phone'],
                'is_24_7'   => $s['is_24_7'],
                'zone_id'   => $arena?->id,
                'is_active' => true,
            ]);
        }

        // ----------------------------------------------------------------
        // QR codes placés dans l'arène (activés)
        // ----------------------------------------------------------------
        $qrPositions = [
            ['label' => 'Entrée Nord — Dakar Arena',    'lat' => 14.7460, 'lng' => -17.4665],
            ['label' => 'Entrée Sud — Dakar Arena',     'lat' => 14.7440, 'lng' => -17.4660],
            ['label' => 'Entrée Est — Dakar Arena',     'lat' => 14.7455, 'lng' => -17.4648],
            ['label' => 'Entrée Ouest — Dakar Arena',   'lat' => 14.7452, 'lng' => -17.4675],
            ['label' => 'Tribune A — Dakar Arena',      'lat' => 14.7458, 'lng' => -17.4662],
            ['label' => 'Tribune B — Dakar Arena',      'lat' => 14.7448, 'lng' => -17.4658],
            ['label' => 'Zone Restauration',            'lat' => 14.7450, 'lng' => -17.4668],
            ['label' => 'Parking Principal',            'lat' => 14.7435, 'lng' => -17.4670],
        ];

        foreach ($qrPositions as $pos) {
            $existing = QrCode::where('location_label', $pos['label'])->first();
            if ($existing) continue;

            $qr = QrCode::create([
                'location_label' => $pos['label'],
                'latitude'       => $pos['lat'],
                'longitude'       => $pos['lng'],
                'zone_id'         => $arena?->id,
                'expires_at'      => '2026-08-15 23:59:59',
                'created_by'      => $coordinator?->id,
                'is_active'       => false,
                'token'           => 'tmp_' . \Illuminate\Support\Str::uuid(),
            ]);

            try {
                $token = $qrService->generateToken($qr);
                $qr->update([
                    'token'        => $token,
                    'is_active'    => true,
                    'activated_at' => now(),
                    'activated_by' => $coordinator?->id,
                ]);
            } catch (\Exception $e) {
                // QR_TOKEN_SECRET peut ne pas être configuré en démo
                $qr->update(['is_active' => true, 'activated_at' => now()]);
            }
        }

        // ----------------------------------------------------------------
        // Présences agents (tous disponibles pour la démo)
        // ----------------------------------------------------------------
        $agentPositions = [
            ['+221772000001', 14.7458, -17.4662],
            ['+221772000002', 14.7448, -17.4658],
            ['+221772000003', 14.7453, -17.4660],
        ];

        foreach ($agentPositions as [$phone, $lat, $lng]) {
            $agent = User::where('phone', $phone)->first();
            if (! $agent) continue;
            AgentPresence::updateOrCreate(['agent_id' => $agent->id], [
                'status'            => 'available',
                'latitude'          => $lat,
                'longitude'         => $lng,
                'last_heartbeat_at' => now(),
                'toggled_on_at'     => now()->subMinutes(30),
            ]);
        }

        // ----------------------------------------------------------------
        // Incidents actifs pour le dashboard
        // ----------------------------------------------------------------
        $demoIncidents = [
            [
                'ref'      => 'INC-2026-000001',
                'title'    => 'Malaise — Entrée Nord',
                'category' => 'health',
                'severity' => 'high',
                'priority' => 'p1',
                'status'   => 'in_progress',
                'lat'      => 14.7460,
                'lng'      => -17.4665,
            ],
            [
                'ref'      => 'INC-2026-000002',
                'title'    => 'Accès bloqué — Sortie B',
                'category' => 'access_blocked',
                'severity' => 'medium',
                'priority' => 'p2',
                'status'   => 'qualified',
                'lat'      => 14.7448,
                'lng'      => -17.4670,
            ],
            [
                'ref'      => 'INC-2026-000003',
                'title'    => 'Mouvement de foule — Tribune A',
                'category' => 'crowd',
                'severity' => 'critical',
                'priority' => 'p1',
                'status'   => 'mission_assigned',
                'lat'      => 14.7458,
                'lng'      => -17.4660,
            ],
        ];

        foreach ($demoIncidents as $inc) {
            if (Incident::where('reference', $inc['ref'])->exists()) continue;

            $incident = Incident::create([
                'reference'          => $inc['ref'],
                'title'              => $inc['title'],
                'category'           => $inc['category'],
                'severity'           => $inc['severity'],
                'priority'           => $inc['priority'],
                'latitude'           => $inc['lat'],
                'longitude'          => $inc['lng'],
                'zone_id'            => $arena?->id,
                'status'             => $inc['status'],
                'alertes_count'      => rand(1, 3),
                'created_by_user_id' => $coordinator?->id,
                'qualified_at'       => now()->subMinutes(rand(5, 30)),
            ]);

            // Alerte source pour chaque incident
            Alerte::create([
                'reference'      => 'AL-2026-' . str_pad(Alerte::count() + 1, 7, '0', STR_PAD_LEFT),
                'source_user_id' => $coordinator?->id,
                'category'       => $inc['category'],
                'description'    => 'Signalement démo — ' . $inc['title'],
                'latitude'       => $inc['lat'],
                'longitude'      => $inc['lng'],
                'zone_id'        => $arena?->id,
                'status'         => 'validated',
                'incident_id'    => $incident->id,
                'validated_at'   => now()->subMinutes(rand(5, 25)),
            ]);

            // Mission pour les incidents actifs
            if (in_array($inc['status'], ['in_progress', 'mission_assigned'])) {
                $agent = $agents->first();
                if ($agent) {
                    Mission::create([
                        'reference'           => 'MSN-2026-' . str_pad(Mission::count() + 1, 6, '0', STR_PAD_LEFT),
                        'incident_id'         => $incident->id,
                        'created_by_user_id'  => $coordinator?->id,
                        'assigned_to_user_id' => $agent->id,
                        'title'               => 'Intervention — ' . $inc['title'],
                        'briefing'            => 'Prendre en charge rapidement. Coordonner avec le PC.',
                        'status'              => $inc['status'] === 'in_progress' ? 'on_site' : 'assigned',
                        'latitude'            => $inc['lat'],
                        'longitude'           => $inc['lng'],
                        'assigned_at'         => now()->subMinutes(rand(3, 15)),
                        'estimated_duration_minutes' => 20,
                    ]);
                }
            }
        }

        $this->command->info('Demo seeder OK — ' . count($demoIncidents) . ' incidents, ' . count($qrPositions) . ' QR codes, ' . count($sites) . ' sites');
    }
}
