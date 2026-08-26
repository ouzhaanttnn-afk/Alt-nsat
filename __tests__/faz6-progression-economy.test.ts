import {
  CUSTOMER_RUSH_REMAINING_BONUS_RATIO,
  JEWELRY_SET_BONUS_PCT,
  MINUTES_PER_DAY,
  PASSIVE_INVESTMENT_CONFIG,
  WORKSHOP_CONFIG,
} from '../src/config/economyConfig';
import {
  computeJewelryPieceDailyReturnTl,
  createJewelryInvestment,
  holdingKey,
  settleJewelryInvestments,
  type JewelryHoldings,
} from '../src/engine/jewelry';
import { buildMarketAssets, clampDailyReturn, computeDailyMarketReturn, stepMarketReferenceDaily } from '../src/engine/market';
import { dailyCustomerTargetForDay, charismaTrafficBonus, useGameStore } from '../src/store/useGameStore';

const initialState = useGameStore.getState();

function resetStore() {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  useGameStore.setState({
    ...initialState,
    day: 1,
    minuteOfDay: 0,
    speed: 1,
    level: WORKSHOP_CONFIG.requiredLevel,
    capital: { cashTl: 5_000_000, debtTl: 0, stockValueTl: 0 },
    inventory: [],
    waitingCustomers: [],
    incomingCustomer: null,
    dailyCustomerTarget: 20,
    dailyCustomersGenerated: 0,
    customerRushUsedDay: null,
    customerRushFeedback: null,
    jewelryHoldings: {},
    workshop: { unlocked: false, level: 0, totalHasProduced: 0, lastProductionDay: null },
    atolyeLevel: 0,
  });
}

function advanceOneGameDay() {
  for (let i = 0; i < 96; i += 1) {
    useGameStore.getState().tick(5);
  }
}

beforeEach(resetStore);

afterEach(() => {
  jest.restoreAllMocks();
});

test('daily market return is clamped to +/-3.5% and deterministic with same seed', () => {
  expect(clampDailyReturn(0.2)).toBe(0.035);
  expect(clampDailyReturn(-0.2)).toBe(-0.035);

  const seedValues = [0.9, 0.8, 0.7, 0.6];
  const rngA = jest.fn(() => seedValues.shift() ?? 0.5);
  const resultA = computeDailyMarketReturn(rngA);
  const seedValuesB = [0.9, 0.8, 0.7, 0.6];
  const rngB = jest.fn(() => seedValuesB.shift() ?? 0.5);
  const resultB = computeDailyMarketReturn(rngB);

  expect(resultA).toBe(resultB);
  expect(resultA).toBeLessThanOrEqual(0.035);
  expect(resultA).toBeGreaterThanOrEqual(-0.035);
  expect(stepMarketReferenceDaily(6_000, () => 1).reference).toBeGreaterThan(0);
});

test('gold market assets stay correlated with gram reference and ceyrek is not double-purity discounted', () => {
  const assets = buildMarketAssets(7_000, 6_800);
  expect(assets.gramAltin.priceTl).toBe(7_000);
  expect(assets.ceyrekAltin.dailyChangePercent).toBeCloseTo(assets.gramAltin.dailyChangePercent, 8);
  expect(assets.bilezik22.dailyChangePercent).toBeCloseTo(assets.gramAltin.dailyChangePercent, 8);
  expect(assets.ceyrekAltin.priceTl).toBeGreaterThan(7_000 * 1.5);
});

test('daily customer target follows progression curve and charisma bonus is capped', () => {
  expect(dailyCustomerTargetForDay(1, 0, () => 0)).toBe(16);
  expect(dailyCustomerTargetForDay(1, 100, () => 1)).toBe(30);
  expect(charismaTrafficBonus(100)).toBe(0.25);
  expect(charismaTrafficBonus(500)).toBe(0.25);
});

test('customer rush can be used once per day and adds only remaining potential', () => {
  useGameStore.setState({ dailyCustomerTarget: 20, dailyCustomersGenerated: 10, customerRushUsedDay: null });
  useGameStore.getState().watchAdForCustomerHype();
  expect(useGameStore.getState().dailyCustomerTarget).toBe(20 + Math.ceil(10 * CUSTOMER_RUSH_REMAINING_BONUS_RATIO));
  expect(useGameStore.getState().customerRushUsedDay).toBe(1);
  useGameStore.getState().watchAdForCustomerHype();
  expect(useGameStore.getState().dailyCustomerTarget).toBe(24);
});

