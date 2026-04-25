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
            'expires_at'     => ['required', 'date', 'after:today'],
        ]);

        $qr = QrCode::create([
            ...$data,
            'created_by' => auth('api')->id(),
            'is_active'  => false, // invalide par défaut
            'token'      => 'temp',
        ]);

        $token = $this->qrTokenService->generateToken($qr);
        $qr->update(['token' => $token]);

        return response()->json([
            'data' => [
                'id'         => $qr->id,
                'is_active'  => false,
                'expires_at' => $qr->expires_at,
                'scan_url'   => config('app.url') . '/q/' . $token,
                'qr'         => $qr,
            ],
        ], 201);
    }

    public function batch(Request $request)
    {
        $data = $request->validate([
            'expires_at'             => ['required', 'date', 'after:today'],
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
                'expires_at' => $data['expires_at'],
                'created_by' => auth('api')->id(),
                'is_active'  => false,
                'token'      => 'temp',
            ]);
            $token = $this->qrTokenService->generateToken($qr);
            $qr->update(['token' => $token]);
            $created[] = [
                'id'        => $qr->id,
                'label'     => $qr->location_label,
                'is_active' => false,
                'scan_url'  => config('app.url') . '/q/' . $token,
            ];
        }

        return response()->json(['data' => $created], 201);
    }

    /**
     * Activation explicite d'un QR code par l'admin/coordinateur.
     * Génère le token JWT avec l'expiration de l'événement.
     */
    public function activate(QrCode $qrCode)
    {
        if ($qrCode->is_active) {
            return response()->json(['message' => 'QR code déjà actif.'], 422);
        }

        if ($qrCode->expires_at && $qrCode->expires_at->isPast()) {
            return response()->json(['message' => 'Impossible d\'activer un QR code dont la date d\'expiration est dépassée.'], 422);
        }

        $qrCode->update([
            'is_active'    => true,
            'activated_at' => now(),
            'activated_by' => auth('api')->id(),
        ]);

        return response()->json([
            'message' => 'QR code activé.',
            'data'    => [
                'id'           => $qrCode->id,
                'is_active'    => true,
                'activated_at' => $qrCode->activated_at,
                'expires_at'   => $qrCode->expires_at,
                'scan_url'     => config('app.url') . '/q/' . $qrCode->token,
            ],
        ]);
    }

    public function update(Request $request, QrCode $qrCode)
    {
        $data = $request->validate([
            'location_label' => ['sometimes', 'string', 'max:255'],
            'zone_id'        => ['sometimes', 'nullable', 'uuid', 'exists:zones,id'],
            'site_id'        => ['sometimes', 'nullable', 'uuid', 'exists:sites,id'],
            'description'    => ['sometimes', 'nullable', 'string', 'max:500'],
            'expires_at'     => ['sometimes', 'date', 'after:today'],
        ]);

        // Si on change la date d'expiration, régénérer le token
        if (isset($data['expires_at'])) {
            $qrCode->update($data);
            $token = $this->qrTokenService->generateToken($qrCode->fresh());
            $qrCode->update(['token' => $token]);
        } else {
            $qrCode->update($data);
        }

        return response()->json(['data' => $qrCode->fresh()]);
    }

    public function rotate(QrCode $qrCode)
    {
        if ($qrCode->expires_at && $qrCode->expires_at->isPast()) {
            return response()->json(['message' => 'QR code expiré, rotation impossible.'], 422);
        }

        $token = $this->qrTokenService->generateToken($qrCode);
        $qrCode->update(['token' => $token]);

        return response()->json([
            'message' => 'Token QR régénéré.',
            'data'    => [
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
