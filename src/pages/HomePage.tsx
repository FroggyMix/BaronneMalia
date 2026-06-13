import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  PawPrint,
  TrendingUp,
  TrendingDown,
  Minus,
  Utensils,
  ChevronRight,
  Calendar,
  Scale,
  AlertTriangle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AppData, FeedingEntry } from "@/types";
import {
  getAgeInWeeks,
  getAgeDisplay,
  getWeightStats,
  projectWeightTrend,
  getFeedingRecommendation,
  getWeightStatus,
  getFeedingAnalysis,
  getGramsEstimate,
  getTrendColor,
} from "@/utils/calculations";
import { GROWTH_REFERENCES } from "@/data/growthReferences";
import { getAdviceForAge } from "@/data/nutritionAdvice";
import { Header } from "@/components/Header";

interface HomePageProps {
  data: AppData;
  selectedReference: string;
  onExport: () => string;
  onImport: (json: string) => boolean;
  onResetDemo: () => void;
  onClearAll: () => void;
  updateReference?: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  ideal: { color: "#7A8B6E", bg: "#D4E0CD", label: "Dans la fourchette idéale" },
  underweight: { color: "#C8956C", bg: "#F0E2D0", label: "En-dessous de l'idéal" },
  overweight: { color: "#C06B5A", bg: "#E8D0CA", label: "Au-dessus de l'idéal" },
};

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  "Hausse rapide": TrendingUp,
  "Hausse modérée": TrendingUp,
  "Stable": Minus,
  "Baisse modérée": TrendingDown,
  "Baisse rapide": TrendingDown,
  "Pas assez de données": Minus,
};



