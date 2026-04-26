<?php

namespace App\Http\Controllers\Spectator;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;

class MapController extends Controller
{
    public function incidentsNearby(Request $request)
    {
        $request->validate([
            'lat'    => ['required', 'numeric', 'between:-90,90'],
            'lng'    => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['nullable', 'integer', 'min:100', 'max:20000'],
        ]);

        $lat    = (float) $request->lat;
        $lng    = (float) $request->lng;
        $radius = (int) ($request->radius ?? 2000);

        // Expose seulement les incidents actifs, sans infos sensibles
        $incidents = Incident::whereIn('status', ['open', 'qualified', 'mission_assigned', 'in_progress'])
            ->selectRaw("
                id, reference, category, severity, status,
                latitude, longitude, zone_id, created_at,
                ROUND(
                    (111111 * DEGREES(ACOS(
                        LEAST(1.0,
                            COS(RADIANS(?)) * COS(RADIANS(latitude))
                            * COS(RADIANS(longitude - ?))
                            + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                        )
                    )))::numeric, 0
                ) AS distance_meters
            ", [$lat, $lng, $lat])
            ->whereRaw("
                111111 * DEGREES(ACOS(
                    LEAST(1.0,
                        COS(RADIANS(?)) * COS(RADIANS(latitude))
                        * COS(RADIANS(longitude - ?))
                        + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                    )
                )) < ?
            ", [$lat, $lng, $lat, $radius])
            ->orderBy('distance_meters')
            ->limit(50)
            ->get();

        return response()->json(['data' => $incidents]);
    }
}
