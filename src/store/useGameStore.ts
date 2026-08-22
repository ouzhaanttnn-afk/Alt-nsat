import { create } from 'zustand';
import type { CapitalState, GoldPriceState, ReputationState } from '../types/game';

export type ClockSpeed = 0 | 1 | 2 | 4;

export interface JumpEvent {
  percent: number;
  day: number;
}

// Bölüm 2: Oyuncu 1 kg has altınla başlar. "Açık nokta" olarak bırakılan
// likit/teminat ayrımı şöyle çözüldü: 200g nakde çevrilip kasaya konuyor,
// 800g fiziksel rezerv (SERMAYEN başlığı) olarak kalıyor. Tamamı rezerv
// olsaydı nakit hep 0 kalır, hiçbir alım gerçekleşemezdi.
const STARTING_CASH_GRAMS = 200;
const STARTING_RESERVE_GRAMS = 800;
const STARTING_REFERENCE_PRICE = 6845; // TL, gram altın referans (orta) fiyatı

// ALIŞ (piyasa sizden düşük fiyattan alır) / SATIŞ (piyasa size yüksek
// fiyattan satar) — referans fiyatın etrafında sabit bir spread.
const SPREAD_RATIO = 0.01;

export const MINUTES_PER_DAY = 1440;
// Oyun saatinin gerçek zamana oranı: 1x hızda 1 gün ≈ 8 gerçek dakika.
const GAME_MINUTES_PER_REAL_SECOND_AT_1X = 3;
// Bölüm 2: "her oyun-dakikasında ±%0.3–%1.2 küçük dalgalanma". Bağımsız
// dakika adımları tek seferde sqrt(n) ile ölçeklenerek uygulanıyor; bu
// yüzden 1440 dakikalık bir günde spesifikasyondaki ham değer (%1.2)
// günlük %25-30 gibi gerçekçi olmayan bir oynaklığa büyüyordu. Kripto
// değil kuyumcu hissi için düşürüldü — günlük tipik hareket artık
// birkaç puan, nadir sıçramalar (aşağıda) hâlâ göze çarpıyor.
const MAX_PERCENT_PER_MINUTE = 0.15;
// Bölüm 2: "Nadir büyük sıçrama (günde 1-2, %5-10 ihtimal): ±%5-15".
const JUMP_CHECKS_PER_DAY = 1.5;
const JUMP_TRIGGER_PROBABILITY = 0.075;
const JUMP_PROBABILITY_PER_MINUTE = (JUMP_CHECKS_PER_DAY * JUMP_TRIGGER_PROBABILITY) / MINUTES_PER_DAY;
// Uygulama arka planda uzun süre kaldıysa tek tick'te aşırı sıçramayı önler.
const MAX_REAL_SECONDS_PER_TICK = 5;

function priceFromReference(reference: number): Pick<GoldPriceState, 'buyPricePerGram' | 'sellPricePerGram'> {
  return {
    buyPricePerGram: reference * (1 - SPREAD_RATIO),
    sellPricePerGram: reference * (1 + SPREAD_RATIO),
  };
}

interface GameState {
  capital: CapitalState;
  goldPrice: GoldPriceState;
  reputation: ReputationState;
  day: number;
  minuteOfDay: number;
  speed: ClockSpeed;
  referencePriceAtDayStart: number;
  lastJumpEvent: JumpEvent | null;
  setSpeed: (speed: ClockSpeed) => void;
  /** Gerçek zamanda geçen saniyeyi oyun saatine ve altın fiyatına işler. */
  tick: (realSecondsElapsed: number) => void;
  /**
   * Bir alımı kapatır: önce nakitten öder, yetmeyen kısmı borca yazar.
   * Alınan ürün, has altın karşılığı üzerinden stok değerine eklenir.
   */
  settleDeal: (paidAmountTl: number, itemMarketValueTl: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  capital: {
    goldGrams: STARTING_RESERVE_GRAMS,
    cashTl: STARTING_CASH_GRAMS * STARTING_REFERENCE_PRICE,
    stockValueTl: STARTING_RESERVE_GRAMS * STARTING_REFERENCE_PRICE,
    debtTl: 0,
  },
  goldPrice: {
    ...priceFromReference(STARTING_REFERENCE_PRICE),
    dailyChangePercent: 0,
  },
  reputation: {
    score: 50,
  },
  day: 1,
  minuteOfDay: 0,
  speed: 1,
  referencePriceAtDayStart: STARTING_REFERENCE_PRICE,
  lastJumpEvent: null,

  setSpeed: (speed) => set({ speed }),

  tick: (realSecondsElapsedRaw) => {
    const state = get();
    if (state.speed === 0) return;

    const realSecondsElapsed = Math.min(realSecondsElapsedRaw, MAX_REAL_SECONDS_PER_TICK);
    const gameMinutes = realSecondsElapsed * state.speed * GAME_MINUTES_PER_REAL_SECOND_AT_1X;
    if (gameMinutes <= 0) return;

    const currentReference = (state.goldPrice.buyPricePerGram + state.goldPrice.sellPricePerGram) / 2;
    const walkPercent = (Math.random() * 2 - 1) * MAX_PERCENT_PER_MINUTE * Math.sqrt(gameMinutes);
    let nextReference = currentReference * (1 + walkPercent / 100);

    let jumpEvent = state.lastJumpEvent;
    const jumpProbability = JUMP_PROBABILITY_PER_MINUTE * gameMinutes;
    if (Math.random() < jumpProbability) {
      const magnitude = 5 + Math.random() * 10; // %5-15
      const jumpPercent = Math.random() < 0.5 ? -magnitude : magnitude;
      nextReference *= 1 + jumpPercent / 100;
      jumpEvent = { percent: jumpPercent, day: state.day };
    }
    nextReference = Math.max(nextReference, 100);

    let minuteOfDay = state.minuteOfDay + gameMinutes;
    let day = state.day;
    let referencePriceAtDayStart = state.referencePriceAtDayStart;
    while (minuteOfDay >= MINUTES_PER_DAY) {
      minuteOfDay -= MINUTES_PER_DAY;
      day += 1;
      referencePriceAtDayStart = nextReference;
    }

    const dailyChangePercent =
      ((nextReference - referencePriceAtDayStart) / referencePriceAtDayStart) * 100;

    set({
      minuteOfDay,
      day,
      referencePriceAtDayStart,
      lastJumpEvent: jumpEvent,
      goldPrice: {
        ...priceFromReference(nextReference),
        dailyChangePercent,
      },
    });
  },

  settleDeal: (paidAmountTl, itemMarketValueTl) => {
    const state = get();
    const shortfall = Math.max(0, paidAmountTl - state.capital.cashTl);
    const cashTl = Math.max(0, state.capital.cashTl - paidAmountTl);
    set({
      capital: {
        ...state.capital,
        cashTl,
        debtTl: state.capital.debtTl + shortfall,
        stockValueTl: state.capital.stockValueTl + itemMarketValueTl,
      },
    });
  },
}));
