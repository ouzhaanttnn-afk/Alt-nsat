import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  BOZDURMA_BULK_LOT_MAX_GRAMS,
  BOZDURMA_BULK_LOT_MIN_GRAMS,
  BOZDURMA_BULK_LOT_PROBABILITY,
  BOZDURMA_DIRECTION_PROBABILITY,
  CAPITAL_TIERS,
  GAME_MINUTES_PER_REAL_SECOND_AT_1X,
  INCOMING_CUSTOMER_CHECKS_PER_DAY,
  INCOMING_CUSTOMER_EXPIRY_MINUTES,
  INCOMING_CUSTOMER_TRIGGER_PROBABILITY,
  LATE_PAYMENT_TRUST_PENALTY,
  LOAN_TERM_DAYS,
  MARKET_SPREAD_MAX_TL_PER_GRAM,
  MARKET_SPREAD_MIN_TL_PER_GRAM,
  MARKET_STEP_MAX_PERCENT,
  MARKET_STEP_MIN_PERCENT,
  MARKET_STEP_MINUTES,
  MAX_REAL_SECONDS_PER_TICK,
  MIN_TRUST_FOR_CREDIT,
  MINUTES_PER_DAY,
  OFFER_RESOLUTION_DELAY_MINUTES,
  RESTART_FLUCTUATION_MAX_PERCENT,
  RESTART_FLUCTUATION_MIN_PERCENT,
  STARTING_CAPITAL_GRAMS,
  STARTING_REFERENCE_PRICE,
  STARTING_WHOLESALER_TRUST,
  WHOLESALER_MARGIN_MAX_TL_PER_GRAM,
  WHOLESALER_MARGIN_MIN_TL_PER_GRAM,
} from '../config/economyConfig';
import type { ScaleReading } from '../components/ScalePanel';
import {
  BOZDURMA_CUSTOMER_ARCHETYPES,
  INCOMING_CUSTOMER_ARCHETYPES,
  INCOMING_CUSTOMER_NAMES,
} from '../data/incomingCustomerPool';
import { toptanciStock } from '../data/toptanciStock';
import type { PirlantaCatalogItem } from '../data/mockPirlanta';
import { skillTree } from '../data/skillTree';
import type {
  CapitalState,
  GoldPriceState,
  InventoryCategory,
  InventoryItem,
  ReputationState,
} from '../types/game';
import type { IncomingCustomer } from '../types/incomingCustomer';
import type { Offer } from '../types/offer';

export type ClockSpeed = 0 | 1 | 2 | 4;

export {
  CAPITAL_TIERS,
  MINUTES_PER_DAY,
  OFFER_RESOLUTION_DELAY_MINUTES,
} from '../config/economyConfig';

function computeNetWorthTl(capital: CapitalState): number {
  return capital.cashTl + capital.stockValueTl - capital.debtTl;
}

function tierIndexForNetWorth(netWorthTl: number): number {
  let index = -1;
  for (let i = 0; i < CAPITAL_TIERS.length; i++) {
    if (netWorthTl >= CAPITAL_TIERS[i]) index = i;
  }
  return index;
}

/** [min, max] aralığında düzgün dağılımlı rastgele değer. */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** ±magnitude yüzdesinde, rastgele işaretli bir fiyat hareketi. */
function randomSignedPercent(minMagnitude: number, maxMagnitude: number): number {
  const magnitude = randomInRange(minMagnitude, maxMagnitude);
  return Math.random() < 0.5 ? -magnitude : magnitude;
}

function priceFromReferenceAndSpread(
  reference: number,
  spreadTlPerGram: number,
): Pick<GoldPriceState, 'buyPricePerGram' | 'sellPricePerGram'> {
  return {
    buyPricePerGram: reference - spreadTlPerGram / 2,
    sellPricePerGram: reference + spreadTlPerGram / 2,
  };
}

/** Has altın karşılığı: karat 24 üzerinden orantılanmış gram. */
function equivalentGrams(grams: number, karat: number): number {
  return grams * (karat / 24);
}

/** Has altın karşılığı: karat 24 üzerinden orantılanmış birim gram. */
export function hasEquivalentGrams(item: InventoryItem): number {
  return equivalentGrams(item.grams, item.karat);
}

/** Bir pozisyonun güncel toplam değeri (tüm adet dahil, canlı kurdan). */
export function currentPositionValueTl(item: InventoryItem, buyPricePerGram: number): number {
  return hasEquivalentGrams(item) * item.quantity * buyPricePerGram;
}

/** Stok değerini envanterden yeniden hesaplar: pırlanta sabit (sembolik) değerde, geri kalan (sarrafiye) güncel kurda mark-to-market. */
function computeStockValueTl(inventory: InventoryItem[], buyPricePerGram: number): number {
  return inventory.reduce((sum, item) => {
    if (item.category === 'pirlanta') {
      return sum + item.costBasisTl;
    }
    return sum + currentPositionValueTl(item, buyPricePerGram);
  }, 0);
}

