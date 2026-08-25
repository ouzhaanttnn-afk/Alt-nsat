import { buildOfferHistoryRows } from '../src/utils/offerHistoryKey';
import type { Offer } from '../src/types/offer';

function createOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: '1',
    customerName: 'Kemal Bey',
    productName: 'Gram Altın',
    category: 'yatirim',
    karat: 24,
    grams: 1,
    offerAmountTl: 5000,
    marketValueTl: 5100,
    status: 'kabul',
    willAccept: true,
    createdDay: 1,
    createdMinuteOfDay: 30,
    resolvesAtTotalMinutes: 1470,
    ...overrides,
  };
}

describe('buildOfferHistoryRows', () => {
  it('uses distinct, stable keys when a legacy save reuses an offer id', () => {
    const offers = [
      createOffer(),
      createOffer({ customerName: 'Merve Hanım', createdMinuteOfDay: 45, resolvesAtTotalMinutes: 1485 }),
    ];

    const firstRender = buildOfferHistoryRows(offers).map((row) => row.historyKey);
    const secondRender = buildOfferHistoryRows(offers).map((row) => row.historyKey);

    expect(new Set(firstRender).size).toBe(offers.length);
    expect(secondRender).toEqual(firstRender);
  });

  it('keeps even identical legacy records uniquely keyed without using their index alone', () => {
    const offers = [createOffer(), createOffer()];
    const keys = buildOfferHistoryRows(offers).map((row) => row.historyKey);

    expect(new Set(keys).size).toBe(offers.length);
    expect(keys[0]).not.toEqual(keys[1]);
    expect(buildOfferHistoryRows(offers).map((row) => row.historyKey)).toEqual(keys);
  });
});
