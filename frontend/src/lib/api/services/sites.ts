// ─── sitesApi — STUB FONCTIONNEL ────────────────────────────────────────────
//
// Toutes les méthodes sont préservées avec leurs signatures pour que les
// consommateurs (coordinateur/sites/page.tsx, components/MapView.tsx) compilent
// et tournent sans modification, avec UI dégradée :
//   - nearby() / list() retournent vide → cartes et listes affichent "0 site"
//   - show() / create() / update() / destroy() throw une erreur explicite
//     que le consommateur affiche via son try/catch existant
//
// À remplacer par les vrais appels HTTP (cf. backend SiteController) quand le
// service est branché.

import type { LaravelPaginator, Site, SiteType } from "@/lib/types";

export interface NearbyQuery {
  lat: number;
  lng: number;
  radius?: number;
  type?: SiteType | string;
}

export interface CreateSitePayload {
  name: string;
  type: SiteType;
  latitude: number;
  longitude: number;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  is_24_7?: boolean;
  opening_hours?: Record<string, unknown> | null;
  zone_id?: string | null;
}

const STUB_ERROR = new Error("sitesApi : méthode non encore implémentée (stub).");

function emptyPaginator<T>(): LaravelPaginator<T> {
  return {
    current_page: 1,
    data: [],
    first_page_url: null,
    from: null,
    last_page: 1,
    last_page_url: null,
    links: [],
    next_page_url: null,
    path: "",
    per_page: 20,
    prev_page_url: null,
    to: null,
    total: 0,
  };
}

export const sitesApi = {
  /** F2.3 — postes de secours / sites événement à proximité. */
  async nearby(_q: NearbyQuery): Promise<Site[]> {
    return [];
  },

  /** F2.4 — fiche détaillée. */
  async show(_id: string): Promise<Site> {
    throw STUB_ERROR;
  },

  /** Liste paginée (coordinateur). */
  async list(_q?: { type?: string; is_active?: boolean; page?: number }): Promise<LaravelPaginator<Site>> {
    return emptyPaginator<Site>();
  },

  async create(_payload: CreateSitePayload): Promise<Site> {
    throw STUB_ERROR;
  },

  async update(_id: string, _payload: Partial<CreateSitePayload>): Promise<Site> {
    throw STUB_ERROR;
  },

  async destroy(_id: string): Promise<{ message: string }> {
    throw STUB_ERROR;
  },
};
