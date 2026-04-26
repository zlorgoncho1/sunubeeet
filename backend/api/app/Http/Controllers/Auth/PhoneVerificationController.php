<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PhoneVerificationController extends Controller
{
    public function __construct(private OtpService $otp) {}

    /**
     * POST /api/v1/auth/verify-phone/start
     *
     * Envoie un OTP au numéro de téléphone de l'utilisateur authentifié
     * Requis lors de l'inscription pour confirmer le numéro
     *
     * Auth: access token (utilisateur authentifié)
     */
    public function start(Request $request)
    {
        $user = auth('api')->user();

        // Si déjà vérifié, pas besoin de renvoyer
        if ($user->phone_verified_at) {
            return response()->json([
                'message' => 'Téléphone déjà vérifié.',
            ], Response::HTTP_OK);
        }

        $otp = $this->otp->generate($user->phone);
        $this->otp->send($user->phone, $otp);

        return response()->json([
            'data' => [
                'phone' => $this->maskPhone($user->phone),
                'message' => 'Code OTP envoyé par SMS.',
            ],
            'meta' => [
                'otp_expires_at' => now()->addMinutes(10)->toIso8601String(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * POST /api/v1/auth/verify-phone/confirm
     *
     * Confirme le numéro de téléphone avec l'OTP envoyé
     *
     * Auth: access token (utilisateur authentifié)
     */
    public function confirm(Request $request)
    {
        $data = $request->validate([
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $user = auth('api')->user();

        if (! $this->otp->verify($user->phone, $data['otp'])) {
            return response()->json([
                'message' => 'Code OTP invalide ou expiré.',
                'code'    => 'VERIFICATION_OTP_INVALID',
                'errors'  => ['otp' => ['Le code OTP n\'est pas valide.']],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->update(['phone_verified_at' => now()]);

        return response()->json([
            'data' => [
                'message' => 'Téléphone vérifié avec succès.',
                'phone_verified_at' => $user->phone_verified_at->toIso8601String(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Masquer le numéro de téléphone pour l'affichage
     * Ex: +221 77 *** ** 67
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) < 4) {
            return str_repeat('*', strlen($phone));
        }

        $visible = substr($phone, 0, 6);
        $hidden = str_repeat('*', strlen($phone) - 8);
        $end = substr($phone, -2);

        return $visible . ' ' . $hidden . ' ' . $end;
    }
}

