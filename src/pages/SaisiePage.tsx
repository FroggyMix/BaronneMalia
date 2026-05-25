import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Scale, Utensils, Plus, Minus, CheckCircle, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import type { WeightEntry, FeedingEntry, AppData } from "@/types";

interface SaisiePageProps {
  data: AppData;
  onAddWeight: (entry: Omit<WeightEntry, "id">) => void;
  onAddFeeding: (entry: Omit<FeedingEntry, "id">) => void;
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

export function SaisiePage({ data, onAddWeight, onAddFeeding, selectedReference, onExport, onImport, onResetDemo, onClearAll, onUpdateReference }: SaisiePageProps) {
  const [entryType, setEntryType] = useState<EntryType>("weight");
  const [showSuccess, setShowSuccess] = useState(false);

  const [weightDate, setWeightDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weightKg, setWeightKg] = useState("");
  const [bcs, setBcs] = useState<number>(5);
  const [weightNotes, setWeightNotes] = useState("");

  const [feedingDate, setFeedingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [quantityPerMeal, setQuantityPerMeal] = useState(150);
  const [foodType, setFoodType] = useState("croquettes");
  const [feedingNotes, setFeedingNotes] = useState("");
  const [foodBrand] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const cardBg = { backgroundColor: "var(--bm-card-bg)" };
  const surfaceBg = { backgroundColor: "var(--bm-surface)" };
  const textPrimary = { color: "var(--bm-charcoal)" };
  const textSecondary = { color: "var(--bm-text-secondary)" };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightKg);
    if (!w || w <= 0 || w > 80) return;

    onAddWeight({
      date: weightDate,
      weightKg: w,
      bodyConditionScore: bcs,
      notes: weightNotes || undefined,
    });

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
      brand: foodBrand || undefined,
      notes: feedingNotes || undefined,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
    setFeedingNotes("");
    setFeedingDate(today);
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weightKg) || 0;
    const newVal = Math.max(0.1, Math.min(80, current + delta));
    setWeightKg(newVal.toFixed(1));
  };

  const adjustQuantity = (delta: number) => {
    setQuantityPerMeal((prev) => Math.max(20, Math.min(1000, prev + delta)));
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bm-cream)" }}>
      <Header title="Nouvelle saisie" showBack selectedReference={selectedReference} onExport={onExport} onImport={onImport} onResetDemo={onResetDemo} onClearAll={onClearAll} onUpdateReference={onUpdateReference} />

      <main className="pt-20 px-5 max-w-lg mx-auto">
        <div className="rounded-xl p-1 shadow-sm flex mb-6" style={{ backgroundColor: "var(--bm-card-bg)" }}>
          {[
            { type: "weight" as EntryType, label: "Poids", icon: Scale },
            { type: "feeding" as EntryType, label: "Nourriture", icon: Utensils },
          ].map((tab) => (
            <button
              key={tab.type}
              onClick={() => setEntryType(tab.type)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                entryType === tab.type
                  ? "text-white shadow-sm"
                  : "hover:opacity-80"
              }`}
              style={
                entryType === tab.type
                  ? { backgroundColor: "var(--bm-gold)", color: "#fff" }
                  : { color: "var(--bm-text-secondary)" }
              }
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
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Date de pesée *</label>
                <input
                  type="date"
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  max={today}
                  className="w-full h-14 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Poids (kg) *</label>
                <div className="rounded-xl shadow-sm flex items-center" style={{ backgroundColor: "var(--bm-card-bg)", border: "1px solid var(--bm-border)" }}>
                  <button type="button" onClick={() => adjustWeight(-0.1)} className="p-4 rounded-l-xl transition-colors" style={surfaceBg}>
                    <Minus size={20} style={{ color: "var(--bm-gold)" }} />
                  </button>
                  <input
                    type="number" step="0.1" min="0.5" max="80"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 h-14 text-center text-2xl font-bold bg-transparent focus:outline-none"
                    style={textPrimary}
                  />
                  <button type="button" onClick={() => adjustWeight(0.1)} className="p-4 rounded-r-xl transition-colors" style={surfaceBg}>
                    <Plus size={20} style={{ color: "var(--bm-gold)" }} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Score Corporel (optionnel)</label>
                <div className="rounded-xl shadow-sm p-4" style={{ backgroundColor: "var(--bm-card-bg)", border: "1px solid var(--bm-border)" }}>
                  <div className="flex items-center justify-between gap-1">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setBcs(score)}
                        className="w-8 h-8 rounded-full text-sm font-bold transition-all duration-200"
                        style={
                          bcs === score
                            ? { backgroundColor: "var(--bm-gold)", color: "#fff", transform: "scale(1.1)" }
                            : score >= 4 && score <= 5
                            ? { backgroundColor: "#D4E0CD", color: "var(--bm-charcoal)" }
                            : { backgroundColor: "var(--bm-surface)", color: "var(--bm-text-secondary)" }
                        }
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center mt-2" style={textSecondary}>{BCS_DESCRIPTIONS[bcs]}</p>
                  <p className="text-xs text-center mt-1 font-medium" style={{ color: "#7A8B6E" }}>Idéal pour un chiot Golden Retriever : 4-5/9</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Notes (optionnel)</label>
                <textarea
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  placeholder="Commentaires sur la pesée..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm resize-none"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }}
                />
              </div>

              <Button
                type="submit"
                disabled={!weightKg || parseFloat(weightKg) <= 0}
                className="w-full h-14 font-semibold text-base rounded-xl shadow-md disabled:opacity-50 text-white"
                style={{ backgroundColor: "var(--bm-gold)" }}
              >
                Enregistrer la pesée
              </Button>

              {data.weightHistory.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-3" style={textSecondary}>Dernières pesées</h3>
                  <div className="space-y-2">
                    {[...data.weightHistory]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between rounded-xl p-3 shadow-sm" style={cardBg}>
                          <div className="flex items-center gap-3">
                            <Scale size={16} style={{ color: "var(--bm-gold)" }} />
                            <div>
                              <p className="font-semibold" style={textPrimary}>{entry.weightKg} kg</p>
                              <p className="text-xs" style={textSecondary}>
                                {format(new Date(entry.date), "d MMM yyyy", { locale: fr })}
                              </p>
                            </div>
                          </div>
                          {entry.bodyConditionScore && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}>
                              BCS {entry.bodyConditionScore}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.form>
          ) : (
            <motion.form
              key="feeding-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleFeedingSubmit}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Date *</label>
                <input type="date" value={feedingDate} onChange={(e) => setFeedingDate(e.target.value)} max={today}
                  className="w-full h-14 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm"
                  style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Nombre de repas/jour *</label>
                <div className="flex gap-3">
                  {[2, 3, 4].map((n) => (
                    <button key={n} type="button" onClick={() => setMealsPerDay(n)}
                      className="flex-1 h-14 rounded-xl font-semibold text-base transition-all duration-200"
                      style={mealsPerDay === n
                        ? { backgroundColor: "var(--bm-gold)", color: "#fff" }
                        : { backgroundColor: "var(--bm-card-bg)", color: "var(--bm-text-secondary)", border: "1px solid var(--bm-border)" }
                      }
                    >{n} repas</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Quantité par repas (g) *</label>
                <div className="rounded-xl shadow-sm flex items-center" style={{ backgroundColor: "var(--bm-card-bg)", border: "1px solid var(--bm-border)" }}>
                  <button type="button" onClick={() => adjustQuantity(-10)} className="p-4 rounded-l-xl transition-colors" style={surfaceBg}>
                    <Minus size={20} style={{ color: "var(--bm-gold)" }} />
                  </button>
                  <input type="number" value={quantityPerMeal}
                    onChange={(e) => setQuantityPerMeal(Math.max(20, Math.min(1000, parseInt(e.target.value) || 0)))}
                    className="flex-1 h-14 text-center text-2xl font-bold bg-transparent focus:outline-none"
                    style={textPrimary}
                  />
                  <button type="button" onClick={() => adjustQuantity(10)} className="p-4 rounded-r-xl transition-colors" style={surfaceBg}>
                    <Plus size={20} style={{ color: "var(--bm-gold)" }} />
                  </button>
                </div>
                <p className="text-xs mt-1" style={textSecondary}>Total quotidien : {quantityPerMeal * mealsPerDay}g</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={textSecondary}>Type d'alimentation</label>
                <div className="relative">
                  <select value={foodType} onChange={(e) => setFoodType(e.target.value)}
                    className="w-full h-14 px-4 pr-10 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--bm-gold)] shadow-sm appearance-none"
                    style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", border: "1px solid var(--bm-border)" }}
                  >
                    {FOOD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--bm-text-secondary)" }} />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 font-semibold text-base rounded-xl shadow-md text-white"
                style={{ backgroundColor: "var(--bm-gold)" }}>
                Enregistrer l'alimentation
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-0 right-0 px-5 z-50 flex justify-center"
            >
              <div className="bg-[#7A8B6E] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
                <CheckCircle size={20} />
                <span className="font-medium">Saisie enregistrée</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
