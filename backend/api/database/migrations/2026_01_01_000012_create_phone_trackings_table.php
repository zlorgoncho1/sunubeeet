<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_trackings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->char('phone_hash', 64);
            // sha256(phone + salt) — jamais retourné par l'API
            $table->string('phone_e164_masked', 25);
            // "+221 77 *** ** 67" pour affichage uniquement
            $table->uuid('alerte_id');
            $table->foreign('alerte_id')->references('id')->on('alertes')->onDelete('cascade');
            $table->boolean('verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at')->storedAs("created_at + INTERVAL '90 days'");
            $table->unique(['phone_hash', 'alerte_id']);
            $table->timestamp('created_at')->nullable();
        });

        DB::statement('CREATE INDEX idx_phone_trackings_hash ON phone_trackings(phone_hash) WHERE verified = true');
        DB::statement('CREATE INDEX idx_phone_trackings_alerte ON phone_trackings(alerte_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_trackings');
    }
};
