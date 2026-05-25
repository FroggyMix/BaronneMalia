import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Calendar,
  Target,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Header } from "@/components/Header";
import { getIdealWeightRangeRef } from "@/data/growthReferences";
import {
  getAgeInWeeks,
  getWeightStats,
  projectWeightTrend,
  getWeightStatus,
  getWeightStatusLabel,
} from "@/utils/calculations";
import type { AppData } from "@/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Point {
  x: number;
  y: number;
}

interface CourbePageProps {
  data: AppData;
  selectedReference: string;
}

type TimeRange = "all" | "6m" | "3m" | "1m";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "6m", label: "6 mois" },
  { value: "3m", label: "3 mois" },
  { value: "1m", label: "1 mois" },
];

const TREND_CONFIG: Record<string, { icon: typeof TrendingUp; color: string }> = {
  "Hausse rapide": { icon: TrendingUp, color: "#C06B5A" },
  "Hausse modérée": { icon: TrendingUp, color: "#C8956C" },
  "Stable": { icon: Minus, color: "#7A8B6E" },
  "Baisse modérée": { icon: TrendingDown, color: "#C8956C" },
  "Baisse rapide": { icon: TrendingDown, color: "#C06B5A" },
  "Pas assez de données": { icon: Minus, color: "rgba(45,42,38,0.4)" },
};

const ITEMS_PER_PAGE = 10;

/** Format week number to human-readable age label */
function formatAgeLabel(weeks: number, detailed: boolean): string {
  const months = Math.floor(weeks / 4);
  const remWeeks = weeks % 4;
  if (remWeeks === 0) return `${months}m`;
  if (detailed) return `${months}m${remWeeks}s`;
  return "";
}

