<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'parent_id'   => $this->parent_id,
            'latitude'    => $this->latitude,
            'longitude'   => $this->longitude,
            'description' => $this->description,
            'is_active'   => $this->is_active,
            'children'    => ZoneResource::collection($this->whenLoaded('children')),
        ];
    }
}
