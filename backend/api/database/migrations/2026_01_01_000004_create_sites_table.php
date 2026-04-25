<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name');
            $table->string('type', 30);
            // police | commissariat | gendarmerie | hopital | clinique | samu
            // pompiers | protection_civile | point_secours | evenement_pc
            // depannage | point_eau | point_repos | site_evenement | autre
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->text('address')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_24_7')->default(false);
            $table->jsonb('opening_hours')->nullable();
            $table->uuid('zone_id')->nullable();
            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::statement('CREATE INDEX idx_sites_type ON sites(type) WHERE is_active = true');
        DB::statement('CREATE INDEX idx_sites_geo ON sites(latitude, longitude)');
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
