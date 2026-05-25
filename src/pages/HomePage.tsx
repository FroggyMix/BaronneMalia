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
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AppData } from "@/types";
import {
  getAgeInWeeks,
  getAgeDisplay,
  getWeightStats,
  projectWeightTrend,
  getFeedingRecommendation,
  getWeightStatus,
} from "@/utils/calculations";
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

const TREND_CONFIG: Record<string, { icon: typeof TrendingUp; color: string }> = {
  "Hausse rapide": { icon: TrendingUp, color: "#C06B5A" },
  "Hausse modérée": { icon: TrendingUp, color: "#C8956C" },
  "Stable": { icon: Minus, color: "#7A8B6E" },
  "Baisse modérée": { icon: TrendingDown, color: "#C8956C" },
  "Baisse rapide": { icon: TrendingDown, color: "#C06B5A" },
  "Pas assez de données": { icon: Minus, color: "rgba(45,42,38,0.4)" },
};

export function HomePage({ data, selectedReference, onExport, onImport, onResetDemo, onClearAll, updateReference }: HomePageProps) {
  const navigate = useNavigate();
  const [animatedWeight, setAnimatedWeight] = useState(0);
  const [advicePreview, setAdvicePreview] = useState<string>("");

  const { profile, weightHistory } = data;
  const ageWeeks = getAgeInWeeks(profile.birthDate);
  const ageDisplay = getAgeDisplay(profile.birthDate);
  const stats = getWeightStats(weightHistory);
  const trend = projectWeightTrend(weightHistory, profile.birthDate, 6);

  const currentWeight = stats.currentWeight || 0;
  const weightStatus = getWeightStatus(currentWeight, ageWeeks);
  const feeding = getFeedingRecommendation(
    currentWeight,
    ageWeeks,
    profile.neutered,
    profile.activityLevel,
    weightHistory,
    profile.birthDate,
  );

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
  const trendEntry = TREND_CONFIG[trend.trendDescription] || TREND_CONFIG["Pas assez de données"];
  const TrendIcon = trendEntry.icon;
  const trendColor = trendEntry.color;

  const lastDate = stats.currentDate
    ? format(new Date(stats.currentDate), "d MMMM yyyy", { locale: fr })
    : "Aucune pesée";

  // Common card style
  const cardStyle = { backgroundColor: "var(--bm-card-bg)" };
  const textPrimary = { color: "var(--bm-charcoal)" };
  const textSecondary = { color: "var(--bm-text-secondary)" };
  const textTertiary = { color: "var(--bm-text-tertiary)" };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bm-cream)" }}>
      <Header showSettings selectedReference={selectedReference} onExport={onExport} onImport={onImport} onResetDemo={onResetDemo} onClearAll={onClearAll} onUpdateReference={(id) => updateReference?.(id)} />

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
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--bm-pale-gold)" }}
            >
              <PawPrint size={28} style={{ color: "var(--bm-gold)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold" style={textPrimary}>{profile.name}</h2>
              <p style={textSecondary}>
                {profile.breed} {"\u2640"}
              </p>
              <p className="text-xs mt-0.5" style={textTertiary}>
                {ageDisplay}
              </p>
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
              <p className="text-xs font-medium uppercase tracking-wider" style={textSecondary}>
                Poids actuel
              </p>
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
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
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
                <p className="font-semibold" style={{ color: trendColor }}>
                  {trend.trendDescription}
                </p>
                {trend.trendRate !== 0 && (
                  <p className="text-sm" style={textSecondary}>
                    {trend.trendRate > 0 ? "+" : ""}
                    {trend.trendRate} kg/mois
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
                Recommandation du jour
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold" style={textPrimary}>
                {feeding.dailyKcal}{" "}
                <span className="text-base font-medium" style={textSecondary}>kcal/jour</span>
              </p>
              <p className="text-sm" style={textSecondary}>
                {feeding.mealsPerDay} repas de ~{feeding.kcalPerMeal} kcal
              </p>
              <p className="text-sm" style={textTertiary}>
                ≈ {feeding.cupsEstimate} tasses | {feeding.gramsEstimate}g de croquettes standard
              </p>
            </div>
            {feeding.warning && (
              <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: "#E8D0CA" }}>
                <AlertTriangle size={16} className="text-[#C06B5A] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#C06B5A]">{feeding.warning}</p>
              </div>
            )}
            <button
              onClick={() => navigate("/conseils")}
              className="mt-3 flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: "var(--bm-gold)" }}
            >
              Voir les conseils détaillés
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Quick Entry Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <button
            onClick={() => navigate("/saisie")}
            className="w-full rounded-2xl py-4 px-5 shadow-md flex items-center justify-center gap-2 transition-colors font-semibold text-white"
            style={{ backgroundColor: "var(--bm-gold)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-gold-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-gold)")}
          >
            <Scale size={20} />
            Saisir un nouveau poids
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
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={textSecondary}>
              Conseil du jour
            </p>
            <p className="text-sm leading-relaxed" style={textPrimary}>{advicePreview}</p>
            <button
              onClick={() => navigate("/conseils")}
              className="mt-2 flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: "var(--bm-gold)" }}
            >
              Lire la suite
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {weightHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Scale size={48} className="mx-auto mb-4" style={{ color: "var(--bm-text-tertiary)", opacity: 0.5 }} />
            <p className="mb-4" style={textTertiary}>
              Commencez par saisir le premier poids de {profile.name}
            </p>
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
