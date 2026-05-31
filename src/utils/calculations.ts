import { differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { getIdealWeightRange, getWeightStatus as _getWeightStatus, getWeightStatusLabel as _getWeightStatusLabel } from "@/data/growthCurve";
import type { WeightEntry, FeedingEntry } from "@/types";

// Re-export for convenience
export const getWeightStatus = _getWeightStatus;
export const getWeightStatusLabel = _getWeightStatusLabel;

/**
 * Get age in days (precise, for chart positioning)
 */
export function getAgeInDays(birthDate: string, referenceDate?: string): number {
  const birth = new Date(birthDate);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  return differenceInDays(ref, birth);
}

/**
 * Get age in weeks with decimal precision (for chart X-axis)
 * Returns exact value: 10.4 weeks = 10 weeks + 3 days
 */
export function getAgeInWeeksDecimal(birthDate: string, referenceDate?: string): number {
  const days = getAgeInDays(birthDate, referenceDate);
  return days / 7;
}

/**
 * Calculate Resting Energy Requirement (RER)
 * Formula: RER = 70 × (body weight in kg)^0.75
 * Source: NRC 2006, FEDIAF 2024
 */
export function calculateRER(weightKg: number): number {
  if (weightKg <= 0) return 0;
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * Calculate Maintenance Energy Requirement (MER)
 * Source: FEDIAF 2024, NRC 2006
 */
export function calculateMER(
  weightKg: number,
  ageWeeks: number,
  isNeutered: boolean,
  activityLevel: "sedentary" | "moderate" | "active" | "very_active" = "moderate"
): number {
  const rer = calculateRER(weightKg);
  let multiplier: number;

  if (ageWeeks <= 16) {
    // Puppy < 4 months
    multiplier = 3.0;
  } else if (ageWeeks <= 26) {
    // Puppy 4-6 months
    multiplier = 2.5;
  } else if (ageWeeks <= 52) {
    // Puppy 6-12 months
    multiplier = 2.0;
  } else {
    // Adult
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.4,
      moderate: 1.6,
      active: 2.0,
      very_active: 3.0,
    };
    multiplier = activityMultipliers[activityLevel] || 1.6;
    if (isNeutered) multiplier *= 0.85; // 15% reduction for neutered dogs
  }

  return Math.round(rer * multiplier);
}

/**
 * Get age in weeks from birth date to reference date
 */
export function getAgeInWeeks(birthDate: string, referenceDate?: string): number {
  const birth = new Date(birthDate);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const weeks = differenceInWeeks(ref, birth);
  return Math.max(0, weeks);
}

/**
 * Get age in months (for display)
 */
export function getAgeInMonths(birthDate: string, referenceDate?: string): number {
  const birth = new Date(birthDate);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  return Math.max(0, differenceInMonths(ref, birth));
}

/**
 * Get formatted age string (e.g. "15 semaines (3.5 mois)")
 */
export function getAgeDisplay(birthDate: string, referenceDate?: string): string {
  const weeks = getAgeInWeeks(birthDate, referenceDate);
  const months = getAgeInMonths(birthDate, referenceDate);
  const remainingWeeks = weeks % 4;
  
  if (weeks < 8) {
    return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  
  if (weeks < 52) {
    if (remainingWeeks === 0) {
      return `${months} mois`;
    }
    return `${months}.${Math.round(remainingWeeks / 4 * 10)} mois (${weeks} sem.)`;
  }
  
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} et ${remMonths} mois`;
}

/**
 * Get meal frequency based on age
 */
export function getMealFrequency(ageWeeks: number): number {
  if (ageWeeks <= 12) return 4;
  if (ageWeeks <= 24) return 3;
  return 2;
}

/**
 * Calculate cups estimate from daily kcal
 * Standard kibble: ~365 kcal per cup (350-380 range)
 */
export function getCupsEstimate(dailyKcal: number): string {
  const KCAL_PER_CUP = 365;
  const cups = dailyKcal / KCAL_PER_CUP;
  return cups.toFixed(1);
}

/**
 * Get grams estimate from daily kcal
 * Standard kibble: ~365 kcal/100g
 */
export function getGramsEstimate(dailyKcal: number): number {
  const KCAL_PER_100G = 365;
  return Math.round((dailyKcal / KCAL_PER_100G) * 100);
}

/**
 * Project weight trend using linear regression (ordinary least squares)
 * on recent entries. Returns projection points with absolute age in weeks.
 */
export function projectWeightTrend(
  entries: WeightEntry[],
  birthDate: string,
  weeksAhead: number = 6
): { projectedPoints: Array<{ x: number; y: number }>; trendDescription: string; trendRate: number } {
  if (entries.length < 2) {
    return { projectedPoints: [], trendDescription: "Pas assez de données", trendRate: 0 };
  }

  // Sort by date, take last 6 entries for responsive trend
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const recent = sorted.slice(-6);

  // Linear regression: y = slope * x + intercept
  // x = age in weeks, y = weight in kg
  const n = recent.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const entry of recent) {
    const x = getAgeInWeeks(birthDate, entry.date);
    const y = entry.weightKg;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { projectedPoints: [], trendDescription: "Tendance stable", trendRate: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator; // kg per week

  // Last measurement anchor point
  const lastEntry = recent[recent.length - 1];
  const lastAgeWeeks = getAgeInWeeks(birthDate, lastEntry.date);
  const lastWeight = lastEntry.weightKg;

  // Project forward: start exactly from last known point
  const projectedPoints: Array<{ x: number; y: number }> = [];
  for (let w = 1; w <= weeksAhead; w++) {
    const ageWeeks = lastAgeWeeks + w;
    const projectedWeight = lastWeight + slope * w;
    projectedPoints.push({
      x: ageWeeks,
      y: Math.max(0.5, Math.round(projectedWeight * 10) / 10),
    });
  }

  // Trend description
  const monthlyRate = slope * 4.33;
  let trendDescription: string;

  if (monthlyRate > 1.5) trendDescription = "Hausse rapide";
  else if (monthlyRate > 0.5) trendDescription = "Hausse modérée";
  else if (monthlyRate > -0.5) trendDescription = "Stable";
  else if (monthlyRate > -1.5) trendDescription = "Baisse modérée";
  else trendDescription = "Baisse rapide";

  return {
    projectedPoints,
    trendDescription,
    trendRate: Math.round(monthlyRate * 100) / 100,
  };
}

/**
 * Get feeding recommendation with adjustments based on weight status and trend
 */
export function getFeedingRecommendation(
  currentWeightKg: number,
  ageWeeks: number,
  isNeutered: boolean,
  activityLevel: "sedentary" | "moderate" | "active" | "very_active",
  entries: WeightEntry[],
  birthDate: string,
): {
  dailyKcal: number;
  mealsPerDay: number;
  kcalPerMeal: number;
  cupsEstimate: string;
  gramsEstimate: number;
  recommendation: string;
  warning?: string;
  adjusted: boolean;
} {
  const mer = calculateMER(currentWeightKg, ageWeeks, isNeutered, activityLevel);
  const idealRange = getIdealWeightRange(ageWeeks);
  
  let adjustedKcal = mer;
  let adjusted = false;
  let warning: string | undefined;
  
  // Weight-based adjustments
  if (currentWeightKg > idealRange.max * 1.05) {
    adjustedKcal *= 0.9; // Reduce 10% if overweight
    adjusted = true;
    warning = "Le poids est légèrement au-dessus de l'idéal. Ration réduite de 10%.";
  } else if (currentWeightKg > idealRange.max * 1.15) {
    adjustedKcal *= 0.8; // Reduce 20% if significantly overweight
    adjusted = true;
    warning = "Surpoids significatif. Ration réduite de 20%. Consultez votre vétérinaire.";
  } else if (currentWeightKg < idealRange.min * 0.95) {
    adjustedKcal *= 1.1; // Increase 10% if underweight
    adjusted = true;
    warning = "Le poids est en-dessous de l'idéal. Ration augmentée de 10%.";
  } else if (currentWeightKg < idealRange.min * 0.85) {
    adjustedKcal *= 1.2; // Increase 20% if significantly underweight
    adjusted = true;
    warning = "Sous-poids significatif. Ration augmentée de 20%. Consultez votre vétérinaire.";
  }
  
  // Trend-based adjustments
  if (entries.length >= 3) {
    const trend = projectWeightTrend(entries, birthDate, 2);
    if (trend.trendRate > 1.5 && !adjusted) {
      adjustedKcal *= 0.95;
      adjusted = true;
    } else if (trend.trendRate < -0.5 && !adjusted) {
      adjustedKcal *= 1.05;
      adjusted = true;
    }
  }
  
  adjustedKcal = Math.round(adjustedKcal);
  const meals = getMealFrequency(ageWeeks);
  const kcalPerMeal = Math.round(adjustedKcal / meals);
  
  const recommendation = ageWeeks <= 52
    ? `Pour un chiot de ${ageWeeks} semaines pesant ${currentWeightKg} kg, les besoins sont estimés à ${adjustedKcal} kcal/jour. Répartissez en ${meals} repas pour une digestion optimale et une glycémie stable.`
    : `Pour un Golden Retriever adulte de ${currentWeightKg} kg avec une activité ${activityLevel}, les besoins sont estimés à ${adjustedKcal} kcal/jour. Répartissez en ${meals} repas.`;
  
  return {
    dailyKcal: adjustedKcal,
    mealsPerDay: meals,
    kcalPerMeal,
    cupsEstimate: getCupsEstimate(adjustedKcal),
    gramsEstimate: getGramsEstimate(adjustedKcal),
    recommendation,
    warning,
    adjusted,
  };
}

/**
 * Get weight statistics for the history
 */
export function getWeightStats(entries: WeightEntry[]): {
  startingWeight: number | null;
  startingDate: string | null;
  currentWeight: number | null;
  currentDate: string | null;
  totalGain: number | null;
  averageWeeklyGain: number | null;
  weeksTracked: number;
  weighingsCount: number;
} {
  if (entries.length === 0) {
    return {
      startingWeight: null,
      startingDate: null,
      currentWeight: null,
      currentDate: null,
      totalGain: null,
      averageWeeklyGain: null,
      weeksTracked: 0,
      weighingsCount: 0,
    };
  }

  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const firstDate = new Date(first.date);
  const lastDate = new Date(last.date);
  const weeksTracked = Math.max(1, differenceInWeeks(lastDate, firstDate));
  
  const totalGain = Math.round((last.weightKg - first.weightKg) * 10) / 10;
  const averageWeeklyGain = Math.round((totalGain / weeksTracked) * 100) / 100;

  return {
    startingWeight: first.weightKg,
    startingDate: first.date,
    currentWeight: last.weightKg,
    currentDate: last.date,
    totalGain,
    averageWeeklyGain,
    weeksTracked,
    weighingsCount: entries.length,
  };
}

/**
 * Get BCS description
 */
export function getBCSDescription(score: number): string {
  if (score <= 2) return "Très maigre";
  if (score === 3) return "Maigre";
  if (score === 4) return "Légèrement maigre (idéal pour chiot)";
  if (score === 5) return "Idéal";
  if (score === 6) return "Légèrement en surpoids";
  if (score === 7) return "Surpoids";
  if (score >= 8) return "Obèse";
  return "";
}

/**
 * Compare real feeding intake with theoretical needs, adjusted for weight status and trend.
 * Returns actionable recommendation with percentage adjustment.
 */
export function getFeedingAnalysis(
  feedingHistory: FeedingEntry[],
  theoreticalKcal: number,
  weightStatus: string,
  trendDescription: string,
): {
  status: string;
  reasoning: string;
  actualKcal: number;
  adjustedKcal: number;
  adjustmentPercent: number;
} {
  // Compute average daily intake from last 7 days of recorded feedings
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentFeedings = feedingHistory
    .filter((f) => new Date(f.date) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Average daily kcal consumed (approximate: 1g croquettes ≈ 3.5-4 kcal, patee ≈ 1.2 kcal/g)
  // Simplified: use kcal/g factor based on food type
  const kcalPerGram: Record<string, number> = {
    croquettes: 3.7,
    "patée": 1.2,
    mix: 2.5,
    BARF: 1.5,
    maison: 1.8,
  };

  let actualKcal = 0;
  if (recentFeedings.length > 0) {
    const totalGrams = recentFeedings.reduce(
      (sum, f) => sum + f.mealsPerDay * f.quantityPerMealGrams,
      0
    );
    const avgFoodType = recentFeedings[0].foodType;
    const kcalFactor = kcalPerGram[avgFoodType] || 3.0;
    // Normalize to daily average over the period
    const daysCovered = Math.max(1, recentFeedings.length / (recentFeedings[0]?.mealsPerDay || 2));
    actualKcal = Math.round((totalGrams * kcalFactor) / daysCovered);
  }

  // Determine adjustment based on weight status + trend
  let adjustmentPercent = 0;
  let reasoning = "";

  if (weightStatus === "overweight") {
    if (trendDescription.includes("Hausse")) {
      adjustmentPercent = -20;
      reasoning = `Le poids est au-dessus de l'idéal avec une tendance à la hausse (${trendDescription.toLowerCase()}). L'apport actuel (${actualKcal} kcal/j) dépasse les besoins. Une réduction de 20% est recommandée pour inverser la courbe.`;
    } else {
      adjustmentPercent = -10;
      reasoning = `Le poids est au-dessus de l'idéal. L'apport actuel (${actualKcal} kcal/j) légèrement supérieur aux besoins théoriques (${theoreticalKcal} kcal). Réduction de 10% pour revenir dans la fourchette.`;
    }
  } else if (weightStatus === "underweight") {
    if (trendDescription.includes("Baisse")) {
      adjustmentPercent = +20;
      reasoning = `Le poids est en-dessous de l'idéal avec une tendance à la baisse. L'apport actuel (${actualKcal} kcal/j) est insuffisant. Une augmentation de 20% est nécessaire pour reprendre du poids de manière saine.`;
    } else {
      adjustmentPercent = +10;
      reasoning = `Le poids est en-dessous de l'idéal. L'apport actuel (${actualKcal} kcal/j) est légèrement insuffisant. Augmentation de 10% pour progresser vers le poids cible.`;
    }
  } else {
    // Ideal weight — use trend to fine-tune
    if (trendDescription === "Hausse rapide") {
      adjustmentPercent = -5;
      reasoning = `Poids idéal mais croissance très rapide. Légère réduction de 5% pour ralentir et éviter un surpoids précoce qui pourrait aggraver la dysplasie de hanche.`;
    } else if (trendDescription === "Baisse modérée" || trendDescription === "Baisse rapide") {
      adjustmentPercent = +5;
      reasoning = `Poids idéal mais légère baisse détectée. Augmentation de 5% pour maintenir la trajectoire de croissance optimale.`;
    } else {
      adjustmentPercent = 0;
      reasoning = `Le poids est idéal et la tendance est stable. L'apport actuel (${actualKcal} kcal/j) est bien adapté. Continuez sur cette lancée.`;
    }
  }

  const adjustedKcal = Math.round(theoreticalKcal * (1 + adjustmentPercent / 100));

  return {
    status: adjustmentPercent < 0
      ? "Surconsommation détectée"
      : adjustmentPercent > 0
      ? "Sous-consommation détectée"
      : "Apport optimal",
    reasoning,
    actualKcal,
    adjustedKcal,
    adjustmentPercent,
  };
}
