<?php

namespace App\Http\Controllers\Spectator;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\TrackingEvent;
use App\Services\AntiSpamService;
use App\Services\ReferenceService;
use Illuminate\Http\Request;

class AlereteController extends Controller
{
    public function __construct(
        private AntiSpamService  $antiSpam,
        private ReferenceService $reference,
    ) {}

    public function store(Request $request)
    {
        $data = $request->validate([
            'category'       => ['required', 'string', 'in:health,security,crowd,access_blocked,fire_danger,lost_found,logistics,transport,other'],
            'sub_category'   => ['nullable', 'array'],
            'description'    => ['nullable', 'string', 'max:300'],
            'photo_media_id' => ['nullable', 'uuid', 'exists:media_files,id'],
            'audio_media_id' => ['nullable', 'uuid', 'exists:media_files,id'],
            'latitude'       => ['required', 'numeric', 'between:-90,90'],
            'longitude'      => ['required', 'numeric', 'between:-180,180'],
            'zone_id'        => ['nullable', 'uuid', 'exists:zones,id'],
        ]);

        if (empty($data['description']) && empty($data['photo_media_id']) && empty($data['audio_media_id'])) {
            return response()->json([
                'message' => 'Au moins une description, photo ou audio est requis.',
            ], 422);
        }

        $user = auth('api')->user();
        $lat  = (float) $data['latitude'];
        $lng  = (float) $data['longitude'];

        // Anti-spam
        $parentId    = $this->antiSpam->findParent($data['category'], $lat, $lng);
        $isDuplicate = $parentId !== null;

        $alerte = Alerte::create([
            'reference'              => $this->reference->nextAlerte(),
            'source_qr_id'           => null,
            'source_user_id'         => $user->id,
            'category'               => $data['category'],
            'sub_category'           => $data['sub_category'] ?? null,
            'description'            => $data['description'] ?? null,
            'photo_media_id'         => $data['photo_media_id'] ?? null,
            'audio_media_id'         => $data['audio_media_id'] ?? null,
            'latitude'               => $lat,
            'longitude'              => $lng,
            'zone_id'                => $data['zone_id'] ?? null,
            'status'                 => 'received',
            'is_potential_duplicate' => $isDuplicate,
            'duplicate_of_alerte_id' => $parentId,
            'client_ip'              => $request->ip(),
            'client_fingerprint'     => $request->header('X-Fingerprint'),
        ]);

        TrackingEvent::create([
            'target_type' => 'alerte',
            'target_id'   => $alerte->id,
            'actor_id'    => $user->id,
            'actor_role'  => 'spectator',
            'action'      => 'alerte.created',
            'to_status'   => 'received',
            'metadata'    => ['is_duplicate' => $isDuplicate, 'source' => 'app'],
            'latitude'    => $lat,
            'longitude'   => $lng,
        ]);

        return response()->json([
            'data' => [
                'id'                     => $alerte->id,
                'reference'              => $alerte->reference,
                'status'                 => $alerte->status,
                'is_potential_duplicate' => $isDuplicate,
            ],
        ], 201);
    }
}
