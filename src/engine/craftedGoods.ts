import {
  CRAFTED_MELT_PURITY_BY_KARAT,
  CRAFTED_WORKSHOP_MIN_CRAFT_PREMIUM_RATIO,
  CRAFTED_WORKSHOP_PROCESSING_DAYS_BY_SIZE,
  CRAFTED_WORKSHOP_VALUE_BONUS_RATIO,
} from '../config/economyConfig';
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

export function craftedWorkshopDurationDays(item: Pick<InventoryItem, 'grams'>): number {
  if (item.grams <= 10) return CRAFTED_WORKSHOP_PROCESSING_DAYS_BY_SIZE.small;
  if (item.grams <= 25) return CRAFTED_WORKSHOP_PROCESSING_DAYS_BY_SIZE.medium;
  return CRAFTED_WORKSHOP_PROCESSING_DAYS_BY_SIZE.large;
}

export function craftedWorkshopResult(
  item: InventoryItem,
  buyPricePerGram: number,
): {
  metalValueTl: number;
  craftValueBeforeTl: number;
  craftValueAfterTl: number;
  estimatedValueTl: number;
  valueAddedTl: number;
} {
  const metalValueTl = craftedGoodMetalValueTl(item, buyPricePerGram);
  const minimumCraftPremiumTl = Math.round(item.costBasisTl * CRAFTED_WORKSHOP_MIN_CRAFT_PREMIUM_RATIO);
  const craftValueBeforeTl = Math.max(craftedGoodCraftValueTl(item, buyPricePerGram), minimumCraftPremiumTl);
  const craftValueAfterTl = Math.round(craftValueBeforeTl * (1 + CRAFTED_WORKSHOP_VALUE_BONUS_RATIO));
  return {
    metalValueTl,
    craftValueBeforeTl,
    craftValueAfterTl,
    estimatedValueTl: metalValueTl + craftValueAfterTl,
    valueAddedTl: craftValueAfterTl - craftValueBeforeTl,
  };
}
