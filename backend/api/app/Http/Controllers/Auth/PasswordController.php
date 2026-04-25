<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    public function __construct(private OtpService $otp) {}

    public function forgot(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $user = User::where('phone', $data['phone'])->where('is_active', true)->first();

        // Réponse identique que l'utilisateur existe ou non (sécurité)
        if ($user) {
            $otp = $this->otp->generate($data['phone']);
            $this->otp->send($data['phone'], $otp);
        }

        return response()->json([
            'message' => 'Si ce numéro existe, un code OTP a été envoyé.',
        ]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'phone'    => ['required', 'string'],
            'otp'      => ['required', 'string', 'size:6'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = User::where('phone', $data['phone'])->where('is_active', true)->firstOrFail();

        if (! $this->otp->verify($data['phone'], $data['otp'])) {
            return response()->json(['message' => 'Code OTP invalide ou expiré.'], 422);
        }

        $user->update([
            'password'             => Hash::make($data['password']),
            'must_change_password' => false,
        ]);

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    public function change(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = auth('api')->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.'], 422);
        }

        $user->update([
            'password'             => Hash::make($data['password']),
            'must_change_password' => false,
        ]);

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }
}
