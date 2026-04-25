<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuditLogger
{
    // Actions à enregistrer : [méthode => [pattern_url => action_label]]
    private const AUDITED = [
        'POST'   => [
            'auth/login'            => 'auth.login',
            'qr-codes'              => 'qr_code.created',
            'qr-codes/*/activate'   => 'qr_code.activated',
            'qr-codes/*/deactivate' => 'qr_code.deactivated',
            'qr-codes/*/rotate'     => 'qr_code.rotated',
            'missions'              => 'mission.dispatched',
            'missions/*/cancel'     => 'mission.cancelled',
            'missions/*/reassign'   => 'mission.reassigned',
            'users'                 => 'user.created',
            'users/*/activate'      => 'user.activated',
            'users/*/deactivate'    => 'user.deactivated',
            'users/*/reset-password' => 'user.password_reset',
            'incidents/*/resolve'   => 'incident.resolved',
            'incidents/*/close'     => 'incident.closed',
        ],
        'PATCH'  => [
            'users/*'               => 'user.updated',
        ],
        'DELETE' => [
            'sites/*'               => 'site.deleted',
        ],
    ];

    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $action = $this->resolveAction($request);
            if ($action) {
                $this->log($request, $action);
            }
        }

        return $response;
    }

    private function resolveAction(Request $request): ?string
    {
        $method  = $request->method();
        $path    = ltrim(str_replace('/api/v1/', '', $request->path()), '/');
        $actions = self::AUDITED[$method] ?? [];

        foreach ($actions as $pattern => $label) {
            $regex = '#^' . str_replace('*', '[^/]+', $pattern) . '$#';
            if (preg_match($regex, $path)) {
                return $label;
            }
        }

        return null;
    }

    private function log(Request $request, string $action): void
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (\Exception) {
            $user = null;
        }

        AuditLog::create([
            'user_id'     => $user?->id,
            'user_role'   => $user?->role,
            'action'      => $action,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);
    }
}
