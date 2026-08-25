import React from 'react';
import { render } from '@testing-library/react-native';
import { TradingPositionCard } from '../src/components/TradingPositionCard';
import {
  BROKER_LIQUIDATION_MAX_COST_RECOVERY_RATIO,
  EMERGENCY_MICRO_LOAN_MAX_CASH_TL,
  EMERGENCY_MICRO_LOAN_TL,
  LOW_CASH_WARNING_THRESHOLD_TL,
  STARTING_CASH_TL,
} from '../src/config/economyConfig';
import { toptanciStock } from '../src/data/toptanciStock';
import { useGameStore, currentPositionValueTl } from '../src/store/useGameStore';
import type { InventoryItem } from '../src/types/game';

const initialState = useGameStore.getState();

function makePosition(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'position-1',
    name: 'Gram Altın (Has)',
    category: 'yatirim',
    karat: 24,
    grams: 1,
    quantity: 10,
    costBasisTl: 50_000,
    acquiredDay: 1,
    ...overrides,
  };
}

beforeEach(() => {
  useGameStore.setState(initialState, true);
  useGameStore.setState({
    day: 1,
    minuteOfDay: 0,
    speed: 1,
    inventory: [],
    capital: { cashTl: 200_000, debtTl: 0, stockValueTl: 0 },
    goldPrice: { buyPricePerGram: 4_000, sellPricePerGram: 4_000, dailyChangePercent: 0 },
    wholesalerBuyMarginTlPerGram: 0,
    wholesalerTrust: 65,
    brokerDeal: null,
    loanDueDay: null,
    realizedTradingProfitTl: 0,
    totalTradingCostBasisTl: 0,
  });
});

afterEach(() => {
  useGameStore.setState(initialState, true);
});

