import { create } from 'zustand';
import type { Opportunity } from '../components/OpportunityCard';
import { marketOpportunities } from '../data/mockMarket';
import type {
  CapitalState,
  GoldPriceState,
  InventoryCategory,
  InventoryItem,
  ReputationState,
} from '../types/game';

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

// Toptancı Güveni: borç aldığında bir vade başlar, vadeyi geç ödersen
// güven düşer ve vade yeniden ötelenir (kronik geç ödeyen daha çok
// puan kaybeder). Güven belirli bir eşiğin altına inerse toptancı
// artık kredi (borçla tamamlama) vermez.
const STARTING_WHOLESALER_TRUST = 65;
const LOAN_TERM_DAYS = 5;
const LATE_PAYMENT_TRUST_PENALTY = 15;
const MIN_TRUST_FOR_CREDIT = 30;

// Kullanıcı kararı: takı (bilezik/yüzük/kolye) tek tek pazarlıkla
// satılmıyor — vitrine girip toplam değerinin sabit bir günlük oranı
// kadar sürekli pasif gelir üretiyor. Yatırım altını (çeyrek/gram/vb.)
// ise doğrudan/aktif alınıp satılıyor, değeri güncel kurla dalgalanır.
export const TAKI_PASSIVE_INCOME_RATE_PER_DAY = 0.015;

function priceFromReference(reference: number): Pick<GoldPriceState, 'buyPricePerGram' | 'sellPricePerGram'> {
  return {
    buyPricePerGram: reference * (1 - SPREAD_RATIO),
    sellPricePerGram: reference * (1 + SPREAD_RATIO),
  };
}

/** Has altın karşılığı: karat 24 üzerinden orantılanmış gram. */
export function hasEquivalentGrams(item: InventoryItem): number {
  return item.grams * (item.karat / 24);
}

/** Stok değerini envanterden yeniden hesaplar: takı sabit değerde, yatırım güncel kurda. */
function computeStockValueTl(inventory: InventoryItem[], buyPricePerGram: number): number {
  return inventory.reduce((sum, item) => {
    if (item.category === 'yatirim') {
      return sum + hasEquivalentGrams(item) * buyPricePerGram;
    }
    return sum + item.valueTl;
  }, 0);
}

let nextInventoryId = 1;

interface GameState {
  capital: CapitalState;
  goldPrice: GoldPriceState;
  reputation: ReputationState;
  inventory: InventoryItem[];
  /** Piyasa'daki satın alınabilir fırsatlar; satın alınan bir fırsat listeden kalkar. */
  marketListings: Opportunity[];
  day: number;
  minuteOfDay: number;
  speed: ClockSpeed;
  referencePriceAtDayStart: number;
  lastJumpEvent: JumpEvent | null;
  wholesalerTrust: number;
  /** Aktif borcun ödenmesi gereken oyun günü; borç yoksa null. */
  loanDueDay: number | null;
  setSpeed: (speed: ClockSpeed) => void;
  /** Gerçek zamanda geçen saniyeyi oyun saatine, altın fiyatına ve pasif gelire işler. */
  tick: (realSecondsElapsed: number) => void;
  /**
   * Bir alımı kapatır: önce nakitten öder, yetmeyen kısmı borca yazar.
   * Alınan ürün envantere eklenir (takı ise vitrine girip pasif gelir
   * üretmeye başlar, yatırım ise doğrudan satılabilir olur).
   * Toptancı Güveni eşiğin altındaysa ve nakit yetmiyorsa işlem reddedilir.
   */
  settleDeal: (
    paidAmountTl: number,
    item: { name: string; category: InventoryCategory; karat: number; grams: number; marketValueTl: number },
  ) => { success: true; borrowedTl: number } | { success: false; borrowedTl: 0 };
  /** Bir yatırım ürününü güncel kurdan nakde çevirir. */
  sellInventoryItem: (itemId: string) => void;
  /** Nakitten borcu (kısmen ya da tamamen) kapatır. */
  repayDebt: (amountTl: number) => void;
  /** Satın alınan bir Piyasa fırsatını listeden kaldırır. */
  removeMarketListing: (id: string) => void;
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
  inventory: [],
  marketListings: marketOpportunities,
  day: 1,
  minuteOfDay: 0,
  speed: 1,
  referencePriceAtDayStart: STARTING_REFERENCE_PRICE,
  lastJumpEvent: null,
  wholesalerTrust: STARTING_WHOLESALER_TRUST,
  loanDueDay: null,

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
    const nextBuyPrice = nextReference * (1 - SPREAD_RATIO);

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

