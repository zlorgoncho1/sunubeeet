<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'type',
        'latitude', 'longitude',
        'address', 'phone',
        'description', 'is_24_7',
        'opening_hours', 'zone_id', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active'     => 'boolean',
            'is_24_7'       => 'boolean',
            'opening_hours' => 'array',
            'latitude'      => 'decimal:7',
            'longitude'     => 'decimal:7',
        ];
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }
}
