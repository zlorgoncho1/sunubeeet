<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_files', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('kind', 15);
            // photo | audio | document
            $table->string('bucket', 63);
            $table->text('object_key');
            $table->string('mime_type', 100);
            $table->bigInteger('size_bytes');
            $table->uuid('uploaded_by_user_id')->nullable();
            $table->foreign('uploaded_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->uuid('source_qr_id')->nullable();
            $table->foreign('source_qr_id')->references('id')->on('qr_codes')->onDelete('set null');

            // Photo
            $table->boolean('is_human_blurred')->default(false);
            $table->string('blur_processing_status', 15)->default('pending');
            // pending | processing | ready | failed
            $table->text('original_object_key')->nullable();

            // Audio
            $table->integer('duration_seconds')->nullable();
            $table->string('transcription_status', 20)->default('not_requested');
            // not_requested | pending | processing | completed | failed

            $table->string('checksum_sha256', 64);
            $table->timestamp('expires_at')->nullable();
            $table->unique(['bucket', 'object_key']);
            $table->timestamp('created_at')->nullable();
        });

        DB::statement("CREATE INDEX idx_media_blur_status ON media_files(blur_processing_status) WHERE kind = 'photo'");
        DB::statement("CREATE INDEX idx_media_audio_status ON media_files(transcription_status) WHERE kind = 'audio'");
    }

    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};
