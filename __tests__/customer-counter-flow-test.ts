import type { IncomingCustomer } from '../src/types/incomingCustomer';
import { useGameStore } from '../src/store/useGameStore';

const initialState = useGameStore.getState();

function makeCustomer(overrides: Partial<IncomingCustomer> = {}): IncomingCustomer {
  return {
    id: 'customer-1',
    direction: 'bozdurma',
    customer: {
      name: 'Test Müşterisi',
      type: 'Dengeli',
      request: 'Gram altın bozdurmak istiyorum.',
      urgency: 'normal',
      bargainingStyle: 'dengeli',
      acceptanceThreshold: 0.9,
    },
    product: {
      name: 'Gram Altın',
      source: 'Müşteri getirdi',
      category: 'yatirim',
      karat: 24,
      grams: 1,
      marketValueTl: 5000,
    },
    scaleReading: { grams: 1, karat: 24, cleanliness: 'Temiz' },
    expiresAtTotalMinutes: 999_999,
    ...overrides,
  };
}

beforeEach(() => {
  useGameStore.setState(initialState, true);
});

afterEach(() => {
  useGameStore.setState(initialState, true);
});

describe('customer counter lifecycle', () => {
  it('moves one waiting customer to the single active counter state atomically', () => {
    const customer = makeCustomer();
    useGameStore.setState({ incomingCustomer: null, waitingCustomers: [customer], speed: 2, preNegotiationSpeed: null });

    expect(useGameStore.getState().callNextCustomerToCounter()).toBe(true);

    const state = useGameStore.getState();
    expect(state.waitingCustomers).toEqual([]);
    expect(state.incomingCustomer).toEqual(customer);
    expect(state.speed).toBe(0);
    expect(state.preNegotiationSpeed).toBe(2);
    expect(useGameStore.getState().callNextCustomerToCounter()).toBe(false);
  });

  it('keeps an active customer through ticks and until its controlled close', () => {
    const active = makeCustomer({ expiresAtTotalMinutes: 0 });
    const next = makeCustomer({ id: 'customer-2' });
    useGameStore.setState({ incomingCustomer: active, waitingCustomers: [next], speed: 1, day: 1, minuteOfDay: 10 });

    useGameStore.getState().tick(1);

    expect(useGameStore.getState().incomingCustomer?.id).toBe(active.id);
    expect(useGameStore.getState().callNextCustomerToCounter()).toBe(false);

    useGameStore.getState().clearIncomingCustomer(active.id);
    expect(useGameStore.getState().incomingCustomer).toBeNull();
    expect(useGameStore.getState().callNextCustomerToCounter()).toBe(true);
    expect(useGameStore.getState().incomingCustomer?.id).toBe(next.id);
  });

  it('keeps a multi-line customer active while line items are being processed', () => {
    const firstLine = makeCustomer().product;
    const secondLine = { ...firstLine, name: 'Çeyrek Altın', karat: 22, grams: 1.754 };
    const customer = makeCustomer({
      lines: [
        { product: firstLine, scaleReading: { grams: 1, karat: 24, cleanliness: 'Temiz' } },
        { product: secondLine, scaleReading: { grams: 1.754, karat: 22, cleanliness: 'Temiz' } },
      ],
    });
    useGameStore.setState({ incomingCustomer: null, waitingCustomers: [customer] });

    useGameStore.getState().callNextCustomerToCounter();
    useGameStore.getState().tick(1);

    expect(useGameStore.getState().incomingCustomer?.id).toBe(customer.id);
    expect(useGameStore.getState().incomingCustomer?.lines).toHaveLength(2);
  });

  it('settles a bozdurma and a sale without clearing the active customer before the result closes', () => {
    const buyCustomer = makeCustomer();
    useGameStore.setState({ incomingCustomer: buyCustomer, capital: { ...initialState.capital, cashTl: 100_000 } });

    expect(
      useGameStore.getState().settleDeal(4_500, {
        name: buyCustomer.product.name,
        category: buyCustomer.product.category,
        karat: buyCustomer.product.karat,
        grams: buyCustomer.product.grams,
        marketValueTl: buyCustomer.product.marketValueTl,
      }),
    ).toMatchObject({ success: true });
    expect(useGameStore.getState().incomingCustomer?.id).toBe(buyCustomer.id);

    const saleCustomer = makeCustomer({
      id: 'sale-customer',
      direction: 'satis',
      inventoryItemId: 'sale-item',
      unitsRequired: 1,
    });
    useGameStore.setState({
      incomingCustomer: saleCustomer,
      inventory: [
        {
          id: 'sale-item',
          name: 'Gram Altın',
          category: 'yatirim',
          karat: 24,
          grams: 1,
          quantity: 1,
          costBasisTl: 4_000,
          acquiredDay: 1,
        },
      ],
      capital: { ...useGameStore.getState().capital, cashTl: 10_000 },
    });

    expect(useGameStore.getState().resolveIncomingCustomer(true, 5_000)).toMatchObject({ profitTl: 1_000 });
    expect(useGameStore.getState().inventory).toHaveLength(0);
    expect(useGameStore.getState().incomingCustomer?.id).toBe(saleCustomer.id);
  });
});
