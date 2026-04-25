<?php

namespace App\Http\Controllers\Spectator;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\TrackingEvent;
use Illuminate\Http\Request;

class MyAlerteController extends Controller
{
    public function index(Request $request)
    {
        $user = auth('api')->user();

        $alertes = Alerte::where('source_user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($alertes);
    }

    public function timeline(Request $request, Alerte $alerte)
    {
        $user = auth('api')->user();

        // Coordinateurs et admins peuvent voir toutes les timelines
        $canViewAll = in_array($user->role, ['coordinator', 'admin', 'super_admin']);

        if (! $canViewAll && $alerte->source_user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $events = TrackingEvent::where('target_type', 'alerte')
            ->where('target_id', $alerte->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn($e) => [
                'action'      => $e->action,
                'from_status' => $e->from_status,
                'to_status'   => $e->to_status,
                'note'        => $e->note,
                'created_at'  => $e->created_at,
            ]);

        // Ajouter aussi les events de l'incident lié (statut mission pour le spectateur)
        $incidentEvents = collect();
        if ($alerte->incident_id) {
            $incidentEvents = TrackingEvent::where('target_type', 'incident')
                ->where('target_id', $alerte->incident_id)
                ->whereIn('action', [
                    'incident.qualified',
                    'incident.resolved',
                    'incident.closed',
                    'mission.assigned',
                    'mission.accepted',
                    'mission.on_route',
                    'mission.on_site',
                    'mission.completed',
                ])
                ->orderBy('created_at')
                ->get()
                ->map(fn($e) => [
                    'action'      => $e->action,
                    'from_status' => $e->from_status,
                    'to_status'   => $e->to_status,
                    'note'        => null,
                    'created_at'  => $e->created_at,
                ]);
        }

        $timeline = $events->concat($incidentEvents)->sortBy('created_at')->values();

        return response()->json([
            'data' => [
                'alerte' => [
                    'id'        => $alerte->id,
                    'reference' => $alerte->reference,
                    'category'  => $alerte->category,
                    'status'    => $alerte->status,
                ],
                'timeline' => $timeline,
            ],
        ]);
    }
}
