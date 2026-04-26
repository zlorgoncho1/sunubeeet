<?php
namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\AgentPresence;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * KPIs du dashboard (F4.2)
     */
    public function kpis(Request $request): JsonResponse
    {
        $user = $request->user();
        $zoneIds = $this->getZoneIdsForUser($user);

        // Incidents ouverts
        $openIncidents = Incident::whereIn('status', ['open', 'qualified', 'mission_assigned', 'in_progress'])
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->count();

        // Incidents critiques
        $criticalIncidents = Incident::where('severity', 'critical')
            ->whereIn('status', ['open', 'qualified', 'mission_assigned', 'in_progress'])
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->count();

        // Incidents high
        $highIncidents = Incident::where('severity', 'high')
            ->whereIn('status', ['open', 'qualified', 'mission_assigned', 'in_progress'])
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->count();

        // Temps de réponse moyen (en secondes)
        $avgResponseTime = Incident::whereNotNull('qualified_at')
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (qualified_at - created_at))) as avg_seconds')
            ->value('avg_seconds') ?? 0;

        // Temps de résolution moyen (en secondes)
        $avgResolutionTime = Incident::whereNotNull('resolved_at')
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_seconds')
            ->value('avg_seconds') ?? 0;

        // Missions actives
        $activeMissions = Mission::whereIn('status', ['assigned', 'accepted', 'on_route', 'on_site'])
            ->when($zoneIds, function($q) use ($zoneIds) {
                $q->whereHas('incident', fn($iq) => $iq->whereIn('zone_id', $zoneIds));
            })
            ->count();

        // Agents disponibles
        $availableAgents = AgentPresence::where('status', 'available')
            ->whereHas('agent', function($q) use ($zoneIds) {
                $q->where('is_active', true)
                  ->when($zoneIds, fn($uq) => $uq->whereIn('zone_id', $zoneIds));
            })
            ->count();

        // Agents sur site
        $agentsOnSite = Mission::where('status', 'on_site')
            ->when($zoneIds, function($q) use ($zoneIds) {
                $q->whereHas('incident', fn($iq) => $iq->whereIn('zone_id', $zoneIds));
            })
            ->distinct('assigned_to_user_id')
            ->count('assigned_to_user_id');

        // Agents offline
        $offlineAgents = AgentPresence::where('status', 'offline')
            ->whereHas('agent', function($q) use ($zoneIds) {
                $q->where('is_active', true)
                  ->when($zoneIds, fn($uq) => $uq->whereIn('zone_id', $zoneIds));
            })
            ->count();

        // Doublons potentiels en attente
        $potentialDuplicates = Alerte::where('is_potential_duplicate', true)
            ->where('status', 'received')
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->count();

        // Zones à chaud
        $hotZones = Incident::where('is_hot_zone', true)
            ->whereIn('status', ['open', 'qualified', 'mission_assigned', 'in_progress'])
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->distinct('zone_id')
            ->count('zone_id');

        return response()->json([
            'data' => [
                'open_incidents' => $openIncidents,
                'critical_incidents' => $criticalIncidents,
                'high_incidents' => $highIncidents,
                'average_response_time_seconds' => round($avgResponseTime),
                'average_resolution_time_seconds' => round($avgResolutionTime),
                'active_missions' => $activeMissions,
                'agents_available' => $availableAgents,
                'agents_on_site' => $agentsOnSite,
                'agents_offline' => $offlineAgents,
                'potential_duplicates_pending' => $potentialDuplicates,
                'hot_zones_count' => $hotZones,
            ],
        ]);
    }

    /**
     * Incidents en direct pour le dashboard
     */
    public function incidentsLive(Request $request): JsonResponse
    {
        $user = $request->user();
        $zoneIds = $this->getZoneIdsForUser($user);

        $incidents = Incident::with(['alertes' => fn($q) => $q->select('id', 'incident_id', 'status')])
            ->whereIn('status', ['open', 'qualified', 'mission_assigned', 'in_progress'])
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $incidents->map(function($incident) {
                return [
                    'id' => $incident->id,
                    'reference' => $incident->reference,
                    'title' => $incident->title,
                    'category' => $incident->category,
                    'severity' => $incident->severity,
                    'priority' => $incident->priority,
                    'status' => $incident->status,
                    'latitude' => $incident->latitude,
                    'longitude' => $incident->longitude,
                    'alertes_count' => $incident->alertes->count(),
                    'created_at' => $incident->created_at,
                ];
            }),
        ]);
    }

    /**
     * Agents en direct pour le dashboard
     */
    public function agentsLive(Request $request): JsonResponse
    {
        $user = $request->user();
        $zoneIds = $this->getZoneIdsForUser($user);

        $agents = User::with(['presence', 'team', 'missions' => function($q) {
                $q->whereIn('status', ['assigned', 'accepted', 'on_route', 'on_site'])
                  ->select('id', 'assigned_to_user_id', 'status');
            }])
            ->where('role', 'agent')
            ->where('is_active', true)
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->get();

        return response()->json([
            'data' => $agents->map(function($agent) {
                $currentMission = $agent->missions->first();
                $effectiveStatus = $this->calculateEffectiveStatus($agent->presence, $currentMission);

                return [
                    'agent' => [
                        'id' => $agent->id,
                        'fullname' => $agent->fullname,
                        'team_type' => $agent->team?->type,
                        'phone' => $agent->phone,
                    ],
                    'presence' => $agent->presence ? [
                        'status' => $agent->presence->status,
                        'effective_status' => $effectiveStatus,
                        'latitude' => $agent->presence->latitude,
                        'longitude' => $agent->presence->longitude,
                        'battery_level' => $agent->presence->battery_level,
                        'last_heartbeat_at' => $agent->presence->last_heartbeat_at,
                    ] : null,
                    'current_mission_id' => $currentMission?->id,
                ];
            }),
        ]);
    }

    /**
     * Alertes doublons potentiels en attente
     */
    public function pendingDuplicates(Request $request): JsonResponse
    {
        $user = $request->user();
        $zoneIds = $this->getZoneIdsForUser($user);

        $alertes = Alerte::with(['duplicateParent', 'sourceUser', 'sourceQr'])
            ->where('is_potential_duplicate', true)
            ->where('status', 'received')
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $alertes->map(function($alerte) {
                return [
                    'id' => $alerte->id,
                    'reference' => $alerte->reference,
                    'category' => $alerte->category,
                    'description' => $alerte->description,
                    'latitude' => $alerte->latitude,
                    'longitude' => $alerte->longitude,
                    'created_at' => $alerte->created_at,
                    'duplicate_of_reference' => $alerte->duplicateParent?->reference,
                    'source' => $alerte->source_qr_id ? 'qr' : 'user',
                ];
            }),
            'meta' => [
                'current_page' => $alertes->currentPage(),
                'per_page' => $alertes->perPage(),
                'total' => $alertes->total(),
                'last_page' => $alertes->lastPage(),
            ],
        ]);
    }

    /**
     * Calcul du statut effectif de l'agent
     */
    private function calculateEffectiveStatus(?AgentPresence $presence, ?Mission $mission): string
    {
        if (!$presence || $presence->status === 'offline') {
            return 'offline';
        }

        if (!$mission) {
            return 'available';
        }

        return match($mission->status) {
            'on_site' => 'on_site',
            'on_route' => 'on_route',
            'accepted', 'assigned' => 'assigned',
            default => 'available',
        };
    }

    /**
     * Récupère les zones accessibles par l'utilisateur
     */
    private function getZoneIdsForUser(User $user): ?array
    {
        // Pour admin/super_admin, pas de restriction
        if (in_array($user->role, ['admin', 'super_admin'])) {
            return null;
        }

        // Pour coordinator, zones de leur équipe
        if ($user->role === 'coordinator' && $user->team) {
            return $user->team->zones->pluck('id')->toArray();
        }

        return [];
    }
}
