<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QrCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'location_label' => $this->location_label,
            'latitude'       => $this->latitude,
            'longitude'      => $this->longitude,
            'is_active'      => $this->is_active,
            'scan_count'     => $this->scan_count,
            'last_scanned_at' => $this->last_scanned_at,
            'expires_at'     => $this->expires_at,
            'scan_url'       => config('app.url') . '/q/' . $this->token,
            'zone'           => $this->whenLoaded('zone', fn() => [
                'id'   => $this->zone->id,
                'name' => $this->zone->name,
            ]),
            'site'           => $this->whenLoaded('site', fn() => [
                'id'   => $this->site->id,
                'name' => $this->site->name,
                'type' => $this->site->type,
            ]),
            'created_at'     => $this->created_at,
        ];
    }
}
