import {
  COUNTER_OFFER_CHANCE,
  COUNTER_OFFER_FLOOR_RATIO,
  COUNTER_OFFER_POSITION,
  KARIZMA_COUNTER_POSITION_EFFECT_PER_POINT,
  KARIZMA_NEUTRAL_SCORE,
  KARIZMA_THRESHOLD_EFFECT_PER_POINT,
} from '../config/economyConfig';
import type { BargainingStyle } from '../types/negotiation';

/**
 * v3 mimari birleşimi: pazarlık motoru artık `src/engine/`de yaşıyor —
 * UI'dan (NegotiationPanel) ve store'dan (useGameStore) tamamen bağımsız,
 * saf fonksiyonlar. Önceki adı `src/utils/negotiationEngine.ts` idi.
 *
 * KRİTİK — "AYNI TEKLİFİ TEKRAR GÖNDER" İSTİSMARI KAPALI: Oyun B'nin
 * (kuyumcu-simulatoru-mobile) `evaluateOffer`'ı kabulü HER ÇAĞRIDA bağımsız
 * bir `rng() < acceptanceProbability` zarıyla belirliyordu — bu, oyuncunun
 * DÜŞÜK bir teklifi (örn. %85) art arda göndererek düşük ihtimali bile
 * zamanla RNG lehine çevirebilmesi anlamına geliyordu (spam-kabul istismarı).
 * Buradaki motor KASITLI OLARAK deterministiktir: `offerTl >= adjustedThreshold`
 * ise kabul KESİNDİR (rastgelelik yok); eşiğin altındaysa sonuç ya karşı
 * teklif ya da RET'tir — ret TERMİNALDİR (müşteri o pazarlıktan tamamen
 * ayrılır, aynı teklifi tekrar göndermek için ikinci bir şans YOKTUR).
 * Yani ne kadar çok denenirse denensin, yetersiz bir teklif asla "şansla"
 * kabul olamaz — kabul her zaman offer/threshold karşılaştırmasının
 * doğrudan sonucudur.
 */

function clamp(value: number, min: number, max: number): number {
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
 * Alım-bozdurma yönünde (dükkân müşteriden alıyor) bir teklifi değerlendirir.
 * `thresholdTl` müşterinin kabul edeceği ASGARİ (taban) tutar. Karizma
 * (0-100, 50 nötr) yüksekse taban hafifçe düşer; pazarlık tarzı (sert/
 * dengeli/kolay) karşı teklif verme ihtimalini ve karşı teklifin oyuncu
 * lehine ne kadar kayacağını belirler.
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
 * yükselir.
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

/**
 * [YENİ] Toplu Alım — Kalem Bazlı Pazarlık: bir müşteri birden fazla farklı
 * ürünle (ör. Çeyrek + Gram + Bilezik) aynı anda geldiğinde, HER KALEM
 * kendi teklif/eşik/pazarlık-tarzı ile bağımsız değerlendirilir — tek bir
 * sepet fiyatı YOKTUR. Bu fonksiyon tek bir kalemi değerlendirir; çağıran
 * (NegotiationPanel) kalemleri sırayla bu fonksiyona besler (bkz.
 * NegotiationLineItem / IncomingCustomer.lines).
 */
export function evaluateLineItemOffer(
  args: EvaluateArgs & { offerTl: number; thresholdTl: number },
): BargainOutcome {
  return evaluateBuyOffer(args);
}
