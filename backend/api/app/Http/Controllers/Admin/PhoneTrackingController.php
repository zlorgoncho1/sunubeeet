<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PhoneTracking;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Statistiques agrégées sur les suivis téléphonique anonymes (flow F1 QR).
 *
 * - Aucun numéro n'est exposé en clair (table stocke `phone_hash` + masque).
 * - Mesure l'efficacité du flow OTP et anticipe les expirations.
 */
class PhoneTrackingController extends Controller
{
    private const CACHE_TTL = 60;

    /**
     * GET /v1/dashboard/admin/phone-tracking/stats
     */
    public function stats(): JsonResponse
    {
        $data = Cache::remember('dashboard:admin:phone-tracking:stats', self::CACHE_TTL, function () {
            $row = DB::select("
                SELECT
                  COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE verified = true) AS verified,
                  COUNT(*) FILTER (WHERE verified = true AND expires_at > NOW()) AS active,
                  COUNT(*) FILTER (WHERE verified = true AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days') AS expiring_7d,
                  COUNT(*) FILTER (WHERE verified = true AND expires_at < NOW()) AS expired
                FROM phone_trackings
            ")[0] ?? null;

            $total = (int) ($row->total ?? 0);
            $verified = (int) ($row->verified ?? 0);

            // Nombre d'alertes ayant au moins 1 phone tracking attaché.
            $alertesWithTracking = (int) DB::table('phone_trackings')
                ->distinct('alerte_id')
                ->count('alerte_id');

            return [
                'total_inserts' => $total,
                'verified' => $verified,
                'active' => (int) ($row->active ?? 0),
                'expiring_in_7_days' => (int) ($row->expiring_7d ?? 0),
                'expired' => (int) ($row->expired ?? 0),
                'verification_rate' => $total > 0 ? round($verified / $total, 3) : 0.0,
                'alertes_with_tracking' => $alertesWithTracking,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
