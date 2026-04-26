<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Http\Requests\ValidateAlerteRequest;
use App\Http\Resources\AlerteResource;
use App\Models\Alerte;
use App\Models\Incident;
use App\Models\TrackingEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AlerteController extends Controller
{
    /**
     * Liste des alertes pour coordinateur
     */
    public function index(Request $request): JsonResponse
    {
        $query = Alerte::with(['incident', 'sourceUser', 'sourceQr']);

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        if ($request->has('severity') && $request->severity !== 'all') {
            $query->whereHas('incident', function ($q) use ($request) {
                $q->where('severity', $request->severity);
            });
        }
        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }
        if ($request->has('qr_id')) {
            $query->where('source_qr_id', $request->qr_id);
        }
        if ($request->has('is_potential_duplicate')) {
            $query->where('is_potential_duplicate', $request->boolean('is_potential_duplicate'));
        }
        if ($request->has('created_from')) {
            $query->where('created_at', '>=', $request->created_from);
        }
        if ($request->has('created_to')) {
            $query->where('created_at', '<=', $request->created_to);
        }
        if ($request->has('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        // Tri
        $sort = $request->get('sort', '-created_at');
        if ($sort === 'created_at') {
            $query->orderBy('created_at', 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $alertes = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => AlerteResource::collection($alertes),
            'meta' => [
                'current_page' => $alertes->currentPage(),
                'per_page' => $alertes->perPage(),
                'total' => $alertes->total(),
                'last_page' => $alertes->lastPage(),
            ],
            'links' => [
                'first' => $alertes->url(1),
                'last' => $alertes->url($alertes->lastPage()),
                'prev' => $alertes->previousPageUrl(),
                'next' => $alertes->nextPageUrl(),
            ],
        ]);
    }

    /**
     * Détail d'une alerte
     */
    public function show(Alerte $alerte): JsonResponse
    {
        $alerte->load(['incident', 'duplicateParent', 'mediaFiles', 'sourceUser', 'sourceQr']);

        return response()->json([
            'data' => [
                'alerte' => new AlerteResource($alerte),
                'incident' => $alerte->incident ? $alerte->incident : null,
                'duplicate_parent' => $alerte->duplicateParent ? new AlerteResource($alerte->duplicateParent) : null,
                'media' => [
                    'photo' => $alerte->photoMedia ? [
                        'url' => $alerte->photoMedia->getSignedUrl(),
                        'expires_at' => $alerte->photoMedia->getSignedUrlExpiry(),
                    ] : null,
                    'audio' => $alerte->audioMedia ? [
                        'url' => $alerte->audioMedia->getSignedUrl(),
                        'expires_at' => $alerte->audioMedia->getSignedUrlExpiry(),
                        'transcription_translated' => $alerte->audioMedia->transcription_translated,
                        'transcription_status' => $alerte->audioMedia->transcription_status,
                    ] : null,
                ],
                'source' => [
                    'type' => $alerte->source_qr_id ? 'qr' : 'user',
                    'qr_code' => $alerte->sourceQr ? [
                        'id' => $alerte->sourceQr->id,
                        'location_label' => $alerte->sourceQr->location_label,
                    ] : null,
                    'user' => $alerte->sourceUser ? [
                        'id' => $alerte->sourceUser->id,
                        'fullname' => $alerte->sourceUser->fullname,
                    ] : null,
                ],
            ],
        ]);
    }

    /**
     * Valider une alerte → créer ou attacher à un incident
     */
    public function validateAlerte(ValidateAlerteRequest $request, Alerte $alerte): JsonResponse
    {
        if ($alerte->status !== 'received') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'L\'alerte doit être en statut "received" pour être validée.',
                ]
            ], Response::HTTP_CONFLICT);
        }

        return DB::transaction(function () use ($request, $alerte) {
            $user = $request->user();

            if ($request->action === 'create_new_incident') {
                // Créer un nouvel incident
                $incident = Incident::create([
                    'reference' => Incident::generateReference(),
                    'title' => $request->incident_data['title'],
                    'description' => $alerte->description,
                    'category' => $alerte->category,
                    'sub_category' => $alerte->sub_category,
                    'severity' => $request->incident_data['severity'],
                    'priority' => $request->incident_data['priority'] ?? 'p3',
                    'latitude' => $alerte->latitude,
                    'longitude' => $alerte->longitude,
                    'zone_id' => $alerte->zone_id,
                    'created_by_user_id' => $user->id,
                ]);

                $alerte->update([
                    'status' => 'validated',
                    'incident_id' => $incident->id,
                    'validated_at' => now(),
                ]);

                // Tracking
                TrackingEvent::create([
                    'target_type' => 'alerte',
                    'target_id' => $alerte->id,
                    'actor_id' => $user->id,
                    'actor_role' => $user->role,
                    'action' => 'alerte.validated',
                    'from_status' => 'received',
                    'to_status' => 'validated',
                ]);

                TrackingEvent::create([
                    'target_type' => 'incident',
                    'target_id' => $incident->id,
                    'actor_id' => $user->id,
                    'actor_role' => $user->role,
                    'action' => 'incident.created',
                ]);

                return response()->json([
                    'data' => [
                        'alerte' => new AlerteResource($alerte->fresh()),
                        'incident' => $incident,
                    ],
                ]);

            } elseif ($request->action === 'attach_to_existing') {
                // Attacher à un incident existant
                $incident = Incident::findOrFail($request->incident_id);

                $alerte->update([
                    'status' => 'validated',
                    'incident_id' => $incident->id,
                    'validated_at' => now(),
                ]);

                // Tracking
                TrackingEvent::create([
                    'target_type' => 'alerte',
                    'target_id' => $alerte->id,
                    'actor_id' => $user->id,
                    'actor_role' => $user->role,
                    'action' => 'alerte.validated',
                    'from_status' => 'received',
                    'to_status' => 'validated',
                ]);

                return response()->json([
                    'data' => [
                        'alerte' => new AlerteResource($alerte->fresh()),
                        'incident' => $incident,
                    ],
                ]);
            }

            return response()->json([
                'error' => [
                    'code' => 'INVALID_ACTION',
                    'message' => 'Action non reconnue.',
                ]
            ], Response::HTTP_BAD_REQUEST);
        });
    }

    /**
     * Marquer comme doublon
     */
    public function markDuplicate(Request $request, Alerte $alerte): JsonResponse
    {
        $request->validate([
            'duplicate_of_alerte_id' => 'required|exists:alertes,id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($alerte->status !== 'received') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'L\'alerte doit être en statut "received".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $duplicateOf = Alerte::findOrFail($request->duplicate_of_alerte_id);

        $alerte->update([
            'status' => 'duplicate',
            'duplicate_of_alerte_id' => $duplicateOf->id,
            'resolution_reason' => $request->note,
        ]);

        TrackingEvent::create([
            'target_type' => 'alerte',
            'target_id' => $alerte->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'alerte.marked_duplicate',
            'from_status' => 'received',
            'to_status' => 'duplicate',
            'note' => $request->note,
        ]);

        return response()->json([
            'data' => new AlerteResource($alerte->fresh()),
        ]);
    }

    /**
     * Marquer comme fausse alerte
     */
    public function markFalseAlert(Request $request, Alerte $alerte): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if (!in_array($alerte->status, ['received', 'validated'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'L\'alerte doit être en statut "received" ou "validated".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $alerte->update([
            'status' => 'false_alert',
            'resolution_reason' => $request->reason,
        ]);

        TrackingEvent::create([
            'target_type' => 'alerte',
            'target_id' => $alerte->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'alerte.marked_false_alert',
            'from_status' => $alerte->getOriginal('status'),
            'to_status' => 'false_alert',
            'note' => $request->reason,
        ]);

        return response()->json([
            'data' => new AlerteResource($alerte->fresh()),
        ]);
    }

    /**
     * Rejeter l'alerte
     */
    public function reject(Request $request, Alerte $alerte): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($alerte->status !== 'received') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'L\'alerte doit être en statut "received".',
                ]
            ], Response::HTTP_CONFLICT);
        }

        $alerte->update([
            'status' => 'rejected',
            'resolution_reason' => $request->reason,
        ]);

        TrackingEvent::create([
            'target_type' => 'alerte',
            'target_id' => $alerte->id,
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->role,
            'action' => 'alerte.rejected',
            'from_status' => 'received',
            'to_status' => 'rejected',
            'note' => $request->reason,
        ]);

        return response()->json([
            'data' => new AlerteResource($alerte->fresh()),
        ]);
    }

    /**
     * Timeline d'une alerte
     */
    public function timeline(Alerte $alerte): JsonResponse
    {
        $events = TrackingEvent::where('target_type', 'alerte')
            ->where('target_id', $alerte->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $events->map(function ($event) {
                return [
                    'id' => $event->id,
                    'action' => $event->action,
                    'from_status' => $event->from_status,
                    'to_status' => $event->to_status,
                    'note' => $event->note,
                    'actor' => $event->actor ? [
                        'id' => $event->actor->id,
                        'fullname' => $event->actor->fullname,
                        'role' => $event->actor->role,
                    ] : null,
                    'created_at' => $event->created_at,
                ];
            }),
        ]);
    }
}
