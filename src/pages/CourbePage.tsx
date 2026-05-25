import { useState, useMemo, useEffect } from "react";
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
import { getIdealWeightRangeRef, getReferenceData, GROWTH_REFERENCES } from "@/data/growthReferences";
import {
  getAgeInWeeksDecimal,
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
  onExport?: () => string;
  onImport?: (json: string) => boolean;
  onResetDemo?: () => void;
  onClearAll?: () => void;
  onUpdateReference?: (id: string) => void;
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

function formatAgeLabel(weeks: number): string {
  const months = Math.floor(weeks / 4);
  const remWeeks = Math.round((weeks % 4) * 10) / 10;
  if (months === 0) return `${remWeeks.toFixed(0)}s`;
  if (remWeeks < 0.3) return `${months}m`;
  return `${months}m${Math.round(remWeeks)}s`;
}

export function CourbePage({ data, selectedReference, onExport, onImport, onResetDemo, onClearAll, onUpdateReference }: CourbePageProps) {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  const [showRefSelector, setShowRefSelector] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { profile, weightHistory } = data;
  const ageWeeksDecimal = getAgeInWeeksDecimal(profile.birthDate);
  const stats = getWeightStats(weightHistory);
  const trend = projectWeightTrend(weightHistory, profile.birthDate, 6);
  const currentWeight = stats.currentWeight || 0;
  const weightStatus = getWeightStatus(currentWeight, Math.round(ageWeeksDecimal));
  const idealRange = getIdealWeightRangeRef(Math.round(ageWeeksDecimal), selectedReference);

  // X-axis zoom window (in weeks since birth, with decimals)
  const { startWeek, endWeek } = useMemo(() => {
    const end = ageWeeksDecimal + 3;
    let start: number;
    switch (timeRange) {
      case "1m": start = Math.max(8, ageWeeksDecimal - 5); break;
      case "3m": start = Math.max(8, ageWeeksDecimal - 14); break;
      case "6m": start = Math.max(8, ageWeeksDecimal - 27); break;
      default: start = 8;
    }
    return { startWeek: start, endWeek: end };
  }, [ageWeeksDecimal, timeRange]);

  // Y range from visible data
  const { yMin, yMax } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;
    const refData = getReferenceData(selectedReference);
    
    for (let w = Math.floor(startWeek); w <= Math.ceil(endWeek); w++) {
      const d = refData.find((p) => p.week === w);
      if (d) {
        minVal = Math.min(minVal, d.minKg);
        maxVal = Math.max(maxVal, d.maxKg);
      }
    }
    weightHistory.forEach((e) => {
      const w = getAgeInWeeksDecimal(profile.birthDate, e.date);
      if (w >= startWeek && w <= endWeek) {
        minVal = Math.min(minVal, e.weightKg);
        maxVal = Math.max(maxVal, e.weightKg);
      }
    });
    trend.projectedPoints.forEach((p) => {
      if (p.x >= startWeek && p.x <= endWeek) {
        minVal = Math.min(minVal, p.y);
        maxVal = Math.max(maxVal, p.y);
      }
    });
    const range = maxVal - minVal;
    return {
      yMin: Math.max(0, Math.floor((minVal - range * 0.1) * 10) / 10),
      yMax: Math.ceil((maxVal + range * 0.1) * 10) / 10,
    };
  }, [startWeek, endWeek, weightHistory, profile.birthDate, trend, selectedReference]);

  // Build chart datasets
  const chartData = useMemo((): ChartData<"line"> => {
    if (weightHistory.length === 0) return { labels: [], datasets: [] };

    const refData = getReferenceData(selectedReference);

    // 1. Ideal min curve - smooth linear interpolation between integer weeks
    const idealMinPoints: Point[] = [];
    const idealMaxPoints: Point[] = [];
    const step = 0.25;
    for (let w = startWeek; w <= endWeek + 0.01; w += step) {
      const w0 = Math.floor(w);
      const frac = w - w0;
      const p0 = refData.find((d) => d.week === w0);
      const p1 = refData.find((d) => d.week === w0 + 1);
      let minV: number, maxV: number;
      if (p0 && p1) {
        minV = p0.minKg + (p1.minKg - p0.minKg) * frac;
        maxV = p0.maxKg + (p1.maxKg - p0.maxKg) * frac;
      } else if (p0) {
        minV = p0.minKg; maxV = p0.maxKg;
      } else {
        const first = refData[0];
        minV = first.minKg; maxV = first.maxKg;
      }
      idealMinPoints.push({ x: Math.round(w * 100) / 100, y: Math.round(minV * 100) / 100 });
      idealMaxPoints.push({ x: Math.round(w * 100) / 100, y: Math.round(maxV * 100) / 100 });
    }

    // 2. Actual measurements - EXACT decimal age, no rounding/flooring
    const sortedEntries = [...weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const actualPoints: Point[] = sortedEntries.map((e) => ({
      x: Math.round(getAgeInWeeksDecimal(profile.birthDate, e.date) * 100) / 100,
      y: e.weightKg,
    }));

    // 3. Projection - starts from the last measurement point (no duplicate anchor)
    const projPoints: Point[] = [];
    if (actualPoints.length > 0 && trend.projectedPoints.length > 0) {
      const lastActual = actualPoints[actualPoints.length - 1];
      for (const p of trend.projectedPoints) {
        if (p.x > lastActual.x && p.x <= endWeek) {
          projPoints.push({ x: Math.round(p.x * 100) / 100, y: p.y });
        }
      }
      // Connect projection to last actual point
      if (projPoints.length > 0) {
        projPoints.unshift({ x: lastActual.x, y: lastActual.y });
      }
    }

    // Dark mode colors
    const fillColor = isDark ? "rgba(200, 149, 108, 0.15)" : "rgba(240, 226, 208, 0.5)";
    const bandColor = isDark ? "rgba(200, 149, 108, 0.5)" : "rgba(192, 149, 108, 0.5)";

    return {
      datasets: [
        // [0] MIN curve (rendered first, below max)
        {
          label: "Min",
          data: idealMinPoints as any,
          borderColor: bandColor,
          backgroundColor: fillColor,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          xAxisID: "x",
          order: 3,
        },
        // [1] MAX curve (fill towards [0] = min)
        {
          label: "Fourchette idéale",
          data: idealMaxPoints as any,
          borderColor: bandColor,
          backgroundColor: fillColor,
          fill: "-1",
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          xAxisID: "x",
          order: 2,
        },
        // [2] Actual weights
        {
          label: "Poids réel",
          data: actualPoints as any,
          borderColor: "#C8956C",
          backgroundColor: "#C8956C",
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#C8956C",
          pointBorderColor: isDark ? "#242320" : "#FFFFFF",
          pointBorderWidth: 2,
          tension: 0.3,
          order: 1,
          xAxisID: "x",
        },
        // [3] Projection
        {
          label: "Projection (6 sem.)",
          data: projPoints as any,
          borderColor: "#6B8FA3",
          backgroundColor: "rgba(107, 143, 163, 0.08)",
          borderWidth: 2,
          borderDash: [8, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          order: 0,
          xAxisID: "x",
        },
      ],
    };
  }, [weightHistory, startWeek, endWeek, profile.birthDate, trend, timeRange, selectedReference, isDark]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: true },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyleWidth: 10,
          padding: 20,
          font: { family: "'Inter', sans-serif", size: 12 },
          color: isDark ? "rgba(245,240,232,0.7)" : "rgba(45,42,38,0.7)",
          filter: (item) => item.text !== "Min",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1E1D1B" : "#2D2A26",
        titleColor: isDark ? "#F5F0E8" : "#FFFFFF",
        bodyColor: isDark ? "#F5F0E8" : "#FFFFFF",
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items: any) => {
            if (!items.length) return "";
            const week = Number(items[0].parsed.x);
            return `Âge : ${formatAgeLabel(week)}`;
          },
          label: (item: any) => {
            const val = Number(item.parsed.y).toFixed(1);
            if (item.dataset.label === "Poids réel") return `Poids : ${val} kg`;
            if (item.dataset.label === "Projection (6 sem.)") return `Projection : ${val} kg`;
            return undefined;
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
          color: isDark ? "rgba(245,240,232,0.5)" : "rgba(45,42,38,0.5)",
          maxRotation: 0,
          autoSkip: false,
          callback: function (value) {
            const week = Number(value);
            const rem = week % 4;
            if (Math.abs(rem) < 0.3 || Math.abs(rem - 4) < 0.3) {
              return formatAgeLabel(week);
            }
            if (timeRange === "1m" && (Math.abs(rem - 2) < 0.3)) {
              return formatAgeLabel(week);
            }
            return "";
          },
          stepSize: 1,
        },
        border: { color: isDark ? "rgba(245,240,232,0.1)" : "rgba(45,42,38,0.1)" },
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { color: isDark ? "rgba(245,240,232,0.08)" : "rgba(45,42,38,0.06)" },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: isDark ? "rgba(245,240,232,0.5)" : "rgba(45,42,38,0.5)",
          callback: (value) => `${value} kg`,
          stepSize: Math.max(0.5, Math.round((yMax - yMin) / 6 * 10) / 10),
        },
        border: { display: false },
      },
    },
    animation: { duration: 400, easing: "easeOutQuart" },
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
      String(getAgeInWeeksDecimal(profile.birthDate, e.date).toFixed(1)),
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
      <Header title="Courbe de croissance" showBack selectedReference={selectedReference} onExport={onExport} onImport={onImport} onResetDemo={onResetDemo} onClearAll={onClearAll} onUpdateReference={onUpdateReference} />

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
            <>
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowRefSelector((s) => !s)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors"
                  style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}
                >
                  Référentiel : {GROWTH_REFERENCES.find((r) => r.id === selectedReference)?.shortLabel || selectedReference}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showRefSelector ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>

              {showRefSelector && (
                <div className="mt-2 rounded-xl p-3 space-y-1" style={{ backgroundColor: "var(--bm-surface)", border: "1px solid var(--bm-border)" }}>
                  {GROWTH_REFERENCES.map((ref) => (
                    <button
                      key={ref.id}
                      onClick={() => {
                        onUpdateReference?.(ref.id);
                        setShowRefSelector(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors"
                      style={selectedReference === ref.id ? { backgroundColor: "var(--bm-pale-gold)" } : {}}
                      onMouseEnter={(e) => { if (selectedReference !== ref.id) e.currentTarget.style.backgroundColor = "rgba(200,149,108,0.1)"; }}
                      onMouseLeave={(e) => { if (selectedReference !== ref.id) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium" style={{ color: "var(--bm-charcoal)" }}>{ref.shortLabel}</span>
                          <span className="px-1 py-0 rounded text-[9px] font-medium" style={{ backgroundColor: ref.quality === 'A' || ref.quality === 'A-' ? '#D4E0CD' : '#F0E2D0', color: ref.quality === 'A' || ref.quality === 'A-' ? '#7A8B6E' : '#C8956C' }}>{ref.quality}</span>
                          {ref.recommended && <span className="px-1 py-0 rounded text-[9px] font-medium" style={{ backgroundColor: 'var(--bm-pale-gold)', color: 'var(--bm-gold)' }}>✓</span>}
                        </div>
                      </div>
                      {selectedReference === ref.id && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--bm-gold)" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid var(--bm-border)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C8956C" }} />
                  <span className="text-xs" style={{ color: "var(--bm-text-secondary)" }}>Poids réel</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 rounded" style={{ height: "10px", backgroundColor: isDark ? "rgba(200,149,108,0.2)" : "rgba(240,226,208,0.8)", border: `1px solid ${isDark ? "rgba(200,149,108,0.5)" : "rgba(192,149,108,0.5)"}` }} />
                  <span className="text-xs" style={{ color: "var(--bm-text-secondary)" }}>Fourchette idéale</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 border-t-2 border-dashed" style={{ borderColor: "#6B8FA3" }} />
                  <span className="text-xs" style={{ color: "var(--bm-text-secondary)" }}>Projection (6 sem.)</span>
                </div>
              </div>
            </>
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
                const entryWeeks = getAgeInWeeksDecimal(profile.birthDate, entry.date);
                const months = Math.floor(entryWeeks / 4);
                const remWeeks = Math.round(entryWeeks % 4);
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
