import {
  MINUTES_PER_DAY,
  WORKSHOP_CONFIG,
} from '../src/config/economyConfig';
import {
  craftedGoodEstimatedValueTl,
  craftedGoodHasGrams,
  craftedMeltHasGrams,
  isCraftedGoodItem,
} from '../src/engine/craftedGoods';
import {
  useGameStore,
  workshopDailyHasOutput,
  workshopUpgradeCostTl,
} from '../src/store/useGameStore';
import type { InventoryItem, WorkshopState } from '../src/types/game';

const initialState = useGameStore.getState();

function craftedItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'crafted-1',
    name: 'İşlemeli Bilezik',
    category: 'iscilikli',
    karat: 22,
    actualKarat: 22,
    grams: 12,
    quantity: 1,
    costBasisTl: 55_000,
    estimatedValueTl: 60_000,
    source: 'Müşteri getirdi',
    acquiredDay: 1,
    acquiredMinuteOfDay: 20,
    ...overrides,
  };
}

function legacyCraftedItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return craftedItem({
    workshopStatus: 'processing',
    workshopStartedAtTotalMinutes: 100,
    workshopEndsAtTotalMinutes: 200,
    workshopProcessed: false,
    workshopValueAddedTl: 5000,
    workshopCostTl: 1000,
    ...overrides,
  });
}

function sarrafiyeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'gram-1',
    name: 'Gram Altın (Has)',
    category: 'yatirim',
    karat: 24,
    grams: 1,
    quantity: 1,
    costBasisTl: 5000,
    acquiredDay: 1,
    ...overrides,
  };
}

function workshopState(overrides: Partial<WorkshopState> = {}): WorkshopState {
  return {
    unlocked: false,
    level: 0,
    totalHasProduced: 0,
    lastProductionDay: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  useGameStore.setState({
    ...initialState,
    day: 1,
    minuteOfDay: 0,
    speed: 1,
    level: 1,
    totalXp: 0,
    capital: { cashTl: 2_000_000, debtTl: 0, stockValueTl: 0 },
    goldPrice: { buyPricePerGram: 5000, sellPricePerGram: 5300, dailyChangePercent: 0 },
    inventory: [],
    meltingJob: null,
    workshop: workshopState(),
    atolyeLevel: 0,
    waitingCustomers: [],
    incomingCustomer: null,
  }, true);
});

afterEach(() => {
  jest.restoreAllMocks();
  useGameStore.setState(initialState, true);
});

it('classifies crafted goods separately from sarrafiye', () => {
  expect(isCraftedGoodItem(craftedItem())).toBe(true);
  expect(isCraftedGoodItem(sarrafiyeItem())).toBe(false);
});

it('does not allow crafted goods to be sent to workshop anymore', () => {
  const item = craftedItem();
  useGameStore.setState({ inventory: [item], level: WORKSHOP_CONFIG.requiredLevel });

  expect(useGameStore.getState().startCraftedGoodWorkshop(item.id)).toBe(false);
  expect(useGameStore.getState().collectCraftedGoodWorkshop(item.id)).toBe(false);
  expect(useGameStore.getState().inventory[0]).toEqual(item);
});

it('keeps sarrafiye out of melt and legacy workshop flows', () => {
  useGameStore.setState({ inventory: [sarrafiyeItem()], level: WORKSHOP_CONFIG.requiredLevel });

  expect(useGameStore.getState().meltCraftedGood('gram-1')).toBe(false);
  expect(useGameStore.getState().startCraftedGoodWorkshop('gram-1')).toBe(false);
});

it('melting removes the crafted item and converts it into recovered has gold', () => {
  const item = craftedItem({ id: 'crafted-melt', grams: 10, actualKarat: 18, costBasisTl: 40_000 });
  useGameStore.setState({ inventory: [item] });

  expect(useGameStore.getState().meltCraftedGood(item.id)).toBe(true);
  expect(useGameStore.getState().inventory.find((stockItem) => stockItem.id === item.id)).toBeUndefined();
  expect(useGameStore.getState().meltCraftedGood(item.id)).toBe(false);

  const job = useGameStore.getState().meltingJob!;
  const expectedRecovered = craftedMeltHasGrams(item.grams, item.actualKarat!);
  expect(job.recoveredGrams).toBe(expectedRecovered);
  expect(job.costBasisTl).toBe(item.costBasisTl);

  useGameStore.setState({
    day: Math.floor((job.completesAtTotalMinutes - 5) / MINUTES_PER_DAY),
    minuteOfDay: (job.completesAtTotalMinutes - 5) % MINUTES_PER_DAY,
  });
  useGameStore.getState().tick(5);

  const gramAltin = useGameStore.getState().inventory.find((stockItem) => stockItem.name === 'Gram Altın (Has)');
  expect(gramAltin?.quantity).toBe(expectedRecovered);
  expect(gramAltin?.costBasisTl).toBe(item.costBasisTl);
  expect(useGameStore.getState().inventory.find((stockItem) => stockItem.category === 'iscilikli')).toBeUndefined();
});

