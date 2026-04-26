<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'type', 'zone_id', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function members()
    {
        return $this->hasMany(User::class);
    }
}
