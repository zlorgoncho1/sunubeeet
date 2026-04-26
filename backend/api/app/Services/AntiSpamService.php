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

    /**
     * Vérifie si une alerte similaire existe à proximité spatio-temporelle
     */
    public function checkForDuplicates(
        string $category,
        float $latitude,
        float $longitude,
        ?string $clientFingerprint = null
    ): ?\App\Models\Alerte {
        $windowStart = now()->subSeconds($this->timeWindowSeconds)->toDateTimeString();

        $query = \App\Models\Alerte::where('category', $category)
            ->whereNotIn('status', ['false_alert', 'rejected', 'duplicate'])
            ->where('created_at', '>', $windowStart)
            ->whereRaw("
                111111 * DEGREES(ACOS(
                    LEAST(1.0,
                        COS(RADIANS(?)) * COS(RADIANS(latitude))
                        * COS(RADIANS(longitude - ?))
                        + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                    )
                )) < ?
            ", [$latitude, $longitude, $latitude, $this->distanceMeters]);

        if ($clientFingerprint) {
            $query->where('client_fingerprint', $clientFingerprint);
        }

        return $query->orderBy('created_at', 'desc')->first();
    }

    /**
     * Trouve la zone pour des coordonnées GPS
     */
    public function findZoneForCoordinates(float $latitude, float $longitude): ?string
    {
        // Pour MVP, logique simplifiée
        // En phase 2, utiliser PostGIS
        return \App\Models\Zone::where('is_active', true)
            ->whereRaw('ST_Contains(boundary, ST_Point(?, ?))', [$longitude, $latitude])
            ->value('id');
    }

    /**
     * Vérifie le rate limit par IP
     */
    public function checkRateLimit(string $ipAddress, int $maxPerWindow = 10, int $windowSeconds = 600): bool
    {
        $recentAlerts = \App\Models\Alerte::where('client_ip', $ipAddress)
            ->where('created_at', '>', now()->subSeconds($windowSeconds))
            ->count();

        return $recentAlerts < $maxPerWindow;
    }
}
