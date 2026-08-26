import { PASSIVE_INVESTMENT_CONFIG } from '../config/economyConfig';
import { JEWELRY_PIECES, JEWELRY_TIERS, type JewelryPieceType, type JewelryTierId } from '../data/jewelryInvestments';

export interface JewelryInvestmentPosition {
  id: string;
  tierId: JewelryTierId;
  pieceId: JewelryPieceType;
  activatedDay: number;
  maturityDay: number;
  principalTl: number;
  roi30Days: number;
  dailyIncomeTl: number;
  principalRefunded: boolean;
}

export type JewelryHoldings = Record<string, JewelryInvestmentPosition>;

export function holdingKey(tier: JewelryTierId, piece: JewelryPieceType): string {
  return `${tier}.${piece}`;
}

export function passiveInvestmentTierConfig(tierId: JewelryTierId) {
  return PASSIVE_INVESTMENT_CONFIG.tiers.find((tier) => tier.id === tierId) ?? null;
}

export function passiveInvestmentPieceConfig(tierId: JewelryTierId, pieceId: JewelryPieceType) {
  return passiveInvestmentTierConfig(tierId)?.pieces.find((piece) => piece.id === pieceId) ?? null;
}

export function computeJewelryInvestmentPrincipalTl(tierId: JewelryTierId, pieceId: JewelryPieceType): number {
  return passiveInvestmentPieceConfig(tierId, pieceId)?.principalTl ?? 0;
}

// Eski çağrılar için tutulur; yeni Faz 6 modelinde fiyat artık parçaya göre
// sabit config'ten gelir. Piece verilmezse aynı ayardaki ilk parça döner.
export function computeJewelryPiecePriceTl(tierId: JewelryTierId, _buyPricePerGram?: number, pieceId?: JewelryPieceType): number {
  const fallbackPiece = 'yuzuk';
  return computeJewelryInvestmentPrincipalTl(tierId, pieceId ?? fallbackPiece);
}

export function computeJewelryPieceDailyReturnTl(tierId: JewelryTierId, _buyPricePerGram?: number, pieceId?: JewelryPieceType): number {
  const tier = passiveInvestmentTierConfig(tierId);
  const principal = computeJewelryPiecePriceTl(tierId, undefined, pieceId);
  return tier ? Math.round((principal * tier.roi30Days) / PASSIVE_INVESTMENT_CONFIG.termDays) : 0;
}

export function isJewelryPieceOwned(holdings: JewelryHoldings, tier: JewelryTierId, piece: JewelryPieceType): boolean {
  const position = holdings[holdingKey(tier, piece)];
  return !!position && !position.principalRefunded;
}

export function isInvestmentActive(position: JewelryInvestmentPosition, settlementDay: number): boolean {
  return !position.principalRefunded && settlementDay >= position.activatedDay && settlementDay < position.maturityDay;
}

export function isJewelrySetComplete(holdings: JewelryHoldings, tier: JewelryTierId, settlementDay = Number.POSITIVE_INFINITY): boolean {
  return JEWELRY_PIECES.every((piece) => {
    const position = holdings[holdingKey(tier, piece.id)];
    return !!position && !position.principalRefunded && (settlementDay === Number.POSITIVE_INFINITY || isInvestmentActive(position, settlementDay));
  });
}

export function createJewelryInvestment(tierId: JewelryTierId, pieceId: JewelryPieceType, activatedDay: number): JewelryInvestmentPosition | null {
  const tier = passiveInvestmentTierConfig(tierId);
  const piece = passiveInvestmentPieceConfig(tierId, pieceId);
  if (!tier || !piece) return null;
  return {
    id: `${tierId}.${pieceId}.${activatedDay}`,
    tierId,
    pieceId,
    activatedDay,
    maturityDay: activatedDay + PASSIVE_INVESTMENT_CONFIG.termDays,
    principalTl: piece.principalTl,
    roi30Days: tier.roi30Days,
    dailyIncomeTl: Math.round((piece.principalTl * tier.roi30Days) / PASSIVE_INVESTMENT_CONFIG.termDays),
    principalRefunded: false,
  };
}

