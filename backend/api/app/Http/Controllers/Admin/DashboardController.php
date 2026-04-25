<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\AuditLog;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\QrCode;
use App\Models\Site;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function kpis()
    {
        $kpis = Cache::remember('dashboard:admin:kpis', 30, function () {
            $agentsActive = User::where('role', 'agent')->where('is_active', true)->count();

            $alertesToday = Alerte::whereDate('created_at', now()->toDateString())->count();

            $incidentsOpen = Incident::whereIn('status', ['open', 'qualified'])->count();

            $missionsActive = Mission::whereIn('status', ['accepted', 'on_route', 'on_site'])->count();

            $qrCodesActive = QrCode::where('is_active', true)->count();

            $sitesActive = Site::where('is_active', true)->count();

            $duplicatesDetected = Alerte::where('is_potential_duplicate', true)->count();

            $auditLogs24h = AuditLog::where('created_at', '>=', now()->subDay())->count();

            return [
                'agents_active' => $agentsActive,
                'alertes_today' => $alertesToday,
                'incidents_open' => $incidentsOpen,
                'missions_active' => $missionsActive,
                'qr_codes_active' => $qrCodesActive,
                'sites_active' => $sitesActive,
                'duplicates_detected' => $duplicatesDetected,
                'audit_logs_24h' => $auditLogs24h,
                'db_driver' => DB::getDriverName(),
            ];
        });

        return response()->json(['data' => $kpis]);
    }
}

