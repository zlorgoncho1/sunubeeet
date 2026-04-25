<?php

namespace App\Events;

use App\Models\Incident;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Incident $incident) {}

    public function broadcastOn(): array
    {
        $channels = [];

        // Notifier tous les coordinateurs de la zone
        if ($this->incident->zone_id) {
            $channels[] = new PrivateChannel('coordinator.zone.' . $this->incident->zone_id);
        }

        return $channels ?: [new PrivateChannel('coordinator.zone.global')];
    }

    public function broadcastAs(): string
    {
        return 'IncidentUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'incident' => [
                'id'        => $this->incident->id,
                'reference' => $this->incident->reference,
                'status'    => $this->incident->status,
                'severity'  => $this->incident->severity,
                'category'  => $this->incident->category,
                'latitude'  => $this->incident->latitude,
                'longitude' => $this->incident->longitude,
            ],
        ];
    }
}
