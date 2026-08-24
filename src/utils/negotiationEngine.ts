import {
  COUNTER_OFFER_CHANCE,
  COUNTER_OFFER_FLOOR_RATIO,
  COUNTER_OFFER_POSITION,
  KARIZMA_COUNTER_POSITION_EFFECT_PER_POINT,
  KARIZMA_NEUTRAL_SCORE,
  KARIZMA_THRESHOLD_EFFECT_PER_POINT,
} from '../config/economyConfig';
import type { BargainingStyle } from '../types/negotiation';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type BargainOutcome =
  | { kind: 'accept' }
  | { kind: 'counter'; counterAmountTl: number }
  | { kind: 'reject' };

interface EvaluateArgs {
  bargainingStyle: BargainingStyle;
  karizmaScore: number;
  roundsUsed: number;
  maxRounds: number;
}

function counterPosition(bargainingStyle: BargainingStyle, karizmaScore: number): number {
  return clamp(
    COUNTER_OFFER_POSITION[bargainingStyle] -
      (karizmaScore - KARIZMA_NEUTRAL_SCORE) * KARIZMA_COUNTER_POSITION_EFFECT_PER_POINT,
    0.1,
    0.98,
  );
}

/**
 * Bölüm 4.3/6/8: alım-bozdurma yönünde (dükkân müşteriden alıyor) bir
 * teklifi değerlendirir. `thresholdTl` müşterinin kabul edeceği ASGARİ
 * (taban) tutar. Karizma (0-100, 50 nötr) yüksekse taban hafifçe düşer —
 * müşteriler ilk teklife biraz daha toleranslı olur; pazarlık tarzı
 * (sert/dengeli/kolay) karşı teklif verme ihtimalini ve karşı teklifin
 * oyuncu lehine ne kadar kayacağını belirler.
 */
export function evaluateBuyOffer(
  args: EvaluateArgs & { offerTl: number; thresholdTl: number },
): BargainOutcome {
  const { offerTl, thresholdTl, bargainingStyle, karizmaScore, roundsUsed, maxRounds } = args;
  const karizmaFactor = clamp(1 - (karizmaScore - KARIZMA_NEUTRAL_SCORE) * KARIZMA_THRESHOLD_EFFECT_PER_POINT, 0.85, 1.15);
  const adjustedThreshold = thresholdTl * karizmaFactor;

  if (offerTl >= adjustedThreshold) return { kind: 'accept' };

  const shortfallRatio = (adjustedThreshold - offerTl) / adjustedThreshold;
  if (shortfallRatio > 1 - COUNTER_OFFER_FLOOR_RATIO || roundsUsed >= maxRounds) {
    return { kind: 'reject' };
  }
  if (Math.random() >= COUNTER_OFFER_CHANCE[bargainingStyle]) {
    return { kind: 'reject' };
  }

  const position = counterPosition(bargainingStyle, karizmaScore);
  const counterAmountTl = Math.round(offerTl + (adjustedThreshold - offerTl) * position);
  return { kind: 'counter', counterAmountTl };
}

/**
 * Satış yönünde (dükkân müşteriye satıyor): `thresholdTl` müşterinin
 * ödemeye razı olduğu AZAMİ (tavan) tutar. Karizma yüksekse tavan hafifçe
 * yükselir — müşteriler biraz daha yüksek fiyata tolerans gösterir.
 */
export function evaluateSellOffer(
  args: EvaluateArgs & { askTl: number; thresholdTl: number },
): BargainOutcome {
  const { askTl, thresholdTl, bargainingStyle, karizmaScore, roundsUsed, maxRounds } = args;
  const karizmaFactor = clamp(1 + (karizmaScore - KARIZMA_NEUTRAL_SCORE) * KARIZMA_THRESHOLD_EFFECT_PER_POINT, 0.85, 1.15);
  const adjustedThreshold = thresholdTl * karizmaFactor;

  if (askTl <= adjustedThreshold) return { kind: 'accept' };

  const overageRatio = (askTl - adjustedThreshold) / adjustedThreshold;
  if (overageRatio > 1 - COUNTER_OFFER_FLOOR_RATIO || roundsUsed >= maxRounds) {
    return { kind: 'reject' };
  }
  if (Math.random() >= COUNTER_OFFER_CHANCE[bargainingStyle]) {
    return { kind: 'reject' };
  }

  const position = counterPosition(bargainingStyle, karizmaScore);
  const counterAmountTl = Math.round(askTl - (askTl - adjustedThreshold) * position);
  return { kind: 'counter', counterAmountTl };
}
