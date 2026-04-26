<?php
namespace App\Http\Controllers\Agent;
use App\Http\Controllers\Controller;
use App\Models\AgentPresence;
use App\Models\TrackingEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
class PresenceController extends Controller {
    /**
     * Toggle présence on/off (F3.2)
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:available,offline',
            'latitude' => 'required_if:status,available|numeric|between:-90,90',
            'longitude' => 'required_if:status,available|numeric|between:-180,180',
            'battery_level' => 'nullable|integer|between:0,100',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($request, $user) {
            $presence = AgentPresence::firstOrNew(['agent_id' => $user->id]);

            $oldStatus = $presence->status;

            if ($request->status === 'available') {
                $presence->fill([
                    'status' => 'available',
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'battery_level' => $request->battery_level,
                    'last_heartbeat_at' => now(),
                    'toggled_on_at' => $oldStatus === 'offline' ? now() : $presence->toggled_on_at,
                ]);
            } else {
                // Vérifier qu'il n'a pas de mission active
                $activeMission = $user->missions()
                    ->whereIn('status', ['assigned', 'accepted', 'on_route', 'on_site'])
                    ->first();

                if ($activeMission) {
                    return response()->json([
                        'error' => [
                            'code' => 'CONFLICT',
                            'message' => 'Vous avez une mission active. Terminez ou refusez la mission avant de vous déconnecter.',
                        ]
                    ], Response::HTTP_CONFLICT);
                }

                $presence->fill([
                    'status' => 'offline',
                    'toggled_off_at' => now(),
                ]);
            }

            $presence->updated_at = now();
            $presence->save();

            // Tracking
            $action = $request->status === 'available' ? 'agent.toggle_on' : 'agent.toggle_off';
            TrackingEvent::create([
                'target_type' => 'alerte', // Note: spec says 'agent' but model uses 'alerte' as target_type?
                'target_id' => $user->id,
                'actor_id' => $user->id,
                'actor_role' => $user->role,
                'action' => $action,
                'from_status' => $oldStatus,
                'to_status' => $request->status,
            ]);

            return response()->json([
                'data' => [
                    'presence' => [
                        'status' => $presence->status,
                        'toggled_on_at' => $presence->toggled_on_at,
                        'toggled_off_at' => $presence->toggled_off_at,
                        'updated_at' => $presence->updated_at,
                    ],
                ],
            ]);
        });
    }
    /**
     * Heartbeat (ping toutes les 30s)
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $user = $request->user();
        // Optionnel: mettre à jour position si fournie
        $request->validate([
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);
        $presence = AgentPresence::where('agent_id', $user->id)
            ->where('status', 'available')
            ->first();
        if ($presence) {
            $updateData = ['last_heartbeat_at' => now()];
            if ($request->has('latitude') && $request->has('longitude')) {
                $updateData['latitude'] = $request->latitude;
                $updateData['longitude'] = $request->longitude;
                // Tracking pour mise à jour position
                TrackingEvent::create([
                    'target_type' => 'alerte',
                    'target_id' => $user->id,
                    'actor_id' => $user->id,
                    'actor_role' => $user->role,
                    'action' => 'agent.location_updated',
                    'metadata' => [
                        'latitude' => $request->latitude,
                        'longitude' => $request->longitude,
                    ],
                ]);
            }
            $presence->update($updateData);
        }
        return response()->json(['data' => ['heartbeat_received' => true]]);
    }
}
