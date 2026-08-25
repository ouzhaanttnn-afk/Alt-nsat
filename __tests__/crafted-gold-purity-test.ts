import { MINUTES_PER_DAY } from '../src/config/economyConfig';
import { craftedMeltHasGrams } from '../src/engine/craftedGoods';
import { useGameStore } from '../src/store/useGameStore';
import type { InventoryItem } from '../src/types/game';

const initialState = useGameStore.getState();

function craftedItem(karat: number): InventoryItem {
  return {
    id: `crafted-${karat}`,
    name: `${karat} Ayar Yüzük`,
    category: 'iscilikli',
    karat,
    actualKarat: karat,
    grams: 10,
    quantity: 1,
    costBasisTl: 20_000,
    estimatedValueTl: 30_000,
    stoneValueTl: 0,
    source: 'Müşteri getirdi',
    acquiredDay: 1,
    workshopStatus: 'none',
    workshopProcessed: false,
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

describe('crafted item melt purity conversion', () => {
  it.each([
    { karat: 8, expectedHasGrams: 3.33, purity: 0.333 },
    { karat: 14, expectedHasGrams: 5.85, purity: 0.585 },
    { karat: 18, expectedHasGrams: 7.5, purity: 0.75 },
    { karat: 22, expectedHasGrams: 9.16, purity: 0.916 },
  ])('uses $purity purity for 10g $karat ayar crafted melt', ({ karat, expectedHasGrams }) => {
    const item = craftedItem(karat);
    useGameStore.setState({ inventory: [item] });

    expect(craftedMeltHasGrams(item.grams, karat)).toBe(expectedHasGrams);
    expect(useGameStore.getState().meltCraftedGood(item.id)).toBe(true);
    expect(useGameStore.getState().inventory).toHaveLength(0);
    expect(useGameStore.getState().meltCraftedGood(item.id)).toBe(false);

    const job = useGameStore.getState().meltingJob!;
    expect(job.recoveredGrams).toBe(expectedHasGrams);
    expect(job.costBasisTl).toBe(item.costBasisTl);
    expect(job.stoneValueTl).toBe(0);

    moveClockToTotalMinutes(job.completesAtTotalMinutes - 5);
    useGameStore.getState().tick(5);

    const gramAltin = useGameStore.getState().inventory.find((stockItem) => stockItem.name === 'Gram Altın (Has)');
    expect(gramAltin?.quantity).toBe(expectedHasGrams);
    expect(gramAltin?.grams).toBe(1);
    expect(gramAltin?.karat).toBe(24);
    expect(useGameStore.getState().inventory.some((stockItem) => stockItem.category === 'iscilikli')).toBe(false);
  });
});
