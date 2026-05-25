import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bone,
  Utensils,
  Heart,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  CircleDot,
  BookOpenCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { getAdviceForAge, getAdviceByCategory } from "@/data/nutritionAdvice";
import { getWeightStatus, getAgeInWeeks, getFeedingRecommendation } from "@/utils/calculations";
import type { AppData, NutritionAdvice } from "@/types";

interface ConseilsPageProps {
  data: AppData;
  selectedReference?: string;
  onExport?: () => string;
  onImport?: (json: string) => boolean;
  onResetDemo?: () => void;
  onClearAll?: () => void;
  onUpdateReference?: (referenceId: string) => void;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  growth: { icon: Bone, label: "Croissance", color: "#C8956C", bg: "#F0E2D0" },
  nutrition: { icon: Utensils, label: "Alimentation", color: "#7A8B6E", bg: "#D4E0CD" },
  health: { icon: Heart, label: "Santé", color: "#C06B5A", bg: "#E8D0CA" },
  feeding: { icon: BookOpen, label: "Conduite alimentaire", color: "#6B8FA3", bg: "#d0dce2" },
};

const PRIORITY_CONFIG = {
  high: { label: "Important", color: "#C06B5A", bg: "#E8D0CA" },
  medium: { label: "Recommandé", color: "#C8956C", bg: "#F0E2D0" },
  low: { label: "À savoir", color: "#6B8FA3", bg: "#d0dce2" },
};

