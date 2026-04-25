<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MediaFile extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $dates = ['created_at'];

    protected $fillable = [
        'kind', 'bucket', 'object_key',
        'mime_type', 'size_bytes',
        'uploaded_by_user_id', 'source_qr_id',
        'is_human_blurred', 'blur_processing_status',
        'original_object_key', 'duration_seconds',
        'transcription_status', 'checksum_sha256',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_human_blurred' => 'boolean',
            'expires_at'       => 'datetime',
            'created_at'       => 'datetime',
        ];
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function sourceQr()
    {
        return $this->belongsTo(QrCode::class, 'source_qr_id');
    }

    public function getSignedUrl(int $minutes = 5): string
    {
        return Storage::disk('s3')->temporaryUrl($this->object_key, now()->addMinutes($minutes));
    }
}
