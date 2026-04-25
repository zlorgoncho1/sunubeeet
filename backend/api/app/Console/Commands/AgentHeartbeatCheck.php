<?php

namespace App\Console\Commands;

use App\Models\AgentPresence;
use App\Models\TrackingEvent;
use Illuminate\Console\Command;

class AgentHeartbeatCheck extends Command
{
    protected $signature   = 'agents:heartbeat-check';
    protected $description = 'Bascule en offline les agents sans heartbeat depuis plus de 5 minutes';

    public function handle(): void
    {
        $staleAgents = AgentPresence::where('status', 'available')
            ->where('last_heartbeat_at', '<', now()->subMinutes(5))
            ->get();

        foreach ($staleAgents as $presence) {
            $presence->update([
                'status'        => 'offline',
                'toggled_off_at' => now(),
                'updated_at'    => now(),
            ]);

            TrackingEvent::create([
                'target_type' => 'agent',
                'target_id'   => $presence->agent_id,
                'actor_role'  => 'system',
                'action'      => 'agent.toggle_off',
                'to_status'   => 'offline',
                'note'        => 'Bascule auto — heartbeat expiré',
            ]);
        }

        $this->info("$staleAgents->count() agent(s) basculé(s) en offline.");
    }
}
