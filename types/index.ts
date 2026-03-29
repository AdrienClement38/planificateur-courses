export type DriveKey = "leclerc" | "carrefour" | "intermarche" | "auchan" | "cora" | "monoprix";

export interface DriveConfig {
  key: DriveKey;
  name: string;
  label: string;
  home: string;
  color: string;
  buildSearchUrl: (query: string) => string;
}

export type MealType = "dinner" | "lunch-dinner" | "all";
export type Period = "1 week" | "2 weeks" | "1 month";

export interface PlannerFormData {
  budget: number;
  persons: number;
  mealType: MealType;
  period: Period;
  drive: DriveKey;
  preferences: string[];
  exclusions: string[];
  cuisineStyle: string;
}

export interface Meal {
  day: string;
  name: string;
  tags: string[];
}

export interface ShoppingItem {
  name: string;
  qty: string;
  unit_price: number;
  total_price: number;
}

export type ShoppingList = Record<string, ShoppingItem[]>;

export interface MealPlan {
  summary: string;
  estimated_total: number;
  meals: Meal[];
  shopping_list: ShoppingList;
}

export interface GenerateRequest {
  formData: PlannerFormData;
}

export interface GenerateResponse {
  plan: MealPlan;
}