export function ConseilsPage({ data, selectedReference, onExport, onImport, onResetDemo, onClearAll, onUpdateReference }: ConseilsPageProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    personalized: true,
  });
  const [expandedAdvice, setExpandedAdvice] = useState<Record<string, boolean>>({});

  const { profile, weightHistory } = data;
  const ageWeeks = getAgeInWeeks(profile.birthDate);
  const currentWeight = weightHistory.length > 0
    ? [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weightKg
    : 0;
  const weightStatus = getWeightStatus(currentWeight, ageWeeks);
  const feedingRec = currentWeight > 0
    ? getFeedingRecommendation(currentWeight, ageWeeks, profile.neutered, profile.activityLevel, weightHistory, profile.birthDate)
    : null;

  const personalizedAdvice = useMemo(() => {
    if (currentWeight === 0) return [];
    return getAdviceForAge(ageWeeks, currentWeight, weightStatus);
  }, [ageWeeks, currentWeight, weightStatus]);

  const categoryAdvice = useMemo(() => getAdviceByCategory(), []);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleAdvice = (id: string) => {
    setExpandedAdvice((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cardBg = { backgroundColor: "var(--bm-card-bg)" };
  const textPrimary = { color: "var(--bm-charcoal)" };
  const textSecondary = { color: "var(--bm-text-secondary)" };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bm-cream)" }}>
      <Header title="Conseils & Nutrition" showBack selectedReference={selectedReference} onExport={onExport} onImport={onImport} onResetDemo={onResetDemo} onClearAll={onClearAll} onUpdateReference={onUpdateReference} />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-4">
        {currentWeight > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 shadow-md"
            style={{ backgroundColor: "var(--bm-pale-gold)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target size={20} style={{ color: "var(--bm-gold)" }} />
              <h2 className="font-bold" style={textPrimary}>Recommandation personnalisée</h2>
            </div>

            <div className="flex items-center gap-2 mb-3 text-sm" style={textSecondary}>
              <span>Basé sur : {ageWeeks} semaines · {currentWeight} kg</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: weightStatus === "ideal" ? "#D4E0CD" : weightStatus === "underweight" ? "var(--bm-pale-gold)" : "#E8D0CA",
                  color: weightStatus === "ideal" ? "#7A8B6E" : weightStatus === "underweight" ? "var(--bm-gold)" : "#C06B5A",
                }}
              >
                {weightStatus === "ideal" ? "✓ Poids idéal" : weightStatus === "underweight" ? "Sous-poids" : "Surpoids"}
              </span>
            </div>

            {feedingRec && (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: "var(--bm-gold)" }}>{feedingRec.dailyKcal}</span>
                  <span className="text-sm" style={textSecondary}>kcal/jour</span>
                </div>
                <p className="text-sm" style={textSecondary}>
                  {feedingRec.mealsPerDay} repas de ~{feedingRec.kcalPerMeal} kcal (≈ {feedingRec.cupsEstimate} tasses)
                </p>
                {feedingRec.warning && (
                  <div className="mt-2 p-2.5 rounded-lg flex items-start gap-2" style={{ backgroundColor: "#E8D0CA" }}>
                    <AlertTriangle size={14} className="text-[#C06B5A] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#C06B5A]">{feedingRec.warning}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs leading-relaxed" style={textSecondary}>
                <strong className="text-[#C06B5A]">⚠️ Ne pas sur-nourrir !</strong> Les Golden Retrievers
                sont génétiquement prédisposés à l'obésité (gène DENND1B, étude 2025). Utilisez le BCS
                et la courbe de poids, jamais les signaux de "faim" de votre chien.
              </p>
            </div>
          </motion.div>
        )}

        {personalizedAdvice.length > 0 && (
          <div className="rounded-2xl shadow-sm overflow-hidden" style={cardBg}>
            <button onClick={() => toggleCategory("personalized")}
              className="w-full flex items-center justify-between p-4 transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div className="flex items-center gap-3">
                <CircleDot size={20} style={{ color: "var(--bm-gold)" }} />
                <span className="font-semibold" style={textPrimary}>Conseils personnalisés</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}>
                  {personalizedAdvice.length}
                </span>
              </div>
              {expandedCategories.personalized ? <ChevronUp size={18} style={{ color: "var(--bm-text-secondary)" }} /> : <ChevronDown size={18} style={{ color: "var(--bm-text-secondary)" }} />}
            </button>

            <AnimatePresence>
              {expandedCategories.personalized && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-2">
                    {personalizedAdvice.slice(0, 5).map((advice) => (
                      <AdviceCard key={advice.id} advice={advice} expanded={!!expandedAdvice[advice.id]} onToggle={() => toggleAdvice(advice.id)} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {Object.entries(categoryAdvice).map(([category, adviceList]) => {
          const config = CATEGORY_CONFIG[category];
          if (!config || adviceList.length === 0) return null;
          const Icon = config.icon;

          return (
            <div key={category} className="rounded-2xl shadow-sm overflow-hidden" style={cardBg}>
              <button onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bg }}>
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <span className="font-semibold" style={textPrimary}>{config.label}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: config.bg, color: config.color }}>
                    {adviceList.length}
                  </span>
                </div>
                {expandedCategories[category] ? <ChevronUp size={18} style={{ color: "var(--bm-text-secondary)" }} /> : <ChevronDown size={18} style={{ color: "var(--bm-text-secondary)" }} />}
              </button>

              <AnimatePresence>
                {expandedCategories[category] && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2">
                      {adviceList.map((advice) => (
                        <AdviceCard key={advice.id} advice={advice} expanded={!!expandedAdvice[advice.id]} onToggle={() => toggleAdvice(advice.id)} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-5 shadow-sm" style={cardBg}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpenCheck size={18} style={{ color: "#6B8FA3" }} />
            <h3 className="font-semibold" style={textPrimary}>Sources scientifiques</h3>
          </div>
          <ul className="space-y-2">
            {[
              "FEDIAF Nutritional Guidelines 2024",
              "NRC Nutrient Requirements of Dogs and Cats (2006)",
              "Waltham Centre for Pet Nutrition",
              "AAFCO Nutrient Profiles",
              "AAHA Nutrition & Weight Management Guidelines (2021)",
              "Morris Animal Foundation — Golden Retriever Lifetime Study (2025)",
              "Hawthorne et al. — Body-weight changes during growth (J. Nutr. 2004)",
              "Raffan et al. — DENND1B and obesity in dogs (Science 2025)",
            ].map((source, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#6B8FA3" }} />
                <span className="text-xs" style={{ color: "var(--bm-text-secondary)" }}>{source}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="text-xs text-center pb-4" style={{ color: "var(--bm-text-tertiary)" }}>
          Ces recommandations sont fournies à titre informatif et ne remplacent pas les conseils
          vétérinaires personnalisés. Consultez toujours votre vétérinaire pour des décisions de santé.
        </p>
      </main>
    </div>
  );
}

function AdviceCard({ advice, expanded, onToggle }: { advice: NutritionAdvice; expanded: boolean; onToggle: () => void }) {
  const priority = PRIORITY_CONFIG[advice.priority];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--bm-border)" }}>
      <button onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 transition-colors text-left"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" style={{ color: "var(--bm-charcoal)" }}>{advice.title}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0" style={{ backgroundColor: priority.bg, color: priority.color }}>
              {priority.label}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--bm-text-secondary)" }} /> : <ChevronDown size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--bm-text-secondary)" }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-1">
              <div className="rounded-lg p-3" style={{ backgroundColor: "var(--bm-surface)" }}>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--bm-text-secondary)" }}>{advice.content}</p>
                {advice.source && (
                  <p className="text-xs mt-2 italic" style={{ color: "var(--bm-text-tertiary)" }}>Source : {advice.source}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