describe('inventory cash and debt loop', () => {
  it('starts new games at the v0.2 target economy: 100,000 TL cash, zero stock and zero debt', () => {
    expect(STARTING_CASH_TL).toBe(100_000);
    expect(initialState.capital.cashTl).toBe(100_000);
    expect(initialState.capital.stockValueTl).toBe(0);
    expect(initialState.capital.debtTl).toBe(0);
  });

  it('keeps the low-cash warning informational and below the configured cash buffer only', () => {
    expect(LOW_CASH_WARNING_THRESHOLD_TL).toBe(10_000);
    const cashAfterSmallBuy = 100_000 - 80_000;
    const cashAfterLargeBuy = 100_000 - 95_000;
    expect(cashAfterSmallBuy < LOW_CASH_WARNING_THRESHOLD_TL).toBe(false);
    expect(cashAfterLargeBuy < LOW_CASH_WARNING_THRESHOLD_TL).toBe(true);
  });

  it('wholesaler buy reduces cash and increases stock by the selected quantity', () => {
    const result = useGameStore.getState().buyInvestmentUnits(toptanciStock[0], 10);

    const state = useGameStore.getState();
    expect(result).toEqual({ success: true });
    expect(state.capital.cashTl).toBe(160_000);
    expect(state.inventory).toHaveLength(1);
    expect(state.inventory[0]).toMatchObject({ name: 'Gram Altın (Has)', quantity: 10, costBasisTl: 40_000 });
  });

  it('repeated wholesaler buys calculate weighted average cost: 10g @ 4000 + 10g @ 6000 = 5000/g', () => {
    useGameStore.getState().buyInvestmentUnits(toptanciStock[0], 10);
    useGameStore.setState({
      goldPrice: { buyPricePerGram: 6_000, sellPricePerGram: 6_000, dailyChangePercent: 0 },
      wholesalerBuyMarginTlPerGram: 0,
    });
    useGameStore.getState().buyInvestmentUnits(toptanciStock[0], 10);

    const item = useGameStore.getState().inventory[0];
    expect(item.quantity).toBe(20);
    expect(item.costBasisTl).toBe(100_000);
    expect(item.costBasisTl / item.quantity).toBe(5_000);
  });

  it('repeated settlement buys calculate weighted average cost: 5g @ 4000 + 15g @ 6000 = 5500/g', () => {
    useGameStore.getState().settleDeal(20_000, {
      name: 'Gram Altın (Has)',
      category: 'yatirim',
      karat: 24,
      grams: 1,
      quantity: 5,
      marketValueTl: 20_000,
    });
    useGameStore.getState().settleDeal(90_000, {
      name: 'Gram Altın (Has)',
      category: 'yatirim',
      karat: 24,
      grams: 1,
      quantity: 15,
      marketValueTl: 90_000,
    });

    const item = useGameStore.getState().inventory[0];
    expect(item.quantity).toBe(20);
    expect(item.costBasisTl).toBe(110_000);
    expect(item.costBasisTl / item.quantity).toBe(5_500);
  });

  it('partial sale leaves the remaining weighted average cost stable', () => {
    useGameStore.setState({
      inventory: [makePosition({ quantity: 20, costBasisTl: 100_000 })],
      goldPrice: { buyPricePerGram: 7_000, sellPricePerGram: 7_100, dailyChangePercent: 0 },
    });

    const result = useGameStore.getState().sellInvestmentUnits('position-1', 5);
    const remaining = useGameStore.getState().inventory[0];

    expect(result).toMatchObject({ quantity: 5, saleValueTl: 35_000, profitTl: 10_000 });
    expect(remaining.quantity).toBe(15);
    expect(remaining.costBasisTl).toBe(75_000);
    expect(remaining.costBasisTl / remaining.quantity).toBe(5_000);
  });

  it('rendering and ticking do not mutate average cost', () => {
    const item = makePosition({ quantity: 20, costBasisTl: 100_000 });
    useGameStore.setState({ inventory: [item] });

    render(
      <TradingPositionCard
        item={item}
        currentValueTl={currentPositionValueTl(item, 6_000)}
        currentDay={1}
        onSell={() => undefined}
        onSellQuantity={() => undefined}
      />,
    );
    useGameStore.getState().tick(60);

    const after = useGameStore.getState().inventory[0];
    expect(after.quantity).toBe(20);
    expect(after.costBasisTl / after.quantity).toBe(5_000);
  });

  it('stock potential is separate from realized profit until a sale happens', () => {
    const item = makePosition({ quantity: 10, costBasisTl: 40_000 });
    useGameStore.setState({
      inventory: [item],
      goldPrice: { buyPricePerGram: 6_000, sellPricePerGram: 6_100, dailyChangePercent: 0 },
      realizedTradingProfitTl: 0,
    });

    const potentialProfitTl = currentPositionValueTl(item, 6_000) - item.costBasisTl;
    expect(potentialProfitTl).toBe(20_000);
    expect(useGameStore.getState().realizedTradingProfitTl).toBe(0);

    useGameStore.getState().sellInvestmentUnits('position-1', 10);
    expect(useGameStore.getState().realizedTradingProfitTl).toBe(20_000);
  });

  it('debt-backed broker liquidation cannot create risk-free profit even after a favorable market jump', () => {
    useGameStore.setState({
      capital: { cashTl: 0, debtTl: 0, stockValueTl: 0 },
      goldPrice: { buyPricePerGram: 5_000, sellPricePerGram: 5_100, dailyChangePercent: 0 },
      wholesalerTrust: 80,
    });
    expect(
      useGameStore.getState().settleDeal(10_000, {
        name: 'Gram Altın (Has)',
        category: 'yatirim',
        karat: 24,
        grams: 1,
        quantity: 2,
        marketValueTl: 10_000,
      }),
    ).toMatchObject({ success: true, borrowedTl: 10_000 });

    useGameStore.setState({ goldPrice: { buyPricePerGram: 9_000, sellPricePerGram: 9_100, dailyChangePercent: 0 } });
    const result = useGameStore.getState().resolveBrokerDeal();

    expect(result?.saleValueTl).toBe(10_000 * BROKER_LIQUIDATION_MAX_COST_RECOVERY_RATIO);
    expect(result?.profitTl).toBeLessThanOrEqual(0);
    expect(useGameStore.getState().capital.cashTl).toBe(9_800);
    expect(useGameStore.getState().capital.debtTl).toBe(10_000);
  });

  it('repaying after broker liquidation cannot close the original debt with a profit surplus', () => {
    useGameStore.setState({
      capital: { cashTl: 0, debtTl: 0, stockValueTl: 0 },
      goldPrice: { buyPricePerGram: 5_000, sellPricePerGram: 5_100, dailyChangePercent: 0 },
      wholesalerTrust: 80,
    });
    useGameStore.getState().settleDeal(10_000, {
      name: 'Gram Altın (Has)',
      category: 'yatirim',
      karat: 24,
      grams: 1,
      quantity: 2,
      marketValueTl: 10_000,
    });
    useGameStore.setState({ goldPrice: { buyPricePerGram: 9_000, sellPricePerGram: 9_100, dailyChangePercent: 0 } });
    useGameStore.getState().resolveBrokerDeal();
    useGameStore.getState().repayDebt(99_999);

    expect(useGameStore.getState().capital.cashTl).toBe(0);
    expect(useGameStore.getState().capital.debtTl).toBe(200);
    expect(useGameStore.getState().realizedTradingProfitTl).toBe(-200);
  });

  it('broker liquidation can be resolved only once', () => {
    useGameStore.setState({
      capital: { cashTl: 0, debtTl: 0, stockValueTl: 0 },
      wholesalerTrust: 80,
    });
    useGameStore.getState().settleDeal(5_000, {
      name: 'Gram Altın (Has)',
      category: 'yatirim',
      karat: 24,
      grams: 1,
      quantity: 1,
      marketValueTl: 5_000,
    });

    expect(useGameStore.getState().resolveBrokerDeal()).not.toBeNull();
    expect(useGameStore.getState().resolveBrokerDeal()).toBeNull();
  });

  it('debt repayment is capped by available cash and never creates negative debt', () => {
    useGameStore.setState({ capital: { cashTl: 3_000, debtTl: 8_000, stockValueTl: 0 }, loanDueDay: 5 });

    useGameStore.getState().repayDebt(99_999);

    expect(useGameStore.getState().capital.cashTl).toBe(0);
    expect(useGameStore.getState().capital.debtTl).toBe(5_000);
    expect(useGameStore.getState().loanDueDay).toBe(5);
  });

  it('emergency micro loan is available only when cash is near zero, debt exists and no liquid stock remains', () => {
    useGameStore.setState({
      capital: { cashTl: EMERGENCY_MICRO_LOAN_MAX_CASH_TL, debtTl: 1_000, stockValueTl: 0 },
      inventory: [],
      loanDueDay: 4,
    });

    expect(useGameStore.getState().takeEmergencyMicroLoan()).toBe(true);
    expect(useGameStore.getState().capital.cashTl).toBe(EMERGENCY_MICRO_LOAN_MAX_CASH_TL + EMERGENCY_MICRO_LOAN_TL);
    expect(useGameStore.getState().capital.debtTl).toBe(1_000 + EMERGENCY_MICRO_LOAN_TL);
  });

  it('emergency micro loan is blocked when the player has no debt', () => {
    useGameStore.setState({
      capital: { cashTl: EMERGENCY_MICRO_LOAN_MAX_CASH_TL, debtTl: 0, stockValueTl: 0 },
      inventory: [],
    });

    expect(useGameStore.getState().takeEmergencyMicroLoan()).toBe(false);
  });

  it('emergency micro loan is blocked when liquid stock can still be sold', () => {
    useGameStore.setState({
      capital: { cashTl: EMERGENCY_MICRO_LOAN_MAX_CASH_TL, debtTl: 1_000, stockValueTl: 5_000 },
      inventory: [makePosition()],
    });

    expect(useGameStore.getState().takeEmergencyMicroLoan()).toBe(false);
  });

  it('emergency micro loan ignores non-liquid pirlanta and crafted items for soft-lock detection', () => {
    useGameStore.setState({
      capital: { cashTl: EMERGENCY_MICRO_LOAN_MAX_CASH_TL, debtTl: 1_000, stockValueTl: 5_000 },
      inventory: [
        makePosition({ id: 'pirlanta-1', name: 'Vitrin Pırlanta', category: 'pirlanta' }),
        makePosition({ id: 'crafted-1', name: 'İşçilikli Kolye', category: 'iscilikli' }),
      ],
    });

    expect(useGameStore.getState().takeEmergencyMicroLoan()).toBe(true);
  });
});
