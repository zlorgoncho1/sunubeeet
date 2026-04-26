<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlerteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'category' => $this->category,
            'sub_category' => $this->sub_category,
            'description' => $this->description,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'status' => $this->status,
            'is_potential_duplicate' => $this->is_potential_duplicate,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'validated_at' => $this->validated_at,
        ];
    }
}
