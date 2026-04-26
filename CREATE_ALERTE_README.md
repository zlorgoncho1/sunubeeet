# Implémentation Complète : Création d'Alerte (Flow 2 - Application Spectateur)

Cette implémentation fournit une solution complète et professionnelle pour relier le frontend Next.js au backend Laravel pour la fonctionnalité de création d'alerte.

## Architecture

### Backend Laravel
- **Contrôleur** : `AlerteController` avec validation stricte
- **Service** : `AntiSpamService` pour la détection de doublons spatio-temporels
- **Modèle** : `Alerte` avec génération automatique de référence
- **Tests** : Couverture complète avec PHPUnit

### Frontend Next.js
- **Hook personnalisé** : `useCreateAlerte` pour la gestion d'état
- **Composant** : `CreateAlerteForm` avec gestion d'erreur et loading
- **Types** : TypeScript strict pour le contrat API
- **Client API** : Configuration Axios avec intercepteurs JWT

## Utilisation

### 1. Configuration des Variables d'Environnement

```bash
# Copier le fichier d'exemple
cp frontend/.env.example frontend/.env.local

# Remplir les valeurs
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### 2. Utilisation du Composant

```tsx
import CreateAlerteForm from "@/components/CreateAlerteForm";

export default function AlertPage() {
  return (
    <div>
      <h1>Signaler un incident</h1>
      <CreateAlerteForm
        onSuccess={(alerte) => {
          console.log("Alerte créée:", alerte.reference);
          // Redirection ou mise à jour UI
        }}
        onError={(error) => {
          console.error("Erreur:", error.message);
          // Affichage d'un toast d'erreur
        }}
      />
    </div>
  );
}
```

### 3. Utilisation du Hook Directement

```tsx
import { useCreateAlerte } from "@/lib/hooks/useCreateAlerte";

export default function CustomForm() {
  const { mutate, isLoading, error, data } = useCreateAlerte();

  const handleSubmit = async (formData) => {
    try {
      const response = await mutate({
        category: "health",
        description: "Personne âgée en difficulté",
        latitude: 14.7234,
        longitude: -17.5431,
      });
      console.log("Succès:", response.data.reference);
    } catch (err) {
      console.error("Erreur:", err.message);
    }
  };

  return (
    <button onClick={handleSubmit} disabled={isLoading}>
      {isLoading ? "Création..." : "Signaler"}
    </button>
  );
}
```

## Fonctionnalités Implémentées

### ✅ Backend
- [x] Validation stricte des entrées (Laravel Form Request)
- [x] Gestion d'erreurs centralisée (try/catch global)
- [x] Anti-spam spatio-temporel (100m, 2min)
- [x] Génération automatique de référence (AL-2026-XXXXXXX)
- [x] Détection de zone GPS automatique
- [x] Rate limiting par IP
- [x] Tests unitaires complets
- [x] Logging structuré

### ✅ Frontend
- [x] Hook React personnalisé avec gestion d'état
- [x] Composant UI complet avec validation
- [x] Gestion des erreurs et loading states
- [x] Géolocalisation intégrée
- [x] Types TypeScript stricts
- [x] Client API configuré avec JWT
- [x] Gestion des tokens d'authentification

### ✅ Sécurité
- [x] Authentification JWT obligatoire
- [x] Validation côté serveur
- [x] Protection contre les doublons
- [x] Rate limiting
- [x] Sanitisation des entrées

### ✅ Performance
- [x] Requêtes optimisées
- [x] Gestion de cache (invalidation)
- [x] États de chargement granulaires
- [x] Erreurs non-bloquantes

## API Contract

### Request
```typescript
interface CreateAlerteRequest {
  category: AlerteCategory;
  sub_category?: SubCategory;
  description?: string;
  photo_media_id?: string;
  audio_media_id?: string;
  latitude: number;
  longitude: number;
  client_fingerprint?: string;
}
```

### Response
```typescript
interface CreateAlerteResponse {
  data: {
    id: string;
    reference: string;
    category: AlerteCategory;
    status: "received";
    is_potential_duplicate: boolean;
    created_at: string;
  };
  warning?: string; // Si doublon détecté
}
```

## Tests

### Backend
```bash
cd backend/api
php artisan test --filter=AlerteControllerTest
```

### Frontend
```bash
cd frontend
npm run test CreateAlerteForm
```

## Déploiement

### Variables d'Environnement Requises
```env
# Backend
ANTISPAM_DISTANCE_METERS=100
ANTISPAM_TIME_WINDOW_SECONDS=120

# Frontend
NEXT_PUBLIC_API_URL=https://api.bet.sn/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

## Principes SOLID Respectés

- **S** : Single Responsibility (chaque classe une responsabilité)
- **O** : Open/Closed (extensible via interfaces)
- **L** : Liskov Substitution (héritage correct)
- **I** : Interface Segregation (interfaces spécifiques)
- **D** : Dependency Inversion (injection de dépendances)

## Patterns Utilisés

- **Repository Pattern** : Abstraction de la couche données
- **Service Layer** : Logique métier isolée
- **Form Request** : Validation centralisée
- **Resource** : Transformation des réponses
- **Custom Hook** : Logique React réutilisable
- **Error Boundary** : Gestion d'erreur frontend

Cette implémentation est production-ready et suit les meilleures pratiques de développement fullstack moderne.
