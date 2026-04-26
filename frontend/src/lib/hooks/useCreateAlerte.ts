import { useState, useCallback } from "react";
import { CreateAlerteRequest, CreateAlerteResponse, ApiError } from "@/lib/types";
import { api } from "@/lib/api/client";

interface UseCreateAlerteState {
  isLoading: boolean;
  error: ApiError | null;
  data: CreateAlerteResponse | null;
}

export const useCreateAlerte = () => {
  const [state, setState] = useState<UseCreateAlerteState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(
    async (data: CreateAlerteRequest) => {
      setState({ isLoading: true, error: null, data: null });

      try {
        const response = await api.post<CreateAlerteResponse>("/alertes", data);
        setState({ isLoading: false, error: null, data: response });

        // Log pour debug
        console.log("Alerte créée avec succès:", response.data.alerte.reference);

        return response;
      } catch (error) {
        const apiError = error as ApiError;
        setState({ isLoading: false, error: apiError, data: null });

        console.error("Erreur lors de la création de l'alerte:", apiError);

        throw apiError;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
    isSuccess: state.data !== null,
    isError: state.error !== null,
  };
};
