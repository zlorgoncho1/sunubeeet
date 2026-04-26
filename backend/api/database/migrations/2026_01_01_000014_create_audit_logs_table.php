<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->string('user_role', 20)->nullable();
            $table->string('action', 100);
            $table->string('entity_type', 50)->nullable();
            $table->uuid('entity_id')->nullable();
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement('CREATE INDEX idx_audit_logs_user ON audit_logs(user_id)');
        DB::statement('CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id)');
        DB::statement('CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
