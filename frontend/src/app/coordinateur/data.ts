// Types domaine
export type IncidentStatus =
  | "reçue"
  | "validée"
  | "mission_assignée"
  | "en_cours"
  | "résolue"
  | "doublon"
  | "fausse_alerte";

export type IncidentSeverity = "critique" | "élevé" | "moyen" | "faible";
export type IncidentCategory = "santé" | "sécurité" | "foule" | "accès" | "danger" | "perdu" | "autre";
export type AgentStatus = "disponible" | "en_route" | "sur_site" | "hors_ligne";

export interface Incident {
  id: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  location: string;
  coordinates: [number, number]; // [lng, lat]
  time: string;
  source: "qr" | "app";
}

export interface Agent {
  id: string;
  initials: string;
  name: string;
  specialty: string;
  status: AgentStatus;
  coordinates: [number, number];
  battery: number;
  colorBg: string;
  colorText: string;
  zone?: string;
}

export interface Site {
  id: string;
  name: string;
  type: "hôpital" | "poste_secours" | "police" | "pompiers";
  coordinates: [number, number];
  distance: string;
  hours: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-8429",
    category: "santé",
    severity: "critique",
    status: "reçue",
    description:
      "Un spectateur a fait un malaise, il est au sol et respire difficilement. Besoin d'assistance médicale urgente.",
    location: "Entrée Nord (QR-N-04)",
    coordinates: [-17.4575, 14.6925],
    time: "14:32",
    source: "qr",
  },
  {
    id: "INC-8430",
    category: "foule",
    severity: "élevé",
    status: "validée",
    description: "Mouvement de foule dense au niveau de la sortie Ouest, risque de bousculade.",
    location: "Sortie Ouest (QR-S-07)",
    coordinates: [-17.4635, 14.6875],
    time: "14:28",
    source: "app",
  },
  {
    id: "INC-8431",
    category: "sécurité",
    severity: "moyen",
    status: "mission_assignée",
    description: "Individu suspect repéré près des vestiaires, comportement agité.",
    location: "Zone Vestiaires Nord",
    coordinates: [-17.461, 14.694],
    time: "14:15",
    source: "app",
  },
];

export const MOCK_AGENTS: Agent[] = [
  {
    id: "AGT-01",
    initials: "DF",
    name: "Dr. Ousmane Fall",
    specialty: "Santé",
    status: "disponible",
    coordinates: [-17.459, 14.691],
    battery: 80,
    colorBg: "bg-blue-100",
    colorText: "text-blue-600",
  },
  {
    id: "AGT-02",
    initials: "E2",
    name: "Eq. Secours 2",
    specialty: "Secours",
    status: "en_route",
    coordinates: [-17.463, 14.687],
    battery: 65,
    colorBg: "bg-purple-100",
    colorText: "text-purple-600",
  },
  {
    id: "AGT-03",
    initials: "KN",
    name: "Koné Ndiaye",
    specialty: "Sécurité",
    status: "disponible",
    coordinates: [-17.458, 14.689],
    battery: 92,
    colorBg: "bg-emerald-100",
    colorText: "text-emerald-600",
  },
];

export const MOCK_SITES: Site[] = [
  {
    id: "SITE-01",
    name: "Hôpital Diamniadio",
    type: "hôpital",
    coordinates: [-17.455, 14.685],
    distance: "1.2 km",
    hours: "Urgence 24/7",
  },
];

export const QR_STATIONS = [
  { id: "QR-N-04", label: "QR-N-04", coordinates: [-17.457, 14.695] as [number, number] },
  { id: "QR-S-07", label: "QR-S-07", coordinates: [-17.464, 14.684] as [number, number] },
];

// ── Utilitaires ────────────────────────────────────────────────────────────

export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  critique: "#ef4444",
  élevé: "#f97316",
  moyen: "#eab308",
  faible: "#3b82f6",
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  reçue: "Reçue",
  validée: "Validée",
  mission_assignée: "Mission assignée",
  en_cours: "En cours",
  résolue: "Résolue",
  doublon: "Doublon",
  fausse_alerte: "Fausse alerte",
};

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  santé: "Santé",
  sécurité: "Sécurité",
  foule: "Foule",
  accès: "Accès / Logistique",
  danger: "Danger matériel",
  perdu: "Perdu / Trouvé",
  autre: "Autre",
};

export function computeKPIs(incidents: Incident[], agents: Agent[]) {
  const active = incidents.filter((i) => !["résolue", "doublon", "fausse_alerte"].includes(i.status));
  return {
    open: active.length,
    critical: active.filter((i) => i.severity === "critique").length,
    avgTime: "2m 45s",
    availableAgents: agents.filter((a) => a.status === "disponible").length,
    totalAgents: agents.length,
    hotZones: active.filter((i) => i.severity === "critique" || i.severity === "élevé").length,
  };
}
