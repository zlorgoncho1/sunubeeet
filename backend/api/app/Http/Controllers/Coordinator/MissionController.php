<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMissionRequest;
use App\Http\Resources\MissionResource;
use App\Models\Mission;
use App\Models\MissionServiceInfo;
use App\Models\TrackingEvent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class MissionController extends Controller
{
    /**
     * Liste des missions (coordinateur)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Mission::with(['incident', 'assignedUser', 'serviceInfos.site']);

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('assigned_to_user_id')) {
            $query->where('assigned_to_user_id', $request->assigned_to_user_id);
        }
        if ($request->has('incident_id')) {
            $query->where('incident_id', $request->incident_id);
        }

        $missions = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => MissionResource::collection($missions),
            'meta' => [
                'current_page' => $missions->currentPage(),
                'per_page' => $missions->perPage(),
                'total' => $missions->total(),
                'last_page' => $missions->lastPage(),
            ],
        ]);
    }

    /**
     * Détail d'une mission
     */
    public function show(Mission $mission): JsonResponse
    {
        $mission->load(['incident', 'assignedUser', 'serviceInfos.site']);

        return response()->json([
            'data' => new MissionResource($mission),
        ]);
    }

    /**
     * Créer une mission (F4.4)
     */
    public function store(CreateMissionRequest $request): JsonResponse
    {
        $user = $request->user();

        return DB::transaction(function () use ($request, $user) {
            // Vérifier que l'agent est disponible
            $agent = User::where('id', $request->assigned_to_user_id)
                ->where('role', 'agent')
                ->where('is_active', true)
                ->firstOrFail();

            // Vérifier qu'il n'a pas déjà une mission active
            $activeMission = Mission::where('assigned_to_user_id', $agent->id)
                ->whereIn('status', ['assigned', 'accepted', 'on_route', 'on_site'])
                ->first();

            if ($activeMission) {
                return response()->json([
                    'error' => [
                        'code' => 'AGENT_BUSY',
                        'message' => 'Cet agent a déjà une mission active.',
                    ]
                ], Response::HTTP_CONFLICT);
            }

            // Créer la mission
            $mission = Mission::create([
                'reference' => Mission::generateReference(),
                'incident_id' => $request->incident_id,
                'created_by_user_id' => $user->id,
                'assigned_to_user_id' => $request->assigned_to_user_id,
                'title' => $request->title,
                'briefing' => $request->briefing,
                'estimated_duration_minutes' => $request->estimated_duration_minutes,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            // Attacher les sites de service info
            if ($request->has('service_info_site_ids')) {
                foreach ($request->service_info_site_ids as $index => $siteId) {
                    MissionServiceInfo::create([
                        'mission_id' => $mission->id,
                        'site_id' => $siteId,
                        'priority_order' => $index + 1,
                        'added_by_user_id' => $user->id,
                    ]);
                }
            }

            // Tracking
            TrackingEvent::create([
                'target_type' => 'mission',
                'target_id' => $mission->id,
                'actor_id' => $user->id,
                'actor_role' => $user->role,
                'action' => 'mission.created',
            ]);

            if ($request->send_immediately) {
                $mission->update(['status' => 'assigned', 'assigned_at' => now()]);

                TrackingEvent::create([
                    'target_type' => 'mission',
                    'target_id' => $mission->id,
                    'actor_id' => $user->id,
                    'actor_role' => $user->role,
                    'action' => 'mission.assigned',
                    'from_status' => 'created',
                    'to_status' => 'assigned',
                ]);
            }

            return response()->json([
                'data' => new MissionResource($mission->fresh()->load('serviceInfos.site')),
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Modifier une mission
     */
    public function update(Request $request, Mission $mission): JsonResponse
    {
        if (!in_array($mission->status, ['created', 'assigned'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission ne peut plus être modifiée.',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'briefing' => 'nullable|string|max:1000',
            'estimated_duration_minutes' => 'nullable|integer|min:1|max:1440',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
        ]);

        $mission->update($request->only([
            'title', 'briefing', 'estimated_duration_minutes', 'latitude', 'longitude'
        ]));

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * Annuler une mission
     */
    public function cancel(Request $request, Mission $mission): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if (in_array($mission->status, ['completed', 'cancelled'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission est déjà terminée.',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $mission->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->reason,
            'cancelled_at' => now(),
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.cancelled',
            'from_status' => $mission->getOriginal('status'),
            'to_status' => 'cancelled',
            'note' => $request->reason,
        ]);

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * Réassigner une mission
     */
    public function reassign(Request $request, Mission $mission): JsonResponse
    {
        $request->validate([
            'assigned_to_user_id' => 'required|exists:users,id',
            'reason' => 'required|string|max:500',
        ]);

        if (!in_array($mission->status, ['created', 'assigned', 'accepted'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission ne peut plus être réassignée.',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $newAgent = User::where('id', $request->assigned_to_user_id)
            ->where('role', 'agent')
            ->where('is_active', true)
            ->firstOrFail();

        // Vérifier que le nouvel agent n'a pas de mission active
        $activeMission = Mission::where('assigned_to_user_id', $newAgent->id)
            ->whereIn('status', ['assigned', 'accepted', 'on_route', 'on_site'])
            ->where('id', '!=', $mission->id)
            ->first();

        if ($activeMission) {
            return response()->json([
                'error' => [
                    'code' => 'AGENT_BUSY',
                    'message' => 'Cet agent a déjà une mission active.',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $oldAgentId = $mission->assigned_to_user_id;
        $mission->update([
            'assigned_to_user_id' => $newAgent->id,
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.reassigned',
            'note' => $request->reason,
            'metadata' => [
                'old_agent_id' => $oldAgentId,
                'new_agent_id' => $newAgent->id,
            ],
        ]);

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * Ajouter une info service à une mission
     */
    public function addServiceInfo(Request $request, Mission $mission): JsonResponse
    {
        $request->validate([
            'site_id' => 'required|exists:sites,id',
            'suggested_action' => 'nullable|string|max:500',
        ]);

        // Vérifier que le site n'est pas déjà attaché
        $existing = MissionServiceInfo::where('mission_id', $mission->id)
            ->where('site_id', $request->site_id)
            ->first();

        if ($existing) {
            return response()->json([
                'error' => [
                    'code' => 'ALREADY_EXISTS',
                    'message' => 'Ce site est déjà attaché à la mission.',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $maxOrder = MissionServiceInfo::where('mission_id', $mission->id)->max('priority_order') ?? 0;

        $serviceInfo = MissionServiceInfo::create([
            'mission_id' => $mission->id,
            'site_id' => $request->site_id,
            'suggested_action' => $request->suggested_action,
            'priority_order' => $maxOrder + 1,
            'added_by_user_id' => $request->user()->id,
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.service_info_added',
            'metadata' => ['site_id' => $request->site_id],
        ]);

        return response()->json([
            'data' => $serviceInfo->load('site'),
        ], Response::HTTP_CREATED);
    }

    /**
     * Supprimer une info service
     */
    public function removeServiceInfo(Request $request, Mission $mission, MissionServiceInfo $serviceInfo): JsonResponse
    {
        if ($serviceInfo->mission_id !== $mission->id) {
            return response()->json([
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Info service non trouvée pour cette mission.',
                ]
            ], Response::HTTP_NOT_FOUND);
        }

        $siteId = $serviceInfo->site_id;
        $serviceInfo->delete();

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.service_info_removed',
            'metadata' => ['site_id' => $siteId],
        ]);

        return response()->json([
            'data' => ['removed' => true],
        ]);
    }

    /**
     * Liste des infos service d'une mission
     */
    public function serviceInfos(Mission $mission): JsonResponse
    {
        $serviceInfos = $mission->serviceInfos()->with('site')->orderBy('priority_order')->get();

        return response()->json([
            'data' => $serviceInfos,
        ]);
    }
}