let nextInventoryId = 1;
let nextOfferId = 1;
let nextIncomingCustomerId = 1;

interface BozdurmaCandidate {
  name: string;
  category: InventoryCategory;
  karat: number;
  gramsPerUnit: number;
  quantity: number;
}

/** Bölüm 6/10: müşteriden alım (bozdurma) için ürün + miktar üretir — çoğunlukla stoktaki 3 kalemden biri (küçük/orta miktar), nadiren büyük karışık ayarlı bir hurda parti. */
function pickBozdurmaCandidate(): BozdurmaCandidate {
  if (Math.random() < BOZDURMA_BULK_LOT_PROBABILITY) {
    const karat = [14, 18, 20, 22][Math.floor(Math.random() * 4)];
    const grams = Math.round(randomInRange(BOZDURMA_BULK_LOT_MIN_GRAMS, BOZDURMA_BULK_LOT_MAX_GRAMS));
    return { name: 'Karışık Hurda Altın', category: 'yatirim', karat, gramsPerUnit: grams, quantity: 1 };
  }
  const spec = toptanciStock[Math.floor(Math.random() * toptanciStock.length)];
  const quantity =
    spec.id === 'gram-altin'
      ? 1 + Math.floor(Math.random() * 30)
      : spec.id === 'ceyrek-altin'
        ? 1 + Math.floor(Math.random() * 15)
        : 1 + Math.floor(Math.random() * 4);
  return { name: spec.name, category: spec.category, karat: spec.karat, gramsPerUnit: spec.grams, quantity };
}

