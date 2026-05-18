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
  onExport: () => string;
  onImport: (json: string) => boolean;
  onResetDemo: () => void;
  onClearAll: () => void;
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

export function HomePage({ data, onExport, onImport, onResetDemo, onClearAll }: HomePageProps) {
  const navigate = useNavigate();
  const [animatedWeight, setAnimatedWeight] = useState(0);
  const [advicePreview, setAdvicePreview] = useState<string>("");

  const { profile, weightHistory } = data;
  const ageWeeks = getAgeInWeeks(profile.birthDate);
  const ageDisplay = getAgeDisplay(profile.birthDate);
  const stats = getWeightStats(weightHistory);
  const trend = projectWeightTrend(weightHistory, 6);

  const currentWeight = stats.currentWeight || 0;
  const weightStatus = getWeightStatus(currentWeight, ageWeeks);
  const feeding = getFeedingRecommendation(
    currentWeight,
    ageWeeks,
    profile.neutered,
    profile.activityLevel,
    weightHistory
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

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24">
      <Header showSettings onExport={onExport} onImport={onImport} onResetDemo={onResetDemo} onClearAll={onClearAll} />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-5 shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#F0E2D0] flex items-center justify-center flex-shrink-0">
              <PawPrint size={28} className="text-[#C8956C]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[#2D2A26]">{profile.name}</h2>
              <p className="text-sm text-[rgba(45,42,38,0.6)]">
                {profile.breed} {"\u2640"}
              </p>
              <p className="text-xs text-[rgba(45,42,38,0.5)] mt-0.5">
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
          className="bg-[#F0E2D0] rounded-2xl p-5 shadow-md cursor-pointer"
          onClick={() => navigate("/courbe")}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[rgba(45,42,38,0.6)] uppercase tracking-wider">
                Poids actuel
              </p>
              <p className="text-4xl font-bold text-[#C8956C] mt-1">
                {currentWeight > 0 ? `${animatedWeight.toFixed(1)}` : "--"}
                <span className="text-lg font-semibold ml-1">kg</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Calendar size={14} className="text-[rgba(45,42,38,0.5)]" />
                <p className="text-sm text-[rgba(45,42,38,0.6)]">{lastDate}</p>
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
            className="bg-white rounded-2xl p-5 shadow-md border-l-4"
            style={{ borderLeftColor: trendColor }}
          >
            <p className="text-xs font-medium text-[rgba(45,42,38,0.6)] uppercase tracking-wider mb-2">
              Tendance des 4 dernières semaines
            </p>
            <div className="flex items-center gap-3">
              <TrendIcon size={24} style={{ color: trendColor }} />
              <div>
                <p className="font-semibold text-[#2D2A26]" style={{ color: trendColor }}>
                  {trend.trendDescription}
                </p>
                {trend.trendRate !== 0 && (
                  <p className="text-sm text-[rgba(45,42,38,0.6)]">
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
            className="bg-white rounded-2xl p-5 shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <Utensils size={18} className="text-[#C8956C]" />
              <p className="text-xs font-medium text-[rgba(45,42,38,0.6)] uppercase tracking-wider">
                Recommandation du jour
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-[#2D2A26]">
                {feeding.dailyKcal}{" "}
                <span className="text-base font-medium text-[rgba(45,42,38,0.6)]">kcal/jour</span>
              </p>
              <p className="text-sm text-[rgba(45,42,38,0.7)]">
                {feeding.mealsPerDay} repas de ~{feeding.kcalPerMeal} kcal
              </p>
              <p className="text-sm text-[rgba(45,42,38,0.6)]">
                ≈ {feeding.cupsEstimate} tasses | {feeding.gramsEstimate}g de croquettes standard
              </p>
            </div>
            {feeding.warning && (
              <div className="mt-3 p-3 bg-[#E8D0CA] rounded-lg flex items-start gap-2">
                <AlertTriangle size={16} className="text-[#C06B5A] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#C06B5A]">{feeding.warning}</p>
              </div>
            )}
            <button
              onClick={() => navigate("/conseils")}
              className="mt-3 flex items-center gap-1 text-sm font-medium text-[#C8956C] hover:text-[#A67B5B] transition-colors"
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
            className="w-full bg-[#C8956C] hover:bg-[#A67B5B] text-white rounded-2xl py-4 px-5 shadow-md flex items-center justify-center gap-2 transition-colors font-semibold"
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
            className="bg-white rounded-2xl p-5 shadow-md"
          >
            <p className="text-xs font-medium text-[rgba(45,42,38,0.6)] uppercase tracking-wider mb-2">
              Conseil du jour
            </p>
            <p className="text-sm text-[#2D2A26] leading-relaxed">{advicePreview}</p>
            <button
              onClick={() => navigate("/conseils")}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-[#C8956C] hover:text-[#A67B5B] transition-colors"
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
            <Scale size={48} className="mx-auto text-[rgba(45,42,38,0.2)] mb-4" />
            <p className="text-[rgba(45,42,38,0.5)] mb-4">
              Commencez par saisir le premier poids de {profile.name}
            </p>
            <button
              onClick={() => navigate("/saisie")}
              className="bg-[#C8956C] hover:bg-[#A67B5B] text-white rounded-xl py-3 px-6 font-semibold transition-colors"
            >
              Première pesée
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
