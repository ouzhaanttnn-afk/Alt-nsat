import { create } from 'zustand';
import type { CapitalState, GoldPriceState, ReputationState } from '../types/game';

// Bölüm 2: Oyuncu 1 kg has altınla başlar. Şimdilik başlangıç kuru sabit,
// dalgalanma motoru (rastgele yürüyüş + nadir sıçrama) sonraki adımda eklenecek.
const STARTING_GOLD_GRAMS = 1000;
const STARTING_PRICE_PER_GRAM = 6845; // TL, referans başlangıç kuru

interface GameState {
  capital: CapitalState;
  goldPrice: GoldPriceState;
  reputation: ReputationState;
  day: number;
}

export const useGameStore = create<GameState>(() => ({
  capital: {
    goldGrams: STARTING_GOLD_GRAMS,
    cashTl: 0,
    stockValueTl: STARTING_GOLD_GRAMS * STARTING_PRICE_PER_GRAM,
    debtTl: 0,
  },
  goldPrice: {
    buyPricePerGram: STARTING_PRICE_PER_GRAM,
    sellPricePerGram: STARTING_PRICE_PER_GRAM * 0.98,
    dailyChangePercent: 0,
  },
  reputation: {
    score: 50,
  },
  day: 1,
}));