it('keeps crafted melt purity coefficients unchanged', () => {
  expect(craftedMeltHasGrams(10, 8)).toBe(3.33);
  expect(craftedMeltHasGrams(10, 14)).toBe(5.85);
  expect(craftedMeltHasGrams(10, 18)).toBe(7.5);
  expect(craftedMeltHasGrams(10, 22)).toBe(9.16);
});

it('keeps legacy workshop item fields backward-compatible but inactive', () => {
  const item = legacyCraftedItem();
  const beforeEstimate = craftedGoodEstimatedValueTl(item, 5000);
  const beforeHas = craftedGoodHasGrams(item);
  useGameStore.setState({ inventory: [item], level: WORKSHOP_CONFIG.requiredLevel });

  useGameStore.setState({ day: 2, minuteOfDay: 0 });
  useGameStore.getState().tick(1);

  const after = useGameStore.getState().inventory[0];
  expect(after.workshopStatus).toBe('processing');
  expect(craftedGoodEstimatedValueTl(after, 5000)).toBe(beforeEstimate);
  expect(craftedGoodHasGrams(after)).toBe(beforeHas);
});

it('locks workshop below level 7', () => {
  useGameStore.setState({ level: WORKSHOP_CONFIG.requiredLevel - 1 });
  expect(useGameStore.getState().upgradeAtolye()).toBe(false);
  expect(useGameStore.getState().workshop.level).toBe(0);
});

it('allows workshop installation at level 7 and charges current TL cost', () => {
  useGameStore.setState({ level: WORKSHOP_CONFIG.requiredLevel });
  const expectedCost = WORKSHOP_CONFIG.unlockCostEquivalentHasGrams * 5000;

  expect(useGameStore.getState().upgradeAtolye()).toBe(true);
  expect(useGameStore.getState().workshop).toMatchObject({ unlocked: true, level: 1 });
  expect(useGameStore.getState().atolyeLevel).toBe(1);
  expect(useGameStore.getState().capital.cashTl).toBe(2_000_000 - expectedCost);
});

it('supports workshop Lv1-Lv10 progression', () => {
  useGameStore.setState({ level: WORKSHOP_CONFIG.requiredLevel, capital: { cashTl: 100_000_000, debtTl: 0, stockValueTl: 0 } });

  for (let level = 1; level <= WORKSHOP_CONFIG.maxLevel; level += 1) {
    expect(useGameStore.getState().upgradeAtolye()).toBe(true);
    expect(useGameStore.getState().workshop.level).toBe(level);
  }
});

it('does not upgrade beyond Lv10', () => {
  useGameStore.setState({
    level: WORKSHOP_CONFIG.requiredLevel,
    capital: { cashTl: 100_000_000, debtTl: 0, stockValueTl: 0 },
    workshop: workshopState({ unlocked: true, level: WORKSHOP_CONFIG.maxLevel }),
    atolyeLevel: WORKSHOP_CONFIG.maxLevel,
  });

  expect(useGameStore.getState().upgradeAtolye()).toBe(false);
  expect(useGameStore.getState().workshop.level).toBe(WORKSHOP_CONFIG.maxLevel);
});

it('does not upgrade without enough cash', () => {
  useGameStore.setState({ level: WORKSHOP_CONFIG.requiredLevel, capital: { cashTl: 1, debtTl: 0, stockValueTl: 0 } });

  expect(useGameStore.getState().upgradeAtolye()).toBe(false);
  expect(useGameStore.getState().workshop.level).toBe(0);
});

it('converts upgrade cost from equivalent has grams to current TL', () => {
  useGameStore.setState({
    level: WORKSHOP_CONFIG.requiredLevel,
    goldPrice: { buyPricePerGram: 6123, sellPricePerGram: 6300, dailyChangePercent: 0 },
  });

  expect(workshopUpgradeCostTl(0, 6123)).toBe(WORKSHOP_CONFIG.unlockCostEquivalentHasGrams * 6123);
  expect(useGameStore.getState().upgradeAtolye()).toBe(true);
  expect(useGameStore.getState().capital.cashTl).toBe(2_000_000 - WORKSHOP_CONFIG.unlockCostEquivalentHasGrams * 6123);
});

