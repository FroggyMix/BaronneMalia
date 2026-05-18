import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { AppData, WeightEntry, FeedingEntry, DogProfile, AppSettings } from "@/types";

const STORAGE_KEY = "baronne-malia-data";
const CURRENT_VERSION = 1;

const DEFAULT_PROFILE: DogProfile = {
  name: "Baronne Malia",
  breed: "Golden Retriever",
  gender: "female",
  birthDate: "2026-02-02",
  targetAdultWeightKg: 27,
  neutered: false,
  activityLevel: "moderate",
};

const DEFAULT_SETTINGS: AppSettings = {
  reminderEnabled: false,
  reminderDay: "sunday",
  dataVersion: CURRENT_VERSION,
};

const DEFAULT_DATA: AppData = {
  profile: DEFAULT_PROFILE,
  weightHistory: [],
  feedingHistory: [],
  settings: DEFAULT_SETTINGS,
};

// Real weight data for Baronne Malia
const DEMO_WEIGHT_ENTRIES: WeightEntry[] = [
  { id: uuidv4(), date: "2026-04-04", weightKg: 3.8, bodyConditionScore: 5, notes: "2 mois et 2 jours" },
  { id: uuidv4(), date: "2026-04-09", weightKg: 4.4, bodyConditionScore: 5, notes: "2 mois et 7 jours" },
  { id: uuidv4(), date: "2026-04-13", weightKg: 4.8, bodyConditionScore: 5, notes: "2 mois et 11 jours" },
  { id: uuidv4(), date: "2026-04-17", weightKg: 5.6, bodyConditionScore: 4, notes: "2 mois et 16 jours" },
  { id: uuidv4(), date: "2026-04-20", weightKg: 5.8, bodyConditionScore: 4, notes: "2 mois et 18 jours" },
  { id: uuidv4(), date: "2026-04-24", weightKg: 6.6, bodyConditionScore: 4, notes: "2 mois et 22 jours" },
  { id: uuidv4(), date: "2026-04-26", weightKg: 7.1, bodyConditionScore: 4, notes: "2 mois et 24 jours" },
  { id: uuidv4(), date: "2026-04-30", weightKg: 7.8, bodyConditionScore: 4, notes: "2 mois et 28 jours" },
  { id: uuidv4(), date: "2026-05-02", weightKg: 8.0, bodyConditionScore: 4, notes: "3 mois" },
  { id: uuidv4(), date: "2026-05-07", weightKg: 8.4, bodyConditionScore: 4, notes: "3 mois et 5 jours" },
];

const DEMO_FEEDING_ENTRIES: FeedingEntry[] = [
  { id: uuidv4(), date: "2026-05-04", mealsPerDay: 3, quantityPerMealGrams: 120, foodType: "croquettes", brand: "Royal Canin Golden Retriever Puppy", notes: "" },
  { id: uuidv4(), date: "2026-05-11", mealsPerDay: 3, quantityPerMealGrams: 140, foodType: "croquettes", brand: "Royal Canin Golden Retriever Puppy", notes: "" },
  { id: uuidv4(), date: "2026-05-18", mealsPerDay: 3, quantityPerMealGrams: 150, foodType: "croquettes", brand: "Royal Canin Golden Retriever Puppy", notes: "" },
];

function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppData;
      // Merge with defaults for any missing fields
      return {
        ...DEFAULT_DATA,
        ...parsed,
        profile: { ...DEFAULT_PROFILE, ...parsed.profile },
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    }
  } catch {
    // Corrupted data, return defaults
  }
  return DEFAULT_DATA;
}

function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (isLoaded) {
      saveData(data);
    }
  }, [data, isLoaded]);

  const addWeightEntry = useCallback((entry: Omit<WeightEntry, "id">) => {
    const newEntry: WeightEntry = { ...entry, id: uuidv4() };
    setData(prev => ({
      ...prev,
      weightHistory: [...prev.weightHistory, newEntry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }));
    return newEntry;
  }, []);

  const updateWeightEntry = useCallback((id: string, updates: Partial<WeightEntry>) => {
    setData(prev => ({
      ...prev,
      weightHistory: prev.weightHistory.map(e => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteWeightEntry = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      weightHistory: prev.weightHistory.filter(e => e.id !== id),
    }));
  }, []);

  const addFeedingEntry = useCallback((entry: Omit<FeedingEntry, "id">) => {
    const newEntry: FeedingEntry = { ...entry, id: uuidv4() };
    setData(prev => ({
      ...prev,
      feedingHistory: [...prev.feedingHistory, newEntry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }));
    return newEntry;
  }, []);

  const updateProfile = useCallback((updates: Partial<DogProfile>) => {
    setData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const exportData = useCallback((): string => {
    const exportObj = {
      ...data,
      exportDate: new Date().toISOString(),
      appVersion: "1.0.0",
    };
    return JSON.stringify(exportObj, null, 2);
  }, [data]);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.profile || !parsed.weightHistory || !parsed.feedingHistory) {
        return false;
      }
      const newData: AppData = {
        profile: { ...DEFAULT_PROFILE, ...parsed.profile },
        weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : [],
        feedingHistory: Array.isArray(parsed.feedingHistory) ? parsed.feedingHistory : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      };
      setData(newData);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetWithDemoData = useCallback(() => {
    setData({
      ...DEFAULT_DATA,
      weightHistory: DEMO_WEIGHT_ENTRIES,
      feedingHistory: DEMO_FEEDING_ENTRIES,
    });
  }, []);

  const clearAllData = useCallback(() => {
    setData(DEFAULT_DATA);
  }, []);

  return {
    data,
    isLoaded,
    addWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    addFeedingEntry,
    updateProfile,
    updateSettings,
    exportData,
    importData,
    resetWithDemoData,
    clearAllData,
  };
}

export { DEFAULT_PROFILE, DEFAULT_SETTINGS, DEMO_WEIGHT_ENTRIES };
