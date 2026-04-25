<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracking_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('target_type', 20);
            // alerte | incident | mission
            $table->uuid('target_id');
            $table->uuid('actor_id')->nullable();
            $table->string('actor_role', 20)->nullable();
            // spectator | agent | coordinator | admin | super_admin | system | anonymous
            $table->string('action', 60);
            // alerte.created | mission.accepted | etc.
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30)->nullable();
            $table->text('note')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement('CREATE INDEX idx_tracking_events_target ON tracking_events(target_type, target_id)');
        DB::statement('CREATE INDEX idx_tracking_events_actor ON tracking_events(actor_id)');
        DB::statement('CREATE INDEX idx_tracking_events_created ON tracking_events(created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_events');
    }
};
