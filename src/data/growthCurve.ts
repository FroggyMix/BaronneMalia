import type { GrowthPoint } from "@/types";

// ============================================================
// GOLDEN RETRIEVER FEMALE GROWTH CURVE
// ============================================================
// Sources (consolidated 2025):
// - Waltham Petcare Science Institute (Royal Canin) - puppy growth charts
// - Waggel.co.uk (2025) - breed-specific growth data in kg
// - WindyKnoll Goldens (2021) - smallest/largest/average data
// - PetHelpful (2025) - growth averages
// - PetInsurancereview (2026) - female growth ranges
// - Pawlicy (2025) - female growth chart
//
// Category: Large breed female, estimated adult weight 25-29 kg
// Based on Waltham centile curves for the 25-40 kg adult weight category
// ============================================================

export const GROWTH_CURVE_FEMALE_GOLDEN: GrowthPoint[] = [
  // 2 months (8 weeks)
  { weeks: 8,  minKg: 4.0,  maxKg: 7.0 },
  { weeks: 9,  minKg: 4.5,  maxKg: 7.5 },
  { weeks: 10, minKg: 5.0,  maxKg: 8.0 },
  { weeks: 11, minKg: 5.5,  maxKg: 8.5 },

  // 3 months (12 weeks)
  { weeks: 12, minKg: 6.0,  maxKg: 9.5 },
  { weeks: 13, minKg: 6.5,  maxKg: 10.0 },
  { weeks: 14, minKg: 7.0,  maxKg: 10.5 },
  { weeks: 15, minKg: 7.5,  maxKg: 11.0 },

  // 4 months (16 weeks) — key milestone: ~half adult weight
  { weeks: 16, minKg: 8.0,  maxKg: 12.0 },
  { weeks: 17, minKg: 8.5,  maxKg: 12.5 },
  { weeks: 18, minKg: 9.0,  maxKg: 13.0 },
  { weeks: 19, minKg: 9.5,  maxKg: 13.5 },

  // 5 months (20 weeks)
  { weeks: 20, minKg: 10.0, maxKg: 14.5 },
  { weeks: 21, minKg: 10.5, maxKg: 15.0 },
  { weeks: 22, minKg: 11.0, maxKg: 15.5 },
  { weeks: 23, minKg: 11.5, maxKg: 16.0 },

  // 6 months (24 weeks) — ~2/3 adult weight
  { weeks: 24, minKg: 12.0, maxKg: 17.0 },
  { weeks: 25, minKg: 12.5, maxKg: 17.5 },
  { weeks: 26, minKg: 13.0, maxKg: 18.0 },

  // 7 months (28 weeks)
  { weeks: 28, minKg: 14.0, maxKg: 19.0 },
  { weeks: 29, minKg: 14.5, maxKg: 19.5 },
  { weeks: 30, minKg: 15.0, maxKg: 20.0 },
  { weeks: 31, minKg: 15.5, maxKg: 20.5 },

  // 8 months (32 weeks)
  { weeks: 32, minKg: 16.0, maxKg: 21.0 },
  { weeks: 33, minKg: 16.5, maxKg: 21.5 },
  { weeks: 34, minKg: 17.0, maxKg: 22.0 },
  { weeks: 35, minKg: 17.5, maxKg: 22.5 },

  // 9 months (36 weeks)
  { weeks: 36, minKg: 18.0, maxKg: 23.0 },
  { weeks: 37, minKg: 18.5, maxKg: 23.5 },
  { weeks: 38, minKg: 19.0, maxKg: 24.0 },
  { weeks: 39, minKg: 19.5, maxKg: 24.5 },

  // 10 months (40 weeks)
  { weeks: 40, minKg: 20.0, maxKg: 25.0 },
  { weeks: 41, minKg: 20.5, maxKg: 25.5 },
  { weeks: 42, minKg: 21.0, maxKg: 26.0 },
  { weeks: 43, minKg: 21.5, maxKg: 26.5 },

  // 11 months (44-47 weeks)
  { weeks: 44, minKg: 22.0, maxKg: 27.0 },
  { weeks: 45, minKg: 22.5, maxKg: 27.5 },
  { weeks: 46, minKg: 23.0, maxKg: 28.0 },
  { weeks: 47, minKg: 23.5, maxKg: 28.5 },

  // 12 months (48-51 weeks)
  { weeks: 48, minKg: 24.0, maxKg: 29.0 },
  { weeks: 49, minKg: 24.5, maxKg: 29.5 },
  { weeks: 50, minKg: 25.0, maxKg: 30.0 },
  { weeks: 51, minKg: 25.0, maxKg: 30.0 },

  // 13+ months — mature
  { weeks: 52, minKg: 25.0, maxKg: 30.0 },
  { weeks: 56, minKg: 25.0, maxKg: 30.0 },
  { weeks: 60, minKg: 25.0, maxKg: 30.0 },
  { weeks: 65, minKg: 25.0, maxKg: 30.0 },
  { weeks: 70, minKg: 25.0, maxKg: 30.0 },
  { weeks: 78, minKg: 25.0, maxKg: 30.0 },
];

export function getIdealWeightRange(weeks: number): { min: number; max: number } {
  if (weeks <= 8) return { min: 3.5, max: 6.5 };
  if (weeks >= 78) return { min: 25.0, max: 30.0 };

  // Find surrounding data points
  let lower = GROWTH_CURVE_FEMALE_GOLDEN[0];
  let upper = GROWTH_CURVE_FEMALE_GOLDEN[GROWTH_CURVE_FEMALE_GOLDEN.length - 1];

  for (let i = 0; i < GROWTH_CURVE_FEMALE_GOLDEN.length - 1; i++) {
    if (weeks >= GROWTH_CURVE_FEMALE_GOLDEN[i].weeks && weeks <= GROWTH_CURVE_FEMALE_GOLDEN[i + 1].weeks) {
      lower = GROWTH_CURVE_FEMALE_GOLDEN[i];
      upper = GROWTH_CURVE_FEMALE_GOLDEN[i + 1];
      break;
    }
  }

  const range = upper.weeks - lower.weeks;
  const progress = range === 0 ? 0 : (weeks - lower.weeks) / range;

  return {
    min: Math.round((lower.minKg + (upper.minKg - lower.minKg) * progress) * 10) / 10,
    max: Math.round((lower.maxKg + (upper.maxKg - lower.maxKg) * progress) * 10) / 10,
  };
}

export function getWeightStatus(currentWeight: number, ageWeeks: number): "underweight" | "ideal" | "overweight" {
  const ideal = getIdealWeightRange(ageWeeks);
  // Use a wider tolerance band (30% of the range) for "ideal" classification
  const tolerance = (ideal.max - ideal.min) * 0.3;

  if (currentWeight < ideal.min - tolerance * 0.5) return "underweight";
  if (currentWeight > ideal.max + tolerance * 0.5) return "overweight";
  return "ideal";
}

export function getWeightStatusLabel(status: "underweight" | "ideal" | "overweight"): string {
  switch (status) {
    case "underweight": return "Sous-poids";
    case "ideal": return "Poids idéal";
    case "overweight": return "Surpoids";
  }
}
