<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AntiSpamService
{
    private int $distanceMeters;
    private int $timeWindowSeconds;

    public function __construct()
    {
        $this->distanceMeters    = (int) env('ANTISPAM_DISTANCE_METERS');
        $this->timeWindowSeconds = (int) env('ANTISPAM_TIME_WINDOW_SECONDS');
    }

    /**
     * Cherche une alerte parente proche (même catégorie, même zone spatio-temporelle).
     * Retourne l'ID de l'alerte parente si doublon potentiel, null sinon.
     */
    public function findParent(string $category, float $lat, float $lng): ?string
    {
        $windowStart = now()->subSeconds($this->timeWindowSeconds)->toDateTimeString();

        $result = DB::selectOne("
            SELECT id
            FROM alertes
            WHERE category = ?
              AND status NOT IN ('false_alert', 'rejected', 'duplicate')
              AND created_at > ?
              AND (
                111111 * DEGREES(ACOS(
                  LEAST(1.0,
                    COS(RADIANS(?)) * COS(RADIANS(latitude))
                    * COS(RADIANS(longitude - ?))
                    + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                  )
                ))
              ) < ?
            ORDER BY created_at DESC
            LIMIT 1
        ", [$category, $windowStart, $lat, $lng, $lat, $this->distanceMeters]);

        return $result?->id;
    }
}
