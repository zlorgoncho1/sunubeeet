<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('reference', 20)->unique();

            $table->uuid('source_qr_id')->nullable();
            $table->foreign('source_qr_id')->references('id')->on('qr_codes')->onDelete('set null');
            $table->uuid('source_user_id')->nullable();
            $table->foreign('source_user_id')->references('id')->on('users')->onDelete('set null');

            $table->string('category', 20);
            // health | security | crowd | access_blocked | fire_danger
            // lost_found | logistics | transport | other
            $table->jsonb('sub_category')->nullable();
            $table->text('description')->nullable();

            $table->uuid('photo_media_id')->nullable();
            $table->foreign('photo_media_id')->references('id')->on('media_files')->onDelete('set null');
            $table->uuid('audio_media_id')->nullable();
            $table->foreign('audio_media_id')->references('id')->on('media_files')->onDelete('set null');

            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->uuid('zone_id')->nullable();
            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('set null');

            $table->string('status', 20)->default('received');
            // received | validated | duplicate | false_alert | rejected
            $table->uuid('incident_id')->nullable();
            // FK vers incidents ajoutée après la création de la table incidents

            $table->boolean('is_potential_duplicate')->default(false);
            $table->uuid('duplicate_of_alerte_id')->nullable();
            $table->string('client_ip', 45)->nullable();
            $table->string('client_fingerprint', 128)->nullable();

            $table->text('resolution_reason')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });

        Schema::table('alertes', function (Blueprint $table) {
            $table->foreign('duplicate_of_alerte_id')->references('id')->on('alertes')->onDelete('set null');
        });

        DB::statement('CREATE INDEX idx_alertes_status ON alertes(status)');
        DB::statement('CREATE INDEX idx_alertes_category ON alertes(category)');
        DB::statement('CREATE INDEX idx_alertes_qr ON alertes(source_qr_id)');
        DB::statement('CREATE INDEX idx_alertes_geo ON alertes(latitude, longitude)');
        DB::statement('CREATE INDEX idx_alertes_created ON alertes(created_at DESC)');
        DB::statement('CREATE INDEX idx_alertes_sub_category ON alertes USING GIN (sub_category)');
        DB::statement("CREATE INDEX idx_alertes_antispam ON alertes(category, latitude, longitude, created_at) WHERE status NOT IN ('false_alert','rejected')");
    }

    public function down(): void
    {
        Schema::table('alertes', function (Blueprint $table) {
            $table->dropForeign(['duplicate_of_alerte_id']);
        });
        Schema::dropIfExists('alertes');
    }
};
