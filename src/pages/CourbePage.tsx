import { useState, useMemo, useRef } from "react";
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
import { TrendingUp, TrendingDown, Minus, Scale, Calendar, Target, ChevronLeft, ChevronRight, FileSpreadsheet, Download } from "lucide-react";
import { Header } from "@/components/Header";
import { getIdealWeightRange } from "@/data/growthCurve";
import {
  getAgeInWeeks,
  getWeightStats,
  projectWeightTrend,
  getWeightStatus,
  getWeightStatusLabel,
} from "@/utils/calculations";
import type { AppData, WeightEntry } from "@/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface CourbePageProps {
  data: AppData;
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

export function CourbePage({ data }: CourbePageProps) {
  const navigate = useNavigate();
  const chartRef = useRef<ChartJS<"line">>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { profile, weightHistory } = data;
  const ageWeeks = getAgeInWeeks(profile.birthDate);
  const stats = getWeightStats(weightHistory);
  const trend = projectWeightTrend(weightHistory, 6);
  const currentWeight = stats.currentWeight || 0;
  const weightStatus = getWeightStatus(currentWeight, ageWeeks);
  const idealRange = getIdealWeightRange(ageWeeks);

  // Compute zoom window (in weeks)
  const zoomWindow = useMemo(() => {
    const endWeek = ageWeeks + 2; // +2 for slight padding
    let startWeek: number;
    switch (timeRange) {
      case "1m":
        startWeek = Math.max(8, ageWeeks - 4);
        break;
      case "3m":
        startWeek = Math.max(8, ageWeeks - 13);
        break;
      case "6m":
        startWeek = Math.max(8, ageWeeks - 26);
        break;
      default:
        startWeek = 8;
    }
    return { startWeek, endWeek };
  }, [ageWeeks, timeRange]);

  // Build chart data WITHIN the zoom window only
  const chartData = useMemo((): ChartData<"line"> => {
    if (weightHistory.length === 0) {
      return { labels: [], datasets: [] };
    }

    const { startWeek, endWeek } = zoomWindow;

    const labels: string[] = [];
    const idealMinData: (number | null)[] = [];
    const idealMaxData: (number | null)[] = [];
    const actualData: (number | null)[] = [];
    const projectedData: (number | null)[] = [];

    const lastEntry = weightHistory[weightHistory.length - 1];
    const lastEntryWeek = getAgeInWeeks(profile.birthDate, lastEntry.date);

    // Step size: every 1 week for zoomed views, every 2 weeks for "all"
    const step = timeRange === "all" ? 2 : 1;

    for (let w = startWeek; w <= endWeek; w += step) {
      // Label: show month marker every 4 weeks
      const month = Math.floor(w / 4);
      const weekInMonth = w % 4;
      if (weekInMonth === 0) {
        labels.push(`${month}m`);
      } else if (timeRange !== "all" && (w === startWeek || w === endWeek)) {
        // Show start/end labels for zoomed views
        labels.push(`${month}m${weekInMonth}`);
      } else {
        labels.push("");
      }

      // Ideal range (always show up to 78 weeks, then plateau)
      if (w <= 78) {
        const ideal = getIdealWeightRange(w);
        idealMinData.push(ideal.min);
        idealMaxData.push(ideal.max);
      } else {
        // For adult ages beyond 78 weeks, use the mature plateau
        idealMinData.push(25.0);
        idealMaxData.push(30.0);
      }

      // Actual data: find entry closest to this week
      const entryForWeek = weightHistory.reduce<WeightEntry | null>((closest, e) => {
        const entryWeek = getAgeInWeeks(profile.birthDate, e.date);
        if (Math.abs(entryWeek - w) <= Math.abs(getAgeInWeeks(profile.birthDate, closest?.date || e.date) - w)) {
          return Math.abs(entryWeek - w) <= 1 ? e : closest;
        }
        return closest;
      }, null);

      // Only show actual data points if they fall within the zoom window
      const closestEntryWeek = entryForWeek ? getAgeInWeeks(profile.birthDate, entryForWeek.date) : -999;
      actualData.push(
        entryForWeek && closestEntryWeek >= startWeek - 1 && closestEntryWeek <= endWeek + 1
          ? entryForWeek.weightKg
          : null
      );

      // Projection data
      if (w > lastEntryWeek && trend.projectedWeights.length > 0) {
        const projWeek = w - lastEntryWeek;
        const proj = trend.projectedWeights.find((p) => p.week === projWeek);
        projectedData.push(proj ? proj.weight : null);
      } else if (w === lastEntryWeek) {
        projectedData.push(lastEntry.weightKg);
      } else {
        projectedData.push(null);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: "Fourchette idéale (max)",
          data: idealMaxData,
          borderColor: "rgba(192, 149, 108, 0.3)",
          backgroundColor: "rgba(240, 226, 208, 0.4)",
          fill: "-1",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.4,
          order: 3,
        },
        {
          label: "Fourchette idéale (min)",
          data: idealMinData,
          borderColor: "rgba(192, 149, 108, 0.3)",
          backgroundColor: "rgba(240, 226, 208, 0.4)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.4,
          order: 4,
        },
        {
          label: "Poids réel",
          data: actualData,
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
        },
        {
          label: "Projection (6 sem.)",
          data: projectedData,
          borderColor: "#6B8FA3",
          borderWidth: 2,
          borderDash: [8, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          order: 2,
        },
      ],
    };
  }, [weightHistory, zoomWindow, profile.birthDate, ageWeeks, trend, profile, timeRange]);

  // Dynamic Y axis based on visible data
  const yAxisRange = useMemo(() => {
    const { startWeek, endWeek } = zoomWindow;
    let minVal = Infinity;
    let maxVal = -Infinity;

    // Check ideal range
    for (let w = startWeek; w <= endWeek; w++) {
      const ideal = getIdealWeightRange(w);
      minVal = Math.min(minVal, ideal.min);
      maxVal = Math.max(maxVal, ideal.max);
    }

    // Check actual data within window
    weightHistory.forEach((e) => {
      const w = getAgeInWeeks(profile.birthDate, e.date);
      if (w >= startWeek && w <= endWeek) {
        minVal = Math.min(minVal, e.weightKg);
        maxVal = Math.max(maxVal, e.weightKg);
      }
    });

    // Add padding
    const padding = (maxVal - minVal) * 0.15;
    return {
      min: Math.max(0, Math.floor(minVal - padding)),
      max: Math.ceil(maxVal + padding),
    };
  }, [zoomWindow, weightHistory, profile.birthDate]);

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
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          color: "rgba(45,42,38,0.7)",
          filter: (item) => {
            return item.text !== "Fourchette idéale (max)";
          },
        },
      },
      tooltip: {
        backgroundColor: "#2D2A26",
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: "rgba(45,42,38,0.5)",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: timeRange === "all" ? 12 : 6,
        },
        border: { color: "rgba(45,42,38,0.1)" },
      },
      y: {
        min: yAxisRange.min,
        max: yAxisRange.max,
        grid: { color: "rgba(45,42,38,0.05)" },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: "rgba(45,42,38,0.5)",
          callback: (value) => `${value} kg`,
          stepSize: Math.max(1, Math.round((yAxisRange.max - yAxisRange.min) / 8)),
        },
        border: { display: false },
      },
    },
    animation: {
      duration: 600,
      easing: "easeOutQuart",
    },
  };

  // Pagination for weight history
  const sortedEntries = useMemo(() => {
    return [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [weightHistory]);

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / ITEMS_PER_PAGE));
  const paginatedEntries = sortedEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // CSV Export
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
    <div className="min-h-screen bg-[#FAF6F0] pb-24">
      <Header title="Courbe de croissance" showBack />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-4">
        {/* Time Range Filter */}
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => {
                setTimeRange(range.value);
                setCurrentPage(1);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === range.value
                  ? "bg-[#C8956C] text-white shadow-sm"
                  : "bg-white text-[rgba(45,42,38,0.6)] border border-[rgba(45,42,38,0.1)] shadow-sm hover:bg-[#FAF6F0]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-md"
        >
          {weightHistory.length > 0 ? (
            <div className="h-72">
              <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center flex-col gap-3">
              <Scale size={40} className="text-[rgba(45,42,38,0.2)]" />
              <p className="text-sm text-[rgba(45,42,38,0.5)] text-center">
                Saisissez au moins 2 pesées pour voir la courbe
              </p>
            </div>
          )}

          {weightHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[rgba(45,42,38,0.08)] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 rounded" style={{ height: "8px", backgroundColor: "rgba(240, 226, 208, 0.6)" }} />
                <span className="text-xs text-[rgba(45,42,38,0.6)]">Fourchette idéale (femelle Golden Retriever)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8956C]" />
                <span className="text-xs text-[rgba(45,42,38,0.6)]">Poids réel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 border-t-2 border-dashed border-[#6B8FA3]" />
                <span className="text-xs text-[rgba(45,42,38,0.6)]">Projection (tendance sur 6 sem.)</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Card */}
        {weightHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-md"
          >
            <h3 className="text-sm font-medium text-[rgba(45,42,38,0.6)] uppercase tracking-wider mb-4">
              Statistiques
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#FAF6F0] rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Scale size={14} className="text-[#C8956C]" />
                  <span className="text-xs text-[rgba(45,42,38,0.5)]">Poids de départ</span>
                </div>
                <p className="text-xl font-bold text-[#2D2A26]">
                  {stats.startingWeight} <span className="text-sm font-normal">kg</span>
                </p>
                {stats.startingDate && (
                  <p className="text-xs text-[rgba(45,42,38,0.5)]">
                    {format(new Date(stats.startingDate), "d MMM yyyy", { locale: fr })}
                  </p>
                )}
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-[#7A8B6E]" />
                  <span className="text-xs text-[rgba(45,42,38,0.5)]">Gain total</span>
                </div>
                <p className="text-xl font-bold text-[#2D2A26]">
                  +{stats.totalGain} <span className="text-sm font-normal">kg</span>
                </p>
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={14} className="text-[#6B8FA3]" />
                  <span className="text-xs text-[rgba(45,42,38,0.5)]">Pesées</span>
                </div>
                <p className="text-xl font-bold text-[#2D2A26]">{stats.weighingsCount}</p>
                <p className="text-xs text-[rgba(45,42,38,0.5)]">sur {stats.weeksTracked} semaines</p>
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-[#C8956C]" />
                  <span className="text-xs text-[rgba(45,42,38,0.5)]">Fourchette idéale</span>
                </div>
                <p className="text-lg font-bold text-[#2D2A26]">
                  {idealRange.min}-{idealRange.max} <span className="text-sm font-normal">kg</span>
                </p>
                <p className="text-xs text-[rgba(45,42,38,0.5)]">
                  {getWeightStatusLabel(weightStatus)}
                </p>
              </div>
            </div>

            {weightHistory.length >= 3 && (
              <div className="mt-4 p-3 rounded-xl border-l-4" style={{ borderLeftColor: trendColor, backgroundColor: "#FAF6F0" }}>
                <div className="flex items-center gap-2">
                  <TrendIcon size={18} style={{ color: trendColor }} />
                  <span className="font-medium text-sm text-[#2D2A26]">{trend.trendDescription}</span>
                  <span className="text-sm text-[rgba(45,42,38,0.6)]">
                    ({trend.trendRate > 0 ? "+" : ""}
                    {trend.trendRate} kg/mois)
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Export Buttons */}
        {weightHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-3"
          >
            <button
              onClick={exportCSV}
              className="flex-1 bg-white hover:bg-[#FAF6F0] text-[#2D2A26] rounded-xl py-3 px-4 shadow-sm border border-[rgba(45,42,38,0.1)] flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              <FileSpreadsheet size={16} className="text-[#7A8B6E]" />
              Export CSV
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
              className="flex-1 bg-white hover:bg-[#FAF6F0] text-[#2D2A26] rounded-xl py-3 px-4 shadow-sm border border-[rgba(45,42,38,0.1)] flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              <Download size={16} className="text-[#6B8FA3]" />
              Export JSON
            </button>
          </motion.div>
        )}

        {/* Paginated Weight History */}
        {weightHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-md"
          >
            <h3 className="text-sm font-medium text-[rgba(45,42,38,0.6)] uppercase tracking-wider mb-4">
              Historique des pesées
            </h3>

            <div className="space-y-2">
              {paginatedEntries.map((entry) => {
                const entryWeeks = getAgeInWeeks(profile.birthDate, entry.date);
                const entryAgeMonths = Math.floor(entryWeeks / 4);
                const entryAgeWeeksRemainder = entryWeeks % 4;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Scale size={16} className="text-[#C8956C]" />
                      <div>
                        <p className="font-semibold text-[#2D2A26]">{entry.weightKg} kg</p>
                        <p className="text-xs text-[rgba(45,42,38,0.5)]">
                          {format(new Date(entry.date), "d MMM yyyy", { locale: fr })}
                          {" · "}
                          {entryAgeMonths}m{entryAgeWeeksRemainder > 0 ? `${entryAgeWeeksRemainder}s` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.bodyConditionScore && (
                        <span className="px-2 py-0.5 bg-[#F0E2D0] rounded-full text-xs font-medium text-[#C8956C]">
                          BCS {entry.bodyConditionScore}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(45,42,38,0.08)]">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[#C8956C] disabled:text-[rgba(45,42,38,0.3)] disabled:cursor-not-allowed hover:bg-[#FAF6F0] transition-colors"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>
                <span className="text-sm text-[rgba(45,42,38,0.6)]">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[#C8956C] disabled:text-[rgba(45,42,38,0.3)] disabled:cursor-not-allowed hover:bg-[#FAF6F0] transition-colors"
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => navigate("/saisie")}
          className="w-full bg-[#C8956C] hover:bg-[#A67B5B] text-white rounded-2xl py-4 px-5 shadow-md flex items-center justify-center gap-2 transition-colors font-semibold"
        >
          <Scale size={20} />
          Saisir un nouveau poids
        </motion.button>
      </main>
    </div>
  );
}
