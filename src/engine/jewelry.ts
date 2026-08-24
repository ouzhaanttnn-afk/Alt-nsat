import {
  JEWELRY_DAILY_RETURN_RATE_OF_PRICE,
  JEWELRY_PIECE_BASE_WEIGHT_GRAMS,
  JEWELRY_SET_BONUS_PCT,
} from '../config/economyConfig';
import { JEWELRY_PIECES, JEWELRY_TIERS, type JewelryPieceType, type JewelryTierId } from '../data/jewelryInvestments';

/**
 * v3 — Takı Yatırımı (Parça & Set) motoru. Saf fonksiyonlar, store'dan
 * bağımsız — Oyun B'nin engine/jewelryInvestments.ts'inin portu.
 */
export type JewelryHoldings = Record<string, boolean>;

function holdingKey(tier: JewelryTierId, piece: JewelryPieceType): string {
  return `${tier}.${piece}`;
}

export function isJewelryPieceOwned(holdings: JewelryHoldings, tier: JewelryTierId, piece: JewelryPieceType): boolean {
  return !!holdings[holdingKey(tier, piece)];
}

export function buyJewelryPieceHolding(
  holdings: JewelryHoldings,
  tier: JewelryTierId,
  piece: JewelryPieceType,
): JewelryHoldings {
  return { ...holdings, [holdingKey(tier, piece)]: true };
}

/** Bir parçanın taban fiyatı — güncel piyasa gram fiyatına PEG'li. */
export function computeJewelryPiecePriceTl(tierId: JewelryTierId, buyPricePerGram: number): number {
  const tier = JEWELRY_TIERS.find((t) => t.id === tierId)!;
  return Math.round(buyPricePerGram * tier.priceMultiplier * JEWELRY_PIECE_BASE_WEIGHT_GRAMS);
}

export function computeJewelryPieceDailyReturnTl(tierId: JewelryTierId, buyPricePerGram: number): number {
  return Math.round(computeJewelryPiecePriceTl(tierId, buyPricePerGram) * JEWELRY_DAILY_RETURN_RATE_OF_PRICE);
}

export function isJewelrySetComplete(holdings: JewelryHoldings, tier: JewelryTierId): boolean {
  return JEWELRY_PIECES.every((p) => isJewelryPieceOwned(holdings, tier, p.id));
}

/** Sahip olunan tüm parçalardan (tamamlanan setlerin +%10 bonusu dahil) toplam günlük pasif TL getirisi. */
export function computeJewelryTotalDailyReturnTl(holdings: JewelryHoldings, buyPricePerGram: number): number {
  let total = 0;
  for (const tier of JEWELRY_TIERS) {
    const multiplier = isJewelrySetComplete(holdings, tier.id) ? 1 + JEWELRY_SET_BONUS_PCT : 1;
    for (const piece of JEWELRY_PIECES) {
      if (isJewelryPieceOwned(holdings, tier.id, piece.id)) {
        total += computeJewelryPieceDailyReturnTl(tier.id, buyPricePerGram) * multiplier;
      }
    }
  }
  return Math.round(total);
}