interface GameState {
  capital: CapitalState;
  goldPrice: GoldPriceState;
  reputation: ReputationState;
  inventory: InventoryItem[];
  /** Bölüm 4.6: Bekleyen/Kabul/Red durumundaki tüm pazarlık teklifleri. */
  offers: Offer[];
  /** Piyasa: dükkâna gelmiş, o an aktif müşteri (alım ya da bozdurma isteyebilir). */
  incomingCustomer: IncomingCustomer | null;
  day: number;
  minuteOfDay: number;
  speed: ClockSpeed;
  referencePriceAtDayStart: number;
  /** Bölüm 4.4: genel piyasa ALIŞ/SATIŞ makası (TL/gram) — her 30 dakikalık piyasa adımında yeniden belirlenir. */
  marketSpreadTlPerGram: number;
  /** Bölüm 5: toptancının SATIŞ fiyatının şu kadar altından oyuncuya sattığı marj (TL/gram). */
  wholesalerBuyMarginTlPerGram: number;
  /** Bölüm 5: toptancının ALIŞ/bozdurma fiyatının şu kadar üstünden oyuncudan aldığı marj (TL/gram) — ileri fazlardaki Toptancı Bağlantısı için ayrılmış. */
  wholesalerSellMarginTlPerGram: number;
  wholesalerTrust: number;
  /** Aktif borcun ödenmesi gereken oyun günü; borç yoksa null. */
  loanDueDay: number | null;
  setSpeed: (speed: ClockSpeed) => void;
  /** Gerçek zamanda geçen saniyeyi oyun saatine, altın fiyatına ve müşteri akışına işler. */
  tick: (realSecondsElapsed: number) => void;
  /** Uygulama yeniden açıldığında (rehydration) referans fiyata bir kez daha ekstra ±%3-5 dalgalanma uygular. */
  applyRestartFluctuation: () => void;
  /**
   * Bir alımı kapatır: önce nakitten öder, yetmeyen kısmı borca yazar.
   * Alınan ürün envantere eklenir; aynı ürün (isim/kategori/ayar/gram)
   * zaten stoktaysa mevcut pozisyona eklenip maliyet ortalaması güncellenir.
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
      estimatedSellPriceTl?: number;
      /** Bölüm 10: büyük işlemler — tek pazarlıkta N adet aynı SKU'nun toplu alımı. Belirtilmezse 1. */
      quantity?: number;
    },
  ) => { success: true; borrowedTl: number } | { success: false; borrowedTl: 0 };
  /** Bir pozisyonun tamamını güncel kurdan nakde çevirir; alış-satış makasından gerçekleşen kârı döner. */
  sellInventoryItem: (itemId: string) => { saleValueTl: number; profitTl: number; quantity: number } | null;
  /**
   * Piyasa: Toptancıdan Stok Al — pazarlıksız, her an açık restok. Genel
   * piyasa SATIŞ kurunun toptancı marjı kadar altından, sadece nakit
   * yettiği kadar (borç/kredi yok) anında satın alır.
   */
  buyInvestmentUnits: (
    spec: { name: string; karat: number; grams: number; category: InventoryCategory },
    quantity: number,
  ) => { success: true } | { success: false; reason: 'insufficient_cash' };
  /** Bir pozisyondan istenen adedi (kısmi olabilir) güncel ALIŞ kurundan anında nakde çevirir. */
  sellInvestmentUnits: (
    itemId: string,
    quantity: number,
  ) => { saleValueTl: number; profitTl: number; quantity: number } | null;
  /** Nakitten borcu (kısmen ya da tamamen) kapatır. */
  repayDebt: (amountTl: number) => void;
  /**
   * Kaydırma çubuğuyla gönderilen bir alım teklifini "bekleyen" olarak
   * kaydeder. Sonuç (kabul/red) aslında gönderildiği anda `willAccept` ile
   * belirlenmiştir — tick() içinde vadesi (OFFER_RESOLUTION_DELAY_MINUTES)
   * dolunca açığa çıkar ve kabul ise settleDeal ile aynı şekilde kapanır.
   */
  sendPendingOffer: (offer: {
    customerName: string;
    productName: string;
    category: InventoryCategory;
    karat: number;
    grams: number;
    offerAmountTl: number;
    marketValueTl: number;
    estimatedSellPriceTl?: number;
    quantity?: number;
    willAccept: boolean;
  }) => void;
  /**
   * Aktif gelen müşteriye (direction:'satis') yanıt verir. Kabulde
   * (accepted=true, saleAmountTl ile) stoktan bir adet düşülür,
   * karşılığında pazarlıkla anlaşılan tutar nakde eklenir. Reddde
   * müşteri elini boş dönüp gider.
   */
  resolveIncomingCustomer: (accepted: boolean, saleAmountTl?: number) => { profitTl: number } | null;
  /**
   * Bölüm 6: direction:'bozdurma' bir müşterinin pazarlığı (mevcut 'alis'
   * modu, settleDeal üzerinden) sonuçlandığında aktif müşteriyi temizler
   * — sadece hâlâ aynı müşteri aktifse (id eşleşirse) etkilidir.
   */
  clearIncomingCustomer: (id: string) => void;
  /** Alım-satım makasından bugüne kadar gerçekleşen toplam kâr/zarar. */
  realizedTradingProfitTl: number;
  /**
   * Gerçek para (mağaza içi satın alma) ile kalıcı bir pırlanta vitrin
   * parçası ekler. YER TUTUCU: gerçek ödeme tahsilatı yapmaz, oyun içi
   * nakit/borca hiç dokunmaz — App Store/Play Store IAP entegrasyonu
   * bağlanınca bu eylem gerçek satın alma onayından sonra çağrılacak.
   */
  purchasePirlanta: (catalogItem: PirlantaCatalogItem) => void;

  // Bölüm 7: Yetenek Ağacı. Her yeni Sermaye Kademesi'ne (Bölüm 2) ulaşmak
  // bir puan kazandırır; puanlar skillTree'deki yeteneklere harcanır.
  skillPoints: number;
  skillLevels: Record<string, number>;
  highestCapitalTierIndex: number;
  /** Bir yeteneği bir seviye yükseltir; puan yoksa ya da zaten maksimumdaysa false döner. */
  levelUpSkill: (skillId: string) => boolean;
  /** İtibarı 0-100 aralığında sınırlayarak değiştirir (skill etkileri, gelecekte olaylar vb. için). */
  adjustReputation: (delta: number) => void;

  /** Kalıcı kayıt (AsyncStorage) yüklenene kadar false — bkz. App.tsx'teki yükleme ekranı. */
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

