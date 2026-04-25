<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_presences', function (Blueprint $table) {
            $table->uuid('agent_id')->primary();
            $table->foreign('agent_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('status', 15)->default('offline');
            // available | offline
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->smallInteger('battery_level')->nullable();
            $table->timestamp('last_heartbeat_at')->useCurrent();
            $table->timestamp('toggled_on_at')->nullable();
            $table->timestamp('toggled_off_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        DB::statement('CREATE INDEX idx_agent_presences_status ON agent_presences(status)');
        DB::statement("CREATE INDEX idx_agent_presences_geo ON agent_presences(latitude, longitude) WHERE status = 'available'");

        // Vue dérivée : statut effectif de l'agent
        DB::statement("
            CREATE VIEW agent_effective_status AS
            SELECT
                ap.agent_id,
                CASE
                    WHEN ap.status = 'offline' THEN 'offline'
                    WHEN am.status = 'on_site'  THEN 'on_site'
                    WHEN am.status = 'on_route' THEN 'on_route'
                    WHEN am.status IN ('accepted','assigned') THEN 'assigned'
                    ELSE 'available'
                END AS effective_status,
                am.id AS current_mission_id,
                ap.latitude,
                ap.longitude,
                ap.last_heartbeat_at
            FROM agent_presences ap
            LEFT JOIN LATERAL (
                SELECT id, status FROM missions
                WHERE assigned_to_user_id = ap.agent_id
                  AND status IN ('assigned','accepted','on_route','on_site')
                ORDER BY created_at DESC
                LIMIT 1
            ) am ON TRUE
        ");
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS agent_effective_status');
        Schema::dropIfExists('agent_presences');
    }
};