test('passive jewelry investment pays daily income, same-tier set bonus, and refunds principal once', () => {
  const holdings: JewelryHoldings = {};
  for (const piece of PASSIVE_INVESTMENT_CONFIG.tiers[0].pieces) {
    const investment = createJewelryInvestment('ayar8', piece.id, 1)!;
    holdings[holdingKey('ayar8', piece.id)] = investment;
  }

  const baseDaily = PASSIVE_INVESTMENT_CONFIG.tiers[0].pieces.reduce(
    (sum, piece) => sum + computeJewelryPieceDailyReturnTl('ayar8', undefined, piece.id),
    0,
  );
  const day1 = settleJewelryInvestments(holdings, 1);
  expect(day1.dailyIncomeTl).toBe(baseDaily + Math.round(baseDaily * JEWELRY_SET_BONUS_PCT));
  expect(day1.principalRefundTl).toBe(0);

  const maturity = settleJewelryInvestments(day1.holdings, 31);
  expect(maturity.principalRefundTl).toBe(670_000);
  const duplicate = settleJewelryInvestments(maturity.holdings, 31);
  expect(duplicate.principalRefundTl).toBe(0);
  expect(duplicate.dailyIncomeTl).toBe(0);
});

test('incomplete jewelry set does not receive set bonus and different set bonuses are independent', () => {
  const holdings: JewelryHoldings = {
    [holdingKey('ayar8', 'yuzuk')]: createJewelryInvestment('ayar8', 'yuzuk', 1)!,
  };
  for (const piece of PASSIVE_INVESTMENT_CONFIG.tiers[1].pieces) {
    holdings[holdingKey('ayar14', piece.id)] = createJewelryInvestment('ayar14', piece.id, 1)!;
  }
  const result = settleJewelryInvestments(holdings, 1);
  const ayar8Daily = computeJewelryPieceDailyReturnTl('ayar8', undefined, 'yuzuk');
  const ayar14Base = PASSIVE_INVESTMENT_CONFIG.tiers[1].pieces.reduce(
    (sum, piece) => sum + computeJewelryPieceDailyReturnTl('ayar14', undefined, piece.id),
    0,
  );
  expect(result.dailyIncomeTl).toBe(ayar8Daily + ayar14Base + Math.round(ayar14Base * JEWELRY_SET_BONUS_PCT));
});

test('store day settlement pays jewelry once and resets daily customer counters', () => {
  useGameStore.getState().buyJewelryPiece('ayar8', 'yuzuk');
  const afterBuy = useGameStore.getState();
  const expectedCashAfterBuy = 5_000_000 - 120_000;
  expect(afterBuy.capital.cashTl).toBe(expectedCashAfterBuy);
  useGameStore.setState({ dailyCustomersGenerated: 7, customerRushUsedDay: 1 });

  advanceOneGameDay();
  const afterDay = useGameStore.getState();
  expect(afterDay.day).toBe(2);
  expect(afterDay.capital.cashTl).toBe(expectedCashAfterBuy + 960);
  expect(afterDay.dailyCustomersGenerated).toBeLessThanOrEqual(afterDay.dailyCustomerTarget);
  expect(afterDay.customerRushUsedDay).toBeNull();

  useGameStore.getState().tick(0);
  expect(useGameStore.getState().capital.cashTl).toBe(afterDay.capital.cashTl);
});

test('workshop production remains HAS stock, not cash, after Faz 6 day settlement', () => {
  useGameStore.setState({
    workshop: { unlocked: true, level: 1, totalHasProduced: 0, lastProductionDay: null },
    atolyeLevel: 1,
    capital: { cashTl: 5_000_000, debtTl: 0, stockValueTl: 0 },
  });
  advanceOneGameDay();
  const state = useGameStore.getState();
  expect(state.workshop.totalHasProduced).toBe(0.6);
  expect(state.capital.cashTl).toBe(5_000_000);
  expect(state.inventory.find((item) => item.name === 'Gram Altın (Has)')?.quantity).toBe(0.6);
});
