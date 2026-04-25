<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QrCode;
use App\Services\QrTokenService;
use Illuminate\Http\Request;

class QrCodeController extends Controller
{
    public function __construct(private QrTokenService $qrTokenService) {}

    public function index(Request $request)
    {
        $query = QrCode::query()->with(['zone', 'site']);

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderByDesc('created_at')->paginate(50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'location_label' => ['required', 'string', 'max:255'],
            'latitude'       => ['required', 'numeric', 'between:-90,90'],
            'longitude'      => ['required', 'numeric', 'between:-180,180'],
            'zone_id'        => ['nullable', 'uuid', 'exists:zones,id'],
            'site_id'        => ['nullable', 'uuid', 'exists:sites,id'],
            'description'    => ['nullable', 'string', 'max:500'],
        ]);

        $qr = QrCode::create([
            ...$data,
            'created_by' => auth('api')->id(),
            'is_active'  => true,
            'token'      => 'temp', // remplacé juste après
        ]);

        $token = $this->qrTokenService->generateToken($qr);
        $qr->update(['token' => $token]);

        return response()->json([
            'data' => [
                'id'       => $qr->id,
                'token'    => $token,
                'scan_url' => config('app.url') . '/q/' . $token,
                'qr'       => $qr,
            ],
        ], 201);
    }

    public function batch(Request $request)
    {
        $data = $request->validate([
            'items'                  => ['required', 'array', 'min:1', 'max:100'],
            'items.*.location_label' => ['required', 'string', 'max:255'],
            'items.*.latitude'       => ['required', 'numeric', 'between:-90,90'],
            'items.*.longitude'      => ['required', 'numeric', 'between:-180,180'],
            'items.*.zone_id'        => ['nullable', 'uuid', 'exists:zones,id'],
        ]);

        $created = [];
        foreach ($data['items'] as $item) {
            $qr = QrCode::create([
                ...$item,
                'created_by' => auth('api')->id(),
                'is_active'  => true,
                'token'      => 'temp',
            ]);
            $token = $this->qrTokenService->generateToken($qr);
            $qr->update(['token' => $token]);
            $created[] = ['id' => $qr->id, 'token' => $token, 'label' => $qr->location_label];
        }

        return response()->json(['data' => $created], 201);
    }

    public function update(Request $request, QrCode $qrCode)
    {
        $data = $request->validate([
            'location_label' => ['sometimes', 'string', 'max:255'],
            'zone_id'        => ['sometimes', 'nullable', 'uuid', 'exists:zones,id'],
            'site_id'        => ['sometimes', 'nullable', 'uuid', 'exists:sites,id'],
            'description'    => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $qrCode->update($data);

        return response()->json(['data' => $qrCode->fresh()]);
    }

    public function rotate(QrCode $qrCode)
    {
        $token = $this->qrTokenService->generateToken($qrCode);
        $qrCode->update(['token' => $token]);

        return response()->json([
            'message' => 'Token QR régénéré.',
            'data'    => [
                'token'    => $token,
                'scan_url' => config('app.url') . '/q/' . $token,
            ],
        ]);
    }

    public function deactivate(QrCode $qrCode)
    {
        $qrCode->update(['is_active' => false]);
        return response()->json(['message' => 'QR code désactivé.']);
    }
}
