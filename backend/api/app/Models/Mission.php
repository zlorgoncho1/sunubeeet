<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    use HasUuids;

    protected $fillable = [
        'reference', 'incident_id',
        'created_by_user_id', 'assigned_to_user_id',
        'title', 'briefing', 'estimated_duration_minutes',
        'status', 'latitude', 'longitude',
        'refusal_reason', 'cancellation_reason',
        'completion_note', 'outcome',
        'assigned_at', 'accepted_at', 'refused_at',
        'on_route_at', 'on_site_at',
        'completed_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at'   => 'datetime',
            'accepted_at'   => 'datetime',
            'refused_at'    => 'datetime',
            'on_route_at'   => 'datetime',
            'on_site_at'    => 'datetime',
            'completed_at'  => 'datetime',
            'cancelled_at'  => 'datetime',
            'latitude'      => 'decimal:7',
            'longitude'     => 'decimal:7',
        ];
    }

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function serviceInfos()
    {
        return $this->hasMany(MissionServiceInfo::class);
    }

    public function trackingEvents()
    {
        return $this->morphMany(TrackingEvent::class, null, 'target_type', 'target_id')
            ->where('target_type', 'mission');
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['assigned', 'accepted', 'on_route', 'on_site']);
    }

    /**
     * Génère une référence unique pour la mission (format: MIS-YYYY-NNNNNNN)
     */
    public function generateReference(): string
    {
        $year = now()->year;
        $sequence = str_pad($this->id, 7, '0', STR_PAD_LEFT);
        return "MIS-{$year}-{$sequence}";
    }
}
