export interface DogProfile {
  name: string;
  breed: string;
  gender: "female" | "male";
  birthDate: string;
  targetAdultWeightKg: number;
  neutered: boolean;
  activityLevel: "sedentary" | "moderate" | "active" | "very_active";
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  bodyConditionScore?: number;
  notes?: string;
}

export interface FeedingEntry {
  id: string;
  date: string;
  mealsPerDay: number;
  quantityPerMealGrams: number;
  foodType: string;
  foodCaloriesPer100g?: number;
  brand?: string;
  notes?: string;
}

export interface AppSettings {
  reminderEnabled: boolean;
  reminderDay: string;
  dataVersion: number;
  selectedReference: string; // ID of the growth reference curve
}

export interface AppData {
  profile: DogProfile;
  weightHistory: WeightEntry[];
  feedingHistory: FeedingEntry[];
  settings: AppSettings;
}

export interface GrowthPoint {
  weeks: number;
  minKg: number;
  maxKg: number;
}

export interface NutritionAdvice {
  id: string;
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  category: "growth" | "nutrition" | "health" | "feeding";
  source?: string;
  minAgeWeeks?: number;
  maxAgeWeeks?: number;
}

export type TabRoute = "/" | "/saisie" | "/courbe" | "/conseils";
