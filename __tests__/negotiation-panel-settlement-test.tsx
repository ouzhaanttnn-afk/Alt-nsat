import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import { NegotiationPanel } from '../src/components/NegotiationPanel';
import { CounterOfferCard } from '../src/components/CounterOfferCard';
import { useGameStore } from '../src/store/useGameStore';
import type { IncomingCustomer } from '../src/types/incomingCustomer';

const initialState = useGameStore.getState();

const customer: IncomingCustomer = {
  id: 'settlement-guard-customer',
  direction: 'bozdurma',
  customer: {
    name: 'Test Müşterisi',
    type: 'Dengeli Müşteri',
    request: 'Gram altın bozdurmak istiyorum.',
    urgency: 'Normal',
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
  cleanup();
  jest.useRealTimers();
  useGameStore.setState(initialState, true);
});

it('applies an accepted transaction only once even if the button is pressed twice', async () => {
  const view = await render(<NegotiationPanel incomingCustomer={customer} onClose={jest.fn()} />);
  await fireEvent.press(view.getByText('TEST'));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(900);
  });

  const payFull = view.getByText('Tam Fiyatı Öde');
  await fireEvent.press(payFull);
  await fireEvent.press(payFull);

  expect(useGameStore.getState().capital.cashTl).toBe(95_000);
  expect(useGameStore.getState().offers.filter((offer) => offer.customerName === customer.customer.name)).toHaveLength(1);
});

it('leaves money and stock untouched when repeated poor offers make the customer leave', async () => {
  const view = await render(<NegotiationPanel incomingCustomer={customer} onClose={jest.fn()} />);
  const cashBefore = useGameStore.getState().capital.cashTl;
  const inventoryBefore = useGameStore.getState().inventory;

  await fireEvent.press(view.getByText('TEST'));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(900);
  });

  await fireEvent.press(view.getByText('Teklifi Gönder'));
  await fireEvent.press(view.getByText('Yeni teklif ver'));
  await fireEvent.press(view.getByText('Teklifi Gönder'));
  await fireEvent.press(view.getByText('Teklifi Gönder'));
  await fireEvent.press(view.getByText('Teklifi Gönder'));

  expect(useGameStore.getState().capital.cashTl).toBe(cashBefore);
  expect(useGameStore.getState().inventory).toEqual(inventoryBefore);
  expect(useGameStore.getState().offers.at(0)).toMatchObject({ status: 'red' });
});

it('does not render another-offer control after a final price', async () => {
  const view = await render(
    <CounterOfferCard
      customerName="Test Müşterisi"
      counterAmountTl={5000}
      direction="buy"
      patience={1}
      reaction="Son fiyatım bu."
      isFinal
      onAccept={jest.fn()}
      onWalkAway={jest.fn()}
    />,
  );

  expect(view.queryByText('Yeni teklif ver')).toBeNull();
  expect(view.getByText('Kabul Et · 5.000₺')).toBeTruthy();
  expect(view.getByText('Reddet')).toBeTruthy();
});