export function HomePage({
  data,
  selectedReference,
  onExport,
  onImport,
  onResetDemo,
  onClearAll,
  updateReference,
}: HomePageProps) {
  const navigate = useNavigate();
  const [animatedWeight, setAnimatedWeight] = useState(0);
  const [advicePreview, setAdvicePreview] = useState<string>("");

  const { profile, weightHistory, feedingHistory } = data;
  const ageWeeks = getAgeInWeeks(profile.birthDate);
  const ageDisplay = getAgeDisplay(profile.birthDate);
  const stats = getWeightStats(weightHistory);
  const trend = projectWeightTrend(weightHistory, profile.birthDate, 6);

  const currentWeight = stats.currentWeight || 0;

  // Get the selected growth reference for breed-specific calculations
  const activeReference = GROWTH_REFERENCES.find(r => r.id === selectedReference)
    || GROWTH_REFERENCES.find(r => r.id === 'ref03') // default AKC/GRCA
    || GROWTH_REFERENCES[0];

  // Weight status based on the SELECTED reference (not hardcoded curve)
  const weightStatus = getWeightStatus(currentWeight, ageWeeks, activeReference);

  // Most recent feeding entry (for caloric density and display)
  const lastFeeding: FeedingEntry | null = feedingHistory.length > 0
    ? [...feedingHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;
  const lastFeedingKcal = lastFeeding?.foodCaloriesPer100g || 370;

  const feeding = getFeedingRecommendation(
    currentWeight,
    ageWeeks,
    profile.neutered,
    profile.activityLevel,
    weightHistory,
    profile.birthDate,
    lastFeedingKcal,
    activeReference,
  );

  // NEW: Feeding analysis — real vs theoretical with weight-state adjustment
  const feedingAnalysis = feedingHistory.length > 0
    ? getFeedingAnalysis(feedingHistory, feeding.dailyKcal, weightStatus, trend.trendDescription)
    : null;

  useEffect(() => {
    if (currentWeight > 0) {
      const duration = 1000;
      const start = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedWeight(Math.round(currentWeight * eased * 10) / 10);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [currentWeight]);

  useEffect(() => {
    if (currentWeight > 0) {
      const advice = getAdviceForAge(ageWeeks, currentWeight, weightStatus);
      if (advice.length > 0) {
        setAdvicePreview(advice[0].title);
      }
    }
  }, [ageWeeks, currentWeight, weightStatus]);

  const status = STATUS_CONFIG[weightStatus] || STATUS_CONFIG.ideal;
  const TrendIcon = TREND_ICONS[trend.trendDescription] || TREND_ICONS["Pas assez de données"];
  const trendColor = getTrendColor(trend.trendDescription, ageWeeks);

  const lastDate = stats.currentDate
    ? format(new Date(stats.currentDate), "d MMMM yyyy", { locale: fr })
    : "Aucune pesée";

  // Most recent feeding entry
  const cardStyle = { backgroundColor: "var(--bm-card-bg)" };
  const textPrimary = { color: "var(--bm-charcoal)" };
  const textSecondary = { color: "var(--bm-text-secondary)" };
  const textTertiary = { color: "var(--bm-text-tertiary)" };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bm-cream)" }}>
      <Header selectedReference={selectedReference} onExport={onExport} onImport={onImport} onResetDemo={onResetDemo} onClearAll={onClearAll} onUpdateReference={(id) => updateReference?.(id)} />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-5 shadow-md"
          style={cardStyle}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bm-pale-gold)" }}>
              <PawPrint size={28} style={{ color: "var(--bm-gold)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold" style={textPrimary}>{profile.name}</h2>
              <p style={textSecondary}>{profile.breed} {"\u2640"}</p>
              <p className="text-xs mt-0.5" style={textTertiary}>{ageDisplay}</p>
            </div>
          </div>
        </motion.div>

        {/* Weight Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl p-5 shadow-md cursor-pointer"
          style={{ backgroundColor: "var(--bm-pale-gold)" }}
          onClick={() => navigate("/courbe")}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={textSecondary}>Poids actuel</p>
              <p className="text-4xl font-bold mt-1" style={{ color: "var(--bm-gold)" }}>
                {currentWeight > 0 ? `${animatedWeight.toFixed(1)}` : "--"}
                <span className="text-lg font-semibold ml-1">kg</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Calendar size={14} style={textTertiary} />
                <p className="text-sm" style={textSecondary}>{lastDate}</p>
              </div>
            </div>
            {currentWeight > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
                {status.label}
              </span>
            )}
          </div>
        </motion.div>

        {/* Trend Card */}
        {weightHistory.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl p-5 shadow-md border-l-4"
            style={{ ...cardStyle, borderLeftColor: trendColor }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={textSecondary}>
              Tendance des 4 dernières semaines
            </p>
            <div className="flex items-center gap-3">
              <TrendIcon size={24} style={{ color: trendColor }} />
              <div>
                <p className="font-semibold" style={{ color: trendColor }}>{trend.trendDescription}</p>
                {trend.trendRate !== 0 && (
                  <p className="text-sm" style={textSecondary}>
                    {trend.trendRate > 0 ? "+" : ""}{trend.trendRate} kg/mois
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Feeding Recommendation Card */}
        {currentWeight > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-2xl p-5 shadow-md"
            style={cardStyle}
          >
            <div className="flex items-center gap-2 mb-3">
              <Utensils size={18} style={{ color: "var(--bm-gold)" }} />
              <p className="text-xs font-medium uppercase tracking-wider" style={textSecondary}>
                Alimentation
              </p>
            </div>

            {/* Theoretical recommendation */}
            <div className="space-y-1 mb-3">
              <p className="text-sm" style={textSecondary}>
                Besoins pour {currentWeight.toFixed(1)} kg à {Math.round(ageWeeks / 4.33)} mois :
              </p>
              <p className="text-2xl font-bold" style={textPrimary}>
                {feeding.dailyKcal} <span className="text-base font-medium" style={textSecondary}>kcal/jour</span>
              </p>
              <p className="text-sm" style={textTertiary}>
                ≈ {feeding.mealsPerDay} repas de ~{feeding.kcalPerMeal} kcal
                {" "}| {feeding.gramsEstimate}g
                {lastFeedingKcal !== 365 && (
                  <span style={textSecondary}> (croquettes à {lastFeedingKcal} kcal/100g)</span>
                )}
              </p>
            </div>

            {/* NEW: Real vs theoretical comparison */}
            {feedingAnalysis && (
              <div
                className="rounded-lg p-3 mb-3"
                style={{
                  backgroundColor: feedingAnalysis.adjustmentPercent !== 0 ? "var(--bm-pale-gold)" : "#D4E0CD",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {feedingAnalysis.adjustmentPercent !== 0 ? (
                    <AlertTriangle size={14} style={{ color: "var(--bm-gold)" }} />
                  ) : (
                    <Info size={14} style={{ color: "#7A8B6E" }} />
                  )}
                  <p
                    className="text-xs font-semibold"
                    style={{ color: feedingAnalysis.adjustmentPercent !== 0 ? "var(--bm-gold)" : "#7A8B6E" }}
                  >
                    {feedingAnalysis.status}
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={textSecondary}>
                  {feedingAnalysis.reasoning}
                </p>
                {feedingAnalysis.adjustedKcal != null && (
                  <p className="text-xs font-semibold mt-1" style={{ color: "var(--bm-gold)" }}>
                    Ration ajustée : {feedingAnalysis.adjustedKcal} kcal/j
                    {" "}({feedingAnalysis.adjustmentPercent > 0 ? "+" : ""}{feedingAnalysis.adjustmentPercent}%)
                    {" "}| {getGramsEstimate(feedingAnalysis.adjustedKcal, lastFeedingKcal)}g/j
                  </p>
                )}
              </div>
            )}

            {/* Last recorded meal */}
            {lastFeeding && (
              <div className="flex items-center gap-2 py-2 border-t" style={{ borderColor: "var(--bm-border)" }}>
                <p className="text-xs" style={textTertiary}>
                  Dernier enregistrement : {lastFeeding.mealsPerDay} x {lastFeeding.quantityPerMealGrams}g
                  ({lastFeeding.foodType})
                  {" "}— {format(new Date(lastFeeding.date), "d MMM", { locale: fr })}
                </p>
              </div>
            )}

            {feeding.warning && (
              <div className="mt-2 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: "#E8D0CA" }}>
                <AlertTriangle size={16} className="text-[#C06B5A] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#C06B5A]">{feeding.warning}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Entry Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex gap-3"
        >
          <button
            onClick={() => navigate("/saisie?tab=poids")}
            className="flex-1 rounded-2xl py-4 px-3 shadow-md flex items-center justify-center gap-2 transition-colors font-semibold text-white text-sm"
            style={{ backgroundColor: "var(--bm-gold)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-gold-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-gold)")}
          >
            <Scale size={18} />
            Saisir un poids
          </button>
          <button
            onClick={() => navigate("/saisie?tab=nourriture")}
            className="flex-1 rounded-2xl py-4 px-3 shadow-md flex items-center justify-center gap-2 transition-colors font-semibold text-sm border-2"
            style={{ borderColor: "var(--bm-gold)", color: "var(--bm-gold)", backgroundColor: "transparent" }}
          >
            <Utensils size={18} />
            Saisir un repas
          </button>
        </motion.div>

        {/* Advice Preview */}
        {advicePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="rounded-2xl p-5 shadow-md"
            style={cardStyle}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={textSecondary}>Conseil du jour</p>
            <p className="text-sm leading-relaxed" style={textPrimary}>{advicePreview}</p>
            <button
              onClick={() => navigate("/conseils")}
              className="mt-2 flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: "var(--bm-gold)" }}
            >
              Lire la suite <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {weightHistory.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Scale size={48} className="mx-auto mb-4" style={{ color: "var(--bm-text-tertiary)", opacity: 0.5 }} />
            <p className="mb-4" style={textTertiary}>Commencez par saisir le premier poids de {profile.name}</p>
            <button
              onClick={() => navigate("/saisie")}
              className="rounded-xl py-3 px-6 font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--bm-gold)" }}
            >
              Première pesée
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
