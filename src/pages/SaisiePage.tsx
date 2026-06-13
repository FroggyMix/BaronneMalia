import { useState } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Scale,
  Utensils,
  Plus,
  Minus,
  CheckCircle,
  ChevronDown,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronUp,
  History,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import type { WeightEntry, FeedingEntry, AppData } from "@/types";

interface SaisiePageProps {
  data: AppData;
  onAddWeight: (entry: Omit<WeightEntry, "id">) => void;
  onAddFeeding: (entry: Omit<FeedingEntry, "id">) => void;
  onUpdateWeight?: (id: string, updates: Partial<WeightEntry>) => void;
  onDeleteWeight?: (id: string) => void;
  onUpdateFeeding?: (id: string, updates: Partial<FeedingEntry>) => void;
  onDeleteFeeding?: (id: string) => void;
  selectedReference?: string;
  onExport?: () => string;
  onImport?: (json: string) => boolean;
  onResetDemo?: () => void;
  onClearAll?: () => void;
  onUpdateReference?: (referenceId: string) => void;
}

type EntryType = "weight" | "feeding";

const FOOD_TYPES = [
  { value: "croquettes", label: "Croquettes" },
  { value: "patée", label: "Pâtée" },
  { value: "mix", label: "Mix croquettes/pâtée" },
  { value: "BARF", label: "BARF (cru)" },
  { value: "maison", label: "Cuisine maison" },
];

const BCS_DESCRIPTIONS: Record<number, string> = {
  1: "Émacié — côtes saillantes, aucune graisse",
  2: "Très maigre — côtes très visibles",
  3: "Maigre — côtes visibles, taille marquée",
  4: "Légèrement maigre — côtes facilement palpables (idéal chiot)",
  5: "Idéal — côtes palpables sous fine couche de graisse",
  6: "Légèrement enveloppé — côtes palpables avec difficulté",
  7: "Surpoids — côtes difficiles à sentir",
  8: "Obèse — côtes impalpables",
  9: "Sévèrement obèse — important dépôt de graisse",
};

const FOOD_LABELS: Record<string, string> = {
  croquettes: "Croquettes",
  "patée": "Pâtée",
  mix: "Mix",
  BARF: "BARF",
  maison: "Maison",
};

