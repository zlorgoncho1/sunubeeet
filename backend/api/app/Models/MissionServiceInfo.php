<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MissionServiceInfo extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $dates = ['created_at'];

    protected $fillable = [
        'mission_id', 'site_id',
        'suggested_action', 'priority_order',
        'added_by_user_id',
    ];

    public function mission()
    {
        return $this->belongsTo(Mission::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
