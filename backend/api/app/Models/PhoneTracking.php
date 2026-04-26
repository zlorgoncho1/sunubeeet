<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PhoneTracking extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $dates = ['created_at', 'verified_at', 'expires_at'];

    protected $fillable = [
        'phone_hash', 'phone_e164_masked',
        'alerte_id', 'verified', 'verified_at',
    ];

    protected $hidden = ['phone_hash'];

    protected function casts(): array
    {
        return [
            'verified'    => 'boolean',
            'verified_at' => 'datetime',
            'expires_at'  => 'datetime',
            'created_at'  => 'datetime',
        ];
    }

    public function alerte()
    {
        return $this->belongsTo(Alerte::class);
    }
}