export function buyJewelryPieceHolding(
  holdings: JewelryHoldings,
  tier: JewelryTierId,
  piece: JewelryPieceType,
  activatedDay: number,
): JewelryHoldings {
  const investment = createJewelryInvestment(tier, piece, activatedDay);
  return investment ? { ...holdings, [holdingKey(tier, piece)]: investment } : holdings;
}

export interface JewelrySettlementResult {
  holdings: JewelryHoldings;
  dailyIncomeTl: number;
  setBonusTl: number;
  principalRefundTl: number;
  maturedInvestmentIds: string[];
}

export function settleJewelryInvestments(holdings: JewelryHoldings, settlementDay: number): JewelrySettlementResult {
  let dailyIncomeTl = 0;
  let setBonusTl = 0;
  let principalRefundTl = 0;
  const maturedInvestmentIds: string[] = [];
  const nextHoldings: JewelryHoldings = { ...holdings };

  for (const tier of JEWELRY_TIERS) {
    let tierBaseIncome = 0;
    for (const piece of JEWELRY_PIECES) {
      const position = nextHoldings[holdingKey(tier.id, piece.id)];
      if (position && isInvestmentActive(position, settlementDay)) {
        tierBaseIncome += position.dailyIncomeTl;
      }
    }
    const bonus = tierBaseIncome > 0 && isJewelrySetComplete(nextHoldings, tier.id, settlementDay)
      ? Math.round(tierBaseIncome * PASSIVE_INVESTMENT_CONFIG.setBonusPct)
      : 0;
    dailyIncomeTl += tierBaseIncome + bonus;
    setBonusTl += bonus;
  }

  for (const [key, position] of Object.entries(nextHoldings)) {
    if (!position.principalRefunded && settlementDay >= position.maturityDay) {
      principalRefundTl += position.principalTl;
      maturedInvestmentIds.push(position.id);
      nextHoldings[key] = { ...position, principalRefunded: true };
    }
  }

  return { holdings: nextHoldings, dailyIncomeTl, setBonusTl, principalRefundTl, maturedInvestmentIds };
}

export function computeJewelryTotalDailyReturnTl(holdings: JewelryHoldings, _buyPricePerGram?: number): number {
  const today = Math.max(...Object.values(holdings).map((position) => position.activatedDay), 1);
  return settleJewelryInvestments(holdings, today).dailyIncomeTl;
}

export function normalizeJewelryHoldings(raw: unknown, currentDay = 1): JewelryHoldings {
  if (!raw || typeof raw !== 'object') return {};
  const result: JewelryHoldings = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const [tierId, pieceId] = key.split('.') as [JewelryTierId, JewelryPieceType];
    if (!passiveInvestmentPieceConfig(tierId, pieceId)) continue;
    if (value === true) {
      const migrated = createJewelryInvestment(tierId, pieceId, currentDay);
      if (migrated) result[key] = migrated;
      continue;
    }
    if (value && typeof value === 'object') {
      const position = value as Partial<JewelryInvestmentPosition>;
      const principalTl = Number(position.principalTl);
      const activatedDay = Number(position.activatedDay);
      const maturityDay = Number(position.maturityDay);
      const dailyIncomeTl = Number(position.dailyIncomeTl);
      if (Number.isFinite(principalTl) && Number.isFinite(activatedDay) && Number.isFinite(maturityDay) && Number.isFinite(dailyIncomeTl)) {
        result[key] = {
          id: position.id ?? `${tierId}.${pieceId}.${activatedDay}`,
          tierId,
          pieceId,
          activatedDay,
          maturityDay,
          principalTl,
          roi30Days: Number(position.roi30Days) || passiveInvestmentTierConfig(tierId)?.roi30Days || 0,
          dailyIncomeTl,
          principalRefunded: !!position.principalRefunded,
        };
      }
    }
  }
  return result;
}