    // Vadesi geçmiş borç varsa Toptancı Güveni düşer, vade yeniden ötelenir.
    let wholesalerTrust = state.wholesalerTrust;
    let loanDueDay = state.loanDueDay;
    if (state.capital.debtTl > 0 && loanDueDay !== null) {
      while (day > loanDueDay) {
        wholesalerTrust = Math.max(0, wholesalerTrust - LATE_PAYMENT_TRUST_PENALTY);
        loanDueDay += LOAN_TERM_DAYS;
      }
    } else if (state.capital.debtTl <= 0) {
      loanDueDay = null;
    }

    // Vitrindeki takının toplam değeri üzerinden sürekli oranlı pasif gelir.
    const vitrinValueTl = state.inventory
      .filter((item) => item.category === 'taki')
      .reduce((sum, item) => sum + item.valueTl, 0);
    const passiveIncomeTl = vitrinValueTl * TAKI_PASSIVE_INCOME_RATE_PER_DAY * (gameMinutes / MINUTES_PER_DAY);

    set({
      minuteOfDay,
      day,
      referencePriceAtDayStart,
      lastJumpEvent: jumpEvent,
      wholesalerTrust,
      loanDueDay,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + passiveIncomeTl,
        stockValueTl: computeStockValueTl(state.inventory, nextBuyPrice),
      },
      goldPrice: {
        ...priceFromReference(nextReference),
        dailyChangePercent,
      },
    });
  },

  settleDeal: (paidAmountTl, item) => {
    const state = get();
    const shortfall = Math.max(0, paidAmountTl - state.capital.cashTl);

    if (shortfall > 0 && state.wholesalerTrust < MIN_TRUST_FOR_CREDIT) {
      return { success: false, borrowedTl: 0 };
    }

    const cashTl = Math.max(0, state.capital.cashTl - paidAmountTl);
    const loanDueDay =
      shortfall > 0 && state.loanDueDay === null ? state.day + LOAN_TERM_DAYS : state.loanDueDay;

    const newItem: InventoryItem = {
      id: String(nextInventoryId++),
      name: item.name,
      category: item.category,
      karat: item.karat,
      grams: item.grams,
      valueTl: item.marketValueTl,
      acquiredDay: state.day,
    };
    const inventory = [...state.inventory, newItem];

    set({
      inventory,
      capital: {
        ...state.capital,
        cashTl,
        debtTl: state.capital.debtTl + shortfall,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      loanDueDay,
    });
    return { success: true, borrowedTl: shortfall };
  },

  sellInventoryItem: (itemId) => {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.category !== 'yatirim') return;

    const saleValueTl = hasEquivalentGrams(item) * state.goldPrice.buyPricePerGram;
    const inventory = state.inventory.filter((i) => i.id !== itemId);

    set({
      inventory,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + saleValueTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
    });
  },

  repayDebt: (amountTl) => {
    const state = get();
    const payment = Math.min(amountTl, state.capital.debtTl, state.capital.cashTl);
    if (payment <= 0) return;
    const debtTl = state.capital.debtTl - payment;
    set({
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl - payment,
        debtTl,
      },
      loanDueDay: debtTl <= 0 ? null : state.loanDueDay,
    });
  },

  removeMarketListing: (id) => {
    set((state) => ({
      marketListings: state.marketListings.filter((listing) => listing.id !== id),
    }));
  },
}));
