<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateAlerteRequest;
use App\Http\Resources\AlerteResource;
use App\Models\Alerte;
use App\Services\AntiSpamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AlerteController extends Controller
{
    public function __construct(
        private AntiSpamService $antiSpamService
    ) {}

    /**
     * Créer une nouvelle alerte (Flow 2 - Application Spectateur)
     *
     * @param CreateAlerteRequest $request
     * @return JsonResponse
     */
    public function store(CreateAlerteRequest $request): JsonResponse
    {
        try {
            return DB::transaction(function () use ($request) {
                // Vérification anti-spam
                $potentialDuplicate = $this->antiSpamService->checkForDuplicates(
                    $request->category,
                    $request->latitude,
                    $request->longitude,
                    $request->client_fingerprint ?? null
                );

                // Création de l'alerte
                $alerte = Alerte::create([
                    'source_user_id' => $request->user()->id,
                    'category' => $request->category,
                    'sub_category' => $request->sub_category,
                    'description' => $request->description,
                    'photo_media_id' => $request->photo_media_id,
                    'audio_media_id' => $request->audio_media_id,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'zone_id' => $this->antiSpamService->findZoneForCoordinates(
                        $request->latitude,
                        $request->longitude
                    ),
                    'is_potential_duplicate' => $potentialDuplicate !== null,
                    'duplicate_of_alerte_id' => $potentialDuplicate?->id,
                    'client_fingerprint' => $request->client_fingerprint,
                ]);

                // Générer la référence
                $alerte->update([
                    'reference' => $alerte->generateReference()
                ]);

                // Log de création
                Log::info('Alerte créée', [
                    'alerte_id' => $alerte->id,
                    'user_id' => $request->user()->id,
                    'category' => $request->category,
                    'is_potential_duplicate' => $alerte->is_potential_duplicate,
                ]);

                // Émettre événement temps réel
                // broadcast(new AlerteCreated($alerte))->toOthers();

                $response = [
                    'data' => new AlerteResource($alerte),
                ];

                // Ajouter avertissement si doublon potentiel
                if ($alerte->is_potential_duplicate) {
                    $response['warning'] = 'Une alerte similaire a déjà été signalée à proximité. Votre signalement complète l\'information existante.';
                }

                return response()->json($response, Response::HTTP_CREATED);
            });

        } catch (\Throwable $e) {
            Log::error('Erreur création alerte', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Une erreur inattendue s\'est produite.',
                ]
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
