<?php
namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\AgentPresence;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\TrackingEvent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        // Alertes non traitées (status = received)
        $unprocessedAlertes = Alerte::where('status', 'received')
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->count();

        // Délai moyen received → validated (alertes validées dans les dernières 24h)
        $avgValidationTime = Alerte::whereNotNull('validated_at')
            ->where('validated_at', '>=', now()->subDay())
            ->when($zoneIds, fn($q) => $q->whereIn('zone_id', $zoneIds))
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (validated_at - created_at))) as avg_seconds')
            ->value('avg_seconds') ?? 0;

        // Missions sans réponse > 5 min (status = assigned, age > 5 min)
        $missionsUnanswered = Mission::where('status', 'assigned')
            ->where('assigned_at', '<=', now()->subMinutes(5))
            ->when($zoneIds, function($q) use ($zoneIds) {
                $q->whereHas('incident', fn($iq) => $iq->whereIn('zone_id', $zoneIds));
            })
            ->count();

        // Missions terminées aujourd'hui
        $missionsCompletedToday = Mission::where('status', 'completed')
            ->whereDate('completed_at', now()->toDateString())
            ->when($zoneIds, function($q) use ($zoneIds) {
                $q->whereHas('incident', fn($iq) => $iq->whereIn('zone_id', $zoneIds));
            })
            ->count();

        return response()->json([
            'data' => [
                'open_incidents' => $openIncidents,
                'critical_incidents' => $criticalIncidents,
                'high_incidents' => $highIncidents,
                'average_response_time_seconds' => round($avgResponseTime),
                'average_resolution_time_seconds' => round($avgResolutionTime),
                'average_validation_time_seconds' => round($avgValidationTime),
                'active_missions' => $activeMissions,
                'agents_available' => $availableAgents,
                'agents_on_site' => $agentsOnSite,
                'agents_offline' => $offlineAgents,
                'potential_duplicates_pending' => $potentialDuplicates,
                'hot_zones_count' => $hotZones,
                'unprocessed_alertes' => $unprocessedAlertes,
                'missions_unanswered_5min' => $missionsUnanswered,
                'missions_completed_today' => $missionsCompletedToday,
            ],
        ]);
    }

    /**
     * GET /v1/dashboard/timeline
     *
     * Chronologie des tracking_events de la journée pour la zone du
     * coordinateur. Filtres : target_type (alerte|incident|mission),
     * action (préfixe), limit (défaut 100, max 500).
     */
    public function timeline(Request $request): JsonResponse
    {
        $user = $request->user();
        $zoneIds = $this->getZoneIdsForUser($user);

        $limit = max(1, min(500, (int) $request->query('limit', 100)));
        $targetType = $request->query('target_type');
        $actionPrefix = $request->query('action');
        $from = $request->query('from')
            ? \Illuminate\Support\Carbon::parse($request->query('from'))
            : now()->startOfDay();

        // Pour scoper par zone, on filtre via les FK (alertes/incidents/missions
        // qui ont un zone_id). Les events sans target_id ne sont pas filtrés.
        $alerteIds = $zoneIds
            ? Alerte::whereIn('zone_id', $zoneIds)->pluck('id')
            : null;
        $incidentIds = $zoneIds
            ? Incident::whereIn('zone_id', $zoneIds)->pluck('id')
            : null;
        $missionIds = $zoneIds
            ? Mission::whereHas('incident', fn ($q) => $q->whereIn('zone_id', $zoneIds))->pluck('id')
            : null;

        $events = TrackingEvent::with('actor:id,fullname,role')
            ->where('created_at', '>=', $from)
            ->when($targetType, fn ($q) => $q->where('target_type', $targetType))
            ->when($actionPrefix, fn ($q) => $q->where('action', 'like', $actionPrefix.'%'))
            ->when($zoneIds !== null, function ($q) use ($alerteIds, $incidentIds, $missionIds) {
                $q->where(function ($qq) use ($alerteIds, $incidentIds, $missionIds) {
                    $qq->where(fn ($w) => $w->where('target_type', 'alerte')->whereIn('target_id', $alerteIds))
                       ->orWhere(fn ($w) => $w->where('target_type', 'incident')->whereIn('target_id', $incidentIds))
                       ->orWhere(fn ($w) => $w->where('target_type', 'mission')->whereIn('target_id', $missionIds));
                });
            })
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $events->map(fn ($e) => [
                'id' => $e->id,
                'target_type' => $e->target_type,
                'target_id' => $e->target_id,
                'action' => $e->action,
                'from_status' => $e->from_status,
                'to_status' => $e->to_status,
                'actor' => $e->actor ? [
                    'id' => $e->actor->id,
                    'fullname' => $e->actor->fullname,
                    'role' => $e->actor->role,
                ] : null,
                'note' => $e->note,
                'created_at' => $e->created_at,
            ]),
            'meta' => [
                'count' => $events->count(),
                'limit' => $limit,
                'from' => $from->toIso8601String(),
            ],
        ]);
    }

    /**
     * GET /v1/dashboard/shift-report
     *
     * Synthèse du shift (depuis 00:00 par défaut) : alertes reçues / validées
     * / fausses, incidents ouverts / résolus, missions, délai médian.
     */
    public function shiftReport(Request $request): JsonResponse
    {
        $user = $request->user();
        $zoneIds = $this->getZoneIdsForUser($user);

        $from = $request->query('from')
            ? \Illuminate\Support\Carbon::parse($request->query('from'))
            : now()->startOfDay();
        $to = $request->query('to')
            ? \Illuminate\Support\Carbon::parse($request->query('to'))
            : now();

        $alerteScope = Alerte::whereBetween('created_at', [$from, $to])
            ->when($zoneIds, fn ($q) => $q->whereIn('zone_id', $zoneIds));

        $incidentScope = Incident::whereBetween('created_at', [$from, $to])
            ->when($zoneIds, fn ($q) => $q->whereIn('zone_id', $zoneIds));

        $missionScope = Mission::whereBetween('created_at', [$from, $to])
            ->when($zoneIds, function ($q) use ($zoneIds) {
                $q->whereHas('incident', fn ($iq) => $iq->whereIn('zone_id', $zoneIds));
            });

        $alertes = [
            'total' => (clone $alerteScope)->count(),
            'received' => (clone $alerteScope)->where('status', 'received')->count(),
            'validated' => (clone $alerteScope)->where('status', 'validated')->count(),
            'duplicate' => (clone $alerteScope)->where('status', 'duplicate')->count(),
            'false_alert' => (clone $alerteScope)->where('status', 'false_alert')->count(),
            'rejected' => (clone $alerteScope)->where('status', 'rejected')->count(),
        ];

        $byCategory = (clone $alerteScope)
            ->selectRaw('category, COUNT(*) as n')
            ->groupBy('category')
            ->pluck('n', 'category')
            ->toArray();

        $incidents = [
            'created' => (clone $incidentScope)->count(),
            'resolved' => (clone $incidentScope)->whereIn('status', ['resolved', 'closed'])->count(),
            'cancelled' => (clone $incidentScope)->where('status', 'cancelled')->count(),
            'still_open' => (clone $incidentScope)
                ->whereIn('status', ['open', 'qualified', 'mission_assigned', 'in_progress'])
                ->count(),
        ];

        $missions = [
            'created' => (clone $missionScope)->count(),
            'completed' => (clone $missionScope)->where('status', 'completed')->count(),
            'cancelled' => (clone $missionScope)->where('status', 'cancelled')->count(),
            'refused' => (clone $missionScope)->where('status', 'refused')->count(),
        ];

        // Délai médian validation (alertes validées dans la fenêtre)
        $medianValidation = (clone $alerteScope)
            ->whereNotNull('validated_at')
            ->selectRaw("PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (validated_at - created_at))) as med")
            ->value('med');

        return response()->json([
            'data' => [
                'window' => [
                    'from' => $from->toIso8601String(),
                    'to' => $to->toIso8601String(),
                    'duration_hours' => round($to->diffInMinutes($from) / 60, 1),
                ],
                'alertes' => $alertes,
                'alertes_by_category' => $byCategory,
                'incidents' => $incidents,
                'missions' => $missions,
                'median_validation_seconds' => $medianValidation !== null ? round($medianValidation, 1) : null,
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
