<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    use HasUuids;

    protected $fillable = [
        'reference', 'source_qr_id', 'source_user_id',
        'category', 'sub_category', 'description',
        'photo_media_id', 'audio_media_id',
        'latitude', 'longitude', 'zone_id',
        'status', 'incident_id',
        'is_potential_duplicate', 'duplicate_of_alerte_id',
        'client_ip', 'client_fingerprint',
        'resolution_reason', 'validated_at',
    ];

    protected function casts(): array
    {
        return [
            'sub_category'           => 'array',
            'is_potential_duplicate' => 'boolean',
            'validated_at'           => 'datetime',
            'latitude'               => 'decimal:7',
            'longitude'              => 'decimal:7',
        ];
    }

    public function sourceQr()
    {
        return $this->belongsTo(QrCode::class, 'source_qr_id');
    }

    public function sourceUser()
    {
        return $this->belongsTo(User::class, 'source_user_id');
    }

    public function photo()
    {
        return $this->belongsTo(MediaFile::class, 'photo_media_id');
    }

    public function audio()
    {
        return $this->belongsTo(MediaFile::class, 'audio_media_id');
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }

    public function duplicateOf()
    {
        return $this->belongsTo(Alerte::class, 'duplicate_of_alerte_id');
    }

    public function phoneTrackings()
    {
        return $this->hasMany(PhoneTracking::class);
    }

    public function trackingEvents()
    {
        return $this->morphMany(TrackingEvent::class, null, 'target_type', 'target_id')
            ->where('target_type', 'alerte');
    }

    public function getPhotoMediaAttribute()
    {
        return $this->photo;
    }

    public function getAudioMediaAttribute()
    {
        return $this->audio;
    }

    /**
     * Génère une référence unique pour l'alerte (format: AL-YYYY-NNNNNNN)
     */
    public function generateReference(): string
    {
        $year = now()->year;
        $sequence = str_pad($this->id, 7, '0', STR_PAD_LEFT);
        return "AL-{$year}-{$sequence}";
    }
}
