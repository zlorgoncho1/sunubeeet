<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackingEvent extends Model
{
    public $timestamps = false;
    protected $dates = ['created_at'];

    protected $fillable = [
        'target_type', 'target_id',
        'actor_id', 'actor_role',
        'action', 'from_status', 'to_status',
        'note', 'metadata',
        'latitude', 'longitude',
    ];

    protected function casts(): array
    {
        return [
            'metadata'   => 'array',
            'created_at' => 'datetime',
            'latitude'   => 'decimal:7',
            'longitude'  => 'decimal:7',
        ];
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
