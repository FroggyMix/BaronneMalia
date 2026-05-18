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

export function ConseilsPage({ data }: ConseilsPageProps) {
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
    ? getFeedingRecommendation(currentWeight, ageWeeks, profile.neutered, profile.activityLevel, weightHistory)
    : null;

  // Personalized advice
  const personalizedAdvice = useMemo(() => {
    if (currentWeight === 0) return [];
    return getAdviceForAge(ageWeeks, currentWeight, weightStatus);
  }, [ageWeeks, currentWeight, weightStatus]);

  // Category advice
  const categoryAdvice = useMemo(() => getAdviceByCategory(), []);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleAdvice = (id: string) => {
    setExpandedAdvice((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24">
      <Header title="Conseils & Nutrition" showBack />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-4">
        {/* Personalized Recommendation Hero */}
        {currentWeight > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#F0E2D0] rounded-2xl p-5 shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target size={20} className="text-[#C8956C]" />
              <h2 className="font-bold text-[#2D2A26]">Recommandation personnalisée</h2>
            </div>

            <div className="flex items-center gap-2 mb-3 text-sm text-[rgba(45,42,38,0.7)]">
              <span>Basé sur : {ageWeeks} semaines · {currentWeight} kg</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: weightStatus === "ideal" ? "#D4E0CD" : weightStatus === "underweight" ? "#F0E2D0" : "#E8D0CA",
                  color: weightStatus === "ideal" ? "#7A8B6E" : weightStatus === "underweight" ? "#C8956C" : "#C06B5A",
                }}
              >
                {weightStatus === "ideal" ? "✓ Poids idéal" : weightStatus === "underweight" ? "Sous-poids" : "Surpoids"}
              </span>
            </div>

            {feedingRec && (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#C8956C]">{feedingRec.dailyKcal}</span>
                  <span className="text-sm text-[rgba(45,42,38,0.7)]">kcal/jour</span>
                </div>
                <p className="text-sm text-[rgba(45,42,38,0.7)]">
                  {feedingRec.mealsPerDay} repas de ~{feedingRec.kcalPerMeal} kcal
                  {" "}(≈ {feedingRec.cupsEstimate} tasses)
                </p>
                {feedingRec.warning && (
                  <div className="mt-2 p-2.5 bg-[#E8D0CA] rounded-lg flex items-start gap-2">
                    <AlertTriangle size={14} className="text-[#C06B5A] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#C06B5A]">{feedingRec.warning}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 p-2.5 bg-white/60 rounded-lg">
              <p className="text-xs text-[rgba(45,42,38,0.7)] leading-relaxed">
                <strong className="text-[#C06B5A]">⚠️ Ne pas sur-nourrir !</strong> Les Golden Retrievers
                sont génétiquement prédisposés à l'obésité (gène DENND1B, étude 2025). Utilisez le BCS
                et la courbe de poids, jamais les signaux de "faim" de votre chien.
              </p>
            </div>
          </motion.div>
        )}

        {/* Personalized advice list */}
        {personalizedAdvice.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleCategory("personalized")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#FAF6F0] transition-colors"
            >
              <div className="flex items-center gap-3">
                <CircleDot size={20} className="text-[#C8956C]" />
                <span className="font-semibold text-[#2D2A26]">Conseils personnalisés</span>
                <span className="px-2 py-0.5 bg-[#F0E2D0] rounded-full text-xs font-medium text-[#C8956C]">
                  {personalizedAdvice.length}
                </span>
              </div>
              {expandedCategories.personalized ? (
                <ChevronUp size={18} className="text-[rgba(45,42,38,0.4)]" />
              ) : (
                <ChevronDown size={18} className="text-[rgba(45,42,38,0.4)]" />
              )}
            </button>

            <AnimatePresence>
              {expandedCategories.personalized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {personalizedAdvice.slice(0, 5).map((advice) => (
                      <AdviceCard
                        key={advice.id}
                        advice={advice}
                        expanded={!!expandedAdvice[advice.id]}
                        onToggle={() => toggleAdvice(advice.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Category sections */}
        {Object.entries(categoryAdvice).map(([category, adviceList]) => {
          const config = CATEGORY_CONFIG[category];
          if (!config || adviceList.length === 0) return null;
          const Icon = config.icon;

          return (
            <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#FAF6F0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <span className="font-semibold text-[#2D2A26]">{config.label}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: config.bg, color: config.color }}
                  >
                    {adviceList.length}
                  </span>
                </div>
                {expandedCategories[category] ? (
                  <ChevronUp size={18} className="text-[rgba(45,42,38,0.4)]" />
                ) : (
                  <ChevronDown size={18} className="text-[rgba(45,42,38,0.4)]" />
                )}
              </button>

              <AnimatePresence>
                {expandedCategories[category] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {adviceList.map((advice) => (
                        <AdviceCard
                          key={advice.id}
                          advice={advice}
                          expanded={!!expandedAdvice[advice.id]}
                          onToggle={() => toggleAdvice(advice.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* References */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpenCheck size={18} className="text-[#6B8FA3]" />
            <h3 className="font-semibold text-[#2D2A26]">Sources scientifiques</h3>
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
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8FA3] mt-2 flex-shrink-0" />
                <span className="text-xs text-[rgba(45,42,38,0.6)]">{source}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-xs text-center text-[rgba(45,42,38,0.4)] px-4 pb-4">
          Ces recommandations sont fournies à titre informatif et ne remplacent pas les conseils
          vétérinaires personnalisés. Consultez toujours votre vétérinaire pour des décisions de santé.
        </p>
      </main>
    </div>
  );
}

function AdviceCard({
  advice,
  expanded,
  onToggle,
}: {
  advice: NutritionAdvice;
  expanded: boolean;
  onToggle: () => void;
}) {
  const priority = PRIORITY_CONFIG[advice.priority];

  return (
    <div className="border border-[rgba(45,42,38,0.08)] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 hover:bg-[#FAF6F0] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-[#2D2A26]">{advice.title}</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
              style={{ backgroundColor: priority.bg, color: priority.color }}
            >
              {priority.label}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-[rgba(45,42,38,0.4)] flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={16} className="text-[rgba(45,42,38,0.4)] flex-shrink-0 mt-0.5" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">
              <div className="bg-[#FAF6F0] rounded-lg p-3">
                <p className="text-sm text-[rgba(45,42,38,0.8)] leading-relaxed whitespace-pre-line">
                  {advice.content}
                </p>
                {advice.source && (
                  <p className="text-xs text-[rgba(45,42,38,0.5)] mt-2 italic">
                    Source : {advice.source}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
