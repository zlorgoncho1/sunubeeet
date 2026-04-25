<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasUuids;

    protected $fillable = [
        'reference', 'title', 'description',
        'category', 'sub_category',
        'severity', 'priority',
        'latitude', 'longitude', 'zone_id',
        'status', 'is_hot_zone', 'alertes_count',
        'created_by_user_id', 'qualified_by_user_id',
        'resolved_by_user_id', 'closed_by_user_id',
        'qualified_at', 'resolved_at', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'sub_category' => 'array',
            'is_hot_zone'  => 'boolean',
            'qualified_at' => 'datetime',
            'resolved_at'  => 'datetime',
            'closed_at'    => 'datetime',
            'latitude'     => 'decimal:7',
            'longitude'    => 'decimal:7',
        ];
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function alertes()
    {
        return $this->hasMany(Alerte::class);
    }

    public function missions()
    {
        return $this->hasMany(Mission::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function trackingEvents()
    {
        return $this->morphMany(TrackingEvent::class, null, 'target_type', 'target_id')
            ->where('target_type', 'incident');
    }
}
