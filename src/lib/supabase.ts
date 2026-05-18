import { createClient } from "@supabase/supabase-js";
import type { WeightEntry, FeedingEntry, DogProfile } from "@/types";

// IMPORTANT: Remplacez ces valeurs par celles de votre projet Supabase
// Trouvez-les dans : Supabase Dashboard → Project Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === TABLE: profiles ===
export async function getProfile(): Promise<DogProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .single();
  if (error) {
    console.warn("getProfile:", error.message);
    return null;
  }
  return data ? mapDbProfile(data) : null;
}

export async function upsertProfile(profile: DogProfile): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert(mapProfileToDb(profile), { onConflict: "id" });
  if (error) throw error;
}

// === TABLE: weight_entries ===
export async function getWeightEntries(): Promise<WeightEntry[]> {
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .order("date", { ascending: true });
  if (error) {
    console.warn("getWeightEntries:", error.message);
    return [];
  }
  return (data || []).map(mapDbWeightEntry);
}

export async function addWeightEntry(entry: Omit<WeightEntry, "id">): Promise<WeightEntry> {
  const dbEntry = weightEntryToDb(entry);
  const { data, error } = await supabase
    .from("weight_entries")
    .insert(dbEntry)
    .select()
    .single();
  if (error || !data) throw error || new Error("Insert failed");
  return mapDbWeightEntry(data);
}

export async function updateWeightEntry(id: string, updates: Partial<WeightEntry>): Promise<void> {
  const dbUpdates = weightEntryToDb(updates);
  const { error } = await supabase
    .from("weight_entries")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("weight_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// === TABLE: feeding_entries ===
export async function getFeedingEntries(): Promise<FeedingEntry[]> {
  const { data, error } = await supabase
    .from("feeding_entries")
    .select("*")
    .order("date", { ascending: true });
  if (error) {
    console.warn("getFeedingEntries:", error.message);
    return [];
  }
  return (data || []).map(mapDbFeedingEntry);
}

export async function addFeedingEntry(entry: Omit<FeedingEntry, "id">): Promise<FeedingEntry> {
  const dbEntry = feedingEntryToDb(entry);
  const { data, error } = await supabase
    .from("feeding_entries")
    .insert(dbEntry)
    .select()
    .single();
  if (error || !data) throw error || new Error("Insert failed");
  return mapDbFeedingEntry(data);
}

// === Auth ===
export async function signInAnonymously(): Promise<string | null> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("signInAnonymously:", error.message);
    return null;
  }
  return data.user?.id || null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

// === Mappers: DB <-> App types ===
function mapDbProfile(row: Record<string, unknown>): DogProfile {
  return {
    name: (row.name as string) || "Baronne Malia",
    breed: (row.breed as string) || "Golden Retriever",
    gender: (row.gender as "female" | "male") || "female",
    birthDate: (row.birth_date as string) || "2026-02-02",
    targetAdultWeightKg: (row.target_adult_weight_kg as number) || 27,
    neutered: (row.neutered as boolean) || false,
    activityLevel: (row.activity_level as "sedentary" | "moderate" | "active" | "very_active") || "moderate",
  };
}

function mapProfileToDb(profile: DogProfile): Record<string, unknown> {
  return {
    id: 1,
    name: profile.name,
    breed: profile.breed,
    gender: profile.gender,
    birth_date: profile.birthDate,
    target_adult_weight_kg: profile.targetAdultWeightKg,
    neutered: profile.neutered,
    activity_level: profile.activityLevel,
  };
}

function mapDbWeightEntry(row: Record<string, unknown>): WeightEntry {
  return {
    id: row.id as string,
    date: row.date as string,
    weightKg: row.weight_kg as number,
    bodyConditionScore: row.body_condition_score as number | undefined,
    notes: row.notes as string | undefined,
  };
}

function weightEntryToDb(entry: Partial<WeightEntry>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (entry.date !== undefined) db.date = entry.date;
  if (entry.weightKg !== undefined) db.weight_kg = entry.weightKg;
  if (entry.bodyConditionScore !== undefined) db.body_condition_score = entry.bodyConditionScore;
  if (entry.notes !== undefined) db.notes = entry.notes;
  return db;
}

function mapDbFeedingEntry(row: Record<string, unknown>): FeedingEntry {
  return {
    id: row.id as string,
    date: row.date as string,
    mealsPerDay: row.meals_per_day as number,
    quantityPerMealGrams: row.quantity_per_meal_grams as number,
    foodType: row.food_type as string,
    foodCaloriesPer100g: row.food_calories_per_100g as number | undefined,
    brand: row.brand as string | undefined,
    notes: row.notes as string | undefined,
  };
}

function feedingEntryToDb(entry: Partial<FeedingEntry>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (entry.date !== undefined) db.date = entry.date;
  if (entry.mealsPerDay !== undefined) db.meals_per_day = entry.mealsPerDay;
  if (entry.quantityPerMealGrams !== undefined) db.quantity_per_meal_grams = entry.quantityPerMealGrams;
  if (entry.foodType !== undefined) db.food_type = entry.foodType;
  if (entry.foodCaloriesPer100g !== undefined) db.food_calories_per_100g = entry.foodCaloriesPer100g;
  if (entry.brand !== undefined) db.brand = entry.brand;
  if (entry.notes !== undefined) db.notes = entry.notes;
  return db;
}
