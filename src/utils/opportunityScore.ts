import type { BadgeTone } from '../components/Badge';

// Bölüm 4.2: Fırsat Skoru (0-100) — kâr marjı (%70 ağırlık) ve ekspertiz
// riski (%30 ağırlık) birleşiminden hesaplanır. Statik bir sayı değil,
// alış/satış fiyatı ve risk seviyesinden türetilen gerçek bir puandır.
const MARGIN_REFERENCE_RATIO = 0.35; // %35 kâr marjı tam puan alır

const RISK_SCORE: Record<BadgeTone, number> = {
  positive: 90, // düşük risk
  neutral: 70,
  warning: 55, // orta risk
  negative: 25, // yüksek risk
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateOpportunityScore(
  buyPriceTl: number,
  estimatedSellPriceTl: number,
  riskTone: BadgeTone,
): number {
  const marginRatio = (estimatedSellPriceTl - buyPriceTl) / buyPriceTl;
  const marginScore = clamp((marginRatio / MARGIN_REFERENCE_RATIO) * 100, 0, 100);
  const riskScore = RISK_SCORE[riskTone];
  return Math.round(marginScore * 0.7 + riskScore * 0.3);
}
