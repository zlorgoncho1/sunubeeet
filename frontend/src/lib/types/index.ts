// ── Enums (alignés sur prompt/TYPES.md) ────────────────────────────────

export type UserRole =
  | "spectator"
  | "agent"
  | "coordinator"
  | "admin"
  | "super_admin";

export type AlerteCategory =
  | "health"
  | "security"
  | "crowd"
  | "access_blocked"
  | "fire_danger"
  | "lost_found"
  | "logistics"
  | "transport"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";
export type Priority = "p1" | "p2" | "p3" | "p4";

export type AlerteStatus =
  | "received"
  | "validated"
  | "duplicate"
  | "false_alert"
  | "rejected";

export type IncidentStatus =
  | "open"
  | "qualified"
  | "mission_assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";

export type MissionStatus =
  | "created"
  | "assigned"
  | "accepted"
  | "refused"
  | "on_route"
  | "on_site"
  | "completed"
  | "cancelled";

export type AgentPresenceStatus = "available" | "offline";

export type SiteType =
  | "police"
  | "commissariat"
  | "gendarmerie"
  | "hopital"
  | "clinique"
  | "samu"
  | "pompiers"
  | "protection_civile"
  | "point_secours"
  | "evenement_pc"
  | "depannage"
  | "point_eau"
  | "point_repos"
  | "site_evenement"
  | "autre";

export type TeamType =
  | "health"
  | "security"
  | "logistics"
  | "volunteer"
  | "fire_rescue"
  | "communication";

export type MediaKind = "photo" | "audio" | "document";
export type MediaProcessingStatus = "pending" | "processing" | "ready" | "failed";

// ── Sub-category JSONB ────────────────────────────────────────────────

export interface SubCategory {
  type?: string;
  details?: Record<string, unknown>;
  tags?: string[];
}

// ── Coordonnées GPS ────────────────────────────────────────────────────

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// ── Entités ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  fullname: string;
  phone: string;
  phone_verified_at: string | null;
  role: UserRole;
  team_id: string | null;
  zone_id: string | null;
  is_active: boolean;
  created_by: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  token: string;
  location_label: string;
  latitude: number;
  longitude: number;
  zone_id: string | null;
  site_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
}

export interface MediaFile {
  id: string;
  kind: MediaKind;
  object_key: string;
  mime_type: string | null;
  size_bytes: number | null;
  duration_ms: number | null;
  blur_processing_status: MediaProcessingStatus;
  url?: string | null;
  signed_url_expires_at?: string | null;
  created_at: string;
}

export interface Alerte {
  id: string;
  reference: string;
  source: "qr" | "app";
  qr_code_id: string | null;
  user_id: string | null;
  category: AlerteCategory;
  sub_category: SubCategory | null;
  description: string | null;
  latitude: number;
  longitude: number;
  status: AlerteStatus;
  is_potential_duplicate: boolean;
  duplicate_of_alerte_id: string | null;
  incident_id: string | null;
  media_files?: MediaFile[];
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  reference: string;
  category: AlerteCategory;
  sub_category: SubCategory | null;
  severity: Severity;
  priority: Priority;
  status: IncidentStatus;
  title: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  zone_id: string | null;
  alertes_count: number;
  created_by: string | null;
  qualified_by: string | null;
  qualified_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MissionServiceInfo {
  id: string;
  mission_id: string;
  site_id: string;
  site?: Site;
  reason: string | null;
  added_by: string;
  created_at: string;
}

export interface Mission {
  id: string;
  reference: string;
  incident_id: string;
  agent_id: string;
  agent?: Pick<User, "id" | "fullname" | "phone"> | null;
  status: MissionStatus;
  briefing: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  refused_reason: string | null;
  on_route_at: string | null;
  on_site_at: string | null;
  completed_at: string | null;
  outcome: string | null;
  note: string | null;
  service_infos?: MissionServiceInfo[];
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  name: string;
  type: SiteType;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  hours: string | null;
  description: string | null;
  is_active: boolean;
  distance_meters?: number;
  created_at: string;
  updated_at: string;
}

export interface AgentPresence {
  id: string;
  user_id: string;
  status: AgentPresenceStatus;
  latitude: number | null;
  longitude: number | null;
  last_ping_at: string;
  battery_level: number | null;
}

export interface TrackingEvent {
  id: number;
  action: string;
  alerte_id: string | null;
  incident_id: string | null;
  mission_id: string | null;
  user_id: string | null;
  payload: Record<string, unknown> | null;
  occurred_at: string;
}

// ── Création d'alerte (POST /alertes — F2 App, et POST /qr/alertes — F1) ─
//
// Aligné sur prompt/TYPES.md §26.1 (request) + §25.2 (response envelope).
// La réponse partage la même forme entre F1 et F2 ; les champs `tracking_token`
// et `tracking_expires_at` ne sont remplis que pour le flow QR (F1).

export interface CreateAlerteRequest {
  category: AlerteCategory;
  sub_category?: SubCategory | null;
  description?: string | null;
  photo_media_id?: string | null;
  audio_media_id?: string | null;
  /** Position GPS du device (F2) ou héritée du QR token côté serveur (F1, optionnel ici). */
  latitude: number;
  longitude: number;
  /** Optionnel — token QR si l'alerte est créée depuis un scan en complément du JWT. */
  qr_token?: string | null;
  /** Optionnel — fingerprint client pour anti-spam complémentaire. */
  client_fingerprint?: string;
}

export interface CreateAlerteResponse {
  data: {
    alerte: Pick<
      Alerte,
      | "id"
      | "reference"
      | "status"
      | "is_potential_duplicate"
      | "category"
      | "latitude"
      | "longitude"
      | "created_at"
      | "duplicate_of_alerte_id"
    >;
    /** F1 uniquement — token de suivi anonyme par téléphone. */
    tracking_token?: string;
    tracking_expires_at?: string;
    /** Présent si is_potential_duplicate=true — message à afficher au spectateur. */
    warning?: string;
  };
}

// ── API envelope ──────────────────────────────────────────────────────

export interface ApiPaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface ApiPaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiPaginationMeta | Record<string, unknown>;
  links?: ApiPaginationLinks;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  status: number;
}

// ── Auth payloads (alignés sur LoginController.tokenResponse) ─────────

export interface AuthTokens {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export type AuthUser = Pick<User, "id" | "fullname" | "phone" | "role" | "team_id" | "zone_id">;

export interface LoginResponse extends AuthTokens {
  must_change_password: boolean;
  user: AuthUser;
}

// ── QR session ────────────────────────────────────────────────────────

export interface QrScanResponse {
  qr_id: string;
  location: {
    label: string;
    latitude: number;
    longitude: number;
  };
  scan_session_token: string;
  /** Compteur (nombre d'alertes actives à proximité). */
  active_alerts_nearby: number;
}

// ── Pagination Laravel ────────────────────────────────────────────────

export interface LaravelPaginator<T> {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────

export interface DashboardKPIs {
  open_incidents: number;
  critical_incidents: number;
  available_agents: number;
  total_agents: number;
  hot_zones: number;
  avg_response_time_seconds: number;
}

// ── KPIs front (pour l'UI) ───────────────────────────────────────────

export interface IncidentTimelineEntry {
  label: string;
  occurred_at: string | null;
  done: boolean;
  action: string;
}
