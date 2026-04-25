<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Bët v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // -----------------------------------------------------------------------
    // Auth
    // -----------------------------------------------------------------------
    Route::prefix('auth')->group(function () {
        Route::post('spectator/register', [\App\Http\Controllers\Auth\RegisterController::class, 'spectator']);
        Route::post('login',              [\App\Http\Controllers\Auth\LoginController::class, 'login']);
        Route::post('refresh',            [\App\Http\Controllers\Auth\LoginController::class, 'refresh']);
        Route::post('logout',             [\App\Http\Controllers\Auth\LoginController::class, 'logout'])->middleware('auth.jwt');
        Route::post('spectator/verify-phone', [\App\Http\Controllers\Auth\RegisterController::class, 'verifyPhone']);
        Route::post('password/forgot',        [\App\Http\Controllers\Auth\PasswordController::class, 'forgot']);
        Route::post('password/reset',         [\App\Http\Controllers\Auth\PasswordController::class, 'reset']);
        Route::post('password/change',        [\App\Http\Controllers\Auth\PasswordController::class, 'change'])->middleware('auth.jwt');
    });

    // -----------------------------------------------------------------------
    // Flow QR — anonyme (pas de JWT user)
    // -----------------------------------------------------------------------
    Route::prefix('qr')->group(function () {
        Route::post('scan',                                          [\App\Http\Controllers\QR\QrScanController::class, 'scan']);
        Route::post('alertes',                                       [\App\Http\Controllers\QR\QrAlerteController::class, 'store'])->middleware('qr.session');
        Route::post('alertes/{alerte}/attach-phone',                 [\App\Http\Controllers\QR\QrTrackingController::class, 'attachPhone'])->middleware('qr.session');
        Route::post('tracking/request-otp',                          [\App\Http\Controllers\QR\QrTrackingController::class, 'requestOtp']);
        Route::post('tracking/verify-otp',                           [\App\Http\Controllers\QR\QrTrackingController::class, 'verifyOtp']);
        Route::get('tracking/alertes',                               [\App\Http\Controllers\QR\QrTrackingController::class, 'alertes'])->middleware('tracking.token');
    });

    // -----------------------------------------------------------------------
    // Routes authentifiées (JWT)
    // -----------------------------------------------------------------------
    Route::middleware('auth.jwt')->group(function () {

        // Espace personnel (tous rôles connectés)
        Route::prefix('me')->group(function () {
            Route::patch('presence',                     [\App\Http\Controllers\Agent\PresenceController::class, 'update']);
            Route::get('alertes',                        [\App\Http\Controllers\Spectator\MyAlerteController::class, 'index']);
            Route::get('alertes/{alerte}/timeline',      [\App\Http\Controllers\Spectator\MyAlerteController::class, 'timeline']);
            Route::get('missions/active',                [\App\Http\Controllers\Agent\MissionController::class, 'active']);
        });

        // Alertes (flow App — spectateur connecté)
        Route::post('alertes', [\App\Http\Controllers\Spectator\AlereteController::class, 'store']);

        // Fichiers / Médias
        Route::prefix('files')->group(function () {
            Route::post('upload-url',        [\App\Http\Controllers\MediaController::class, 'uploadUrl']);
            Route::post('{media}/finalize',  [\App\Http\Controllers\MediaController::class, 'finalize']);
            Route::get('{media}/url',        [\App\Http\Controllers\MediaController::class, 'signedUrl']);
        });

        // Map spectateur
        Route::prefix('spectator/map')->group(function () {
            Route::get('incidents-nearby', [\App\Http\Controllers\Spectator\MapController::class, 'incidentsNearby']);
        });

        // Sites (lecture publique pour spectateurs connectés)
        Route::prefix('sites')->group(function () {
            Route::get('nearby', [\App\Http\Controllers\SiteController::class, 'nearby']);
            Route::get('{site}', [\App\Http\Controllers\SiteController::class, 'show']);
        });

        // Map agent
        Route::prefix('agent/map')->group(function () {
            Route::get('incidents-nearby', [\App\Http\Controllers\Agent\MapController::class, 'incidentsNearby']);
            Route::get('agents-nearby',    [\App\Http\Controllers\Agent\MapController::class, 'agentsNearby']);
        });

        // Missions — actions agent
        Route::prefix('missions')->group(function () {
            Route::get('/',                              [\App\Http\Controllers\Coordinator\MissionController::class, 'index']);
            Route::get('{mission}',                      [\App\Http\Controllers\Coordinator\MissionController::class, 'show']);
            Route::get('{mission}/service-infos',        [\App\Http\Controllers\Coordinator\MissionController::class, 'serviceInfos']);
            Route::post('{mission}/accept',              [\App\Http\Controllers\Agent\MissionController::class, 'accept']);
            Route::post('{mission}/refuse',              [\App\Http\Controllers\Agent\MissionController::class, 'refuse']);
            Route::post('{mission}/on-route',            [\App\Http\Controllers\Agent\MissionController::class, 'onRoute']);
            Route::post('{mission}/on-site',             [\App\Http\Controllers\Agent\MissionController::class, 'onSite']);
            Route::post('{mission}/complete',            [\App\Http\Controllers\Agent\MissionController::class, 'complete']);
            Route::post('{mission}/request-reinforcement', [\App\Http\Controllers\Agent\MissionController::class, 'requestReinforcement']);
        });

        // Incidents
        Route::prefix('incidents')->group(function () {
            Route::get('/',            [\App\Http\Controllers\Coordinator\IncidentController::class, 'index']);
            Route::get('{incident}',   [\App\Http\Controllers\Coordinator\IncidentController::class, 'show']);
        });

        // Routes coordinateur
        Route::middleware('role:coordinator,admin,super_admin')->group(function () {

            // Incidents — actions coordinateur
            Route::patch('incidents/{incident}',          [\App\Http\Controllers\Coordinator\IncidentController::class, 'update']);
            Route::post('incidents/{incident}/resolve',   [\App\Http\Controllers\Coordinator\IncidentController::class, 'resolve']);
            Route::post('incidents/{incident}/close',     [\App\Http\Controllers\Coordinator\IncidentController::class, 'close']);
            Route::post('incidents/{incident}/cancel',    [\App\Http\Controllers\Coordinator\IncidentController::class, 'cancel']);

            // Missions — actions coordinateur
            Route::post('missions',                         [\App\Http\Controllers\Coordinator\MissionController::class, 'store']);
            Route::patch('missions/{mission}',              [\App\Http\Controllers\Coordinator\MissionController::class, 'update']);
            Route::post('missions/{mission}/cancel',        [\App\Http\Controllers\Coordinator\MissionController::class, 'cancel']);
            Route::post('missions/{mission}/reassign',      [\App\Http\Controllers\Coordinator\MissionController::class, 'reassign']);

            // Sites — CRUD coordinateur
            Route::post('sites',          [\App\Http\Controllers\SiteController::class, 'store']);
            Route::patch('sites/{site}',  [\App\Http\Controllers\SiteController::class, 'update']);
            Route::delete('sites/{site}', [\App\Http\Controllers\SiteController::class, 'destroy']);
            Route::get('sites',           [\App\Http\Controllers\SiteController::class, 'index']);

            // Utilisateurs — CRUD agents
            Route::get('users',                          [\App\Http\Controllers\UserController::class, 'index']);
            Route::post('users',                         [\App\Http\Controllers\UserController::class, 'store']);
            Route::patch('users/{user}',                 [\App\Http\Controllers\UserController::class, 'update']);
            Route::post('users/{user}/activate',         [\App\Http\Controllers\UserController::class, 'activate']);
            Route::post('users/{user}/deactivate',       [\App\Http\Controllers\UserController::class, 'deactivate']);
            Route::post('users/{user}/reset-password',   [\App\Http\Controllers\UserController::class, 'resetPassword']);
            Route::get('users/{user}/missions-history',  [\App\Http\Controllers\UserController::class, 'missionsHistory']);

            // Dashboard
            Route::prefix('dashboard')->group(function () {
                Route::get('kpis',           [\App\Http\Controllers\Coordinator\DashboardController::class, 'kpis']);
                Route::get('incidents/live', [\App\Http\Controllers\Coordinator\DashboardController::class, 'incidentsLive']);
                Route::get('agents/live',    [\App\Http\Controllers\Coordinator\DashboardController::class, 'agentsLive']);
            });
        });

        // Routes admin
        Route::middleware('role:admin,super_admin')->group(function () {

            // QR Codes
            Route::prefix('qr-codes')->group(function () {
                Route::get('/',                    [\App\Http\Controllers\Admin\QrCodeController::class, 'index']);
                Route::post('/',                   [\App\Http\Controllers\Admin\QrCodeController::class, 'store']);
                Route::post('batch',               [\App\Http\Controllers\Admin\QrCodeController::class, 'batch']);
                Route::patch('{qrCode}',           [\App\Http\Controllers\Admin\QrCodeController::class, 'update']);
                Route::post('{qrCode}/rotate',     [\App\Http\Controllers\Admin\QrCodeController::class, 'rotate']);
                Route::post('{qrCode}/deactivate', [\App\Http\Controllers\Admin\QrCodeController::class, 'deactivate']);
            });

            // Zones
            Route::prefix('zones')->group(function () {
                Route::get('/',         [\App\Http\Controllers\Admin\ZoneController::class, 'index']);
                Route::post('/',        [\App\Http\Controllers\Admin\ZoneController::class, 'store']);
                Route::patch('{zone}',  [\App\Http\Controllers\Admin\ZoneController::class, 'update']);
            });

            // Audit
            Route::get('audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index']);
        });
    });
});
