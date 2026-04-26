<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Http\Resources\MissionResource;
use App\Models\Mission;
use App\Models\TrackingEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class MissionController extends Controller
{
    /**
     * Liste des missions de l'agent (toutes)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $missions = Mission::where('assigned_to_user_id', $user->id)
            ->with(['incident', 'serviceInfos.site'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

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
     * Mission active de l'agent (F3.5)
     */
    public function active(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeMissions = Mission::where('assigned_to_user_id', $user->id)
            ->whereIn('status', ['assigned', 'accepted', 'on_route', 'on_site'])
            ->with(['incident', 'serviceInfos.site'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => [
                'active_missions' => MissionResource::collection($activeMissions),
            ],
        ]);
    }

    /**
     * Accepter une mission (F3.6)
     */
    public function accept(Request $request, Mission $mission): JsonResponse
    {
        if ($mission->assigned_to_user_id !== $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cette mission ne vous est pas assignée.',
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        if ($mission->status !== 'assigned') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission doit être en statut "assigned".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $request->validate([
            'current_location' => 'nullable|array',
            'current_location.latitude' => 'required_with:current_location|numeric|between:-90,90',
            'current_location.longitude' => 'required_with:current_location|numeric|between:-180,180',
        ]);

        $mission->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.accepted',
            'from_status' => 'assigned',
            'to_status' => 'accepted',
        ]);

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * Refuser une mission
     */
    public function refuse(Request $request, Mission $mission): JsonResponse
    {
        if ($mission->assigned_to_user_id !== $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cette mission ne vous est pas assignée.',
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        if ($mission->status !== 'assigned') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission doit être en statut "assigned".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $mission->update([
            'status' => 'refused',
            'refusal_reason' => $request->reason,
            'refused_at' => now(),
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.refused',
            'from_status' => 'assigned',
            'to_status' => 'refused',
            'note' => $request->reason,
        ]);

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * En route
     */
    public function onRoute(Request $request, Mission $mission): JsonResponse
    {
        if ($mission->assigned_to_user_id !== $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cette mission ne vous est pas assignée.',
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        if ($mission->status !== 'accepted') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission doit être en statut "accepted".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $mission->update([
            'status' => 'on_route',
            'on_route_at' => now(),
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.on_route',
            'from_status' => 'accepted',
            'to_status' => 'on_route',
        ]);

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * Sur place
     */
    public function onSite(Request $request, Mission $mission): JsonResponse
    {
        if ($mission->assigned_to_user_id !== $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cette mission ne vous est pas assignée.',
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        if ($mission->status !== 'on_route') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission doit être en statut "on_route".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $request->validate([
            'location_check' => 'nullable|array',
            'location_check.latitude' => 'required_with:location_check|numeric|between:-90,90',
            'location_check.longitude' => 'required_with:location_check|numeric|between:-180,180',
        ]);

        $mission->update([
            'status' => 'on_site',
            'on_site_at' => now(),
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.on_site',
            'from_status' => 'on_route',
            'to_status' => 'on_site',
        ]);

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * Terminer la mission
     */
    public function complete(Request $request, Mission $mission): JsonResponse
    {
        if ($mission->assigned_to_user_id !== $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cette mission ne vous est pas assignée.',
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        if ($mission->status !== 'on_site') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission doit être en statut "on_site".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $request->validate([
            'note' => 'nullable|string|max:1000',
            'outcome' => 'required|in:resolved,transferred,false_alert,escalated',
        ]);

        $mission->update([
            'status' => 'completed',
            'completion_note' => $request->note,
            'outcome' => $request->outcome,
            'completed_at' => now(),
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.completed',
            'from_status' => 'on_site',
            'to_status' => 'completed',
            'note' => $request->note,
            'metadata' => ['outcome' => $request->outcome],
        ]);

        return response()->json([
            'data' => new MissionResource($mission->fresh()),
        ]);
    }

    /**
     * Demander renfort
     */
    public function requestReinforcement(Request $request, Mission $mission): JsonResponse
    {
        if ($mission->assigned_to_user_id !== $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cette mission ne vous est pas assignée.',
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        if (!in_array($mission->status, ['accepted', 'on_route', 'on_site'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'La mission doit être active.',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $request->validate([
            'note' => 'required|string|max:500',
        ]);

        TrackingEvent::create([
            'target_type' => 'mission',
            'target_id' => $mission->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'mission.reinforcement_requested',
            'note' => $request->note,
        ]);

        return response()->json([
            'data' => ['reinforcement_requested' => true],
        ]);
    }
}
