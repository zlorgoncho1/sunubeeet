# 📚 Documentation: Intégration Système d'Alerte Bët sur Laravel

## Table des matières
1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Intégration Backend](#intégration-backend)
4. [API Client](#api-client)
5. [Exemples](#exemples)
6. [Webhook & Notifications](#webhook--notifications)

---

## Architecture

### Vue d'ensemble
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vue/React)                 │
│                   (Formulaire d'alerte)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              API Bët (Python FastAPI)                       │
│         Port 5000: http://localhost:5000                    │
│  ├─ POST /alerte/          → Créer une alerte              │
│  ├─ GET /alerte/{id}       → Récupérer une alerte          │
│  └─ GET /alerte/           → Lister les alertes            │
└──────────────────────┬──────────────────────────────────────┘
                       │ Webhooks + API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Laravel                                │
│    Stockage + Logique métier + Notifications               │
└─────────────────────────────────────────────────────────────┘
```

### Flux de données
```
1. Utilisateur crée une alerte (Frontend)
   ↓
2. Alerte envoyée à API Bët (POST /alerte/)
   ↓
3. API Bët crée alerte + détecte redondance (< 100ms)
   ↓
4. Réponse immédiate avec référence AL-YYYY-NNNNNN
   ↓
5. IA lancée en background (asynchrone)
   ↓
6. Laravel stocke l'alerte dans BD
   ↓
7. Notifications en temps réel (WebSocket/Push)
```

---

## Installation

### 1. Pré-requis
```bash
# Laravel 10+ avec PHP 8.1+
php --version
composer --version

# Base de données
# - MySQL 8.0+
# - PostgreSQL 12+
# - SQLite 3.39+

# Redis (optionnel, pour queue)
```

### 2. Installation du package Laravel

```bash
# Via Composer (créer le package)
composer require sunubeeet/laravel-alerte

# Ou installer manuellement
git clone https://github.com/sunubeeet/laravel-alerte.git packages/sunubeeet/laravel-alerte
```

### 3. Configuration

**config/alerte.php**
```php
<?php

return [
    // URL de l'API Bët
    'bet_api_url' => env('BET_API_URL', 'http://localhost:5000'),
    
    // Timeout des requêtes (secondes)
    'timeout' => env('BET_TIMEOUT', 10),
    
    // Storage des alertes
    'storage' => env('BET_STORAGE', 'database'), // database, redis, file
    
    // Queue pour traitement asynchrone
    'queue' => env('BET_QUEUE', 'default'),
    
    // Notifications
    'notifications' => [
        'enabled' => env('BET_NOTIFICATIONS', true),
        'channels' => ['database', 'mail', 'slack'], // database, mail, slack, sms
    ],
    
    // Webhook pour mises à jour IA
    'webhook' => [
        'enabled' => true,
        'secret' => env('BET_WEBHOOK_SECRET', 'your-secret-key'),
        'endpoint' => '/webhook/alerte-update', // Route interne
    ],
    
    // Redondance (détection en BD)
    'redundancy' => [
        'enabled' => true,
        'window' => 5, // minutes
        'distance' => 0.001, // degrés (≈ 100m)
    ],
];
```

**.env**
```env
BET_API_URL=http://localhost:5000
BET_TIMEOUT=10
BET_STORAGE=database
BET_QUEUE=default
BET_NOTIFICATIONS=true
BET_WEBHOOK_SECRET=your-very-secret-key-here
```

### 4. Migrations

```bash
php artisan migrate
```

**database/migrations/XXXX_XX_XX_create_alertes_table.php**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // AL-2026-000001
            $table->string('bet_alerte_id')->unique(); // UUID from Bët API
            $table->enum('categorie', ['medical', 'securite', 'foule', 'technique', 'incendie', 'autre']);
            $table->text('description')->nullable();
            $table->string('spectateur_id');
            $table->string('spectateur_ip')->nullable();
            $table->string('client_fingerprint')->nullable();
            
            // Média
            $table->longText('audio_base64')->nullable();
            $table->longText('photo_base64')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            
            // Status
            $table->enum('status', ['created', 'processing', 'duplicate', 'validated', 'incident_created', 'rejected'])
                  ->default('processing');
            $table->boolean('is_duplicate')->default(false);
            $table->foreignId('duplicate_of_alerte_id')->nullable()->constrained('alertes')->nullOnDelete();
            
            // IA Results
            $table->string('ia_gravite')->nullable(); // basse, moyenne, haute, critique
            $table->text('ia_transcription')->nullable();
            $table->text('ia_photo_analysis')->nullable();
            $table->decimal('ia_confidence', 3, 2)->nullable(); // 0.00 - 1.00
            $table->json('ia_metadata')->nullable();
            
            // Timestamps
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('ia_completed_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
            
            // Indexes
            $table->index('reference');
            $table->index('spectateur_ip');
            $table->index('status');
            $table->index('categorie');
            $table->index(['latitude', 'longitude']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertes');
    }
};
```

---

## Intégration Backend

### 1. Modèle Alerte

**app/Models/Alerte.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\AsCollection;

class Alerte extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'reference', 'bet_alerte_id', 'categorie', 'description',
        'spectateur_id', 'spectateur_ip', 'client_fingerprint',
        'audio_base64', 'photo_base64', 'latitude', 'longitude',
        'status', 'is_duplicate', 'duplicate_of_alerte_id',
        'ia_gravite', 'ia_transcription', 'ia_photo_analysis',
        'ia_confidence', 'ia_metadata'
    ];

    protected $casts = [
        'is_duplicate' => 'boolean',
        'received_at' => 'datetime',
        'processed_at' => 'datetime',
        'ia_completed_at' => 'datetime',
        'ia_metadata' => AsCollection::class,
    ];

    // Relations
    public function duplicateOf()
    {
        return $this->belongsTo(Alerte::class, 'duplicate_of_alerte_id');
    }

    public function duplicates()
    {
        return $this->hasMany(Alerte::class, 'duplicate_of_alerte_id');
    }

    // Scopes
    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopeDuplicates($query)
    {
        return $query->where('is_duplicate', true);
    }

    public function scopeValidated($query)
    {
        return $query->where('status', 'validated');
    }

    // Accessors
    public function getGraviteColor()
    {
        return [
            'basse' => 'green',
            'moyenne' => 'yellow',
            'haute' => 'orange',
            'critique' => 'red',
        ][$this->ia_gravite] ?? 'gray';
    }
}
```

### 2. Service d'Alerte

**app/Services/AlerteService.php**
```php
<?php

namespace App\Services;

use App\Models\Alerte;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AlerteService
{
    private $apiUrl;
    private $timeout;

    public function __construct()
    {
        $this->apiUrl = config('alerte.bet_api_url');
        $this->timeout = config('alerte.timeout');
    }

    /**
     * Créer une alerte via API Bët
     */
    public function create(array $data): Alerte
    {
        // 1. Appeler API Bët
        $response = $this->callBetApi('POST', '/alerte/', $data);

        if (!$response->ok()) {
            Log::error('Bët API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('API Bët error: ' . $response->body());
        }

        $betData = $response->json();

        // 2. Créer enregistrement en BD
        $alerte = Alerte::create([
            'reference' => $betData['reference'],
            'bet_alerte_id' => $betData['alerte_id'],
            'categorie' => $data['categorie'],
            'description' => $data['description'] ?? null,
            'spectateur_id' => $data['spectateur_id'],
            'spectateur_ip' => $data['spectateur_ip'] ?? request()->ip(),
            'client_fingerprint' => $data['client_fingerprint'] ?? null,
            'audio_base64' => $data['audio_base64'] ?? null,
            'photo_base64' => $data['photo_base64'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'status' => $betData['status'],
            'is_duplicate' => $betData['is_duplicate'],
            'duplicate_of_alerte_id' => $this->findDuplicateAlerte($betData),
        ]);

        // 3. Envoyer notification
        event(new \App\Events\AlerteCreated($alerte));

        // 4. Lancer job pour traitement IA
        if ($betData['status'] === 'processing') {
            \App\Jobs\ProcessAlerte::dispatch($alerte)->onQueue(config('alerte.queue'));
        }

        return $alerte;
    }

    /**
     * Appeler l'API Bët
     */
    public function callBetApi(string $method, string $endpoint, array $data = []): \Illuminate\Http\Client\Response
    {
        $url = $this->apiUrl . $endpoint;

        return Http::timeout($this->timeout)
            ->retry(3, 100)
            ->accept('application/json')
            ->contentType('application/json')
            ->when($method === 'POST', fn($http) => $http->post($url, $data))
            ->when($method === 'GET', fn($http) => $http->get($url))
            ->when($method === 'PUT', fn($http) => $http->put($url, $data));
    }

    /**
     * Récupérer une alerte de l'API Bët
     */
    public function fetch(string $alerteId)
    {
        return $this->callBetApi('GET', "/alerte/{$alerteId}")->json();
    }

    /**
     * Trouver l'alerte d'origine en cas de doublon
     */
    private function findDuplicateAlerte(array $betData): ?int
    {
        if (!$betData['is_duplicate'] || !$betData['duplicate_of_reference']) {
            return null;
        }

        $original = Alerte::where('reference', $betData['duplicate_of_reference'])->first();
        return $original?->id;
    }

    /**
     * Mettre à jour les résultats IA
     */
    public function updateWithIaResults(Alerte $alerte, array $iaResults): void
    {
        $alerte->update([
            'ia_gravite' => $iaResults['gravite'] ?? null,
            'ia_transcription' => $iaResults['transcription'] ?? null,
            'ia_photo_analysis' => $iaResults['photo_analysis'] ?? null,
            'ia_confidence' => $iaResults['confidence'] ?? null,
            'ia_metadata' => $iaResults['metadata'] ?? [],
            'status' => 'validated',
            'processed_at' => now(),
            'ia_completed_at' => now(),
        ]);

        event(new \App\Events\AlerteProcessed($alerte));
    }

    /**
     * Lister les alertes actives
     */
    public function active()
    {
        return Alerte::where('status', '!=', 'rejected')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }
}
```

### 3. Controller

**app/Http/Controllers/AlerteController.php**
```php
<?php

namespace App\Http\Controllers;

use App\Models\Alerte;
use App\Services\AlerteService;
use Illuminate\Http\Request;

class AlerteController extends Controller
{
    public function __construct(private AlerteService $alerteService)
    {}

    /**
     * POST /api/alertes - Créer une alerte
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'categorie' => 'required|in:medical,securite,foule,technique,incendie,autre',
            'description' => 'nullable|string|max:5000',
            'spectateur_id' => 'required|string',
            'audio_base64' => 'nullable|string',
            'photo_base64' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        try {
            $alerte = $this->alerteService->create($validated);

            return response()->json([
                'success' => true,
                'alerte' => $alerte,
                'reference' => $alerte->reference,
                'message' => 'Alerte créée avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur création alerte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/alertes/{id} - Récupérer une alerte
     */
    public function show(Alerte $alerte)
    {
        return response()->json($alerte);
    }

    /**
     * GET /api/alertes - Lister les alertes
     */
    public function index(Request $request)
    {
        $query = Alerte::query();

        // Filtres
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->categorie) {
            $query->where('categorie', $request->categorie);
        }
        if ($request->duplicates_only) {
            $query->where('is_duplicate', true);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    /**
     * POST /webhook/alerte-update - Webhook Bët pour mises à jour IA
     */
    public function webhook(Request $request)
    {
        // Vérifier le secret
        $secret = config('alerte.webhook.secret');
        $signature = $request->header('X-Webhook-Signature');

        if (!hash_equals($signature, hash_hmac('sha256', $request->getContent(), $secret))) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $request->json('all');

        // Récupérer l'alerte
        $alerte = Alerte::where('bet_alerte_id', $data['alerte_id'])->firstOrFail();

        // Mettre à jour avec résultats IA
        $this->alerteService->updateWithIaResults($alerte, $data['ia_results']);

        return response()->json(['success' => true]);
    }
}
```

### 4. Routes

**routes/api.php**
```php
<?php

use App\Http\Controllers\AlerteController;

Route::middleware('api')->group(function () {
    // Alertes
    Route::post('/alertes', [AlerteController::class, 'store']);
    Route::get('/alertes', [AlerteController::class, 'index']);
    Route::get('/alertes/{alerte}', [AlerteController::class, 'show']);
    
    // Webhook (non authentifié mais signé)
    Route::post('/webhook/alerte-update', [AlerteController::class, 'webhook'])->withoutMiddleware('auth:api');
});
```

---

## API Client

### Créer une alerte depuis le frontend (exemple JavaScript)

```javascript
async function createAlerte(formData) {
    const response = await fetch('/api/alertes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
            categorie: formData.categorie,
            description: formData.description,
            spectateur_id: 'USER_' + Date.now(),
            audio_base64: formData.audio || null,
            photo_base64: formData.photo || null,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
        })
    });

    const result = await response.json();
    
    if (result.success) {
        console.log('✅ Alerte créée:', result.reference);
        return result.alerte;
    } else {
        console.error('❌ Erreur:', result.message);
        throw new Error(result.error);
    }
}
```

### Utiliser le service depuis un Controller

```php
public function reportIncident(Request $request, AlerteService $alerteService)
{
    $alerte = $alerteService->create($request->validate([
        'categorie' => 'required|string',
        'description' => 'required|string',
        'spectateur_id' => 'required|string',
    ]));

    return redirect("/incidents/{$alerte->reference}")->with('success', 'Alerte créée');
}
```

---

## Exemples

### 1. Dashboard des Alertes

```php
// app/Http/Controllers/DashboardController.php
public function index()
{
    $alertes = Alerte::where('created_at', '>=', now()->subHours(24))
        ->orderBy('created_at', 'desc')
        ->get();

    $stats = [
        'total' => $alertes->count(),
        'processing' => $alertes->where('status', 'processing')->count(),
        'duplicates' => $alertes->where('is_duplicate', true)->count(),
        'critical' => $alertes->where('ia_gravite', 'critique')->count(),
    ];

    return view('dashboard', ['alertes' => $alertes, 'stats' => $stats]);
}
```

### 2. Notifications en temps réel (Laravel Broadcasting)

```php
// app/Events/AlerteCreated.php
namespace App\Events;

use App\Models\Alerte;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlerteCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Alerte $alerte)
    {}

    public function broadcastOn(): Channel
    {
        return new Channel('alertes');
    }

    public function broadcastAs(): string
    {
        return 'alerte.created';
    }
}
```

### 3. Job de traitement asynchrone

```php
// app/Jobs/ProcessAlerte.php
namespace App\Jobs;

