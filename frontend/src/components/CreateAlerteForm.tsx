"use client";

import { useState } from "react";
import { useCreateAlerte } from "@/lib/hooks/useCreateAlerte";
import { CreateAlerteRequest, CreateAlerteResponse, AlerteCategory, ApiError } from "@/lib/types";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

interface CreateAlerteFormProps {
  onSuccess?: (alerte: CreateAlerteResponse["data"]) => void;
  onError?: (error: ApiError) => void;
}

export default function CreateAlerteForm({ onSuccess, onError }: CreateAlerteFormProps) {
  const { mutate, isLoading, error, data, reset } = useCreateAlerte();
  const geo = useGeolocation({ watch: false });

  const [formData, setFormData] = useState<Partial<CreateAlerteRequest>>({
    category: "health",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!geo.latitude || !geo.longitude) {
      alert("Position GPS requise. Veuillez activer la géolocalisation.");
      return;
    }

    const payload: CreateAlerteRequest = {
      category: formData.category as AlerteCategory,
      sub_category: formData.sub_category,
      description: formData.description || undefined,
      photo_media_id: formData.photo_media_id,
      audio_media_id: formData.audio_media_id,
      latitude: geo.latitude,
      longitude: geo.longitude,
      client_fingerprint: navigator.userAgent, // Simple fingerprint
    };

    try {
      const response = await mutate(payload);
      onSuccess?.(response.data);
    } catch (err) {
      onError?.(err as ApiError);
    }
  };

  const handleReset = () => {
    setFormData({ category: "health", description: "" });
    reset();
  };

  if (data?.data) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          ✅ Alerte créée avec succès !
        </h3>
        <p className="text-green-700 mb-4">
          Référence: <strong>{data.data.reference}</strong>
        </p>
        {data.warning && (
          <p className="text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200">
            ⚠️ {data.warning}
          </p>
        )}
        <button
          onClick={handleReset}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Créer une nouvelle alerte
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900">Signaler un incident</h2>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catégorie *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as AlerteCategory }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="health">Santé</option>
          <option value="security">Sécurité</option>
          <option value="crowd">Foule</option>
          <option value="access_blocked">Accès bloqué</option>
          <option value="fire_danger">Danger incendie</option>
          <option value="lost_found">Objets trouvés</option>
          <option value="logistics">Logistique</option>
          <option value="transport">Transport</option>
          <option value="other">Autre</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez l'incident..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Position GPS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position GPS
        </label>
        {geo.loading ? (
          <p className="text-sm text-gray-500">Récupération de la position...</p>
        ) : geo.error ? (
          <p className="text-sm text-red-600">Erreur GPS: {geo.error}</p>
        ) : (
          <p className="text-sm text-gray-600">
            📍 {geo.latitude?.toFixed(6)}, {geo.longitude?.toFixed(6)}
          </p>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium">Erreur lors de la création</p>
          <p className="text-red-700 text-sm mt-1">{error.message}</p>
          {error.errors && (
            <ul className="text-red-700 text-sm mt-2 list-disc list-inside">
              {Object.entries(error.errors).map(([field, messages]) => (
                <li key={field}>{messages.join(", ")}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || geo.loading || !!geo.error}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Création en cours..." : "Signaler l'incident"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
