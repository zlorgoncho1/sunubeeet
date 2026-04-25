<?php

namespace App\Http\Controllers\QR;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\PhoneTracking;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class QrTrackingController extends Controller
{
    private string $phoneSalt;

    public function __construct(private OtpService $otp)
    {
        $this->phoneSalt = config('app.key');
    }

    /**
     * F1.5 — Attacher un numéro de téléphone à une alerte pour le suivi
     */
    public function attachPhone(Request $request, Alerte $alerte)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
        ]);

        $phoneHash   = hash('sha256', $data['phone'] . $this->phoneSalt);
        $phoneMasked = $this->maskPhone($data['phone']);

        // Idempotent : si déjà attaché on renvoie 202 sans recréer
        $existing = PhoneTracking::where('phone_hash', $phoneHash)
            ->where('alerte_id', $alerte->id)
            ->first();

        if (! $existing) {
            PhoneTracking::create([
                'phone_hash'       => $phoneHash,
                'phone_e164_masked' => $phoneMasked,
                'alerte_id'        => $alerte->id,
                'verified'         => false,
            ]);
        }

        $otp = $this->otp->generate($data['phone']);
        $this->otp->send($data['phone'], "Votre code de suivi Bët : {$otp}");

        return response()->json([
            'message' => 'Code OTP envoyé au ' . $phoneMasked . '.',
        ], 202);
    }

    /**
     * F1.6 — Demander un OTP pour consulter l'historique
     */
    public function requestOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
        ]);

        $phoneHash = hash('sha256', $data['phone'] . $this->phoneSalt);
        $hasAlerts = PhoneTracking::where('phone_hash', $phoneHash)->exists();

        // Même réponse qu'il y ait des alertes ou non (sécurité)
        if ($hasAlerts) {
            $otp = $this->otp->generate($data['phone']);
            $this->otp->send($data['phone'], "Votre code de suivi Bët : {$otp}");
        }

        return response()->json([
            'message' => 'Si ce numéro a des alertes associées, un code OTP a été envoyé.',
        ]);
    }

    /**
     * F1.6 — Vérifier l'OTP et retourner un tracking token
     */
    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'otp'   => ['required', 'string', 'size:6'],
        ]);

        if (! $this->otp->verify($data['phone'], $data['otp'])) {
            return response()->json(['message' => 'Code OTP invalide ou expiré.'], 422);
        }

        $phoneHash = hash('sha256', $data['phone'] . $this->phoneSalt);

        // Marquer les phone_trackings de ce numéro comme vérifiés
        PhoneTracking::where('phone_hash', $phoneHash)
            ->where('verified', false)
            ->update(['verified' => true, 'verified_at' => now()]);

        // Générer un tracking token (JWT 30 min)
        $trackingToken = JWTAuth::factory()
            ->setTTL(30)
            ->customClaims([
                'kind'       => 'tracking',
                'phone_hash' => $phoneHash,
            ])
            ->make()
            ->get();

        return response()->json([
            'data' => [
                'tracking_token' => $trackingToken,
                'expires_in'     => 1800,
            ],
        ]);
    }

    /**
     * F1.6 — Historique des alertes pour un numéro vérifié
     */
    public function alertes(Request $request)
    {
        $phoneHash = $request->tracking_phone_hash; // injecté par ValidateTrackingToken

        $trackings = PhoneTracking::with([
            'alerte' => fn($q) => $q->select(
                'id', 'reference', 'category', 'status',
                'latitude', 'longitude', 'created_at', 'validated_at'
            ),
        ])
            ->where('phone_hash', $phoneHash)
            ->where('verified', true)
            ->where('expires_at', '>', now())
            ->get();

        $alertes = $trackings->map(fn($t) => [
            'id'         => $t->alerte->id,
            'reference'  => $t->alerte->reference,
            'category'   => $t->alerte->category,
            'status'     => $t->alerte->status,
            'created_at' => $t->alerte->created_at,
        ])->values();

        return response()->json(['data' => $alertes]);
    }

    private function maskPhone(string $phone): string
    {
        // +221771234567 → +221 77 *** ** 67
        $clean = preg_replace('/\D/', '', $phone);
        $len   = strlen($clean);
        if ($len < 6) return $phone;

        $visible = substr($clean, -2);
        $masked  = str_repeat('*', max(0, $len - 4));
        return '+' . substr($clean, 0, 2) . ' ' . substr($clean, 2, 2) . ' ' . $masked . ' ' . $visible;
    }
}
