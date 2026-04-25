import type {
  AgentPresenceStatus,
  AlerteCategory,
  AlerteStatus,
  IncidentStatus,
  MissionStatus,
  Severity,
  SiteType,
} from "@/lib/types";

export const CATEGORY_LABELS: Record<AlerteCategory, string> = {
  health: "Santé",
  security: "Sécurité",
  crowd: "Foule",
  access_blocked: "Accès bloqué",
  fire_danger: "Incendie / danger",
  lost_found: "Perdu / trouvé",
  logistics: "Logistique",
  transport: "Transport",
  other: "Autre",
};

export const ALERTE_STATUS_LABELS: Record<AlerteStatus, string> = {
  received: "Reçue",
  validated: "Validée",
  duplicate: "Doublon",
  false_alert: "Fausse alerte",
  rejected: "Rejetée",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Ouvert",
  qualified: "Qualifié",
  mission_assigned: "Mission assignée",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Clôturé",
  cancelled: "Annulé",
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  created: "Créée",
  assigned: "Assignée",
  accepted: "Acceptée",
  refused: "Refusée",
  on_route: "En route",
  on_site: "Sur place",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  critical: "Critique",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  low: "#3b82f6",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export const PRESENCE_LABELS: Record<AgentPresenceStatus, string> = {
  available: "Disponible",
  offline: "Hors ligne",
};

export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  police: "Police",
  commissariat: "Commissariat",
  gendarmerie: "Gendarmerie",
  hopital: "Hôpital",
  clinique: "Clinique",
  samu: "SAMU",
  pompiers: "Pompiers",
  protection_civile: "Protection civile",
  point_secours: "Poste de secours",
  evenement_pc: "PC opérationnel",
  depannage: "Dépannage",
  point_eau: "Point d'eau",
  point_repos: "Point de repos",
  site_evenement: "Site d'événement",
  autre: "Autre",
};

export const CATEGORY_ICONS: Record<AlerteCategory, { icon: string; bg: string; text: string }> = {
  health:        { icon: "solar:heart-linear",            bg: "bg-rose-500/20",   text: "text-rose-200" },
  security:      { icon: "solar:shield-warning-linear",   bg: "bg-red-500/20",    text: "text-red-200" },
  crowd:         { icon: "solar:users-group-rounded-linear", bg: "bg-amber-500/20", text: "text-amber-200" },
  access_blocked:{ icon: "solar:routing-linear",          bg: "bg-sky-500/20",    text: "text-sky-200" },
  fire_danger:   { icon: "solar:fire-linear",             bg: "bg-orange-500/20", text: "text-orange-200" },
  lost_found:    { icon: "solar:magnifer-linear",         bg: "bg-violet-500/20", text: "text-violet-200" },
  logistics:     { icon: "solar:box-linear",              bg: "bg-cyan-500/20",   text: "text-cyan-200" },
  transport:     { icon: "solar:bus-linear",              bg: "bg-teal-500/20",   text: "text-teal-200" },
  other:         { icon: "solar:question-circle-linear",  bg: "bg-slate-500/25",  text: "text-slate-200" },
};
