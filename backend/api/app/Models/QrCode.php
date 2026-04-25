<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
    use HasUuids;

    protected $fillable = [
        'token', 'location_label',
        'latitude', 'longitude',
        'zone_id', 'site_id',
        'description', 'is_active',
        'expires_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'expires_at' => 'datetime',
            'latitude'   => 'decimal:7',
            'longitude'  => 'decimal:7',
        ];
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function alertes()
    {
        return $this->hasMany(Alerte::class, 'source_qr_id');
    }
}
