<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'slug', 'parent_id',
        'latitude', 'longitude',
        'description', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'latitude'  => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function parent()
    {
        return $this->belongsTo(Zone::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Zone::class, 'parent_id');
    }
}
