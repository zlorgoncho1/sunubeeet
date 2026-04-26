<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentPresence extends Model
{
    protected $primaryKey = 'agent_id';
    protected $keyType    = 'string';
    public    $incrementing = false;
    public    $timestamps = false;
    protected $dates = ['last_heartbeat_at', 'toggled_on_at', 'toggled_off_at', 'updated_at'];

    protected $fillable = [
        'agent_id', 'status',
        'latitude', 'longitude',
        'battery_level', 'last_heartbeat_at',
        'toggled_on_at', 'toggled_off_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude'         => 'decimal:7',
            'longitude'        => 'decimal:7',
            'last_heartbeat_at' => 'datetime',
            'toggled_on_at'    => 'datetime',
            'toggled_off_at'   => 'datetime',
            'updated_at'       => 'datetime',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}
