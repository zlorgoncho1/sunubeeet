<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'incident_id' => $this->incident_id,
            'created_by_user_id' => $this->created_by_user_id,
            'assigned_to_user_id' => $this->assigned_to_user_id,
            'title' => $this->title,
            'briefing' => $this->briefing,
            'estimated_duration_minutes' => $this->estimated_duration_minutes,
            'status' => $this->status,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'refusal_reason' => $this->refusal_reason,
            'cancellation_reason' => $this->cancellation_reason,
            'completion_note' => $this->completion_note,
            'outcome' => $this->outcome,
            'created_at' => $this->created_at,
            'assigned_at' => $this->assigned_at,
            'accepted_at' => $this->accepted_at,
            'refused_at' => $this->refused_at,
            'on_route_at' => $this->on_route_at,
            'on_site_at' => $this->on_site_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'updated_at' => $this->updated_at,
            'incident' => $this->whenLoaded('incident', function() {
                return [
                    'id' => $this->incident->id,
                    'reference' => $this->incident->reference,
                    'title' => $this->incident->title,
                    'category' => $this->incident->category,
                    'severity' => $this->incident->severity,
                    'status' => $this->incident->status,
                ];
            }),
            'assigned_user' => $this->whenLoaded('assignedUser', function() {
                return [
                    'id' => $this->assignedUser->id,
                    'fullname' => $this->assignedUser->fullname,
                ];
            }),
            'service_infos' => $this->whenLoaded('serviceInfos', function() {
                return $this->serviceInfos->map(function($info) {
                    return [
                        'id' => $info->id,
                        'site' => $info->site ? [
                            'id' => $info->site->id,
                            'name' => $info->site->name,
                            'type' => $info->site->type,
                            'phone' => $info->site->phone,
                            'latitude' => $info->site->latitude,
                            'longitude' => $info->site->longitude,
                        ] : null,
                        'suggested_action' => $info->suggested_action,
                        'priority_order' => $info->priority_order,
                    ];
                });
            }),
        ];
    }
}
