<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ReferenceService
{
    public function nextAlerte(): string
    {
        $year = now()->year;

        $count = DB::selectOne(
            "SELECT COUNT(*) as total FROM alertes WHERE EXTRACT(YEAR FROM created_at) = ?",
            [$year]
        );

        $seq = ($count->total ?? 0) + 1;

        return sprintf('AL-%d-%07d', $year, $seq);
    }

    public function nextIncident(): string
    {
        $year = now()->year;

        $count = DB::selectOne(
            "SELECT COUNT(*) as total FROM incidents WHERE EXTRACT(YEAR FROM created_at) = ?",
            [$year]
        );

        $seq = ($count->total ?? 0) + 1;

        return sprintf('INC-%d-%06d', $year, $seq);
    }

    public function nextMission(): string
    {
        $year = now()->year;

        $count = DB::selectOne(
            "SELECT COUNT(*) as total FROM missions WHERE EXTRACT(YEAR FROM created_at) = ?",
            [$year]
        );

        $seq = ($count->total ?? 0) + 1;

        return sprintf('MSN-%d-%06d', $year, $seq);
    }
}
