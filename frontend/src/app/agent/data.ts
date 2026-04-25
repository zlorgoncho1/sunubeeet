export type MissionStatus =
  | "assigned"
  | "accepted"
  | "on_route"
  | "on_site"
  | "completed"
  | "refused";

export interface SuggestedSite {
  id: string;
  name: string;
  type: string;
  distance: string;
  phone: string;
}

export interface Mission {
  id: string;
  incidentId: string;
  incidentTitle: string;
  briefing: string;
  category: string;
  severity: "critique" | "élevé" | "moyen" | "faible";
  location: string;
  lat: number;
  lng: number;
  status: MissionStatus;
  time: string;
  suggestedSites: SuggestedSite[];
  description: string;
}

export const MOCK_MISSIONS: Mission[] = [
  {
    id: "MSN-001",
    incidentId: "INC-8429",
    incidentTitle: "Malaise à l'Entrée Nord",
    briefing:
      "Personne en malaise près de l'entrée principale. Foule autour. Priorité haute. Prévoir défibrillateur si disponible. Itinéraire suggéré : Entrée Est pour éviter la foule.",
    category: "Santé",
    severity: "critique",
    location: "Stade Annexe — Entrée Nord",
    lat: 14.6928,
    lng: -17.4467,
    status: "assigned",
    time: "Il y a 3 min",
    description:
      '"Quelqu\'un est tombé à l\'entrée, il ne répond plus, venez vite."',
    suggestedSites: [
      {
        id: "site-1",
        name: "Hôpital Principal de Dakar",
        type: "Hôpital",
        distance: "812 m",
        phone: "+221 33 839 50 00",
      },
      {
        id: "site-2",
        name: "Poste de Secours Zone Nord",
        type: "Secours",
        distance: "120 m",
        phone: "+221 77 100 00 00",
      },
    ],
  },
];

export const STATUS_LABELS: Record<MissionStatus, string> = {
  assigned: "Mission reçue",
  accepted: "Acceptée",
  on_route: "En route",
  on_site: "Sur place",
  completed: "Terminée",
  refused: "Refusée",
};

export const NEARBY_INCIDENTS = [
  { id: "INC-8430", title: "Bousculade Zone B", severity: "élevé", lat: 14.6935, lng: -17.4455 },
  { id: "INC-8431", title: "Objet abandonné", severity: "moyen", lat: 14.6915, lng: -17.4480 },
];
