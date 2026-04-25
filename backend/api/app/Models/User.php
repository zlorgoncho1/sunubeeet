<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'fullname',
        'phone',
        'password',
        'role',
        'team_id',
        'zone_id',
        'created_by',
        'is_active',
        'must_change_password',
        'phone_verified_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password'            => 'hashed',
            'is_active'           => 'boolean',
            'must_change_password' => 'boolean',
            'phone_verified_at'   => 'datetime',
            'last_login_at'       => 'datetime',
        ];
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role'    => $this->role,
            'phone'   => $this->phone,
        ];
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function alertes()
    {
        return $this->hasMany(Alerte::class, 'source_user_id');
    }

    public function missions()
    {
        return $this->hasMany(Mission::class, 'assigned_to_user_id');
    }

    public function presence()
    {
        return $this->hasOne(AgentPresence::class, 'agent_id');
    }

    public function isAgent(): bool
    {
        return $this->role === 'agent';
    }

    public function isCoordinator(): bool
    {
        return $this->role === 'coordinator';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    public function hasRole(string|array $roles): bool
    {
        return in_array($this->role, (array) $roles);
    }
}
