<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ZoneController extends Controller
{
    public function index()
    {
        $zones = Zone::with('children')->whereNull('parent_id')->get();
        return response()->json(['data' => $zones]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'parent_id'   => ['nullable', 'uuid', 'exists:zones,id'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $data['slug']      = Str::slug($data['name']) . '-' . Str::random(4);
        $data['is_active'] = true;

        $zone = Zone::create($data);

        return response()->json(['data' => $zone], 201);
    }

    public function update(Request $request, Zone $zone)
    {
        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'latitude'    => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $zone->update($data);

        return response()->json(['data' => $zone->fresh()]);
    }
}
