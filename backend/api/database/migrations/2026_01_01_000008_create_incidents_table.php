<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('reference', 20)->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 20);
            $table->jsonb('sub_category')->nullable();
            $table->string('severity', 10)->default('medium');
            // low | medium | high | critical
            $table->string('priority', 5)->default('p3');
            // p1 | p2 | p3 | p4
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->uuid('zone_id')->nullable();
            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('set null');
            $table->string('status', 20)->default('open');
            // open | qualified | mission_assigned | in_progress | resolved | closed | cancelled
            $table->boolean('is_hot_zone')->default(false);
            $table->integer('alertes_count')->default(0);

            $table->uuid('created_by_user_id')->nullable();
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->uuid('qualified_by_user_id')->nullable();
            $table->foreign('qualified_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->uuid('resolved_by_user_id')->nullable();
            $table->foreign('resolved_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->uuid('closed_by_user_id')->nullable();
            $table->foreign('closed_by_user_id')->references('id')->on('users')->onDelete('set null');

            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        // Ajouter FK incident_id sur alertes maintenant que incidents existe
        Schema::table('alertes', function (Blueprint $table) {
            $table->foreign('incident_id')->references('id')->on('incidents')->onDelete('set null');
        });

        DB::statement('CREATE INDEX idx_incidents_status ON incidents(status)');
        DB::statement('CREATE INDEX idx_incidents_category ON incidents(category)');
        DB::statement('CREATE INDEX idx_incidents_severity ON incidents(severity)');
        DB::statement('CREATE INDEX idx_incidents_geo ON incidents(latitude, longitude)');
        DB::statement('CREATE INDEX idx_incidents_zone ON incidents(zone_id)');
    }

    public function down(): void
    {
        Schema::table('alertes', function (Blueprint $table) {
            $table->dropForeign(['incident_id']);
        });
        Schema::dropIfExists('incidents');
    }
};
