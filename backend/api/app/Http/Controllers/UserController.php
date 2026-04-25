<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function __construct(private OtpService $otp) {}

    public function index(Request $request)
    {
        $query = User::query()->with(['team', 'zone']);

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('team_id')) {
            $query->where('team_id', $request->team_id);
        }

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $users = $query->orderBy('fullname')->paginate(20);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $actor = auth('api')->user();

        $allowedRoles = match ($actor->role) {
            'coordinator'          => ['agent'],
            'admin', 'super_admin' => ['agent', 'coordinator'],
            default                => [],
        };

        $data = $request->validate([
            'fullname' => ['required', 'string', 'max:255'],
            'phone'    => ['required', 'string', 'regex:/^\+[1-9]\d{7,14}$/', 'unique:users,phone'],
            'role'     => ['required', 'string', 'in:' . implode(',', $allowedRoles)],
            'team_id'  => ['nullable', 'uuid', 'exists:teams,id'],
            'zone_id'  => ['nullable', 'uuid', 'exists:zones,id'],
        ]);

        $temporaryPassword = $this->generateTempPassword();

        $user = User::create([
            'fullname'             => $data['fullname'],
            'phone'                => $data['phone'],
            'password'             => Hash::make($temporaryPassword),
            'role'                 => $data['role'],
            'team_id'              => $data['team_id'] ?? null,
            'zone_id'              => $data['zone_id'] ?? null,
            'created_by'           => $actor->id,
            'is_active'            => true,
            'must_change_password' => true,
            'phone_verified_at'    => now(),
        ]);

        // Envoyer le mot de passe temporaire par SMS
        $this->otp->send($data['phone'], "Votre mot de passe temporaire Bët : {$temporaryPassword}");

        return response()->json([
            'message' => 'Utilisateur créé. Mot de passe temporaire envoyé par SMS.',
            'data'    => ['id' => $user->id, 'phone' => $user->phone, 'role' => $user->role],
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'fullname' => ['sometimes', 'string', 'max:255'],
            'team_id'  => ['sometimes', 'nullable', 'uuid', 'exists:teams,id'],
            'zone_id'  => ['sometimes', 'nullable', 'uuid', 'exists:zones,id'],
        ]);

        $user->update($data);

        return response()->json(['data' => $user->fresh(['team', 'zone'])]);
    }

    public function activate(User $user)
    {
        $user->update(['is_active' => true]);
        return response()->json(['message' => 'Utilisateur activé.']);
    }

    public function deactivate(User $user)
    {
        $user->update(['is_active' => false]);
        return response()->json(['message' => 'Utilisateur désactivé.']);
    }

    public function resetPassword(User $user)
    {
        $temporaryPassword = $this->generateTempPassword();

        $user->update([
            'password'             => Hash::make($temporaryPassword),
            'must_change_password' => true,
        ]);

        $this->otp->send($user->phone, "Votre nouveau mot de passe Bët : {$temporaryPassword}");

        return response()->json(['message' => 'Mot de passe réinitialisé. Envoyé par SMS.']);
    }

    public function missionsHistory(User $user)
    {
        $missions = $user->missions()
            ->with('incident:id,reference,title,category,severity')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($missions);
    }

    private function generateTempPassword(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        return substr(str_shuffle(str_repeat($chars, 3)), 0, 10);
    }
}
