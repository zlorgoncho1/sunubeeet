<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Endpoints analytiques pour le dashboard administrateur.
 *
 * Toutes les requêtes sont scopées globalement (admin = vue projet entière).
 * PostgreSQL only : utilise DATE_TRUNC, EXTRACT(EPOCH FROM ...), PERCENTILE_CONT.
 *
 * Cache : 5 minutes par défaut (analytics = lecture historique, pas temps réel).
 */
class AnalyticsController extends Controller
{
    private const CACHE_TTL = 300;
    private const MAX_RANGE_DAYS = 90;

    /**
     * GET /v1/dashboard/admin/analytics/alertes-volume?range=30
     *
     * Volume d'alertes par jour, segmenté par catégorie et source (QR vs App).
     * Retourne un seau par jour, même les jours à zéro (via generate_series).
     */
    public function alertesVolume(Request $request): JsonResponse
    {
        $days = $this->parseRange($request, 30);
        $cacheKey = "dashboard:admin:analytics:alertes-volume:{$days}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($days) {
            $from = now()->subDays($days - 1)->startOfDay();

            $rows = DB::select(
                "
                SELECT
                  DATE_TRUNC('day', created_at)::date AS day,
                  category,
                  CASE WHEN source_qr_id IS NOT NULL THEN 'qr' ELSE 'app' END AS source,
                  COUNT(*) AS n
                FROM alertes
                WHERE created_at >= ?
                GROUP BY day, category, source
                ORDER BY day ASC
                ",
                [$from]
            );

            return $this->groupVolumeRows($rows, $days, $from);
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /v1/dashboard/admin/analytics/incidents-trend?range=8
     *
     * Incidents par semaine : créés vs résolus/clôturés. `range` = nombre de
     * semaines glissantes (1-12).
     */
    public function incidentsTrend(Request $request): JsonResponse
    {
        $weeks = max(1, min(12, (int) $request->query('range', 8)));
        $cacheKey = "dashboard:admin:analytics:incidents-trend:{$weeks}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($weeks) {
            $from = now()->subWeeks($weeks - 1)->startOfWeek();

            $created = DB::select(
                "
                SELECT DATE_TRUNC('week', created_at)::date AS week, COUNT(*) AS n
                FROM incidents
                WHERE created_at >= ?
                GROUP BY week
                ",
                [$from]
            );

            $resolved = DB::select(
                "
                SELECT DATE_TRUNC('week', COALESCE(closed_at, resolved_at))::date AS week, COUNT(*) AS n
                FROM incidents
                WHERE COALESCE(closed_at, resolved_at) >= ?
                  AND status IN ('resolved', 'closed')
                GROUP BY week
                ",
                [$from]
            );

            $createdMap = collect($created)->keyBy(fn ($r) => (string) $r->week);
            $resolvedMap = collect($resolved)->keyBy(fn ($r) => (string) $r->week);

            $buckets = [];
            for ($i = 0; $i < $weeks; $i++) {
                $weekStart = $from->copy()->addWeeks($i)->toDateString();
                $buckets[] = [
                    'week_start' => $weekStart,
                    'created' => (int) ($createdMap[$weekStart]->n ?? 0),
                    'resolved' => (int) ($resolvedMap[$weekStart]->n ?? 0),
                ];
            }

            return ['range_weeks' => $weeks, 'buckets' => $buckets];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /v1/dashboard/admin/analytics/agents-performance?range=30&limit=10
     *
     * Top agents par missions complétées sur la période. Retourne aussi le
     * taux de complétion (completed / assigned) et la durée moyenne sur site.
     */
    public function agentsPerformance(Request $request): JsonResponse
    {
        $days = $this->parseRange($request, 30);
        $limit = max(1, min(50, (int) $request->query('limit', 10)));
        $cacheKey = "dashboard:admin:analytics:agents-perf:{$days}:{$limit}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($days, $limit) {
            $from = now()->subDays($days);

            $rows = DB::select(
                "
                SELECT
                  u.id,
                  u.fullname,
                  COUNT(m.id) FILTER (WHERE m.status NOT IN ('cancelled')) AS assigned,
                  COUNT(m.id) FILTER (WHERE m.status = 'completed') AS completed,
                  COUNT(m.id) FILTER (WHERE m.status = 'refused') AS refused,
                  AVG(EXTRACT(EPOCH FROM (m.completed_at - m.on_site_at))) FILTER (WHERE m.completed_at IS NOT NULL AND m.on_site_at IS NOT NULL) AS avg_on_site_seconds
                FROM users u
                LEFT JOIN missions m ON m.assigned_to_user_id = u.id AND m.assigned_at >= ?
                WHERE u.role = 'agent' AND u.is_active = true AND u.deleted_at IS NULL
                GROUP BY u.id, u.fullname
                HAVING COUNT(m.id) > 0
                ORDER BY completed DESC, assigned DESC
                LIMIT ?
                ",
                [$from, $limit]
            );

            $agents = array_map(function ($r) {
                $assigned = (int) $r->assigned;
                $completed = (int) $r->completed;
                return [
                    'agent_id' => $r->id,
                    'fullname' => $r->fullname,
                    'missions_assigned' => $assigned,
                    'missions_completed' => $completed,
                    'missions_refused' => (int) $r->refused,
                    'completion_rate' => $assigned > 0 ? round($completed / $assigned, 3) : 0.0,
                    'avg_on_site_minutes' => $r->avg_on_site_seconds !== null
                        ? round($r->avg_on_site_seconds / 60, 1)
                        : null,
                ];
            }, $rows);

            return ['range_days' => $days, 'agents' => $agents];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /v1/dashboard/admin/analytics/heatmap?range=7&precision=3
     *
     * Densité d'alertes par cluster GPS (lat/lng arrondis selon `precision`).
     * precision=3 → ~110 m, precision=2 → ~1.1 km. Cap dur 5000 points.
     */
    public function heatmap(Request $request): JsonResponse
    {
        $days = $this->parseRange($request, 7);
        $precision = max(1, min(4, (int) $request->query('precision', 3)));
        $cacheKey = "dashboard:admin:analytics:heatmap:{$days}:{$precision}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($days, $precision) {
            $from = now()->subDays($days);

            $rows = DB::select(
                "
                SELECT
                  ROUND(latitude::numeric, ?) AS lat,
                  ROUND(longitude::numeric, ?) AS lng,
                  COUNT(*) AS intensity
                FROM alertes
                WHERE created_at >= ?
                  AND status NOT IN ('false_alert', 'rejected')
                GROUP BY lat, lng
                ORDER BY intensity DESC
                LIMIT 5000
                ",
                [$precision, $precision, $from]
            );

            return [
                'range_days' => $days,
                'precision' => $precision,
                'points' => array_map(fn ($r) => [
                    'lat' => (float) $r->lat,
                    'lng' => (float) $r->lng,
                    'intensity' => (int) $r->intensity,
                ], $rows),
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /v1/dashboard/admin/analytics/sources?range=30
     *
     * Répartition QR vs App pour mesurer l'adoption des deux canaux.
     */
    public function sourcesBreakdown(Request $request): JsonResponse
    {
        $days = $this->parseRange($request, 30);
        $cacheKey = "dashboard:admin:analytics:sources:{$days}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($days) {
            $from = now()->subDays($days);

            $row = DB::select(
                "
                SELECT
                  COUNT(*) FILTER (WHERE source_qr_id IS NOT NULL) AS qr,
                  COUNT(*) FILTER (WHERE source_user_id IS NOT NULL AND source_qr_id IS NULL) AS app,
                  COUNT(*) AS total
                FROM alertes
                WHERE created_at >= ?
                ",
                [$from]
            )[0] ?? null;

            $qr = (int) ($row->qr ?? 0);
            $app = (int) ($row->app ?? 0);
            $total = (int) ($row->total ?? 0);

            return [
                'range_days' => $days,
                'qr' => $qr,
                'app' => $app,
                'total' => $total,
                'qr_share' => $total > 0 ? round($qr / $total, 3) : 0.0,
                'app_share' => $total > 0 ? round($app / $total, 3) : 0.0,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /v1/dashboard/admin/analytics/processing-time?range=30
     *
     * Médiane et p95 du délai created_at → validated_at par catégorie.
     * Cible métier : médiane < 5 min (< 300 s).
     */
    public function processingTime(Request $request): JsonResponse
    {
        $days = $this->parseRange($request, 30);
        $cacheKey = "dashboard:admin:analytics:processing-time:{$days}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($days) {
            $from = now()->subDays($days);

            $rows = DB::select(
                "
                SELECT
                  category,
                  COUNT(*) AS n,
                  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (validated_at - created_at))) AS median_s,
                  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (validated_at - created_at))) AS p95_s
                FROM alertes
                WHERE created_at >= ?
                  AND validated_at IS NOT NULL
                GROUP BY category
                ORDER BY n DESC
                ",
                [$from]
            );

            return [
                'range_days' => $days,
                'target_median_seconds' => 300,
                'by_category' => array_map(fn ($r) => [
                    'category' => $r->category,
                    'count' => (int) $r->n,
                    'median_seconds' => $r->median_s !== null ? round($r->median_s, 1) : null,
                    'p95_seconds' => $r->p95_s !== null ? round($r->p95_s, 1) : null,
                ], $rows),
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /v1/dashboard/admin/analytics/duplicates?range=30
     *
     * Taux de doublons par jour. KPI cible < 10 %, alerte si > 20 %.
     */
    public function duplicatesRate(Request $request): JsonResponse
    {
        $days = $this->parseRange($request, 30);
        $cacheKey = "dashboard:admin:analytics:duplicates:{$days}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($days) {
            $from = now()->subDays($days - 1)->startOfDay();

            $rows = DB::select(
                "
                SELECT
                  DATE_TRUNC('day', created_at)::date AS day,
                  COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE is_potential_duplicate = true) AS duplicates
                FROM alertes
                WHERE created_at >= ?
                GROUP BY day
                ORDER BY day ASC
                ",
                [$from]
            );

            $byDay = collect($rows)->keyBy(fn ($r) => (string) $r->day);
            $buckets = [];
            for ($i = 0; $i < $days; $i++) {
                $day = $from->copy()->addDays($i)->toDateString();
                $r = $byDay[$day] ?? null;
                $total = (int) ($r->total ?? 0);
                $dup = (int) ($r->duplicates ?? 0);
                $buckets[] = [
                    'day' => $day,
                    'total' => $total,
                    'duplicates' => $dup,
                    'rate' => $total > 0 ? round($dup / $total, 3) : 0.0,
                ];
            }

            $totalSum = array_sum(array_column($buckets, 'total'));
            $dupSum = array_sum(array_column($buckets, 'duplicates'));

            return [
                'range_days' => $days,
                'overall_rate' => $totalSum > 0 ? round($dupSum / $totalSum, 3) : 0.0,
                'target_max_rate' => 0.10,
                'alert_threshold' => 0.20,
                'buckets' => $buckets,
            ];
        });

        return response()->json(['data' => $data]);
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private function parseRange(Request $request, int $default): int
    {
        $days = (int) $request->query('range', $default);
        return max(1, min(self::MAX_RANGE_DAYS, $days));
    }

    /**
     * @param  array<int,object>  $rows
     */
    private function groupVolumeRows(array $rows, int $days, Carbon $from): array
    {
        $byDay = [];
        foreach ($rows as $r) {
            $day = (string) $r->day;
            $byDay[$day] ??= ['total' => 0, 'by_category' => [], 'by_source' => ['qr' => 0, 'app' => 0]];
            $byDay[$day]['total'] += (int) $r->n;
            $byDay[$day]['by_category'][$r->category] = ($byDay[$day]['by_category'][$r->category] ?? 0) + (int) $r->n;
            $byDay[$day]['by_source'][$r->source] = ($byDay[$day]['by_source'][$r->source] ?? 0) + (int) $r->n;
        }

        $buckets = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $from->copy()->addDays($i)->toDateString();
            $b = $byDay[$day] ?? ['total' => 0, 'by_category' => [], 'by_source' => ['qr' => 0, 'app' => 0]];
            $buckets[] = ['day' => $day] + $b;
        }

        return ['range_days' => $days, 'buckets' => $buckets];
    }
}