export function SaisiePage({
  data,
  onAddWeight,
  onAddFeeding,
  onUpdateWeight,
  onDeleteWeight,
  onUpdateFeeding,
  onDeleteFeeding,
  selectedReference,
  onExport,
  onImport,
  onResetDemo,
  onClearAll,
  onUpdateReference,
}: SaisiePageProps) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [entryType, setEntryType] = useState<EntryType>(
    tabFromUrl === "nourriture" ? "feeding" : "weight"
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWeightHistory, setShowWeightHistory] = useState(true);
  const [showFeedingHistory, setShowFeedingHistory] = useState(true);

  // Weight form state
  const [weightDate, setWeightDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weightKg, setWeightKg] = useState("");
  const [bcs, setBcs] = useState<number>(5);
  const [weightNotes, setWeightNotes] = useState("");

  // Feeding form state
  const [feedingDate, setFeedingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [quantityPerMeal, setQuantityPerMeal] = useState(150);
  const [foodType, setFoodType] = useState("croquettes");
  const [feedingNotes, setFeedingNotes] = useState("");
  const [foodBrand, setFoodBrand] = useState("");
  const [foodCaloriesPer100g, setFoodCaloriesPer100g] = useState(370);

  // Edit state
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
  const [editingFeedingId, setEditingFeedingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editBcs, setEditBcs] = useState(5);
  const [editNotes, setEditNotes] = useState("");
  const [editFeeding, setEditFeeding] = useState<Partial<FeedingEntry>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"weight" | "feeding">("weight");

  const today = format(new Date(), "yyyy-MM-dd");

  const { weightHistory, feedingHistory } = data;
  const sortedWeights = [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedFeedings = [...feedingHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const cardBg = { backgroundColor: "var(--bm-card-bg)" };
  const surfaceBg = { backgroundColor: "var(--bm-surface)" };
  const textPrimary = { color: "var(--bm-charcoal)" };
  const textSecondary = { color: "var(--bm-text-secondary)" };
  const textTertiary = { color: "var(--bm-text-tertiary)" };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightKg);
    if (!w || w <= 0 || w > 80) return;
    onAddWeight({ date: weightDate, weightKg: w, bodyConditionScore: bcs, notes: weightNotes || undefined });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
    setWeightKg("");
    setWeightNotes("");
    setBcs(5);
    setWeightDate(today);
  };

  const handleFeedingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFeeding({
      date: feedingDate,
      mealsPerDay,
      quantityPerMealGrams: quantityPerMeal,
      foodType,
      foodCaloriesPer100g: foodCaloriesPer100g || 370,
      brand: foodBrand || undefined,
      notes: feedingNotes || undefined,
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
    setFeedingNotes("");
    setFoodBrand("");
    setFeedingDate(today);
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weightKg) || 0;
    setWeightKg(Math.max(0.1, Math.min(80, current + delta)).toFixed(1));
  };

  const adjustQuantity = (delta: number) => {
    setQuantityPerMeal((prev) => Math.max(20, Math.min(1000, prev + delta)));
  };

  const startEditWeight = (entry: WeightEntry) => {
    setEditingWeightId(entry.id);
    setEditWeight(entry.weightKg.toString());
    setEditBcs(entry.bodyConditionScore || 5);
    setEditNotes(entry.notes || "");
  };

  const saveEditWeight = (id: string) => {
    const w = parseFloat(editWeight);
    if (w && w > 0 && w < 80 && onUpdateWeight) {
      onUpdateWeight(id, { weightKg: w, bodyConditionScore: editBcs, notes: editNotes || undefined });
    }
    setEditingWeightId(null);
  };

  const startEditFeeding = (entry: FeedingEntry) => {
    setEditingFeedingId(entry.id);
    setEditFeeding({
      mealsPerDay: entry.mealsPerDay,
      quantityPerMealGrams: entry.quantityPerMealGrams,
      foodType: entry.foodType,
      brand: entry.brand || "",
      notes: entry.notes || "",
    });
  };

  const saveEditFeeding = (id: string) => {
    if (onUpdateFeeding && editFeeding.mealsPerDay && editFeeding.quantityPerMealGrams) {
      onUpdateFeeding(id, {
        mealsPerDay: editFeeding.mealsPerDay,
        quantityPerMealGrams: editFeeding.quantityPerMealGrams,
        foodType: editFeeding.foodType,
        brand: (editFeeding.brand as string) || undefined,
        notes: (editFeeding.notes as string) || undefined,
      });
    }
    setEditingFeedingId(null);
    setEditFeeding({});
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      if (deleteType === "weight" && onDeleteWeight) onDeleteWeight(deleteConfirmId);
      else if (deleteType === "feeding" && onDeleteFeeding) onDeleteFeeding(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bm-cream)" }}>
      <Header title="Journal" showBack selectedReference={selectedReference} onExport={onExport} onImport={onImport} onResetDemo={onResetDemo} onClearAll={onClearAll} onUpdateReference={onUpdateReference} />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-5">
        {/* Entry Type Tabs */}
        <div className="rounded-xl p-1 shadow-sm flex" style={{ backgroundColor: "var(--bm-card-bg)" }}>
          {[
            { type: "weight" as EntryType, label: "Poids", icon: Scale },
            { type: "feeding" as EntryType, label: "Repas", icon: Utensils },
          ].map((tab) => (
            <button
              key={tab.type}
              onClick={() => setEntryType(tab.type)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
              style={entryType === tab.type ? { backgroundColor: "var(--bm-gold)", color: "#fff" } : { color: "var(--bm-text-secondary)" }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {entryType === "weight" ? (
            <motion.form
              key="weight-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleWeightSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Date de pesée *</label>
                <input type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} max={today}
                  className="w-full h-12 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Poids (kg) *</label>
                <div className="rounded-xl shadow-sm flex items-center" style={{ backgroundColor: "var(--bm-card-bg)", border: "1px solid var(--bm-border)" }}>
                  <button type="button" onClick={() => adjustWeight(-0.1)} className="p-4 rounded-l-xl transition-colors" style={surfaceBg}><Minus size={20} style={{ color: "var(--bm-gold)" }} /></button>
                  <input type="number" step="0.1" min="0.5" max="80" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="0.0"
                    className="flex-1 h-12 text-center text-2xl font-bold bg-transparent focus:outline-none" style={textPrimary} />
                  <button type="button" onClick={() => adjustWeight(0.1)} className="p-4 rounded-r-xl transition-colors" style={surfaceBg}><Plus size={20} style={{ color: "var(--bm-gold)" }} /></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Score Corpodel (optionnel)</label>
                <div className="rounded-xl shadow-sm p-3" style={{ backgroundColor: "var(--bm-card-bg)", border: "1px solid var(--bm-border)" }}>
                  <div className="flex items-center justify-between gap-1">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((score) => (
                      <button key={score} type="button" onClick={() => setBcs(score)}
                        className="w-7 h-7 rounded-full text-xs font-bold transition-all duration-200"
                        style={bcs === score ? { backgroundColor: "var(--bm-gold)", color: "#fff", transform: "scale(1.1)" }
                          : score >= 4 && score <= 5 ? { backgroundColor: "#D4E0CD", color: "var(--bm-charcoal)" }
                          : { backgroundColor: "var(--bm-surface)", color: "var(--bm-text-secondary)" }}>{score}</button>
                    ))}
                  </div>
                  <p className="text-xs text-center mt-1.5" style={textSecondary}>{BCS_DESCRIPTIONS[bcs]}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Notes (optionnel)</label>
                <textarea value={weightNotes} onChange={(e) => setWeightNotes(e.target.value)} placeholder="Commentaires..." rows={2}
                  className="w-full px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm resize-none"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }} />
              </div>

              <Button type="submit" disabled={!weightKg || parseFloat(weightKg) <= 0}
                className="w-full h-12 font-semibold text-base rounded-xl shadow-md disabled:opacity-50 text-white"
                style={{ backgroundColor: "var(--bm-gold)" }}>
                Enregistrer la pesée
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="feeding-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleFeedingSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Date *</label>
                <input type="date" value={feedingDate} onChange={(e) => setFeedingDate(e.target.value)} max={today}
                  className="w-full h-12 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Repas/jour *</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setMealsPerDay(n)}
                      className="flex-1 h-11 rounded-xl font-semibold text-sm transition-all duration-200"
                      style={mealsPerDay === n ? { backgroundColor: "var(--bm-gold)", color: "#fff" }
                        : { backgroundColor: "var(--bm-card-bg)", color: "var(--bm-text-secondary)", border: "1px solid var(--bm-border)" }}>{n}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Quantité par repas (g) *</label>
                <div className="rounded-xl shadow-sm flex items-center overflow-hidden" style={{ backgroundColor: "var(--bm-card-bg)", border: "1px solid var(--bm-border)" }}>
                  <button type="button" onClick={() => adjustQuantity(-10)} className="px-3 py-3 rounded-l-xl transition-colors flex-shrink-0" style={surfaceBg}><Minus size={20} style={{ color: "var(--bm-gold)" }} /></button>
                  <input type="number" value={quantityPerMeal}
                    onChange={(e) => setQuantityPerMeal(Math.max(20, Math.min(1000, parseInt(e.target.value) || 0)))}
                    className="flex-1 min-w-0 h-12 text-center text-2xl font-bold bg-transparent focus:outline-none" style={textPrimary} />
                  <button type="button" onClick={() => adjustQuantity(10)} className="px-3 py-3 rounded-r-xl transition-colors flex-shrink-0" style={surfaceBg}><Plus size={20} style={{ color: "var(--bm-gold)" }} /></button>
                </div>
                <p className="text-xs mt-1" style={textSecondary}>Total quotidien : {quantityPerMeal * mealsPerDay}g</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Type</label>
                  <div className="relative">
                    <select value={foodType} onChange={(e) => setFoodType(e.target.value)}
                      className="w-full h-12 px-3 pr-8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm appearance-none"
                      style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }}>
                      {FOOD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={textSecondary} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={textSecondary}>kcal / 100g *</label>
                  <input type="number" min={50} max={800} step={5} value={foodCaloriesPer100g}
                    onChange={(e) => setFoodCaloriesPer100g(Math.max(50, Math.min(800, parseInt(e.target.value) || 370)))}
                    className="w-full h-12 px-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm text-center"
                    style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Marque (optionnel)</label>
                <input type="text" value={foodBrand} onChange={(e) => setFoodBrand(e.target.value)} placeholder="Royal Canin, etc."
                  className="w-full h-12 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={textSecondary}>Notes (optionnel)</label>
                <textarea value={feedingNotes} onChange={(e) => setFeedingNotes(e.target.value)} placeholder="Commentaires..." rows={2}
                  className="w-full px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm resize-none"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }} />
              </div>

              <Button type="submit" className="w-full h-12 font-semibold text-base rounded-xl shadow-md text-white"
                style={{ backgroundColor: "var(--bm-gold)" }}>
                Enregistrer le repas
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ===== WEIGHT HISTORY ===== */}
        {weightHistory.length > 0 && (
          <div className="rounded-2xl shadow-md overflow-hidden" style={cardBg}>
            <button onClick={() => setShowWeightHistory(!showWeightHistory)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <History size={16} style={{ color: "var(--bm-gold)" }} />
                <span className="font-semibold text-sm" style={textPrimary}>Historique pesées ({weightHistory.length})</span>
              </div>
              {showWeightHistory ? <ChevronUp size={16} style={textSecondary} /> : <ChevronDown size={16} style={textSecondary} />}
            </button>

            <AnimatePresence>
              {showWeightHistory && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
                    {sortedWeights.map((entry) => (
                      <div key={entry.id} className="rounded-xl p-3" style={{ backgroundColor: "var(--bm-cream)" }}>
                        {editingWeightId === entry.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input type="number" step="0.1" value={editWeight} onChange={(e) => setEditWeight(e.target.value)}
                                className="flex-1 h-9 px-3 rounded-lg text-sm border" style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }} />
                              <input type="number" min="1" max="9" value={editBcs} onChange={(e) => setEditBcs(parseInt(e.target.value) || 5)}
                                className="w-16 h-9 px-2 rounded-lg text-sm border text-center" style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }} />
                            </div>
                            <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes..."
                              className="w-full h-9 px-3 rounded-lg text-sm border" style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }} />
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => setEditingWeightId(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--bm-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><X size={14} /></button>
                              <button onClick={() => saveEditWeight(entry.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#7A8B6E" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><Check size={14} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm" style={textPrimary}>{entry.weightKg.toFixed(1)} kg</span>
                                {entry.bodyConditionScore && <span className="px-1.5 py-0 rounded text-[10px] font-medium" style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}>BCS {entry.bodyConditionScore}</span>}
                              </div>
                              <p className="text-[11px] mt-0.5" style={textTertiary}>
                                {format(new Date(entry.date), "d MMM yyyy", { locale: fr })}
                                {entry.notes && ` — ${entry.notes}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 ml-2">
                              <button onClick={() => startEditWeight(entry)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--bm-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="Modifier"><Pencil size={13} /></button>
                              <button onClick={() => { setDeleteConfirmId(entry.id); setDeleteType("weight"); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#C06B5A" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="Supprimer"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ===== FEEDING HISTORY ===== */}
        {feedingHistory.length > 0 && (
          <div className="rounded-2xl shadow-md overflow-hidden" style={cardBg}>
            <button onClick={() => setShowFeedingHistory(!showFeedingHistory)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Utensils size={16} style={{ color: "var(--bm-gold)" }} />
                <span className="font-semibold text-sm" style={textPrimary}>Historique repas ({feedingHistory.length})</span>
              </div>
              {showFeedingHistory ? <ChevronUp size={16} style={textSecondary} /> : <ChevronDown size={16} style={textSecondary} />}
            </button>

            <AnimatePresence>
              {showFeedingHistory && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
                    {sortedFeedings.map((entry) => (
                      <div key={entry.id} className="rounded-xl p-3" style={{ backgroundColor: "var(--bm-cream)" }}>
                        {editingFeedingId === entry.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px]" style={textTertiary}>Repas/jour</label>
                                <input type="number" min={1} max={6} value={editFeeding.mealsPerDay || 1}
                                  onChange={(e) => setEditFeeding({ ...editFeeding, mealsPerDay: parseInt(e.target.value) || 1 })}
                                  className="w-full h-8 px-2 rounded-lg text-sm border" style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }} />
                              </div>
                              <div>
                                <label className="text-[10px]" style={textTertiary}>Quantité (g)</label>
                                <input type="number" min={10} max={1000} step={10} value={editFeeding.quantityPerMealGrams || 10}
                                  onChange={(e) => setEditFeeding({ ...editFeeding, quantityPerMealGrams: parseInt(e.target.value) || 10 })}
                                  className="w-full h-8 px-2 rounded-lg text-sm border" style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px]" style={textTertiary}>Type</label>
                                <select value={editFeeding.foodType || "croquettes"}
                                  onChange={(e) => setEditFeeding({ ...editFeeding, foodType: e.target.value })}
                                  className="w-full h-8 px-2 rounded-lg text-sm border" style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}>
                                  {FOOD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px]" style={textTertiary}>Marque</label>
                                <input type="text" value={(editFeeding.brand as string) || ""}
                                  onChange={(e) => setEditFeeding({ ...editFeeding, brand: e.target.value })}
                                  className="w-full h-8 px-2 rounded-lg text-sm border" style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => { setEditingFeedingId(null); setEditFeeding({}); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--bm-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><X size={14} /></button>
                              <button onClick={() => saveEditFeeding(entry.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#7A8B6E" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><Check size={14} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm" style={textPrimary}>{entry.mealsPerDay} x {entry.quantityPerMealGrams}g</span>
                                <span className="px-1.5 py-0 rounded text-[10px] font-medium" style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}>{FOOD_LABELS[entry.foodType] || entry.foodType}</span>
                                {entry.foodCaloriesPer100g && (
                                  <span className="px-1.5 py-0 rounded text-[10px] font-medium" style={{ backgroundColor: "#D4E0CD", color: "#7A8B6E" }}>{entry.foodCaloriesPer100g} kcal/100g</span>
                                )}
                              </div>
                              <p className="text-[11px] mt-0.5" style={textTertiary}>
                                {format(new Date(entry.date), "d MMM yyyy", { locale: fr })}
                                {entry.brand && ` — ${entry.brand}`}
                                {entry.notes && ` — ${entry.notes}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 ml-2">
                              <button onClick={() => startEditFeeding(entry)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--bm-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="Modifier"><Pencil size={13} /></button>
                              <button onClick={() => { setDeleteConfirmId(entry.id); setDeleteType("feeding"); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#C06B5A" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="Supprimer"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-0 right-0 px-5 z-50 flex justify-center">
              <div className="bg-[#7A8B6E] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
                <CheckCircle size={20} />
                <span className="font-medium">Saisie enregistrée</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-5"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setDeleteConfirmId(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ backgroundColor: "var(--bm-cream)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-3">
                <Trash2 size={20} style={{ color: "#C06B5A" }} />
                <h3 className="font-bold" style={textPrimary}>Confirmer la suppression</h3>
              </div>
              <p className="text-sm mb-5" style={textSecondary}>Cette action est irréversible.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}>Annuler</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: "#C06B5A" }}>Supprimer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
