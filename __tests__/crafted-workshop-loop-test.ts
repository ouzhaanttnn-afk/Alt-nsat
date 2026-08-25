import {
  ATOLYE_REQUIRED_LEVEL,
  MINUTES_PER_DAY,
} from '../src/config/economyConfig';
import {
  craftedGoodEstimatedValueTl,
  craftedGoodHasGrams,
  craftedMeltHasGrams,
  isCraftedGoodItem,
} from '../src/engine/craftedGoods';
import { useGameStore } from '../src/store/useGameStore';
import type { InventoryItem } from '../src/types/game';

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
    workshopStatus: 'none',
    workshopProcessed: false,
    ...overrides,
  };
}

function sarrafiyeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'gram-1',
    name: 'Gram Altın',
    category: 'yatirim',
    karat: 24,
    grams: 1,
    quantity: 1,
    costBasisTl: 5000,
    acquiredDay: 1,
    ...overrides,
  };
}

function moveClockToTotalMinutes(totalMinutes: number) {
  useGameStore.setState({
    day: Math.floor(totalMinutes / MINUTES_PER_DAY),
    minuteOfDay: totalMinutes % MINUTES_PER_DAY,
  });
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
    capital: { cashTl: 100_000, debtTl: 0, stockValueTl: 0 },
    goldPrice: { buyPricePerGram: 5000, sellPricePerGram: 5300, dailyChangePercent: 0 },
    inventory: [],
    meltingJob: null,
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

it('keeps sarrafiye out of melt and workshop flows', () => {
  useGameStore.setState({ inventory: [sarrafiyeItem()] });

  expect(useGameStore.getState().meltCraftedGood('gram-1')).toBe(false);
  useGameStore.setState({ level: ATOLYE_REQUIRED_LEVEL });
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

  moveClockToTotalMinutes(job.completesAtTotalMinutes - 5);
  useGameStore.getState().tick(5);

  const gramAltin = useGameStore.getState().inventory.find((stockItem) => stockItem.name === 'Gram Altın (Has)');
  expect(gramAltin?.quantity).toBe(expectedRecovered);
  expect(gramAltin?.costBasisTl).toBe(item.costBasisTl);
  expect(useGameStore.getState().inventory.find((stockItem) => stockItem.category === 'iscilikli')).toBeUndefined();
});

it('keeps workshop locked below level 7 and accessible at level 7+', () => {
  const item = craftedItem();
  useGameStore.setState({ inventory: [item], level: ATOLYE_REQUIRED_LEVEL - 1 });

  expect(useGameStore.getState().startCraftedGoodWorkshop(item.id)).toBe(false);

  useGameStore.setState({ level: ATOLYE_REQUIRED_LEVEL });
  expect(useGameStore.getState().startCraftedGoodWorkshop(item.id)).toBe(true);
  expect(useGameStore.getState().inventory[0].workshopStatus).toBe('processing');
});

it('does not allow collection before the workshop time ends', () => {
  const item = craftedItem();
  useGameStore.setState({ inventory: [item], level: ATOLYE_REQUIRED_LEVEL });

  expect(useGameStore.getState().startCraftedGoodWorkshop(item.id)).toBe(true);
  expect(useGameStore.getState().collectCraftedGoodWorkshop(item.id)).toBe(false);
});

it('marks the item ready after time and collects a one-time craft value increase', () => {
  const item = craftedItem({ id: 'crafted-workshop', grams: 20, karat: 18, costBasisTl: 50_000, estimatedValueTl: 54_000 });
  useGameStore.setState({ inventory: [item], level: ATOLYE_REQUIRED_LEVEL });
  const hasGramsBefore = craftedGoodHasGrams(item);
  const gramsBefore = item.grams;
  const karatBefore = item.karat;

  expect(useGameStore.getState().startCraftedGoodWorkshop(item.id)).toBe(true);
  const stockValueAfterStart = useGameStore.getState().capital.stockValueTl;
  const processingItem = useGameStore.getState().inventory[0];
  const endsAt = processingItem.workshopEndsAtTotalMinutes!;
  moveClockToTotalMinutes(endsAt - 5);
  useGameStore.getState().tick(5);

  expect(useGameStore.getState().inventory[0].workshopStatus).toBe('ready');
  expect(useGameStore.getState().collectCraftedGoodWorkshop(item.id)).toBe(true);
  const finishedItem = useGameStore.getState().inventory[0];
  expect(finishedItem.workshopStatus).toBe('none');
  expect(finishedItem.workshopProcessed).toBe(true);
  expect(craftedGoodHasGrams(finishedItem)).toBe(hasGramsBefore);
  expect(finishedItem.grams).toBe(gramsBefore);
  expect(finishedItem.karat).toBe(karatBefore);
  expect(craftedGoodEstimatedValueTl(finishedItem, 5000)).toBeGreaterThan(craftedGoodEstimatedValueTl(item, 5000));
  expect(useGameStore.getState().capital.stockValueTl).toBeGreaterThanOrEqual(stockValueAfterStart);
  expect(useGameStore.getState().collectCraftedGoodWorkshop(item.id)).toBe(false);
  expect(useGameStore.getState().startCraftedGoodWorkshop(item.id)).toBe(false);
});

it('keeps workshop item state in the persisted save payload', () => {
  const item = craftedItem({ id: 'persisted-crafted' });
  useGameStore.setState({ inventory: [item], level: ATOLYE_REQUIRED_LEVEL });
  expect(useGameStore.getState().startCraftedGoodWorkshop(item.id)).toBe(true);

  const partialize = (useGameStore as unknown as { persist: { getOptions: () => { partialize: (state: unknown) => unknown } } }).persist.getOptions().partialize;
  const saved = partialize(useGameStore.getState()) as { inventory: InventoryItem[] };

  expect(saved.inventory[0]).toMatchObject({
    id: item.id,
    workshopStatus: 'processing',
    workshopProcessed: false,
  });
  expect(saved.inventory[0].workshopEndsAtTotalMinutes).toEqual(expect.any(Number));
});