it('adds the correct dailyHasOutput once when a game day ends', () => {
  useGameStore.setState({
    level: WORKSHOP_CONFIG.requiredLevel,
    workshop: workshopState({ unlocked: true, level: 3 }),
    atolyeLevel: 3,
    day: 1,
    minuteOfDay: MINUTES_PER_DAY - 1,
  });

  useGameStore.getState().tick(1);

  const expectedOutput = workshopDailyHasOutput(3);
  const gramAltin = useGameStore.getState().inventory.find((item) => item.name === 'Gram Altın (Has)');
  expect(gramAltin?.quantity).toBe(expectedOutput);
  expect(gramAltin?.costBasisTl).toBe(0);
  expect(useGameStore.getState().workshop.totalHasProduced).toBe(expectedOutput);
  expect(useGameStore.getState().workshop.lastProductionDay).toBe(1);
});

it('does not produce twice for the same completed game day', () => {
  useGameStore.setState({
    level: WORKSHOP_CONFIG.requiredLevel,
    workshop: workshopState({ unlocked: true, level: 2 }),
    atolyeLevel: 2,
    day: 1,
    minuteOfDay: MINUTES_PER_DAY - 1,
  });

  useGameStore.getState().tick(1);
  const firstQuantity = useGameStore.getState().inventory.find((item) => item.name === 'Gram Altın (Has)')?.quantity;
  useGameStore.getState().tick(10);
  const secondQuantity = useGameStore.getState().inventory.find((item) => item.name === 'Gram Altın (Has)')?.quantity;

  expect(secondQuantity).toBe(firstQuantity);
});

it('produces again on the next completed game day', () => {
  useGameStore.setState({
    level: WORKSHOP_CONFIG.requiredLevel,
    workshop: workshopState({ unlocked: true, level: 1 }),
    atolyeLevel: 1,
    day: 1,
    minuteOfDay: MINUTES_PER_DAY - 1,
  });

  useGameStore.getState().tick(1);
  useGameStore.setState({ day: 2, minuteOfDay: MINUTES_PER_DAY - 1 });
  useGameStore.getState().tick(1);

  const expectedOutput = workshopDailyHasOutput(1) * 2;
  const gramAltin = useGameStore.getState().inventory.find((item) => item.name === 'Gram Altın (Has)');
  expect(gramAltin?.quantity).toBe(expectedOutput);
  expect(useGameStore.getState().workshop.lastProductionDay).toBe(2);
});

it('preserves workshop state in the persisted save payload', () => {
  useGameStore.setState({
    workshop: workshopState({ unlocked: true, level: 4, totalHasProduced: 3.2, lastProductionDay: 9 }),
    atolyeLevel: 4,
  });

  const partialize = (useGameStore as unknown as { persist: { getOptions: () => { partialize: (state: unknown) => unknown } } }).persist.getOptions().partialize;
  const saved = partialize(useGameStore.getState()) as { workshop: WorkshopState; atolyeLevel: number };

  expect(saved.workshop).toEqual({ unlocked: true, level: 4, totalHasProduced: 3.2, lastProductionDay: 9 });
  expect(saved.atolyeLevel).toBe(4);
});

it('migrates legacy atolyeLevel saves into workshop state', () => {
  const merge = (useGameStore as unknown as {
    persist: { getOptions: () => { merge: (persisted: unknown, current: unknown) => unknown } };
  }).persist.getOptions().merge;
  const merged = merge({ atolyeLevel: 3 }, initialState) as { workshop: WorkshopState; atolyeLevel: number };

  expect(merged.workshop).toMatchObject({ unlocked: true, level: 3 });
  expect(merged.atolyeLevel).toBe(3);
});

it('workshop production does not change crafted inventory', () => {
  const crafted = craftedItem();
  useGameStore.setState({
    inventory: [crafted],
    workshop: workshopState({ unlocked: true, level: 2 }),
    atolyeLevel: 2,
    day: 1,
    minuteOfDay: MINUTES_PER_DAY - 1,
  });

  useGameStore.getState().tick(1);

  const craftedAfter = useGameStore.getState().inventory.find((item) => item.id === crafted.id);
  expect(craftedAfter).toEqual(crafted);
  expect(useGameStore.getState().inventory.find((item) => item.name === 'Gram Altın (Has)')).toBeDefined();
});

it('workshop production adds Gram Altın (Has), not cash', () => {
  useGameStore.setState({
    workshop: workshopState({ unlocked: true, level: 1 }),
    atolyeLevel: 1,
    day: 1,
    minuteOfDay: MINUTES_PER_DAY - 1,
    capital: { cashTl: 123_456, debtTl: 0, stockValueTl: 0 },
  });

  useGameStore.getState().tick(1);

  expect(useGameStore.getState().capital.cashTl).toBe(123_456);
  expect(useGameStore.getState().inventory.find((item) => item.name === 'Gram Altın (Has)')?.quantity).toBe(
    workshopDailyHasOutput(1),
  );
});
