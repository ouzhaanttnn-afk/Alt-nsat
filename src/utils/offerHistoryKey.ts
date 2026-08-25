import type { Offer } from '../types/offer';

export type OfferHistoryRow = {
  offer: Offer;
  historyKey: string;
};

function stablePart(value: unknown): string {
  return encodeURIComponent(String(value ?? 'legacy'));
}

function offerFingerprint(offer: Offer): string {
  return [
    offer.id,
    offer.createdDay,
    offer.createdMinuteOfDay,
    offer.resolvesAtTotalMinutes,
    offer.customerName,
    offer.productName,
    offer.status,
    offer.offerAmountTl,
    offer.marketValueTl,
    offer.karat,
    offer.grams,
    offer.quantity,
  ]
    .map(stablePart)
    .join('|');
}

/**
 * Produces stable UI keys for persisted offer history. Older saves may contain
 * reused offer ids, so the id alone is not safe for React list rendering.
 */
export function buildOfferHistoryRows(offers: Offer[]): OfferHistoryRow[] {
  const fingerprintOccurrences = new Map<string, number>();

  return offers.map((offer) => {
    const fingerprint = offerFingerprint(offer);
    const occurrence = (fingerprintOccurrences.get(fingerprint) ?? 0) + 1;
    fingerprintOccurrences.set(fingerprint, occurrence);

    return {
      offer,
      historyKey: `offer-history:${fingerprint}:${occurrence}`,
    };
  });
}
