export type AlertStatus =
  | "reçue"
  | "en_cours"
  | "mission_assignée"
  | "résolue"
  | "fausse_alerte";

export interface AlerteHistorique {
  id: string;
  reference: string;
  category: string;
  categoryIcon: "sante" | "securite" | "foule" | "acces" | "danger" | "perdu" | "autre";
  date: string;
  dateIso: string;
  status: AlertStatus;
  description: string;
  location: string;
  timeline: { label: string; time: string; done: boolean }[];
}

export const MOCK_ALERTES: AlerteHistorique[] = [
  {
    id: "alerte-1",
    reference: "AL-2026-0001",
    category: "Santé",
    categoryIcon: "sante",
    date: "Aujourd'hui, 14:32",
    dateIso: "2026-04-25T14:32:00Z",
    status: "mission_assignée",
    description: "Personne en malaise à l'entrée principale. Elle ne répond plus.",
    location: "Stade Annexe — Entrée Nord",
    timeline: [
      { label: "Alerte reçue", time: "14:32", done: true },
      { label: "En cours d'examen", time: "14:34", done: true },
      { label: "Mission assignée à un agent", time: "14:36", done: true },
      { label: "Agent en route / sur place", time: "—", done: false },
      { label: "Résolue", time: "—", done: false },
    ],
  },
  {
    id: "alerte-2",
    reference: "AL-2026-0002",
    category: "Foule",
    categoryIcon: "foule",
    date: "Aujourd'hui, 12:18",
    dateIso: "2026-04-25T12:18:00Z",
    status: "résolue",
    description: "Bousculade à l'entrée Est, environ 50 personnes bloquées.",
    location: "Dakar Arena — Entrée Est",
    timeline: [
      { label: "Alerte reçue", time: "12:18", done: true },
      { label: "En cours d'examen", time: "12:19", done: true },
      { label: "Mission assignée à un agent", time: "12:21", done: true },
      { label: "Agent en route / sur place", time: "12:25", done: true },
      { label: "Résolue", time: "12:38", done: true },
    ],
  },
  {
    id: "alerte-3",
    reference: "AL-2026-0003",
    category: "Sécurité",
    categoryIcon: "securite",
    date: "Hier, 20:45",
    dateIso: "2026-04-24T20:45:00Z",
    status: "fausse_alerte",
    description: "Comportement suspect repéré près du parking.",
    location: "Zone Parking Nord",
    timeline: [
      { label: "Alerte reçue", time: "20:45", done: true },
      { label: "En cours d'examen", time: "20:47", done: true },
      { label: "Fausse alerte confirmée", time: "20:51", done: true },
      { label: "Agent en route / sur place", time: "—", done: false },
      { label: "Résolue", time: "—", done: false },
    ],
  },
  {
    id: "alerte-4",
    reference: "AL-2026-0004",
    category: "Accès",
    categoryIcon: "acces",
    date: "Hier, 16:02",
    dateIso: "2026-04-24T16:02:00Z",
    status: "résolue",
    description: "Accès bloqué par un engin de service mal garé.",
    location: "Entrée Technique Ouest",
    timeline: [
      { label: "Alerte reçue", time: "16:02", done: true },
      { label: "En cours d'examen", time: "16:04", done: true },
      { label: "Mission assignée à un agent", time: "16:06", done: true },
      { label: "Agent en route / sur place", time: "16:15", done: true },
      { label: "Résolue", time: "16:22", done: true },
    ],
  },
];

export const STATUS_LABELS: Record<AlertStatus, string> = {
  reçue: "Reçue",
  en_cours: "En cours",
  mission_assignée: "Mission assignée",
  résolue: "Résolue",
  fausse_alerte: "Fausse alerte",
};

export const STATUS_COLORS: Record<AlertStatus, string> = {
  reçue: "bg-blue-50 text-blue-600 border-blue-100",
  en_cours: "bg-orange-50 text-orange-600 border-orange-100",
  mission_assignée: "bg-purple-50 text-purple-600 border-purple-100",
  résolue: "bg-green-50 text-green-600 border-green-100",
  fausse_alerte: "bg-gray-50 text-gray-500 border-gray-100",
};