export function CourbePage({ data, selectedReference }: CourbePageProps) {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { profile, weightHistory } = data;
  const ageWeeks = getAgeInWeeks(profile.birthDate);
  const stats = getWeightStats(weightHistory);
  const trend = projectWeightTrend(weightHistory, profile.birthDate, 6);
  const currentWeight = stats.currentWeight || 0;
  const weightStatus = getWeightStatus(currentWeight, ageWeeks);
  const idealRange = getIdealWeightRangeRef(ageWeeks, selectedReference);

  // X-axis zoom window (in weeks since birth)
  const { startWeek, endWeek } = useMemo(() => {
    const end = ageWeeks + 4; // show a little past current age
    let start: number;
    switch (timeRange) {
      case "1m":
        start = Math.max(8, ageWeeks - 5);
        break;
      case "3m":
        start = Math.max(8, ageWeeks - 14);
        break;
      case "6m":
        start = Math.max(8, ageWeeks - 27);
        break;
      default:
        start = 8; // from 2 months
    }
    return { startWeek: start, endWeek: end };
  }, [ageWeeks, timeRange]);

  // Compute Y range from visible data
  const { yMin, yMax } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;

    // Ideal range
    for (let w = startWeek; w <= endWeek; w += 1) {
      const ideal = getIdealWeightRangeRef(w, selectedReference);
      minVal = Math.min(minVal, ideal.min);
      maxVal = Math.max(maxVal, ideal.max);
    }

    // Actual measurements within window
    weightHistory.forEach((e) => {
      const w = getAgeInWeeks(profile.birthDate, e.date);
      if (w >= startWeek && w <= endWeek) {
        minVal = Math.min(minVal, e.weightKg);
        maxVal = Math.max(maxVal, e.weightKg);
      }
    });

    // Projections within window
    trend.projectedPoints.forEach((p) => {
      if (p.x >= startWeek && p.x <= endWeek) {
        minVal = Math.min(minVal, p.y);
        maxVal = Math.max(maxVal, p.y);
      }
    });

    const padding = (maxVal - minVal) * 0.12;
    return {
      yMin: Math.max(0, Math.floor((minVal - padding) * 10) / 10),
      yMax: Math.ceil((maxVal + padding) * 10) / 10,
    };
  }, [startWeek, endWeek, weightHistory, profile.birthDate, trend]);

  // Build datasets with EXACT coordinates
  const chartData = useMemo((): ChartData<"line"> => {
    if (weightHistory.length === 0) return { labels: [], datasets: [] };

    // 1. Ideal range — dense interpolated curve
    const idealMinPoints: Point[] = [];
    const idealMaxPoints: Point[] = [];
    const step = 0.5; // half-week steps for smooth curve
    for (let w = startWeek; w <= endWeek + step / 2; w += step) {
      const ideal = getIdealWeightRangeRef(Math.round(w), selectedReference);
      idealMinPoints.push({ x: w, y: ideal.min });
      idealMaxPoints.push({ x: w, y: ideal.max });
    }

    // 2. Actual measurements — each at its EXACT age in weeks
    const sortedEntries = [...weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const actualPoints: Point[] = sortedEntries.map((e) => ({
      x: getAgeInWeeks(profile.birthDate, e.date),
      y: e.weightKg,
    }));

    // 3. Projection — starts exactly from last measurement
    const projectionPoints: Point[] = [];
    if (actualPoints.length > 0) {
      const last = actualPoints[actualPoints.length - 1];
      projectionPoints.push({ x: last.x, y: last.y }); // anchor point
      for (const proj of trend.projectedPoints) {
        if (proj.x <= endWeek) {
          projectionPoints.push({ x: proj.x, y: proj.y });
        }
      }
    }

    return {
      datasets: [
        {
          label: "Fourchette idéale",
          data: idealMaxPoints as any,
          borderColor: "rgba(192, 149, 108, 0.25)",
          backgroundColor: "rgba(240, 226, 208, 0.35)",
          fill: {
            target: "-1" as any,
            above: "rgba(240, 226, 208, 0.35)" as any,
          },
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.4,
          order: 3,
          xAxisID: "x",
        },
        {
          label: "Fourchette idéale (min)",
          data: idealMinPoints as any,
          borderColor: "rgba(192, 149, 108, 0.25)",
          backgroundColor: "rgba(240, 226, 208, 0.35)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.4,
          order: 4,
          xAxisID: "x",
        },
        {
          label: "Poids réel",
          data: actualPoints as any,
          borderColor: "#C8956C",
          backgroundColor: "#C8956C",
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#C8956C",
          pointBorderColor: "#FFFFFF",
          pointBorderWidth: 2,
          tension: 0.3,
          spanGaps: false,
          order: 1,
          xAxisID: "x",
        },
        {
          label: "Projection (6 sem.)",
          data: projectionPoints as any,
          borderColor: "#6B8FA3",
          borderWidth: 2,
          borderDash: [8, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          spanGaps: false,
          order: 2,
          xAxisID: "x",
        },
      ],
    };
  }, [weightHistory, startWeek, endWeek, profile.birthDate, trend, timeRange]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyleWidth: 10,
          padding: 20,
          font: { family: "'Inter', sans-serif", size: 12 },
          color: "rgba(45,42,38,0.7)",
          filter: (item) => item.text !== "Fourchette idéale (min)",
        },
      },
      tooltip: {
        backgroundColor: "#2D2A26",
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items: any) => {
            if (!items.length) return "";
            const week = Math.round(Number(items[0].raw.x));
            return `Âge : ${formatAgeLabel(week, true)}`;
          },
          label: (item: any) => {
            const val = item.raw.y;
            if (item.dataset.label === "Poids réel") return `Poids : ${val} kg`;
            if (item.dataset.label === "Projection (6 sem.)") return `Projection : ${val} kg`;
            // Hide ideal range from tooltip
            if (item.dataset.label?.includes("Fourchette")) return undefined;
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: startWeek,
        max: endWeek,
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: "rgba(45,42,38,0.5)",
          maxRotation: 0,
          autoSkip: false,
          callback: function (value) {
            const week = Math.round(Number(value));
            const remWeeks = week % 4;
            // Show label at every month boundary (week divisible by 4)
            if (remWeeks === 0) return formatAgeLabel(week, false);
            // For 1-month zoom, also show mid-month markers
            if (timeRange === "1m" && remWeeks === 2) return formatAgeLabel(week, true);
            return "";
          },
          stepSize: 1,
          maxTicksLimit: 20,
        },
        border: { color: "rgba(45,42,38,0.1)" },
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { color: "rgba(45,42,38,0.05)" },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: "rgba(45,42,38,0.5)",
          callback: (value) => `${value} kg`,
          stepSize: Math.max(0.5, Math.round((yMax - yMin) / 6 * 10) / 10),
        },
        border: { display: false },
      },
    },
    animation: { duration: 500, easing: "easeOutQuart" },
  };

  // Pagination
  const sortedEntries = useMemo(() => {
    return [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [weightHistory]);
  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / ITEMS_PER_PAGE));
  const paginatedEntries = sortedEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // CSV export
  const exportCSV = () => {
    const sorted = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const headers = ["Date", "Age (semaines)", "Poids (kg)", "BCS", "Notes"];
    const rows = sorted.map((e) => [
      e.date,
      String(getAgeInWeeks(profile.birthDate, e.date)),
      String(e.weightKg).replace(".", ","),
      e.bodyConditionScore ? String(e.bodyConditionScore) : "",
      e.notes ? `"${e.notes.replace(/"/g, "'")}"` : "",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `baronne-malia-pesees-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const trendEntry = TREND_CONFIG[trend.trendDescription] || TREND_CONFIG["Pas assez de données"];
  const TrendIcon = trendEntry.icon;
  const trendColor = trendEntry.color;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bm-cream)" }}>
      <Header title="Courbe de croissance" showBack />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-4">
        {/* Time Range Filter */}
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => { setTimeRange(range.value); setCurrentPage(1); }}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                timeRange === range.value
                  ? { backgroundColor: "var(--bm-gold)", color: "#fff" }
                  : { backgroundColor: "var(--bm-card-bg)", color: "var(--bm-text-secondary)", border: "1px solid var(--bm-border)" }
              }
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 shadow-md"
          style={{ backgroundColor: "var(--bm-card-bg)" }}
        >
          {weightHistory.length > 0 ? (
            <div className="h-72">
              <Line data={chartData as any} options={chartOptions as any} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center flex-col gap-3">
              <Scale size={40} style={{ color: "var(--bm-text-tertiary)", opacity: 0.5 }} />
              <p className="text-sm text-center" style={{ color: "var(--bm-text-secondary)" }}>
                Saisissez au moins 2 pesées pour voir la courbe
              </p>
            </div>
          )}

          {weightHistory.length > 0 && (
            <div className="mt-4 pt-3 space-y-1.5" style={{ borderTop: "1px solid var(--bm-border)" }}>
              <div className="flex items-center gap-2">
                <span className="w-8 rounded" style={{ height: "8px", backgroundColor: "rgba(240,226,208,0.6)" }} />
                <span className="text-xs" style={{ color: "var(--bm-text-secondary)" }}>Fourchette idéale (femelle Golden Retriever)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C8956C" }} />
                <span className="text-xs" style={{ color: "var(--bm-text-secondary)" }}>Poids réel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 border-t-2 border-dashed" style={{ borderColor: "#6B8FA3" }} />
                <span className="text-xs" style={{ color: "var(--bm-text-secondary)" }}>Projection (tendance sur 6 sem.)</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        {weightHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 shadow-md"
            style={{ backgroundColor: "var(--bm-card-bg)" }}
          >
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: "var(--bm-text-secondary)" }}>Statistiques</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Scale, color: "var(--bm-gold)", label: "Poids de départ", value: `${stats.startingWeight} kg`, sub: stats.startingDate ? format(new Date(stats.startingDate), "d MMM yyyy", { locale: fr }) : undefined },
                { icon: TrendingUp, color: "#7A8B6E", label: "Gain total", value: `+${stats.totalGain} kg` },
                { icon: Calendar, color: "#6B8FA3", label: "Pesées", value: `${stats.weighingsCount}`, sub: `sur ${stats.weeksTracked} semaines` },
                { icon: Target, color: "var(--bm-gold)", label: "Fourchette idéale", value: `${idealRange.min}-${idealRange.max} kg`, sub: getWeightStatusLabel(weightStatus) },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: "var(--bm-surface)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon size={14} style={{ color: s.color }} />
                    <span className="text-xs" style={{ color: "var(--bm-text-tertiary)" }}>{s.label}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: "var(--bm-charcoal)" }}>{s.value}</p>
                  {s.sub && <p className="text-xs" style={{ color: "var(--bm-text-tertiary)" }}>{s.sub}</p>}
                </div>
              ))}
            </div>

            {weightHistory.length >= 3 && (
              <div className="mt-4 p-3 rounded-xl border-l-4" style={{ borderLeftColor: trendColor, backgroundColor: "var(--bm-surface)" }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <TrendIcon size={18} style={{ color: trendColor }} />
                  <span className="font-medium text-sm" style={{ color: "var(--bm-charcoal)" }}>{trend.trendDescription}</span>
                  <span className="text-sm" style={{ color: "var(--bm-text-secondary)" }}>({trend.trendRate > 0 ? "+" : ""}{trend.trendRate} kg/mois)</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Export buttons */}
        {weightHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3">
            <button onClick={exportCSV} className="flex-1 rounded-xl py-3 px-4 shadow-sm border flex items-center justify-center gap-2 transition-colors text-sm font-medium" style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", borderColor: "var(--bm-border)" }}>
              <FileSpreadsheet size={16} style={{ color: "#7A8B6E" }} /> Export CSV
            </button>
            <button
              onClick={() => {
                const json = JSON.stringify(weightHistory, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `baronne-malia-pesees-${format(new Date(), "yyyy-MM-dd")}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="flex-1 rounded-xl py-3 px-4 shadow-sm border flex items-center justify-center gap-2 transition-colors text-sm font-medium"
              style={{ backgroundColor: "var(--bm-card-bg)", color: "var(--bm-charcoal)", borderColor: "var(--bm-border)" }}
            >
              <Download size={16} style={{ color: "#6B8FA3" }} /> Export JSON
            </button>
          </motion.div>
        )}

        {/* Paginated history */}
        {weightHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl p-5 shadow-md" style={{ backgroundColor: "var(--bm-card-bg)" }}>
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: "var(--bm-text-secondary)" }}>Historique des pesées</h3>
            <div className="space-y-2">
              {paginatedEntries.map((entry) => {
                const entryWeeks = getAgeInWeeks(profile.birthDate, entry.date);
                const months = Math.floor(entryWeeks / 4);
                const remWeeks = entryWeeks % 4;
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--bm-surface)" }}>
                    <div className="flex items-center gap-3">
                      <Scale size={16} style={{ color: "var(--bm-gold)" }} />
                      <div>
                        <p className="font-semibold" style={{ color: "var(--bm-charcoal)" }}>{entry.weightKg} kg</p>
                        <p className="text-xs" style={{ color: "var(--bm-text-tertiary)" }}>
                          {format(new Date(entry.date), "d MMM yyyy", { locale: fr })} · {months}m{remWeeks > 0 ? `${remWeeks}s` : ""}
                        </p>
                      </div>
                    </div>
                    {entry.bodyConditionScore && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}>
                        BCS {entry.bodyConditionScore}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--bm-border)" }}>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed" style={{ color: "var(--bm-gold)" }}>
                  <ChevronLeft size={16} /> Précédent
                </button>
                <span className="text-sm" style={{ color: "var(--bm-text-secondary)" }}>Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed" style={{ color: "var(--bm-gold)" }}>
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          onClick={() => navigate("/saisie")}
          className="w-full rounded-2xl py-4 px-5 shadow-md flex items-center justify-center gap-2 transition-colors font-semibold text-white"
          style={{ backgroundColor: "var(--bm-gold)" }}
        >
          <Scale size={20} /> Saisir un nouveau poids
        </motion.button>
      </main>
    </div>
  );
}
