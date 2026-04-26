<?php

namespace App\Http\Controllers;

use App\Models\Site;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function index(Request $request)
    {
        $query = Site::query();

        if ($request->filled('type')) {
            $types = explode(',', $request->type);
            $query->whereIn('type', $types);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('name')->paginate(50));
    }

    public function nearby(Request $request)
    {
        $request->validate([
            'lat'    => ['required', 'numeric', 'between:-90,90'],
            'lng'    => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['nullable', 'integer', 'min:100', 'max:50000'],
            'type'   => ['nullable', 'string'],
        ]);

        $lat    = (float) $request->lat;
        $lng    = (float) $request->lng;
        $radius = (int) ($request->radius ?? 2000);

        $query = Site::where('is_active', true)
            ->selectRaw("
                *,
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
            ->orderBy('distance_meters');

        if ($request->filled('type')) {
            $types = explode(',', $request->type);
            $query->whereIn('type', $types);
        }

        $sites = $query->limit(20)->get();

        return response()->json(['data' => $sites]);
    }

    public function show(Site $site)
    {
        return response()->json(['data' => $site]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'type'          => ['required', 'string', 'in:police,commissariat,gendarmerie,hopital,clinique,samu,pompiers,protection_civile,point_secours,evenement_pc,depannage,point_eau,point_repos,site_evenement,autre'],
            'latitude'      => ['required', 'numeric', 'between:-90,90'],
            'longitude'     => ['required', 'numeric', 'between:-180,180'],
            'address'       => ['nullable', 'string'],
            'phone'         => ['nullable', 'string', 'max:20'],
            'description'   => ['nullable', 'string'],
            'is_24_7'       => ['nullable', 'boolean'],
            'opening_hours' => ['nullable', 'array'],
            'zone_id'       => ['nullable', 'uuid', 'exists:zones,id'],
        ]);

        $site = Site::create([...$data, 'is_active' => true]);

        return response()->json(['data' => $site], 201);
    }

    public function update(Request $request, Site $site)
    {
        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'type'          => ['sometimes', 'string'],
            'latitude'      => ['sometimes', 'numeric', 'between:-90,90'],
            'longitude'     => ['sometimes', 'numeric', 'between:-180,180'],
            'address'       => ['sometimes', 'nullable', 'string'],
            'phone'         => ['sometimes', 'nullable', 'string', 'max:20'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'is_24_7'       => ['sometimes', 'boolean'],
            'opening_hours' => ['sometimes', 'nullable', 'array'],
            'is_active'     => ['sometimes', 'boolean'],
        ]);

        $site->update($data);

        return response()->json(['data' => $site->fresh()]);
    }

    public function destroy(Site $site)
    {
        $site->update(['is_active' => false]);
        return response()->json(['message' => 'Site désactivé.']);
    }
}