// Oyuncu zaten bu kademeleri geçmiş sayılıp buna karşılık gelen puanla başlıyor
// (1kg altınla başlamak zaten bir birikimi temsil ediyor).
const STARTING_NET_WORTH_TL = STARTING_CAPITAL_GRAMS * STARTING_REFERENCE_PRICE;
const STARTING_CAPITAL_TIER_INDEX = tierIndexForNetWorth(STARTING_NET_WORTH_TL);
const STARTING_MARKET_SPREAD_TL_PER_GRAM = randomInRange(
  MARKET_SPREAD_MIN_TL_PER_GRAM,
  MARKET_SPREAD_MAX_TL_PER_GRAM,
);

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  capital: {
    cashTl: STARTING_CAPITAL_GRAMS * STARTING_REFERENCE_PRICE,
    stockValueTl: 0,
    debtTl: 0,
  },
  goldPrice: {
    ...priceFromReferenceAndSpread(STARTING_REFERENCE_PRICE, STARTING_MARKET_SPREAD_TL_PER_GRAM),
    dailyChangePercent: 0,
  },
  reputation: {
    score: 50,
  },
  inventory: [],
  offers: [],
  incomingCustomer: null,
  day: 1,
  minuteOfDay: 0,
  speed: 1,
  referencePriceAtDayStart: STARTING_REFERENCE_PRICE,
  marketSpreadTlPerGram: STARTING_MARKET_SPREAD_TL_PER_GRAM,
  wholesalerBuyMarginTlPerGram: randomInRange(WHOLESALER_MARGIN_MIN_TL_PER_GRAM, WHOLESALER_MARGIN_MAX_TL_PER_GRAM),
  wholesalerSellMarginTlPerGram: randomInRange(WHOLESALER_MARGIN_MIN_TL_PER_GRAM, WHOLESALER_MARGIN_MAX_TL_PER_GRAM),
  wholesalerTrust: STARTING_WHOLESALER_TRUST,
  loanDueDay: null,
  realizedTradingProfitTl: 0,
  skillPoints: STARTING_CAPITAL_TIER_INDEX + 1,
  skillLevels: {},
  highestCapitalTierIndex: STARTING_CAPITAL_TIER_INDEX,

  setSpeed: (speed) => set({ speed }),

  tick: (realSecondsElapsedRaw) => {
    const state = get();
    if (state.speed === 0) return;

    const realSecondsElapsed = Math.min(realSecondsElapsedRaw, MAX_REAL_SECONDS_PER_TICK);
    const gameMinutes = realSecondsElapsed * state.speed * GAME_MINUTES_PER_REAL_SECOND_AT_1X;
    if (gameMinutes <= 0) return;

    // Bölüm 4.4: referans fiyat her 30 oyun-dakikasında bir ±%3-5 hareket
    // eder. Bir tick birden fazla 30 dakikalık eşiği aşabileceğinden
    // (yüksek hız), kaç bağımsız adımın uygulanması gerektiği hesaplanır.
    const totalMinutesBefore = state.day * MINUTES_PER_DAY + state.minuteOfDay;
    const totalMinutesAfterRaw = totalMinutesBefore + gameMinutes;
    const stepsToApply = Math.max(
      0,
      Math.floor(totalMinutesAfterRaw / MARKET_STEP_MINUTES) - Math.floor(totalMinutesBefore / MARKET_STEP_MINUTES),
    );

    const currentReference = (state.goldPrice.buyPricePerGram + state.goldPrice.sellPricePerGram) / 2;
    let nextReference = currentReference;
    for (let i = 0; i < stepsToApply; i++) {
      const percent = randomSignedPercent(MARKET_STEP_MIN_PERCENT, MARKET_STEP_MAX_PERCENT);
      // Not: çarpımsal bir süreçte ardışık aritmetik yüzde uygulamak
      // (fiyat *= 1+p/100) simetrik ±p olsa bile sistematik aşağı yönlü
      // bir sapma (volatilite sürüklenmesi) yaratır — binlerce 30 dakikalık
      // adım boyunca fiyatı sıfıra doğru çeker. Logaritmik (exp) uygulama
      // bu sapmayı ortadan kaldırıp fiyatı başlangıç seviyesi etrafında
      // sürüklenmesiz rastgele gezindirir; GDD'nin "±%3-5 hareket" tarifini
      // tek adımda pratikte aynı büyüklükte karşılar (fark <%0.15).
      nextReference *= Math.exp(percent / 100);
    }
    nextReference = Math.max(nextReference, 100);

    // Makas ve toptancı marjları da piyasa adımıyla birlikte yeniden belirlenir.
    const marketSpreadTlPerGram =
      stepsToApply > 0
        ? randomInRange(MARKET_SPREAD_MIN_TL_PER_GRAM, MARKET_SPREAD_MAX_TL_PER_GRAM)
        : state.marketSpreadTlPerGram;
    const wholesalerBuyMarginTlPerGram =
      stepsToApply > 0
        ? randomInRange(WHOLESALER_MARGIN_MIN_TL_PER_GRAM, WHOLESALER_MARGIN_MAX_TL_PER_GRAM)
        : state.wholesalerBuyMarginTlPerGram;
    const wholesalerSellMarginTlPerGram =
      stepsToApply > 0
        ? randomInRange(WHOLESALER_MARGIN_MIN_TL_PER_GRAM, WHOLESALER_MARGIN_MAX_TL_PER_GRAM)
        : state.wholesalerSellMarginTlPerGram;

    const { buyPricePerGram: nextBuyPrice, sellPricePerGram: nextSellPrice } = priceFromReferenceAndSpread(
      nextReference,
      marketSpreadTlPerGram,
    );

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

    // Bekleyen tekliflerin vadesi (OFFER_RESOLUTION_DELAY_MINUTES) dolduysa
    // açığa çıkar: kabul ise settleDeal ile aynı şekilde kapanır (kredi
    // reddedilirse red'e düşer), red ise doğrudan red olur. Sonuç aslında
    // gönderildiği anda (willAccept) belirlenmişti, burada sadece açıklanıyor.
    const currentTotalMinutes = day * MINUTES_PER_DAY + minuteOfDay;
    const offers = state.offers.map((offer) => {
      if (offer.status !== 'bekleyen' || currentTotalMinutes < offer.resolvesAtTotalMinutes) {
        return offer;
      }
      if (!offer.willAccept) {
        return { ...offer, status: 'red' as const };
      }
      const result = get().settleDeal(offer.offerAmountTl, {
        name: offer.productName,
        category: offer.category,
        karat: offer.karat,
        grams: offer.grams,
        marketValueTl: offer.marketValueTl,
        estimatedSellPriceTl: offer.estimatedSellPriceTl,
        quantity: offer.quantity,
      });
      return { ...offer, status: result.success ? ('kabul' as const) : ('red' as const) };
    });
    // settleDeal, teklif kabul edildiyse kasa/envanteri zaten güncelledi —
    // aşağıdaki gün-içi işlemler için o güncel hâli temel alıyoruz.
    const postOfferState = get();

    // Vadesi geçmiş borç varsa Toptancı Güveni düşer, vade yeniden ötelenir.
    let wholesalerTrust = postOfferState.wholesalerTrust;
    let loanDueDay = postOfferState.loanDueDay;
    if (postOfferState.capital.debtTl > 0 && loanDueDay !== null) {
      while (day > loanDueDay) {
        wholesalerTrust = Math.max(0, wholesalerTrust - LATE_PAYMENT_TRUST_PENALTY);
        loanDueDay += LOAN_TERM_DAYS;
      }
    } else if (postOfferState.capital.debtTl <= 0) {
      loanDueDay = null;
    }

    const inventory = postOfferState.inventory;

    // Piyasa: aktif müşterinin süresi dolduysa (ya da 'satis' yönünde
    // istediği ürün stoktan tükendiyse) müşteri elini boş dönüp gider;
    // aktif müşteri yoksa düşük bir olasılıkla yeni biri gelir — hem
    // "almak istiyorum" hem "bozdurmak istiyorum" müşterileri oyunun
    // ilk dakikasından itibaren aynı havuzdan, yapay bir kilit olmadan.
    let incomingCustomer = postOfferState.incomingCustomer;
    if (incomingCustomer) {
      const expired = currentTotalMinutes >= incomingCustomer.expiresAtTotalMinutes;
      const staleSatisTarget =
        incomingCustomer.direction === 'satis' &&
        (() => {
          const target = inventory.find((i) => i.id === incomingCustomer!.inventoryItemId);
          return !target || target.quantity < (incomingCustomer!.unitsRequired ?? 1);
        })();
      if (expired || staleSatisTarget) {
        incomingCustomer = null;
      }
    } else {
      const willTrigger =
        Math.random() <
        ((INCOMING_CUSTOMER_CHECKS_PER_DAY * INCOMING_CUSTOMER_TRIGGER_PROBABILITY) / MINUTES_PER_DAY) * gameMinutes;

      if (willTrigger) {
        const direction: 'satis' | 'bozdurma' =
          Math.random() < BOZDURMA_DIRECTION_PROBABILITY ? 'bozdurma' : 'satis';
        const customerName =
          INCOMING_CUSTOMER_NAMES[Math.floor(Math.random() * INCOMING_CUSTOMER_NAMES.length)];

        if (direction === 'satis') {
          // Cumhuriyet (Tam) Altını değerce 4 Çeyrek'e, Yarım Altın 2
          // Çeyrek'e eşit olduğundan ayrı stok tutulmuyor — müşteri isteği
          // Çeyrek stoğundan bu kadarı düşülerek karşılanıyor.
          const candidates = inventory
            .filter((i) => i.category !== 'pirlanta' && i.quantity > 0)
            .map((item) => ({
              target: item,
              unitsRequired: 1,
              displayName: item.name,
              displayKarat: item.karat,
              displayGrams: item.grams,
            }));
          const ceyrek = inventory.find((i) => i.category === 'yatirim' && i.name === 'Çeyrek Altın');
          if (ceyrek && ceyrek.quantity >= 2) {
            candidates.push({
              target: ceyrek,
              unitsRequired: 2,
              displayName: 'Yarım Altın',
              displayKarat: 22,
              displayGrams: 3.5,
            });
          }
          if (ceyrek && ceyrek.quantity >= 4) {
            candidates.push({
              target: ceyrek,
              unitsRequired: 4,
              displayName: 'Cumhuriyet Altını (Tam Altın)',
              displayKarat: 22,
              displayGrams: 7.02,
            });
          }

          if (candidates.length > 0) {
            const candidate = candidates[Math.floor(Math.random() * candidates.length)];
            const archetype =
              INCOMING_CUSTOMER_ARCHETYPES[Math.floor(Math.random() * INCOMING_CUSTOMER_ARCHETYPES.length)];
            const marketValueTl = equivalentGrams(candidate.displayGrams, candidate.displayKarat) * nextSellPrice;
            incomingCustomer = {
              id: String(nextIncomingCustomerId++),
              direction: 'satis',
              customer: {
                name: customerName,
                type: archetype.type,
                request: `${candidate.displayName} almak istiyorum, elindeki en iyi fiyatı öğrenmek isterim.`,
                urgency: archetype.urgency,
                bargainingStyle: archetype.bargainingStyle,
                // Bölüm 4.3: satış modunda bu, müşterinin ödemeye razı olduğu
                // TAVAN oranı olarak yorumlanır (alım modunda taban olarak
                // yorumlanmasının simetriği) — bkz. PazarlikScreen satış modu.
                acceptanceThreshold: archetype.maxPayRatio,
              },
              product: {
                name: candidate.displayName,
                source: 'Dükkân stoğu',
                category: candidate.target.category,
                karat: candidate.displayKarat,
                grams: candidate.displayGrams,
                marketValueTl,
              },
              inventoryItemId: candidate.target.id,
              unitsRequired: candidate.unitsRequired,
              expiresAtTotalMinutes: currentTotalMinutes + INCOMING_CUSTOMER_EXPIRY_MINUTES,
            };
          }
        } else {
          // Bölüm 6/10: müşteriden alım (bozdurma) — stoktan bağımsız,
          // dükkânın nakdi/kredisi yettiği sürece her zaman mümkün
          // (mevcut 'alis' modu Pazarlık ekranı + settleDeal zaten bu
          // kredi/borç mantığını işletiyor, yeni bir sistem gerekmiyor).
          const candidate = pickBozdurmaCandidate();
          const archetype =
            BOZDURMA_CUSTOMER_ARCHETYPES[Math.floor(Math.random() * BOZDURMA_CUSTOMER_ARCHETYPES.length)];
          const totalEquivGrams = equivalentGrams(candidate.gramsPerUnit, candidate.karat) * candidate.quantity;
          const marketValueTl = totalEquivGrams * nextBuyPrice;
          const scaleReading: ScaleReading = {
            grams: candidate.gramsPerUnit * candidate.quantity,
            karat: candidate.karat,
            cleanliness: candidate.name === 'Karışık Hurda Altın' ? 'Karışık, ayrıştırma gerekiyor' : 'Temiz',
          };
          incomingCustomer = {
            id: String(nextIncomingCustomerId++),
            direction: 'bozdurma',
            customer: {
              name: customerName,
              type: archetype.type,
              request:
                candidate.quantity > 1
                  ? `${candidate.quantity} adet ${candidate.name} bozdurmak istiyorum.`
                  : `${candidate.name} bozdurmak istiyorum.`,
              urgency: archetype.urgency,
              bargainingStyle: archetype.bargainingStyle,
              // Bölüm 4.3: alım modunda (bkz. PazarlikScreen) bu, oyuncunun
              // teklif verebileceği asgari (taban) oran olarak yorumlanır.
              acceptanceThreshold: archetype.minAcceptRatio,
            },
            product: {
              name: candidate.name,
              source: 'Müşteri getirdi',
              category: candidate.category,
              karat: candidate.karat,
              grams: candidate.gramsPerUnit,
              quantity: candidate.quantity,
              marketValueTl,
            },
            scaleReading,
            expiresAtTotalMinutes: currentTotalMinutes + INCOMING_CUSTOMER_EXPIRY_MINUTES,
          };
        }
      }
    }

    const capital: CapitalState = {
      ...postOfferState.capital,
      stockValueTl: computeStockValueTl(inventory, nextBuyPrice),
    };

    // Bölüm 2/7: yeni bir Sermaye Kademesi'ne ulaşınca Yetenek Ağacı puanı kazanılır.
    const newTierIndex = tierIndexForNetWorth(computeNetWorthTl(capital));
    const gainedTiers = Math.max(0, newTierIndex - postOfferState.highestCapitalTierIndex);

    set({
      minuteOfDay,
      day,
      referencePriceAtDayStart,
      marketSpreadTlPerGram,
      wholesalerBuyMarginTlPerGram,
      wholesalerSellMarginTlPerGram,
      wholesalerTrust,
      loanDueDay,
      inventory,
      offers,
      incomingCustomer,
      capital,
      highestCapitalTierIndex: gainedTiers > 0 ? newTierIndex : postOfferState.highestCapitalTierIndex,
      skillPoints: postOfferState.skillPoints + gainedTiers,
      goldPrice: {
        buyPricePerGram: nextBuyPrice,
        sellPricePerGram: nextSellPrice,
        dailyChangePercent,
      },
    });
  },

  applyRestartFluctuation: () => {
    const state = get();
    const currentReference = (state.goldPrice.buyPricePerGram + state.goldPrice.sellPricePerGram) / 2;
    const percent = randomSignedPercent(RESTART_FLUCTUATION_MIN_PERCENT, RESTART_FLUCTUATION_MAX_PERCENT);
    const nextReference = Math.max(100, currentReference * Math.exp(percent / 100));
    const { buyPricePerGram, sellPricePerGram } = priceFromReferenceAndSpread(
      nextReference,
      state.marketSpreadTlPerGram,
    );
    const dailyChangePercent =
      ((nextReference - state.referencePriceAtDayStart) / state.referencePriceAtDayStart) * 100;

    set({
      goldPrice: { buyPricePerGram, sellPricePerGram, dailyChangePercent },
      capital: {
        ...state.capital,
        stockValueTl: computeStockValueTl(state.inventory, buyPricePerGram),
      },
    });
  },

  settleDeal: (paidAmountTl, item) => {
    const state = get();
    const shortfall = Math.max(0, paidAmountTl - state.capital.cashTl);

    if (shortfall > 0 && state.wholesalerTrust < MIN_TRUST_FOR_CREDIT) {
      return { success: false, borrowedTl: 0 };
    }

    const quantity = Math.max(1, item.quantity ?? 1);
    const cashTl = Math.max(0, state.capital.cashTl - paidAmountTl);
    const loanDueDay =
      shortfall > 0 && state.loanDueDay === null ? state.day + LOAN_TERM_DAYS : state.loanDueDay;

    // Fungible ürünler (aynı isim/kategori/ayar/gram) zaten envanterdeyse
    // yeni alım o pozisyona eklenir, maliyet ortalaması güncellenir.
    const existingIndex = state.inventory.findIndex(
      (i) => i.name === item.name && i.category === item.category && i.karat === item.karat && i.grams === item.grams,
    );

    const inventory =
      existingIndex >= 0
        ? state.inventory.map((i, idx) =>
            idx === existingIndex
              ? { ...i, quantity: i.quantity + quantity, costBasisTl: i.costBasisTl + paidAmountTl }
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
              quantity,
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
    if (!item || item.category === 'pirlanta') return null;

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

  buyInvestmentUnits: (spec, quantity) => {
    const state = get();
    if (quantity <= 0) return { success: false, reason: 'insufficient_cash' };

    // Bölüm 5: toptancı, genel piyasa SATIŞ fiyatının marjı kadar altından satar.
    const wholesalerUnitPriceTlPerGram = Math.max(
      1,
      state.goldPrice.sellPricePerGram - state.wholesalerBuyMarginTlPerGram,
    );
    const unitPriceTl = equivalentGrams(spec.grams, spec.karat) * wholesalerUnitPriceTlPerGram;
    const totalCostTl = unitPriceTl * quantity;
    if (totalCostTl > state.capital.cashTl) {
      return { success: false, reason: 'insufficient_cash' };
    }

    const existingIndex = state.inventory.findIndex(
      (i) =>
        i.category === spec.category && i.name === spec.name && i.karat === spec.karat && i.grams === spec.grams,
    );
    const inventory =
      existingIndex >= 0
        ? state.inventory.map((i, idx) =>
            idx === existingIndex
              ? { ...i, quantity: i.quantity + quantity, costBasisTl: i.costBasisTl + totalCostTl }
              : i,
          )
        : [
            ...state.inventory,
            {
              id: String(nextInventoryId++),
              name: spec.name,
              category: spec.category,
              karat: spec.karat,
              grams: spec.grams,
              quantity,
              costBasisTl: totalCostTl,
              acquiredDay: state.day,
            } satisfies InventoryItem,
          ];

    set({
      inventory,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl - totalCostTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
    });
    return { success: true };
  },

  sellInvestmentUnits: (itemId, quantity) => {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.category !== 'yatirim') return null;
    const sellQuantity = Math.min(quantity, item.quantity);
    if (sellQuantity <= 0) return null;

    const unitPriceTl = equivalentGrams(item.grams, item.karat) * state.goldPrice.buyPricePerGram;
    const saleValueTl = unitPriceTl * sellQuantity;
    const soldCostBasisTl = (item.costBasisTl / item.quantity) * sellQuantity;
    const profitTl = saleValueTl - soldCostBasisTl;
    const remainingQuantity = item.quantity - sellQuantity;

    const inventory =
      remainingQuantity > 0
        ? state.inventory.map((i) =>
            i.id === itemId
              ? { ...i, quantity: remainingQuantity, costBasisTl: i.costBasisTl - soldCostBasisTl }
              : i,
          )
        : state.inventory.filter((i) => i.id !== itemId);

    set({
      inventory,
      realizedTradingProfitTl: state.realizedTradingProfitTl + profitTl,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + saleValueTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
    });
    return { saleValueTl, profitTl, quantity: sellQuantity };
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

  sendPendingOffer: (offer) => {
    const state = get();
    const totalMinutesNow = state.day * MINUTES_PER_DAY + state.minuteOfDay;
    const newOffer: Offer = {
      id: String(nextOfferId++),
      customerName: offer.customerName,
      productName: offer.productName,
      category: offer.category,
      karat: offer.karat,
      grams: offer.grams,
      offerAmountTl: offer.offerAmountTl,
      marketValueTl: offer.marketValueTl,
      estimatedSellPriceTl: offer.estimatedSellPriceTl,
      quantity: offer.quantity,
      status: 'bekleyen',
      willAccept: offer.willAccept,
      createdDay: state.day,
      createdMinuteOfDay: state.minuteOfDay,
      resolvesAtTotalMinutes: totalMinutesNow + OFFER_RESOLUTION_DELAY_MINUTES,
    };
    set({ offers: [newOffer, ...state.offers] });
  },

  resolveIncomingCustomer: (accepted, saleAmountTl) => {
    const state = get();
    const customer = state.incomingCustomer;
    if (!customer || customer.direction !== 'satis') return null;

    if (!accepted) {
      set({ incomingCustomer: null });
      return null;
    }

    const item = state.inventory.find((i) => i.id === customer.inventoryItemId);
    const unitsRequired = customer.unitsRequired ?? 1;
    if (!item || item.quantity < unitsRequired) {
      set({ incomingCustomer: null });
      return null;
    }

    const amountTl = saleAmountTl ?? 0;
    const costBasisPerUnit = item.costBasisTl / item.quantity;
    const soldCostBasisTl = costBasisPerUnit * unitsRequired;
    const profitTl = amountTl - soldCostBasisTl;
    const remainingQuantity = item.quantity - unitsRequired;

    const inventory =
      remainingQuantity > 0
        ? state.inventory.map((i) =>
            i.id === item.id
              ? { ...i, quantity: remainingQuantity, costBasisTl: i.costBasisTl - soldCostBasisTl }
              : i,
          )
        : state.inventory.filter((i) => i.id !== item.id);

    set({
      inventory,
      incomingCustomer: null,
      realizedTradingProfitTl: state.realizedTradingProfitTl + profitTl,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + amountTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
    });
    return { profitTl };
  },

  clearIncomingCustomer: (id) => {
    const state = get();
    if (state.incomingCustomer?.id === id) {
      set({ incomingCustomer: null });
    }
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

  levelUpSkill: (skillId) => {
    const state = get();
    const definition = skillTree.find((s) => s.id === skillId);
    if (!definition) return false;
    const currentLevel = state.skillLevels[skillId] ?? 0;
    if (state.skillPoints <= 0 || currentLevel >= definition.maxLevel) return false;

    set({
      skillPoints: state.skillPoints - 1,
      skillLevels: { ...state.skillLevels, [skillId]: currentLevel + 1 },
    });
    return true;
  },

  adjustReputation: (delta) => {
    set((state) => ({
      reputation: { score: Math.max(0, Math.min(100, state.reputation.score + delta)) },
    }));
  },

  hasHydrated: false,
  setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'cepkaynak-save-v5',
      storage: createJSONStorage(() => AsyncStorage),
      // Skill tanımları/oyun kodu değişse bile eski kayıtlar yüklenebilsin diye
      // sadece serileştirilebilir oyun verisi tutulur — aksiyon fonksiyonları
      // ve geçici alanlar (hasHydrated) hariç tutulur.
      partialize: (state) => ({
        capital: state.capital,
        goldPrice: state.goldPrice,
        reputation: state.reputation,
        inventory: state.inventory,
        offers: state.offers,
        incomingCustomer: state.incomingCustomer,
        day: state.day,
        minuteOfDay: state.minuteOfDay,
        speed: state.speed,
        referencePriceAtDayStart: state.referencePriceAtDayStart,
        marketSpreadTlPerGram: state.marketSpreadTlPerGram,
        wholesalerBuyMarginTlPerGram: state.wholesalerBuyMarginTlPerGram,
        wholesalerSellMarginTlPerGram: state.wholesalerSellMarginTlPerGram,
        wholesalerTrust: state.wholesalerTrust,
        loanDueDay: state.loanDueDay,
        realizedTradingProfitTl: state.realizedTradingProfitTl,
        skillPoints: state.skillPoints,
        skillLevels: state.skillLevels,
        highestCapitalTierIndex: state.highestCapitalTierIndex,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Bölüm 4.4: "oyun kapatılıp açıldığında ekstra dalgalanma".
        state?.applyRestartFluctuation();
      },
    },
  ),
);
