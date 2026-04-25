<?php

namespace App\Events;

use App\Models\Mission;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MissionAssigned implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Mission $mission) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('agent.' . $this->mission->assigned_to_user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MissionAssigned';
    }

    public function broadcastWith(): array
    {
        return [
            'mission' => [
                'id'        => $this->mission->id,
                'reference' => $this->mission->reference,
                'title'     => $this->mission->title,
                'briefing'  => $this->mission->briefing,
                'status'    => $this->mission->status,
                'latitude'  => $this->mission->latitude,
                'longitude' => $this->mission->longitude,
                'incident'  => $this->mission->incident ? [
                    'id'       => $this->mission->incident->id,
                    'category' => $this->mission->incident->category,
                    'severity' => $this->mission->incident->severity,
                ] : null,
            ],
        ];
    }
}
