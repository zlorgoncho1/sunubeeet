<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('reference', 20)->unique();
            $table->uuid('incident_id');
            $table->foreign('incident_id')->references('id')->on('incidents')->onDelete('cascade');
            $table->uuid('created_by_user_id');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('assigned_to_user_id');
            $table->foreign('assigned_to_user_id')->references('id')->on('users')->onDelete('cascade');

            $table->string('title');
            $table->text('briefing')->nullable();
            $table->integer('estimated_duration_minutes')->nullable();

            $table->string('status', 20)->default('created');
            // created | assigned | accepted | refused | on_route | on_site | completed | cancelled

            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);

            $table->text('refusal_reason')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('completion_note')->nullable();
            $table->string('outcome', 20)->nullable();
            // resolved | transferred | false_alert | escalated

            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('refused_at')->nullable();
            $table->timestamp('on_route_at')->nullable();
            $table->timestamp('on_site_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        DB::statement('CREATE INDEX idx_missions_status ON missions(status)');
        DB::statement('CREATE INDEX idx_missions_incident ON missions(incident_id)');
        DB::statement('CREATE INDEX idx_missions_agent ON missions(assigned_to_user_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};
