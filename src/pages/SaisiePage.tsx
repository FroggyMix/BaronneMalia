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

export function SaisiePage({ data, onAddWeight, onAddFeeding }: SaisiePageProps) {
  const [entryType, setEntryType] = useState<EntryType>("weight");
  const [showSuccess, setShowSuccess] = useState(false);

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

  const today = format(new Date(), "yyyy-MM-dd");

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

    // Reset form
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

    // Reset partially
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
    <div className="min-h-screen bg-[#FAF6F0] pb-24">
      <Header title="Nouvelle saisie" showBack />

      <main className="pt-20 px-5 max-w-lg mx-auto">
        {/* Segmented Control */}
        <div className="bg-white rounded-xl p-1 shadow-sm flex mb-6">
          {[
            { type: "weight" as EntryType, label: "Poids", icon: Scale },
            { type: "feeding" as EntryType, label: "Nourriture", icon: Utensils },
          ].map((tab) => (
            <button
              key={tab.type}
              onClick={() => setEntryType(tab.type)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                entryType === tab.type
                  ? "bg-[#C8956C] text-white shadow-sm"
                  : "text-[rgba(45,42,38,0.5)] hover:text-[rgba(45,42,38,0.7)]"
              }`}
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
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Date de pesée *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    max={today}
                    className="w-full h-14 px-4 bg-white rounded-xl border border-[rgba(45,42,38,0.1)] text-[#2D2A26] text-base focus:outline-none focus:ring-2 focus:ring-[#C8956C] focus:border-transparent shadow-sm"
                  />
                </div>
              </div>

              {/* Weight Input */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Poids (kg) *
                </label>
                <div className="bg-white rounded-xl border border-[rgba(45,42,38,0.1)] shadow-sm flex items-center">
                  <button
                    type="button"
                    onClick={() => adjustWeight(-0.1)}
                    className="p-4 rounded-l-xl hover:bg-[#FAF6F0] transition-colors active:scale-95"
                  >
                    <Minus size={20} className="text-[#C8956C]" />
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="80"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 h-14 text-center text-2xl font-bold text-[#2D2A26] bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustWeight(0.1)}
                    className="p-4 rounded-r-xl hover:bg-[#FAF6F0] transition-colors active:scale-95"
                  >
                    <Plus size={20} className="text-[#C8956C]" />
                  </button>
                </div>
                {weightKg && (parseFloat(weightKg) < 1 || parseFloat(weightKg) > 60) && (
                  <p className="text-xs text-[#C06B5A] mt-1">
                    Vérifiez le poids saisi. Pour un Golden Retriever femelle, attendez-vous à 2-30 kg.
                  </p>
                )}
              </div>

              {/* BCS Selector */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Score Corporel (optionnel)
                </label>
                <div className="bg-white rounded-xl border border-[rgba(45,42,38,0.1)] shadow-sm p-4">
                  <div className="flex items-center justify-between gap-1">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setBcs(score)}
                        className={`w-8 h-8 rounded-full text-sm font-bold transition-all duration-200 ${
                          bcs === score
                            ? "bg-[#C8956C] text-white scale-110 shadow-md"
                            : score >= 4 && score <= 5
                            ? "bg-[#D4E0CD] text-[#2D2A26] hover:bg-[#c5d4bd]"
                            : "bg-[#FAF6F0] text-[rgba(45,42,38,0.5)] hover:bg-[#ebe5dc]"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center mt-2 text-[rgba(45,42,38,0.6)]">
                    {BCS_DESCRIPTIONS[bcs]}
                  </p>
                  <p className="text-xs text-center mt-1 text-[#7A8B6E] font-medium">
                    Idéal pour un chiot Golden Retriever : 4-5/9
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  placeholder="Commentaires sur la pesée..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-[rgba(45,42,38,0.1)] text-[#2D2A26] text-base focus:outline-none focus:ring-2 focus:ring-[#C8956C] focus:border-transparent shadow-sm resize-none"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={!weightKg || parseFloat(weightKg) <= 0}
                className="w-full h-14 bg-[#C8956C] hover:bg-[#A67B5B] text-white font-semibold text-base rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer la pesée
              </Button>

              {/* Recent Entries */}
              {data.weightHistory.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-[rgba(45,42,38,0.6)] mb-3">
                    Dernières pesées
                  </h3>
                  <div className="space-y-2">
                    {[...data.weightHistory]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Scale size={16} className="text-[#C8956C]" />
                            <div>
                              <p className="font-semibold text-[#2D2A26]">{entry.weightKg} kg</p>
                              <p className="text-xs text-[rgba(45,42,38,0.5)]">
                                {format(new Date(entry.date), "d MMM yyyy", { locale: fr })}
                              </p>
                            </div>
                          </div>
                          {entry.bodyConditionScore && (
                            <span className="px-2 py-0.5 bg-[#F0E2D0] rounded-full text-xs font-medium text-[#C8956C]">
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
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={feedingDate}
                  onChange={(e) => setFeedingDate(e.target.value)}
                  max={today}
                  className="w-full h-14 px-4 bg-white rounded-xl border border-[rgba(45,42,38,0.1)] text-[#2D2A26] text-base focus:outline-none focus:ring-2 focus:ring-[#C8956C] focus:border-transparent shadow-sm"
                />
              </div>

              {/* Meals per day */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Nombre de repas/jour *
                </label>
                <div className="flex gap-3">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMealsPerDay(n)}
                      className={`flex-1 h-14 rounded-xl font-semibold text-base transition-all duration-200 ${
                        mealsPerDay === n
                          ? "bg-[#C8956C] text-white shadow-md"
                          : "bg-white text-[rgba(45,42,38,0.6)] border border-[rgba(45,42,38,0.1)] shadow-sm hover:bg-[#FAF6F0]"
                      }`}
                    >
                      {n} repas
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity per meal */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Quantité par repas (g) *
                </label>
                <div className="bg-white rounded-xl border border-[rgba(45,42,38,0.1)] shadow-sm flex items-center">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(-10)}
                    className="p-4 rounded-l-xl hover:bg-[#FAF6F0] transition-colors active:scale-95"
                  >
                    <Minus size={20} className="text-[#C8956C]" />
                  </button>
                  <input
                    type="number"
                    value={quantityPerMeal}
                    onChange={(e) => setQuantityPerMeal(Math.max(20, Math.min(1000, parseInt(e.target.value) || 0)))}
                    className="flex-1 h-14 text-center text-2xl font-bold text-[#2D2A26] bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustQuantity(10)}
                    className="p-4 rounded-r-xl hover:bg-[#FAF6F0] transition-colors active:scale-95"
                  >
                    <Plus size={20} className="text-[#C8956C]" />
                  </button>
                </div>
                <p className="text-xs text-[rgba(45,42,38,0.5)] mt-1">
                  Total quotidien : {quantityPerMeal * mealsPerDay}g
                </p>
              </div>

              {/* Food type */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Type d'alimentation
                </label>
                <div className="relative">
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full h-14 px-4 pr-10 bg-white rounded-xl border border-[rgba(45,42,38,0.1)] text-[#2D2A26] text-base focus:outline-none focus:ring-2 focus:ring-[#C8956C] focus:border-transparent shadow-sm appearance-none"
                  >
                    {FOOD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(45,42,38,0.4)] pointer-events-none"
                  />
                </div>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Marque (optionnel)
                </label>
                <input
                  type="text"
                  value={foodBrand}
                  onChange={(e) => setFoodBrand(e.target.value)}
                  placeholder="Ex: Royal Canin, Hill's..."
                  className="w-full h-14 px-4 bg-white rounded-xl border border-[rgba(45,42,38,0.1)] text-[#2D2A26] text-base focus:outline-none focus:ring-2 focus:ring-[#C8956C] focus:border-transparent shadow-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[rgba(45,42,38,0.7)] mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={feedingNotes}
                  onChange={(e) => setFeedingNotes(e.target.value)}
                  placeholder="Commentaires..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-[rgba(45,42,38,0.1)] text-[#2D2A26] text-base focus:outline-none focus:ring-2 focus:ring-[#C8956C] focus:border-transparent shadow-sm resize-none"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-14 bg-[#C8956C] hover:bg-[#A67B5B] text-white font-semibold text-base rounded-xl shadow-md"
              >
                Enregistrer l'alimentation
              </Button>

              {/* Recent Entries */}
              {data.feedingHistory.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-[rgba(45,42,38,0.6)] mb-3">
                    Dernières saisies
                  </h3>
                  <div className="space-y-2">
                    {[...data.feedingHistory]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Utensils size={16} className="text-[#C8956C]" />
                            <div>
                              <p className="font-semibold text-[#2D2A26]">
                                {entry.mealsPerDay} × {entry.quantityPerMealGrams}g
                              </p>
                              <p className="text-xs text-[rgba(45,42,38,0.5)]">
                                {format(new Date(entry.date), "d MMM yyyy", { locale: fr })} ·{" "}
                                {FOOD_TYPES.find((t) => t.value === entry.foodType)?.label || entry.foodType}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Success Toast */}
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
