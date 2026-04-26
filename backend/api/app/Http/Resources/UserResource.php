<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'fullname'             => $this->fullname,
            'phone'                => $this->phone,
            'role'                 => $this->role,
            'is_active'            => $this->is_active,
            'must_change_password' => $this->must_change_password,
            'phone_verified_at'    => $this->phone_verified_at,
            'last_login_at'        => $this->last_login_at,
            'team'                 => $this->whenLoaded('team', fn() => [
                'id'   => $this->team->id,
                'name' => $this->team->name,
                'type' => $this->team->type,
            ]),
            'zone'                 => $this->whenLoaded('zone', fn() => [
                'id'   => $this->zone->id,
                'name' => $this->zone->name,
            ]),
            'created_at'           => $this->created_at,
        ];
    }
}
