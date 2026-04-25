<?php

namespace App\Http\Controllers\QR;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\QrCode;
use App\Models\TrackingEvent;
use App\Services\AntiSpamService;
use App\Services\ReferenceService;
use Illuminate\Http\Request;

class QrAlerteController extends Controller
{
    public function __construct(
        private AntiSpamService  $antiSpam,
        private ReferenceService $reference,
    ) {}

    public function store(Request $request)
    {
        $session = $request->qr_session; // injecté par ValidateQrSession
        $qrId    = $session->get('qr_id');
        $loc     = $session->get('loc');

        $qr = QrCode::find($qrId);
        if (! $qr || ! $qr->is_active) {
            return response()->json(['message' => 'QR code invalide.'], 422);
        }

        $data = $request->validate([
            'category'       => ['required', 'string', 'in:health,security,crowd,access_blocked,fire_danger,lost_found,logistics,transport,other'],
            'sub_category'   => ['nullable', 'array'],
            'description'    => ['nullable', 'string', 'max:300'],
            'photo_media_id' => ['nullable', 'uuid', 'exists:media_files,id'],
            'audio_media_id' => ['nullable', 'uuid', 'exists:media_files,id'],
        ]);

        // Au moins un champ de contenu requis en plus de la catégorie
        if (empty($data['description']) && empty($data['photo_media_id']) && empty($data['audio_media_id'])) {
            return response()->json([
                'message' => 'Au moins une description, photo ou audio est requis.',
            ], 422);
        }

        $lat = (float) $loc['lat'];
        $lng = (float) $loc['lng'];

        // Anti-spam
        $parentId    = $this->antiSpam->findParent($data['category'], $lat, $lng);
        $isDuplicate = $parentId !== null;

        $alerte = Alerte::create([
            'reference'              => $this->reference->nextAlerte(),
            'source_qr_id'           => $qrId,
            'source_user_id'         => null,
            'category'               => $data['category'],
            'sub_category'           => $data['sub_category'] ?? null,
            'description'            => $data['description'] ?? null,
            'photo_media_id'         => $data['photo_media_id'] ?? null,
            'audio_media_id'         => $data['audio_media_id'] ?? null,
            'latitude'               => $lat,
            'longitude'              => $lng,
            'zone_id'                => $qr->zone_id,
            'status'                 => 'received',
            'is_potential_duplicate' => $isDuplicate,
            'duplicate_of_alerte_id' => $parentId,
            'client_ip'              => $request->ip(),
            'client_fingerprint'     => $request->header('X-Fingerprint'),
        ]);

        TrackingEvent::create([
            'target_type' => 'alerte',
            'target_id'   => $alerte->id,
            'actor_role'  => 'anonymous',
            'action'      => 'alerte.created',
            'to_status'   => 'received',
            'metadata'    => ['is_duplicate' => $isDuplicate, 'source' => 'qr'],
            'latitude'    => $lat,
            'longitude'   => $lng,
        ]);

        return response()->json([
            'data' => [
                'alerte' => [
                    'id'                   => $alerte->id,
                    'reference'            => $alerte->reference,
                    'status'               => $alerte->status,
                    'is_potential_duplicate' => $isDuplicate,
                ],
            ],
        ], 201);
    }
}
