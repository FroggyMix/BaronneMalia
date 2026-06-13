import { differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { getIdealWeightRange, getIdealWeightRangeFromReference, getWeightStatus as _getWeightStatus, getWeightStatusLabel as _getWeightStatusLabel } from "@/data/growthCurve";
import type { WeightEntry, FeedingEntry } from "@/types";

// Re-export for convenience
export const getWeightStatus = _getWeightStatus;
export const getWeightStatusLabel = _getWeightStatusLabel;
export { getIdealWeightRangeFromReference };

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
 * Get formatted age string with context-aware precision:
 * - Under 1 year: "X mois et Y semaines" (e.g. "3 mois et 2 semaines")
 * - 1 to 5 years: "X ans et Y mois" (e.g. "2 ans et 6 mois")
 * - Over 5 years: "X ans" (e.g. "7 ans")
 */
export function getAgeDisplay(birthDate: string, referenceDate?: string): string {
  const days = getAgeInDays(birthDate, referenceDate);
  const weeks = Math.floor(days / 7);
  const totalMonths = getAgeInMonths(birthDate, referenceDate);
  const years = Math.floor(totalMonths / 12);

  // Under 1 year: months + weeks
  if (weeks < 52) {
    const months = Math.floor(weeks / 4.33);
    const remainingWeeks = Math.round(weeks - months * 4.33);
    if (months === 0) {
      return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
    }
    if (remainingWeeks <= 0) {
      return `${months} mois`;
    }
    return `${months} mois et ${remainingWeeks} semaine${remainingWeeks > 1 ? "s" : ""}`;
  }

  // 1 to 5 years: years + months
  if (years >= 1 && years < 5) {
    const remMonths = totalMonths % 12;
    if (remMonths === 0) return `${years} an${years > 1 ? "s" : ""}`;
    return `${years} an${years > 1 ? "s" : ""} et ${remMonths} mois`;
  }

  // Over 5 years: years only
  return `${years} an${years > 1 ? "s" : ""}`;
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
export function getCupsEstimate(dailyKcal: number, kcalPer100g?: number): string {
  const kcalPerCup = (kcalPer100g || 365) * 1.0; // 1 cup ≈ 100g for standard kibble
  const cups = dailyKcal / kcalPerCup;
  return cups.toFixed(1);
}

/**
 * Get grams estimate from daily kcal.
 * Uses custom kcalPer100g if provided, otherwise defaults to 365.
 */
export function getGramsEstimate(dailyKcal: number, kcalPer100g?: number): number {
  const kcalPer100 = kcalPer100g || 365;
  return Math.round((dailyKcal / kcalPer100) * 100);
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

  // Last measurement anchor point
  const lastEntry = recent[recent.length - 1];
  const lastAgeWeeks = getAgeInWeeksDecimal(birthDate, lastEntry.date);
  const lastWeight = lastEntry.weightKg;

  // === PROJECTION SLOPE: use local slope (last 2-3 points) for visual continuity ===
  // This ensures the projection follows the last visible segment of the curve,
  // avoiding a "jump" when the regression slope differs from recent direction.
  let localSlope: number;
  if (recent.length >= 3) {
    const e1 = recent[recent.length - 3];
    const e2 = recent[recent.length - 2];
    const e3 = recent[recent.length - 1];
    const x1 = getAgeInWeeksDecimal(birthDate, e1.date);
    const x2 = getAgeInWeeksDecimal(birthDate, e2.date);
    const x3 = getAgeInWeeksDecimal(birthDate, e3.date);
    // Weighted: more weight on the last segment (e2→e3)
    const seg1 = (e2.weightKg - e1.weightKg) / (x2 - x1 || 1);
    const seg2 = (e3.weightKg - e2.weightKg) / (x3 - x2 || 1);
    localSlope = seg1 * 0.25 + seg2 * 0.75; // 75% last segment, 25% previous
  } else if (recent.length >= 2) {
    const e1 = recent[recent.length - 2];
    const e2 = recent[recent.length - 1];
    const x1 = getAgeInWeeksDecimal(birthDate, e1.date);
    const x2 = getAgeInWeeksDecimal(birthDate, e2.date);
    localSlope = (e2.weightKg - e1.weightKg) / (x2 - x1 || 1);
  } else {
    localSlope = 0;
  }

  // === TREND DESCRIPTION: use full regression for stable trend text ===
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
  const regressionSlope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;

  // Project forward using LOCAL slope for visual continuity
  const projectedPoints: Array<{ x: number; y: number }> = [];
  projectedPoints.push({ x: lastAgeWeeks, y: lastWeight }); // anchor at last real point
  for (let w = 1; w <= weeksAhead; w++) {
    const ageWeeks = lastAgeWeeks + w;
    const projectedWeight = lastWeight + localSlope * w;
    projectedPoints.push({
      x: ageWeeks,
      y: Math.max(0.5, Math.round(projectedWeight * 10) / 10),
    });
  }

  // Trend description: age-adjusted thresholds for Golden Retriever puppies
  const monthlyRate = regressionSlope * 4.33;
  const lastAgeMonths = lastAgeWeeks / 4.33;

  // Age-appropriate thresholds (Golden Retriever female):
  // < 4 months: very rapid growth is normal (up to 4 kg/month)
  // 4-6 months: rapid growth normal (up to 2.5 kg/month)
  // 6-9 months: moderate growth (up to 1.2 kg/month)
  // > 9 months: slow growth / maintenance
  let rapidThreshold: number;
  let moderateThreshold: number;
  if (lastAgeMonths < 4) {
    rapidThreshold = 3.0;
    moderateThreshold = 1.5;
  } else if (lastAgeMonths < 6) {
    rapidThreshold = 2.0;
    moderateThreshold = 0.8;
  } else if (lastAgeMonths < 9) {
    rapidThreshold = 1.0;
    moderateThreshold = 0.4;
  } else {
    rapidThreshold = 0.5;
    moderateThreshold = 0.2;
  }

  let trendDescription: string;
  if (monthlyRate > rapidThreshold) trendDescription = "Hausse rapide";
  else if (monthlyRate > moderateThreshold) trendDescription = "Hausse modérée";
  else if (monthlyRate > -moderateThreshold) trendDescription = "Stable";
  else if (monthlyRate > -rapidThreshold) trendDescription = "Baisse modérée";
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
/**
 * Returns the appropriate trend color based on trend description and age.
 * Rapid growth is normal for young puppies -> green.
 */
export function getTrendColor(trendDescription: string, ageWeeks: number): string {
  const ageMonths = ageWeeks / 4.33;
  switch (trendDescription) {
    case "Hausse rapide":
      if (ageMonths < 4) return "#7A8B6E";   // < 4 months: perfectly normal
      if (ageMonths < 6) return "#C8956C";   // 4-6 months: watch
      return "#C06B5A";                       // > 6 months: too fast
    case "Hausse moderee":
      return "#7A8B6E";                        // Always green, ideal
    case "Stable":
      return "#7A8B6E";
    case "Baisse moderee":
      return "#C8956C";
    case "Baisse rapide":
      return "#C06B5A";                        // Always alarming
    default:
      return "rgba(45,42,38,0.4)";
  }
}

export function getFeedingRecommendation(
  currentWeightKg: number,
  ageWeeks: number,
  isNeutered: boolean,
  activityLevel: "sedentary" | "moderate" | "active" | "very_active",
  entries: WeightEntry[],
  birthDate: string,
  kcalPer100g?: number,
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
    cupsEstimate: getCupsEstimate(adjustedKcal, kcalPer100g),
    gramsEstimate: getGramsEstimate(adjustedKcal, kcalPer100g),
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
 * 
 * Logic:
 * - If weight is outside ideal range → adjust based on weight status + trend
 * - If weight is ideal → compare actual intake vs theoretical, use trend as fine-tuning
 * - Never recommend reducing if actual intake is already below theoretical
 * - Never recommend increasing if actual intake is already above theoretical
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
  adjustedKcal: number | null;
  adjustmentPercent: number;
} {
  // Compute average daily intake from last 14 days of recorded feedings
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentFeedings = feedingHistory
    .filter((f) => new Date(f.date) >= fourteenDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // kcal per gram by food type (approximate average values)
  const kcalPerGram: Record<string, number> = {
    croquettes: 3.7,
    "patée": 1.2,
    mix: 2.5,
    BARF: 1.5,
    maison: 1.8,
  };

  let actualKcal = 0;
  let sourceFeedings = recentFeedings;

  // FALLBACK: if no feedings in last 14 days, use the most recent entry
  if (recentFeedings.length === 0 && feedingHistory.length > 0) {
    const mostRecent = [...feedingHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    sourceFeedings = [mostRecent];
  }

  if (sourceFeedings.length > 0) {
    // Each FeedingEntry represents ONE DAY of feeding
    const totalGrams = sourceFeedings.reduce(
      (sum, f) => sum + f.mealsPerDay * f.quantityPerMealGrams,
      0
    );
    const avgFoodType = sourceFeedings[0].foodType;
    const kcalFactor = kcalPerGram[avgFoodType] || 3.0;
    const numDays = sourceFeedings.length;
    actualKcal = Math.round((totalGrams * kcalFactor) / numDays);
  }

  // Core principle: compare actual intake to theoretical needs
  const intakeRatio = theoreticalKcal > 0 ? actualKcal / theoreticalKcal : 1;

  let adjustmentPercent = 0;
  let reasoning = "";

  // === CASE 1: Overweight ===
  if (weightStatus === "overweight") {
    if (intakeRatio > 1.1) {
      // Actually eating too much
      if (trendDescription.includes("Hausse")) {
        adjustmentPercent = -15;
        reasoning = `Poids au-dessus de l'idéal ET apport réel (${actualKcal} kcal/j) supérieur aux besoins (${theoreticalKcal} kcal/j). Tendance à la hausse confirmée. Réduction de 15% nécessaire.`;
      } else {
        adjustmentPercent = -10;
        reasoning = `Poids au-dessus de l'idéal avec apport réel (${actualKcal} kcal/j) supérieur aux besoins (${theoreticalKcal} kcal/j). Réduction de 10% pour reprogresser vers la fourchette idéale.`;
      }
    } else if (intakeRatio < 0.9) {
      // Eating less than theoretical but still overweight
      // Could be recent change, orMER factors underestimated
      adjustmentPercent = -5;
      reasoning = `Poids au-dessus de l'idéal malgré un apport (${actualKcal} kcal/j) inférieur au calcul théorique (${theoreticalKcal} kcal/j). Légère réduction de 5% recommandée — le métabolisme réel peut être plus bas que la moyenne de référence.`;
    } else {
      // Intake matches theoretical but still overweight
      adjustmentPercent = -10;
      reasoning = `Poids au-dessus de l'idéal avec apport aligné sur les besoins théoriques. Réduction de 10% suggérée car les besoins individuels sont probablement inférieurs à la moyenne de référence.`;
    }
  }
  // === CASE 2: Underweight ===
  else if (weightStatus === "underweight") {
    if (intakeRatio < 0.9) {
      // Actually eating too little
      if (trendDescription.includes("Baisse")) {
        adjustmentPercent = +20;
        reasoning = `Poids en-dessous de l'idéal ET apport réel (${actualKcal} kcal/j) inférieur aux besoins (${theoreticalKcal} kcal/j). Tendance à la baisse. Augmentation de 20% urgente.`;
      } else {
        adjustmentPercent = +15;
        reasoning = `Poids en-dessous de l'idéal avec apport réel (${actualKcal} kcal/j) inférieur aux besoins (${theoreticalKcal} kcal/j). Augmentation de 15% pour reprendre du poids.`;
      }
    } else if (intakeRatio > 1.1) {
      // Eating more than theoretical but still underweight
      adjustmentPercent = +5;
      reasoning = `Poids en-dessous de l'idéal malgré un apport (${actualKcal} kcal/j) supérieur au calcul théorique. Le métabolisme de ${recentFeedings[0]?.foodType ? "votre chiot" : ""} est peut-être plus élevé. Augmentation de 5%, consulter un vétérinaire si persistant.`;
    } else {
      adjustmentPercent = +10;
      reasoning = `Poids en-dessous de l'idéal avec apport aligné sur les besoins théoriques. Augmentation de 10% car les besoins individuels sont probablement supérieurs à la moyenne.`;
    }
  }
  // === CASE 3: Ideal weight ===
  else {
    if (intakeRatio > 1.15) {
      // Eating significantly more than needed — preemptive reduction
      adjustmentPercent = -10;
      reasoning = `Poids idéal actuellement, mais apport réel (${actualKcal} kcal/j) dépasse les besoins théoriques (${theoreticalKcal} kcal/j) de ${Math.round((intakeRatio - 1) * 100)}%. Réduction préventive de 10% pour anticiper tout dérapage.`;
    } else if (intakeRatio < 0.85) {
      // Eating significantly less than theoretical
      adjustmentPercent = +10;
      reasoning = `Poids idéal actuellement, mais apport réel (${actualKcal} kcal/j) inférieur aux besoins théoriques (${theoreticalKcal} kcal/j) de ${Math.round((1 - intakeRatio) * 100)}%. Augmentation de 10% pour maintenir la croissance.`;
    } else if (intakeRatio > 1.05) {
      // Slightly above theoretical — minor preemptive adjustment
      adjustmentPercent = -5;
      reasoning = `Poids idéal avec apport légèrement au-dessus des besoins (${actualKcal} vs ${theoreticalKcal} kcal/j). Ajustement préventif de -5% pour maintenir l'idéal à long terme.`;
    } else if (intakeRatio < 0.95) {
      // Slightly below theoretical
      adjustmentPercent = +5;
      reasoning = `Poids idéal avec apport légèrement en-dessous des besoins (${actualKcal} vs ${theoreticalKcal} kcal/j). Ajustement de +5% pour sécuriser la croissance.`;
    } else {
      // Intake perfectly aligned with theoretical
      adjustmentPercent = 0;
      reasoning = `Apport réel (${actualKcal} kcal/j) parfaitement aligné sur les besoins théoriques (${theoreticalKcal} kcal/j). Le poids est idéal. Continuez sur cette lancée !`;
    }
  }

  const adjustedKcal = adjustmentPercent !== 0
    ? Math.round(theoreticalKcal * (1 + adjustmentPercent / 100))
    : null;

  return {
    status: adjustmentPercent < -10
      ? "Surconsommation significative"
      : adjustmentPercent < 0
      ? "Léger excès d'apport"
      : adjustmentPercent > 10
      ? "Sous-consommation significative"
      : adjustmentPercent > 0
      ? "Léger déficit d'apport"
      : "Apport optimal",
    reasoning,
    actualKcal,
    adjustedKcal,
    adjustmentPercent,
  };
}
