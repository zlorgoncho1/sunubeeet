<?php

namespace App\Events;

use App\Models\Alerte;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlerteReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Alerte $alerte) {}

    public function broadcastOn(): array
    {
        $channels = [];

        if ($this->alerte->zone_id) {
            $channels[] = new PrivateChannel('coordinator.zone.' . $this->alerte->zone_id);
        }

        return $channels ?: [new PrivateChannel('coordinator.zone.global')];
    }

    public function broadcastAs(): string
    {
        return 'AlerteReceived';
    }

    public function broadcastWith(): array
    {
        return [
            'alerte' => [
                'id'                     => $this->alerte->id,
                'reference'              => $this->alerte->reference,
                'category'               => $this->alerte->category,
                'status'                 => $this->alerte->status,
                'is_potential_duplicate' => $this->alerte->is_potential_duplicate,
                'latitude'               => $this->alerte->latitude,
                'longitude'              => $this->alerte->longitude,
                'created_at'             => $this->alerte->created_at,
            ],
        ];
    }
}
