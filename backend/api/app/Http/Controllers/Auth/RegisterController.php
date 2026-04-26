<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class RegisterController extends Controller
{
    public function __construct(private OtpService $otp) {}

    /**
     * POST /api/v1/auth/spectator/register
     *
     * Inscription d'un spectateur (Flow F2.1.a)
     */
    public function spectator(Request $request)
    {
        $data = $request->validate([
            'fullname' => ['required', 'string', 'max:255'],
            'phone'    => ['required', 'string', 'regex:/^\+[1-9]\d{7,14}$/', 'unique:users,phone'],
            'password' => ['required', Password::min(8)->letters()->numbers()],
        ]);

        $user = User::create([
            'fullname' => $data['fullname'],
            'phone'    => $data['phone'],
            'password' => Hash::make($data['password']),
            'role'     => 'spectator',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        // Générer l'access token immédiatement
        $accessToken = auth('api')->fromUser($user);
        $refreshToken = $this->generateRefreshToken($user);

        // Envoyer OTP pour vérification du téléphone
        $otp = $this->otp->generate($data['phone']);
        $this->otp->send($data['phone'], $otp);

        return response()->json([
            'data' => [
                'user' => [
                    'id'       => $user->id,
                    'fullname' => $user->fullname,
                    'phone'    => $user->phone,
                    'role'     => $user->role,
                ],
                'tokens' => [
                    'access_token'        => $accessToken,
                    'access_expires_at'   => now()->addMinutes(config('jwt.ttl'))->toIso8601String(),
                    'refresh_token'       => $refreshToken,
                    'refresh_expires_at'  => now()->addDays(7)->toIso8601String(),
                ],
                'message' => 'Compte créé avec succès. Un code OTP a été envoyé par SMS pour confirmer votre numéro.',
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * POST /api/v1/auth/spectator/verify-phone
     *
     * Vérification du téléphone via OTP (route legacy, préférer /auth/verify-phone/confirm)
     */
    public function verifyPhone(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'otp'   => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('phone', $data['phone'])->firstOrFail();

        if (! $this->otp->verify($data['phone'], $data['otp'])) {
            return response()->json([
                'message' => 'Code OTP invalide ou expiré.',
                'code'    => 'VERIFICATION_OTP_INVALID',
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
     * Générer un JWT utilisé comme refresh token
     */
    private function generateRefreshToken(User $user): string
    {
        return JWTAuth::claims([
            'type'  => 'refresh',
            'phone' => $user->phone,
        ])->fromUser($user);
    }
}
