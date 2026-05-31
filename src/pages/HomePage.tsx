import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AppData, WeightEntry, FeedingEntry } from "@/types";
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
  onUpdateWeight?: (id: string, updates: Partial<WeightEntry>) => void;
  onDeleteWeight?: (id: string) => void;
  onUpdateFeeding?: (id: string, updates: Partial<FeedingEntry>) => void;
  onDeleteFeeding?: (id: string) => void;
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

const FOOD_LABELS: Record<string, string> = {
  croquettes: "Croquettes",
  "patée": "Pâtée",
  mix: "Mix",
  BARF: "BARF",
  maison: "Maison",
};

export function HomePage({
  data,
  selectedReference,
  onExport,
  onImport,
  onResetDemo,
  onClearAll,
  updateReference,
  onUpdateWeight,
  onDeleteWeight,
  onUpdateFeeding,
  onDeleteFeeding,
}: HomePageProps) {
  const navigate = useNavigate();
  const [animatedWeight, setAnimatedWeight] = useState(0);
  const [advicePreview, setAdvicePreview] = useState<string>("");
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
  const [editingFeedingId, setEditingFeedingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editBcs, setEditBcs] = useState(5);
  const [editNotes, setEditNotes] = useState("");
  const [showWeightHistory, setShowWeightHistory] = useState(false);
  const [showFeedingHistory, setShowFeedingHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"weight" | "feeding">("weight");

  const { profile, weightHistory, feedingHistory } = data;
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

  // Sort entries reverse chronological for history display
  const sortedWeights = [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedFeedings = [...feedingHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const startEditWeight = (entry: WeightEntry) => {
    setEditingWeightId(entry.id);
    setEditWeight(entry.weightKg.toString());
    setEditBcs(entry.bodyConditionScore || 5);
    setEditNotes(entry.notes || "");
  };

  const saveEditWeight = (id: string) => {
    const w = parseFloat(editWeight);
    if (w && w > 0 && w < 80 && onUpdateWeight) {
      onUpdateWeight(id, {
        weightKg: w,
        bodyConditionScore: editBcs,
        notes: editNotes || undefined,
      });
    }
    setEditingWeightId(null);
  };

  const cancelEditWeight = () => {
    setEditingWeightId(null);
    setEditWeight("");
    setEditBcs(5);
    setEditNotes("");
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      if (deleteType === "weight" && onDeleteWeight) {
        onDeleteWeight(deleteConfirmId);
      } else if (deleteType === "feeding" && onDeleteFeeding) {
        onDeleteFeeding(deleteConfirmId);
      }
      setDeleteConfirmId(null);
    }
  };

  // Common card style
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
            Saisir un nouveau poids ou repas
          </button>
        </motion.div>

        {/* ===== WEIGHT HISTORY ===== */}
        {weightHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="rounded-2xl shadow-md overflow-hidden"
            style={cardStyle}
          >
            <button
              onClick={() => setShowWeightHistory(!showWeightHistory)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-2">
                <History size={18} style={{ color: "var(--bm-gold)" }} />
                <span className="font-semibold" style={textPrimary}>
                  Historique des pesées ({weightHistory.length})
                </span>
              </div>
              {showWeightHistory ? (
                <ChevronUp size={18} style={textSecondary} />
              ) : (
                <ChevronDown size={18} style={textSecondary} />
              )}
            </button>

            <AnimatePresence>
              {showWeightHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-2">
                    {sortedWeights.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl p-3 transition-colors"
                        style={{ backgroundColor: "var(--bm-cream)" }}
                      >
                        {editingWeightId === entry.id ? (
                          /* EDIT MODE */
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs" style={textSecondary}>Poids (kg)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="flex-1 h-10 px-3 rounded-lg text-sm border"
                                style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs" style={textSecondary}>BCS (1-9)</label>
                              <input
                                type="number"
                                min="1"
                                max="9"
                                value={editBcs}
                                onChange={(e) => setEditBcs(parseInt(e.target.value) || 5)}
                                className="w-20 h-10 px-3 rounded-lg text-sm border"
                                style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs" style={textSecondary}>Notes</label>
                              <input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="flex-1 h-10 px-3 rounded-lg text-sm border"
                                style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={cancelEditWeight}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: "var(--bm-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={() => saveEditWeight(entry.id)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: "#7A8B6E" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <Check size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* DISPLAY MODE */
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold" style={textPrimary}>
                                  {entry.weightKg.toFixed(1)} kg
                                </span>
                                {entry.bodyConditionScore && (
                                  <span
                                    className="px-1.5 py-0 rounded text-[10px] font-medium"
                                    style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}
                                  >
                                    BCS {entry.bodyConditionScore}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={textTertiary}>
                                {format(new Date(entry.date), "d MMMM yyyy", { locale: fr })}
                                {entry.notes && ` — ${entry.notes}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => startEditWeight(entry)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: "var(--bm-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                title="Modifier"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => { setDeleteConfirmId(entry.id); setDeleteType("weight"); }}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: "#C06B5A" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ===== FEEDING HISTORY ===== */}
        {feedingHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="rounded-2xl shadow-md overflow-hidden"
            style={cardStyle}
          >
            <button
              onClick={() => setShowFeedingHistory(!showFeedingHistory)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-2">
                <Utensils size={18} style={{ color: "var(--bm-gold)" }} />
                <span className="font-semibold" style={textPrimary}>
                  Historique alimentaire ({feedingHistory.length})
                </span>
              </div>
              {showFeedingHistory ? (
                <ChevronUp size={18} style={textSecondary} />
              ) : (
                <ChevronDown size={18} style={textSecondary} />
              )}
            </button>

            <AnimatePresence>
              {showFeedingHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-2">
                    {sortedFeedings.map((entry) => (
                      <FeedingHistoryItem
                        key={entry.id}
                        entry={entry}
                        isEditing={editingFeedingId === entry.id}
                        onStartEdit={() => setEditingFeedingId(entry.id)}
                        onSaveEdit={(id, updates) => {
                          onUpdateFeeding?.(id, updates);
                          setEditingFeedingId(null);
                        }}
                        onCancelEdit={() => setEditingFeedingId(null)}
                        onDelete={(id) => {
                          setDeleteConfirmId(id);
                          setDeleteType("feeding");
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Advice Preview */}
        {advicePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
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

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-5"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm shadow-xl"
              style={{ backgroundColor: "var(--bm-cream)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <Trash2 size={20} style={{ color: "#C06B5A" }} />
                <h3 className="font-bold" style={textPrimary}>Confirmer la suppression</h3>
              </div>
              <p className="text-sm mb-5" style={textSecondary}>
                Cette action est irréversible. Voulez-vous vraiment supprimer cette entrée ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: "#C06B5A" }}
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===== FEEDING HISTORY ITEM COMPONENT ===== */
function FeedingHistoryItem({
  entry,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  entry: FeedingEntry;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (id: string, updates: Partial<FeedingEntry>) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const [editMeals, setEditMeals] = useState(entry.mealsPerDay);
  const [editQty, setEditQty] = useState(entry.quantityPerMealGrams);
  const [editType, setEditType] = useState(entry.foodType);
  const [editBrand, setEditBrand] = useState(entry.brand || "");

  const textPrimary = { color: "var(--bm-charcoal)" };
  const textTertiary = { color: "var(--bm-text-tertiary)" };

  if (isEditing) {
    return (
      <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "var(--bm-cream)" }}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px]" style={textTertiary}>Repas/jour</label>
            <input
              type="number" min={1} max={6}
              value={editMeals}
              onChange={(e) => setEditMeals(parseInt(e.target.value) || 1)}
              className="w-full h-9 px-2 rounded-lg text-sm border"
              style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
            />
          </div>
          <div>
            <label className="text-[10px]" style={textTertiary}>Quantité (g)</label>
            <input
              type="number" min={10} max={1000} step={10}
              value={editQty}
              onChange={(e) => setEditQty(parseInt(e.target.value) || 10)}
              className="w-full h-9 px-2 rounded-lg text-sm border"
              style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px]" style={textTertiary}>Type</label>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="w-full h-9 px-2 rounded-lg text-sm border"
              style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
            >
              <option value="croquettes">Croquettes</option>
              <option value="patée">Pâtée</option>
              <option value="mix">Mix</option>
              <option value="BARF">BARF</option>
              <option value="maison">Maison</option>
            </select>
          </div>
          <div>
            <label className="text-[10px]" style={textTertiary}>Marque</label>
            <input
              type="text"
              value={editBrand}
              onChange={(e) => setEditBrand(e.target.value)}
              className="w-full h-9 px-2 rounded-lg text-sm border"
              style={{ backgroundColor: "var(--bm-card-bg)", borderColor: "var(--bm-border)", color: "var(--bm-charcoal)" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancelEdit}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--bm-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={16} />
          </button>
          <button
            onClick={() => onSaveEdit(entry.id, {
              mealsPerDay: editMeals,
              quantityPerMealGrams: editQty,
              foodType: editType,
              brand: editBrand || undefined,
            })}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#7A8B6E" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Check size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-3 transition-colors"
      style={{ backgroundColor: "var(--bm-cream)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={textPrimary}>
              {entry.mealsPerDay} x {entry.quantityPerMealGrams}g
            </span>
            <span
              className="px-1.5 py-0 rounded text-[10px] font-medium"
              style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}
            >
              {FOOD_LABELS[entry.foodType] || entry.foodType}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={textTertiary}>
            {format(new Date(entry.date), "d MMMM yyyy", { locale: fr })}
            {entry.brand && ` — ${entry.brand}`}
            {entry.notes && ` — ${entry.notes}`}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onStartEdit}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--bm-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            title="Modifier"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#C06B5A" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
