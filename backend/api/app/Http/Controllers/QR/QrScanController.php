<?php

namespace App\Http\Controllers\QR;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\QrCode;
use App\Services\QrTokenService;
use Illuminate\Http\Request;

class QrScanController extends Controller
{
    public function __construct(private QrTokenService $qrTokenService) {}

    public function scan(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
        ]);

        try {
            $decoded = $this->qrTokenService->decodeQrToken($data['token']);
        } catch (\Exception) {
            return response()->json(['message' => 'QR code invalide.'], 422);
        }

        $qr = QrCode::find($decoded['qr_id']);

        if (! $qr || ! $qr->is_active) {
            return response()->json(['message' => 'QR code inactif ou introuvable.'], 422);
        }

        // Incrémenter le compteur de scans
        $qr->increment('scan_count');
        $qr->update(['last_scanned_at' => now()]);

        // Alertes actives à proximité (info pour l'UI)
        $activeNearby = Alerte::where('status', 'received')
            ->whereRaw("
                111111 * DEGREES(ACOS(
                  LEAST(1.0,
                    COS(RADIANS(?)) * COS(RADIANS(latitude))
                    * COS(RADIANS(longitude - ?))
                    + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                  )
                )) < 200
            ", [$qr->latitude, $qr->longitude, $qr->latitude])
            ->count();

        // Générer le scan session token (15 min)
        $scanSessionToken = $this->qrTokenService->generateScanSession($qr);

        return response()->json([
            'data' => [
                'qr_id'              => $qr->id,
                'location'           => [
                    'label'     => $qr->location_label,
                    'latitude'  => (float) $qr->latitude,
                    'longitude' => (float) $qr->longitude,
                ],
                'scan_session_token' => $scanSessionToken,
                'active_alerts_nearby' => $activeNearby,
            ],
        ]);
    }
}
