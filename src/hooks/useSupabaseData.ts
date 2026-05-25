import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { AppData, WeightEntry, FeedingEntry, DogProfile, AppSettings } from "@/types";
import {
  getProfile,
  upsertProfile,
  getWeightEntries,
  addWeightEntry as addWeightEntryRemote,
  updateWeightEntry as updateWeightEntryRemote,
  deleteWeightEntry as deleteWeightEntryRemote,
  getFeedingEntries,
  addFeedingEntry as addFeedingEntryRemote,
  signInAnonymously,
} from "@/lib/supabase";

const LOCAL_KEY = "baronne-malia-data";
const CURRENT_VERSION = 2;

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
  selectedReference: "ref03", // AKC/GRCA recommended by default
};

const DEFAULT_DATA: AppData = {
  profile: DEFAULT_PROFILE,
  weightHistory: [],
  feedingHistory: [],
  settings: DEFAULT_SETTINGS,
};

// Real weight data for Baronne Malia
const REAL_WEIGHT_ENTRIES: WeightEntry[] = [
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

function loadLocalData(): AppData {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppData;
      return {
        ...DEFAULT_DATA,
        ...parsed,
        profile: { ...DEFAULT_PROFILE, ...parsed.profile },
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    }
  } catch {
    // corrupted
  }
  return DEFAULT_DATA;
}

function saveLocalData(data: AppData): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save local data:", e);
  }
}

export function useSupabaseData() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // Check if Supabase is configured
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
  const isConfigured =
    SUPABASE_URL.length > 0 &&
    !SUPABASE_URL.includes("YOUR_PROJECT") &&
    !SUPABASE_URL.includes("localhost");

  // Auth on mount
  useEffect(() => {
    if (!isConfigured) {
      setAuthReady(true);
      return;
    }
    signInAnonymously().then(() => setAuthReady(true));
  }, [isConfigured]);

  // Initial load: try Supabase first, fallback to localStorage
  useEffect(() => {
    if (!authReady) return;

    async function load() {
      if (isConfigured) {
        try {
          const [profile, weightEntries, feedingEntries] = await Promise.all([
            getProfile(),
            getWeightEntries(),
            getFeedingEntries(),
          ]);

          const local = loadLocalData();
          const mergedProfile = profile || local.profile;
          const mergedWeights =
            weightEntries.length > 0 ? weightEntries : local.weightHistory;
          const mergedFeedings =
            feedingEntries.length > 0 ? feedingEntries : local.feedingHistory;

          const newData: AppData = {
            profile: mergedProfile,
            weightHistory: mergedWeights,
            feedingHistory: mergedFeedings,
            settings: local.settings,
          };

          setData(newData);
          saveLocalData(newData);
          setIsOnline(true);
          setIsLoaded(true);
          return;
        } catch {
          // Supabase failed, use localStorage
          setIsOnline(false);
        }
      }

      // Fallback to localStorage
      const local = loadLocalData();
      setData(local);
      setIsLoaded(true);
    }

    load();
  }, [authReady, isConfigured]);

  // Persist to localStorage on every change
  useEffect(() => {
    if (isLoaded) {
      saveLocalData(data);
    }
  }, [data, isLoaded]);

  const addWeightEntry = useCallback(
    async (entry: Omit<WeightEntry, "id">) => {
      const newEntry: WeightEntry = { ...entry, id: uuidv4() };

      // Optimistic local update
      setData((prev) => ({
        ...prev,
        weightHistory: [...prev.weightHistory, newEntry].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }));

      // Remote sync
      if (isConfigured && isOnline) {
        try {
          await addWeightEntryRemote(entry);
        } catch (e) {
          console.warn("Failed to sync weight entry:", e);
          setIsOnline(false);
        }
      }

      return newEntry;
    },
    [isConfigured, isOnline]
  );

  const updateWeightEntry = useCallback(
    async (id: string, updates: Partial<WeightEntry>) => {
      setData((prev) => ({
        ...prev,
        weightHistory: prev.weightHistory.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }));

      if (isConfigured && isOnline) {
        try {
          await updateWeightEntryRemote(id, updates);
        } catch (e) {
          console.warn("Failed to sync update:", e);
        }
      }
    },
    [isConfigured, isOnline]
  );

  const deleteWeightEntry = useCallback(
    async (id: string) => {
      setData((prev) => ({
        ...prev,
        weightHistory: prev.weightHistory.filter((e) => e.id !== id),
      }));

      if (isConfigured && isOnline) {
        try {
          await deleteWeightEntryRemote(id);
        } catch (e) {
          console.warn("Failed to sync delete:", e);
        }
      }
    },
    [isConfigured, isOnline]
  );

  const addFeedingEntry = useCallback(
    async (entry: Omit<FeedingEntry, "id">) => {
      const newEntry: FeedingEntry = { ...entry, id: uuidv4() };

      setData((prev) => ({
        ...prev,
        feedingHistory: [...prev.feedingHistory, newEntry].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }));

      if (isConfigured && isOnline) {
        try {
          await addFeedingEntryRemote(entry);
        } catch (e) {
          console.warn("Failed to sync feeding entry:", e);
          setIsOnline(false);
        }
      }

      return newEntry;
    },
    [isConfigured, isOnline]
  );

  const updateProfile = useCallback(
    async (updates: Partial<DogProfile>) => {
      const newProfile = { ...data.profile, ...updates };
      setData((prev) => ({ ...prev, profile: newProfile }));

      if (isConfigured && isOnline) {
        try {
          await upsertProfile(newProfile);
        } catch (e) {
          console.warn("Failed to sync profile:", e);
        }
      }
    },
    [data.profile, isConfigured, isOnline]
  );

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const updateReference = useCallback((referenceId: string) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, selectedReference: referenceId },
    }));
  }, []);

  const exportData = useCallback((): string => {
    const exportObj = {
      ...data,
      exportDate: new Date().toISOString(),
      appVersion: "2.0.0",
    };
    return JSON.stringify(exportObj, null, 2);
  }, [data]);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.profile || !Array.isArray(parsed.weightHistory)) {
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
    const demoData: AppData = {
      ...DEFAULT_DATA,
      weightHistory: REAL_WEIGHT_ENTRIES,
      feedingHistory: [],
    };
    setData(demoData);
  }, []);

  const clearAllData = useCallback(() => {
    setData(DEFAULT_DATA);
    if (isConfigured && isOnline) {
      // Clear remote data is optional - kept for safety
    }
  }, [isConfigured, isOnline]);

  return {
    data,
    isLoaded,
    isOnline,
    isConfigured,
    addWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    addFeedingEntry,
    updateProfile,
    updateSettings,
    updateReference,
    exportData,
    importData,
    resetWithDemoData,
    clearAllData,
  };
}