use App\Models\Alerte;
use App\Services\AlerteService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class ProcessAlerte implements ShouldQueue
{
    use Dispatchable;

    public function __construct(public Alerte $alerte)
    {}

    public function handle(AlerteService $service)
    {
        // Récupérer résultats IA de l'API Bët
        $betData = $service->fetch($this->alerte->bet_alerte_id);

        // Mettre à jour la BD
        if ($betData['ia_metadata']) {
            $service->updateWithIaResults($this->alerte, $betData['ia_metadata']);
        }
    }
}
```

---

## Webhook & Notifications

### Signature Webhook

Pour chaque webhook reçu, l'API Bët envoie un header `X-Webhook-Signature` calculé ainsi:

```php
$signature = hash_hmac('sha256', $requestBody, $webhookSecret);
```

Laravel côté Laravel:
```php
$expectedSignature = hash_hmac('sha256', $request->getContent(), config('alerte.webhook.secret'));
$isValid = hash_equals($expectedSignature, $request->header('X-Webhook-Signature'));
```

### Format du Webhook

```json
{
    "event": "alerte.processed",
    "alerte_id": "uuid-xxx",
    "reference": "AL-2026-000001",
    "ia_results": {
        "gravite": "haute",
        "transcription": "Patient inconscient à l'étage 2",
        "photo_analysis": "Image sombre, difficile à analyser",
        "confidence": 0.87,
        "metadata": {
            "model_used": "llama-3.3-70b",
            "processing_time_ms": 1250
        }
    }
}
```

---

## Tests

```php
// tests/Feature/AlerteTest.php
public function test_create_alerte()
{
    $response = $this->postJson('/api/alertes', [
        'categorie' => 'medical',
        'description' => 'Patient évanoui',
        'spectateur_id' => 'TEST_USER',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['success', 'alerte', 'reference']);

    $this->assertDatabaseHas('alertes', [
        'reference' => $response->json('reference'),
    ]);
}
```

---

## Support & Questions

- 📧 support@bet-alerts.dev
- 🐛 Issues: github.com/sunubeeet/laravel-alerte/issues
- 📖 Docs: https://docs.bet-alerts.dev

