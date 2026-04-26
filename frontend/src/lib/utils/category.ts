import type { CategoryKey } from "@/components/AlertSheet/Step1Categories";
import type { AlerteCategory } from "@/lib/types";

/**
 * Mapping entre la `CategoryKey` UI (français/court) et `AlerteCategory` (contrat API).
 * Cf. prompt/TYPES.md §3.2.
 */
export const UI_TO_API_CATEGORY: Record<CategoryKey, AlerteCategory> = {
  sante: "health",
  securite: "security",
  foule: "crowd",
  acces: "access_blocked",
  danger: "fire_danger",
  perdu: "lost_found",
  autre: "other",
};

export const API_TO_UI_CATEGORY: Record<AlerteCategory, CategoryKey> = {
  health: "sante",
  security: "securite",
  crowd: "foule",
  access_blocked: "acces",
  fire_danger: "danger",
  lost_found: "perdu",
  logistics: "acces",
  transport: "acces",
  other: "autre",
};

export function toApiCategory(key: CategoryKey): AlerteCategory {
  return UI_TO_API_CATEGORY[key];
}
