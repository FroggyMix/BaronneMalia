import type { GrowthPoint } from "@/types";

// Golden Retriever Female Growth Curve
// Consolidated from scientific and veterinary sources:
// - Pawlicy.com Golden Retriever Growth Chart
// - Waggel.co.uk Puppy Growth Guide  
// - PetInsurancereview.com Growth Patterns
// - AKC Breed Standards (55-65 lbs / 25-29.5 kg adult female)
// Data smoothed and interpolated for weekly granularity

export const GROWTH_CURVE_FEMALE_GOLDEN: GrowthPoint[] = [
  { weeks: 8,  minKg: 2.0,  maxKg: 4.0 },   // 2 months
  { weeks: 9,  minKg: 2.5,  maxKg: 4.8 },
  { weeks: 10, minKg: 3.1,  maxKg: 5.6 },
  { weeks: 11, minKg: 3.8,  maxKg: 6.5 },
  { weeks: 12, minKg: 4.5,  maxKg: 7.5 },   // 3 months
  { weeks: 13, minKg: 5.2,  maxKg: 8.3 },
  { weeks: 14, minKg: 5.9,  maxKg: 9.1 },
  { weeks: 15, minKg: 6.6,  maxKg: 9.9 },
  { weeks: 16, minKg: 7.2,  maxKg: 10.7 },  // 4 months
  { weeks: 17, minKg: 7.8,  maxKg: 11.3 },
  { weeks: 18, minKg: 8.4,  maxKg: 11.9 },
  { weeks: 19, minKg: 8.9,  maxKg: 12.4 },
  { weeks: 20, minKg: 9.4,  maxKg: 12.9 },  // 5 months
  { weeks: 21, minKg: 9.9,  maxKg: 13.4 },
  { weeks: 22, minKg: 10.4, maxKg: 13.9 },
  { weeks: 23, minKg: 10.9, maxKg: 14.4 },
  { weeks: 24, minKg: 11.4, maxKg: 14.9 },  // 6 months
  { weeks: 25, minKg: 11.8, maxKg: 15.4 },
  { weeks: 26, minKg: 12.2, maxKg: 15.9 },
  { weeks: 27, minKg: 12.6, maxKg: 16.4 },
  { weeks: 28, minKg: 13.0, maxKg: 16.9 },  // 7 months
  { weeks: 29, minKg: 13.4, maxKg: 17.3 },
  { weeks: 30, minKg: 13.8, maxKg: 17.7 },
  { weeks: 31, minKg: 14.2, maxKg: 18.1 },
  { weeks: 32, minKg: 14.6, maxKg: 18.5 },  // 8 months
  { weeks: 33, minKg: 15.0, maxKg: 18.9 },
  { weeks: 34, minKg: 15.4, maxKg: 19.3 },
  { weeks: 35, minKg: 15.8, maxKg: 19.7 },
  { weeks: 36, minKg: 16.2, maxKg: 20.1 },  // 9 months
  { weeks: 37, minKg: 16.6, maxKg: 20.5 },
  { weeks: 38, minKg: 17.0, maxKg: 20.9 },
  { weeks: 39, minKg: 17.4, maxKg: 21.3 },
  { weeks: 40, minKg: 17.8, maxKg: 21.7 },  // 10 months
  { weeks: 41, minKg: 18.2, maxKg: 22.1 },
  { weeks: 42, minKg: 18.6, maxKg: 22.5 },
  { weeks: 43, minKg: 19.0, maxKg: 22.9 },
  { weeks: 44, minKg: 19.4, maxKg: 23.3 },  // 11 months
  { weeks: 45, minKg: 19.8, maxKg: 23.7 },
  { weeks: 46, minKg: 20.2, maxKg: 24.1 },
  { weeks: 47, minKg: 20.6, maxKg: 24.5 },
  { weeks: 48, minKg: 21.0, maxKg: 24.9 },  // 12 months
  { weeks: 49, minKg: 21.3, maxKg: 25.2 },
  { weeks: 50, minKg: 21.6, maxKg: 25.5 },
  { weeks: 51, minKg: 21.9, maxKg: 25.8 },
  { weeks: 52, minKg: 22.2, maxKg: 26.1 },  // 13 months
  { weeks: 56, minKg: 23.0, maxKg: 27.0 },
  { weeks: 60, minKg: 23.5, maxKg: 27.5 },
  { weeks: 65, minKg: 24.0, maxKg: 28.0 },
  { weeks: 70, minKg: 24.5, maxKg: 28.5 },
  { weeks: 78, minKg: 25.0, maxKg: 29.5 },  // 18 months - mature
];

export function getIdealWeightRange(weeks: number): { min: number; max: number } {
  if (weeks <= 8) return { min: 1.5, max: 3.5 };
  if (weeks >= 78) return { min: 25.0, max: 29.5 };

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
