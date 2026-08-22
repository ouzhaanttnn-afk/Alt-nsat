import { create } from 'zustand';
import type { Opportunity } from '../components/OpportunityCard';
import { marketOpportunities } from '../data/mockMarket';
import type { PirlantaCatalogItem } from '../data/mockPirlanta';
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

export interface VitrinMaturityEvent {
  count: number;
  totalPayoutTl: number;
  sampleName: string;
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
// satılmıyor — vitrine girip kendi kâr potansiyeline göre sürekli pasif
// gelir üretiyor (yüksek marjlı ürün günde daha çok kazandırır). 30 gün
// (vitrin vadesi) dolunca ürün "satılmış" sayılır: o güne kadar zaten
// beklenen kârının tamamını gün gün tahsil etmiştir, vade sonunda sadece
// ödediği maliyet nakde döner ve vitrinden kalkar. Yatırım altını
// (çeyrek/gram/vb.) ise doğrudan/aktif alınıp satılıyor, değeri güncel
// kurla dalgalanır, vade kavramı yok.
export const VITRIN_TERM_DAYS = 30;

function priceFromReference(reference: number): Pick<GoldPriceState, 'buyPricePerGram' | 'sellPricePerGram'> {
  return {
    buyPricePerGram: reference * (1 - SPREAD_RATIO),
    sellPricePerGram: reference * (1 + SPREAD_RATIO),
  };
}

/** Has altın karşılığı: karat 24 üzerinden orantılanmış birim gram. */
export function hasEquivalentGrams(item: InventoryItem): number {
  return item.grams * (item.karat / 24);
}

/** Bir pozisyonun güncel toplam değeri (tüm adet dahil, canlı kurdan). */
export function currentPositionValueTl(item: InventoryItem, buyPricePerGram: number): number {
  return hasEquivalentGrams(item) * item.quantity * buyPricePerGram;
}

/** Stok değerini envanterden yeniden hesaplar: takı/pırlanta sabit değerde, yatırım güncel kurda. */
function computeStockValueTl(inventory: InventoryItem[], buyPricePerGram: number): number {
  return inventory.reduce((sum, item) => {
    if (item.category === 'yatirim') {
      return sum + currentPositionValueTl(item, buyPricePerGram);
    }
    return sum + item.costBasisTl;
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
  /** En son tick'te vadesi dolup vitrinden kalkan takı(lar) — banner için. */
  lastVitrinMaturity: VitrinMaturityEvent | null;
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
    item: {
      name: string;
      category: InventoryCategory;
      karat: number;
      grams: number;
      marketValueTl: number;
      /** Sadece takı: vitrin vadesi sonunda beklenen satış değeri. */
      estimatedSellPriceTl?: number;
    },
  ) => { success: true; borrowedTl: number } | { success: false; borrowedTl: 0 };
  /** Bir yatırım pozisyonunun tamamını güncel kurdan nakde çevirir; alış-satış makasından gerçekleşen kârı döner. */
  sellInventoryItem: (itemId: string) => { saleValueTl: number; profitTl: number; quantity: number } | null;
  /** Nakitten borcu (kısmen ya da tamamen) kapatır. */
  repayDebt: (amountTl: number) => void;
  /** Satın alınan bir Piyasa fırsatını listeden kaldırır. */
  removeMarketListing: (id: string) => void;
  /** Alım-satım makasından bugüne kadar gerçekleşen toplam kâr/zarar. */
  realizedTradingProfitTl: number;
  /**
   * Gerçek para (mağaza içi satın alma) ile kalıcı bir pırlanta vitrin
   * parçası ekler. YER TUTUCU: gerçek ödeme tahsilatı yapmaz, oyun içi
   * nakit/borca hiç dokunmaz — App Store/Play Store IAP entegrasyonu
   * bağlanınca bu eylem gerçek satın alma onayından sonra çağrılacak.
   */
  purchasePirlanta: (catalogItem: PirlantaCatalogItem) => void;
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
  lastVitrinMaturity: null,
  realizedTradingProfitTl: 0,

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

    // Her takı kendi kâr potansiyeline göre günlük pasif gelir üretir;
    // vitrin vadesi (30 gün) dolan ürün "satılmış" sayılıp maliyeti
    // nakde döner ve envanterden kalkar.
    let vitrinIncomeTl = 0;
    let maturedCount = 0;
    let maturedPayoutTl = 0;
    let maturedSampleName = '';
    const inventory: InventoryItem[] = [];
    for (const item of state.inventory) {
      if (item.category === 'pirlanta') {
        // Kalıcı vitrin parçası: vade yok, sabit günlük gelir sonsuza kadar sürer.
        vitrinIncomeTl += (item.dailyIncomeTl ?? 0) * item.quantity * (gameMinutes / MINUTES_PER_DAY);
        inventory.push(item);
        continue;
      }
      if (item.category !== 'taki') {
        inventory.push(item);
        continue;
      }
      const ageInDays = day - item.acquiredDay;
      if (ageInDays >= VITRIN_TERM_DAYS) {
        maturedCount += 1;
        maturedPayoutTl += item.costBasisTl;
        maturedSampleName = item.name;
        continue;
      }
      const expectedProfitTl = (item.estimatedValueTl ?? item.costBasisTl) - item.costBasisTl;
      const dailyIncomeTl = expectedProfitTl / VITRIN_TERM_DAYS;
      vitrinIncomeTl += dailyIncomeTl * (gameMinutes / MINUTES_PER_DAY);
      inventory.push(item);
    }
    const lastVitrinMaturity: VitrinMaturityEvent | null =
      maturedCount > 0
        ? { count: maturedCount, totalPayoutTl: maturedPayoutTl, sampleName: maturedSampleName }
        : state.lastVitrinMaturity;

    set({
      minuteOfDay,
      day,
      referencePriceAtDayStart,
      lastJumpEvent: jumpEvent,
      wholesalerTrust,
      loanDueDay,
      inventory,
      lastVitrinMaturity,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + vitrinIncomeTl + maturedPayoutTl,
        stockValueTl: computeStockValueTl(inventory, nextBuyPrice),
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

    // Yatırım altını fungible olduğu için aynı ürün (isim/kategori/ayar/
    // gram eşleşen) zaten envanterdeyse yeni alım o pozisyona eklenir ve
    // maliyet ortalaması güncellenir. Takı ise her parça kendi 30 günlük
    // vitrin vadesini ayrı işletmesi gerektiğinden hiçbir zaman birleşmez.
    const existingIndex =
      item.category === 'yatirim'
        ? state.inventory.findIndex(
            (i) =>
              i.name === item.name &&
              i.category === item.category &&
              i.karat === item.karat &&
              i.grams === item.grams,
          )
        : -1;

    const inventory =
      existingIndex >= 0
        ? state.inventory.map((i, idx) =>
            idx === existingIndex
              ? { ...i, quantity: i.quantity + 1, costBasisTl: i.costBasisTl + paidAmountTl }
              : i,
          )
        : [
            ...state.inventory,
            {
              id: String(nextInventoryId++),
              name: item.name,
              category: item.category,
              karat: item.karat,
              grams: item.grams,
              quantity: 1,
              costBasisTl: paidAmountTl,
              acquiredDay: state.day,
              estimatedValueTl: item.estimatedSellPriceTl,
            } satisfies InventoryItem,
          ];

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
    if (!item || item.category !== 'yatirim') return null;

    const saleValueTl = currentPositionValueTl(item, state.goldPrice.buyPricePerGram);
    const profitTl = saleValueTl - item.costBasisTl;
    const inventory = state.inventory.filter((i) => i.id !== itemId);

    set({
      inventory,
      realizedTradingProfitTl: state.realizedTradingProfitTl + profitTl,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + saleValueTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
    });
    return { saleValueTl, profitTl, quantity: item.quantity };
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

  purchasePirlanta: (catalogItem) => {
    const state = get();
    const existingIndex = state.inventory.findIndex(
      (i) => i.category === 'pirlanta' && i.name === catalogItem.name,
    );

    const inventory =
      existingIndex >= 0
        ? state.inventory.map((i, idx) =>
            idx === existingIndex
              ? { ...i, quantity: i.quantity + 1, costBasisTl: i.costBasisTl + catalogItem.symbolicValueTl }
              : i,
          )
        : [
            ...state.inventory,
            {
              id: String(nextInventoryId++),
              name: catalogItem.name,
              category: 'pirlanta',
              karat: catalogItem.karat,
              grams: catalogItem.grams,
              quantity: 1,
              costBasisTl: catalogItem.symbolicValueTl,
              acquiredDay: state.day,
              dailyIncomeTl: catalogItem.dailyIncomeTl,
              realMoneyPriceLabel: catalogItem.priceLabel,
            } satisfies InventoryItem,
          ];

    // Not: cashTl/debtTl'ye kasıtlı olarak dokunulmuyor — gerçek para,
    // oyun içi altın ekonomisinden tamamen ayrı bir rayda.
    set({
      inventory,
      capital: {
        ...state.capital,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
    });
  },
}));
