import { CRAFTED_MELT_PURITY_BY_KARAT } from '../config/economyConfig';
import type { InventoryItem } from '../types/game';
import { equivalentGrams } from './pricing';

export function isCraftedGoodItem(item: Pick<InventoryItem, 'category'>): boolean {
  return item.category === 'iscilikli';
}

export function craftedGoodHasGrams(item: Pick<InventoryItem, 'grams' | 'karat'>): number {
  return equivalentGrams(item.grams, item.karat);
}

export function craftedMeltHasGrams(grams: number, karat: number): number {
  const purity = CRAFTED_MELT_PURITY_BY_KARAT[karat] ?? karat / 24;
  return Math.round(grams * purity * 100) / 100;
}

export function craftedGoodMetalValueTl(
  item: Pick<InventoryItem, 'grams' | 'karat'>,
  buyPricePerGram: number,
): number {
  return Math.round(craftedGoodHasGrams(item) * buyPricePerGram);
}

export function craftedGoodEstimatedValueTl(item: InventoryItem, buyPricePerGram: number): number {
  return Math.round(item.estimatedValueTl ?? Math.max(item.costBasisTl, craftedGoodMetalValueTl(item, buyPricePerGram)));
}

export function craftedGoodCraftValueTl(item: InventoryItem, buyPricePerGram: number): number {
  return Math.max(0, craftedGoodEstimatedValueTl(item, buyPricePerGram) - craftedGoodMetalValueTl(item, buyPricePerGram));
}
