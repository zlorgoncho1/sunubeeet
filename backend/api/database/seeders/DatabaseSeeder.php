<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Zones JOJ 2026
        $senegal = Zone::updateOrCreate(
            ['slug' => 'senegal'],
            ['name' => 'Sénégal', 'is_active' => true]
        );

        $dakar = Zone::updateOrCreate(
            ['slug' => 'dakar'],
            ['name' => 'Dakar', 'parent_id' => $senegal->id, 'is_active' => true]
        );

        $arena = Zone::updateOrCreate(
            ['slug' => 'dakar-arena'],
            [
                'name' => 'Dakar Arena',
                'parent_id' => $dakar->id,
                'latitude' => 14.7453,
                'longitude' => -17.4660,
                'is_active' => true,
            ]
        );

        $diamniadio = Zone::updateOrCreate(
            ['slug' => 'diamniadio'],
            ['name' => 'Diamniadio', 'parent_id' => $dakar->id, 'is_active' => true]
        );

        Zone::updateOrCreate(
            ['slug' => 'saly'],
            ['name' => 'Saly', 'parent_id' => $senegal->id, 'is_active' => true]
        );

        // Équipes
        $teamHealth = Team::updateOrCreate(
            ['name' => 'Équipe Santé'],
            ['type' => 'health', 'zone_id' => $arena->id, 'is_active' => true]
        );
        $teamSecurity = Team::updateOrCreate(
            ['name' => 'Équipe Sécurité'],
            ['type' => 'security', 'zone_id' => $arena->id, 'is_active' => true]
        );
        $teamLogistic = Team::updateOrCreate(
            ['name' => 'Équipe Logistique'],
            ['type' => 'logistics', 'zone_id' => $arena->id, 'is_active' => true]
        );

        // Super Admin
        User::updateOrCreate(
            ['phone' => '+221700000001'],
            [
                'fullname' => 'Super Admin',
                'password' => Hash::make('SuperAdmin123!'),
                'role' => 'super_admin',
                'is_active' => true,
                'must_change_password' => false,
                'phone_verified_at' => now(),
            ]
        );

        // Admin
        User::updateOrCreate(
            ['phone' => '+221700000002'],
            [
                'fullname' => 'Admin Bët',
                'password' => Hash::make('Admin123!'),
                'role' => 'admin',
                'zone_id' => $arena->id,
                'is_active' => true,
                'must_change_password' => false,
                'phone_verified_at' => now(),
            ]
        );

        // Coordinateur
        $coordinator = User::updateOrCreate(
            ['phone' => '+221771000001'],
            [
                'fullname' => 'Aminata Diop',
                'password' => Hash::make('Coord123!'),
                'role' => 'coordinator',
                'zone_id' => $arena->id,
                'is_active' => true,
                'must_change_password' => false,
                'phone_verified_at' => now(),
            ]
        );

        // Agents
        User::updateOrCreate(
            ['phone' => '+221772000001'],
            [
                'fullname' => 'Moussa Ndiaye',
                'password' => Hash::make('Agent123!'),
                'role' => 'agent',
                'team_id' => $teamHealth->id,
                'zone_id' => $arena->id,
                'created_by' => $coordinator->id,
                'is_active' => true,
                'must_change_password' => true,
                'phone_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['phone' => '+221772000002'],
            [
                'fullname' => 'Aida Fall',
                'password' => Hash::make('Agent123!'),
                'role' => 'agent',
                'team_id' => $teamSecurity->id,
                'zone_id' => $arena->id,
                'created_by' => $coordinator->id,
                'is_active' => true,
                'must_change_password' => true,
                'phone_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['phone' => '+221772000003'],
            [
                'fullname' => 'Cheikh Diouf',
                'password' => Hash::make('Agent123!'),
                'role' => 'agent',
                'team_id' => $teamLogistic->id,
                'zone_id' => $arena->id,
                'created_by' => $coordinator->id,
                'is_active' => true,
                'must_change_password' => true,
                'phone_verified_at' => now(),
            ]
        );
    }
}
