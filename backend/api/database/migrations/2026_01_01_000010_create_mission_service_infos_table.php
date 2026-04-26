<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mission_service_infos', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('mission_id');
            $table->foreign('mission_id')->references('id')->on('missions')->onDelete('cascade');
            $table->uuid('site_id');
            $table->foreign('site_id')->references('id')->on('sites')->onDelete('cascade');
            $table->text('suggested_action')->nullable();
            $table->integer('priority_order')->default(1);
            $table->uuid('added_by_user_id');
            $table->foreign('added_by_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['mission_id', 'site_id']);
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mission_service_infos');
    }
};
