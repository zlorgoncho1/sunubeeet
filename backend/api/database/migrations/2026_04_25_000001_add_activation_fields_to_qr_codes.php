<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('qr_codes', function (Blueprint $table) {
            $table->timestamp('activated_at')->nullable()->after('is_active');
            $table->uuid('activated_by')->nullable()->after('activated_at');
            $table->foreign('activated_by')->references('id')->on('users')->onDelete('set null');
        });
    }
    public function down(): void {
        Schema::table('qr_codes', function (Blueprint $table) {
            $table->dropForeign(['activated_by']);
            $table->dropColumn(['activated_at', 'activated_by']);
        });
    }
};
