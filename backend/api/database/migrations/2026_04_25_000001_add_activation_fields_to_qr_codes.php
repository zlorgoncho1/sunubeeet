<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('qr_codes', function (Blueprint $table) {
            // activated_at est déjà créé par la migration originale
            // create_qr_codes_table — on saute si présent (idempotent).
            if (! Schema::hasColumn('qr_codes', 'activated_at')) {
                $table->timestamp('activated_at')->nullable()->after('is_active');
            }
            if (! Schema::hasColumn('qr_codes', 'activated_by')) {
                $table->uuid('activated_by')->nullable()->after('activated_at');
                $table->foreign('activated_by')->references('id')->on('users')->onDelete('set null');
            }
        });
    }
    public function down(): void {
        Schema::table('qr_codes', function (Blueprint $table) {
            if (Schema::hasColumn('qr_codes', 'activated_by')) {
                $table->dropForeign(['activated_by']);
                $table->dropColumn('activated_by');
            }
            // On ne drop pas activated_at : il appartient à la migration originale.
        });
    }
};
