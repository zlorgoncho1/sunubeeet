<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function __construct(private OtpService $otp) {}

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

        $otp  = $this->otp->generate($data['phone']);
        $this->otp->send($data['phone'], $otp);

        return response()->json([
            'message' => 'Compte créé. Un code OTP a été envoyé au ' . $data['phone'] . '.',
            'data'    => ['user_id' => $user->id],
        ], 201);
    }

    public function verifyPhone(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'otp'   => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('phone', $data['phone'])->firstOrFail();

        if (! $this->otp->verify($data['phone'], $data['otp'])) {
            return response()->json(['message' => 'Code OTP invalide ou expiré.'], 422);
        }

        $user->update(['phone_verified_at' => now()]);

        return response()->json(['message' => 'Téléphone vérifié avec succès.']);
    }
}
