import { act, fireEvent, render } from '@testing-library/react-native';
import type { IncomingCustomer } from '../src/types/incomingCustomer';
import { NegotiationPanel } from '../src/components/NegotiationPanel';
import { useGameStore } from '../src/store/useGameStore';

const initialState = useGameStore.getState();

const customer: IncomingCustomer = {
  id: 'test-gate-customer',
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
};

beforeEach(() => {
  jest.useFakeTimers();
  useGameStore.setState({ ...initialState, incomingCustomer: customer, capital: { ...initialState.capital, cashTl: 100_000 } }, true);
});

afterEach(() => {
  jest.useRealTimers();
  useGameStore.setState(initialState, true);
});

it('keeps the offer controls closed until the product test completes', async () => {
  const view = await render(<NegotiationPanel incomingCustomer={customer} onClose={jest.fn()} />);

  expect(view.getByText('Ürünü test etmeden teklif veremezsin.')).toBeTruthy();
  expect(view.queryByText('Teklifi Gönder')).toBeNull();

  await fireEvent.press(view.getByText('TEST'));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(900);
  });

  expect(view.queryByText('Ürünü test etmeden teklif veremezsin.')).toBeNull();
  expect(view.getByText('Teklifi Gönder')).toBeTruthy();
});
