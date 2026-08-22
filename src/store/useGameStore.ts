import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { INCOMING_CUSTOMER_ARCHETYPES, INCOMING_CUSTOMER_NAMES } from '../data/incomingCustomerPool';
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

export interface JumpEvent {
  percent: number;
  day: number;
  /** Sıçramanın "sebebi" olarak gösterilen haber başlığı — karar gerektirmez, salt bilgilendirme. */
  headline: string;
}

export interface VitrinMaturityEvent {
  count: number;
  totalPayoutTl: number;
  sampleName: string;
}

// Bölüm 2: Oyuncu 1 kg has altınla başlar — ayrı bir "rezerv" yok, tamamı
// gün 1 fiyatından doğrudan kullanılabilir nakde çevrilir. "Sermayen X gram
// altın" gösterimi artık sabit bir varlık değil, kasadaki nakit güncel
// kurdan bölünerek her an yeniden hesaplanan bir gösterge (bkz. CapitalSummary).
const STARTING_CAPITAL_GRAMS = 1000;
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

// Her sıçramanın bir "sebebi" var gibi görünsün diye yön bazlı haber
// başlığı havuzu — karar gerektirmez, sadece fiyat hareketini bağlamlar.
const POSITIVE_NEWS_HEADLINES = [
  'Merkez Bankası faiz kararı sonrası altına talep arttı',
  'Dolar/TL yükseldi, gram altın buna paralel yükseliyor',
  'Külçe altın ithalatına ek vergi geldi, arz daraldı',
  'Küresel piyasalarda güvenli liman talebi arttı',
  'Enflasyon verileri beklentilerin üzerinde geldi',
];
const NEGATIVE_NEWS_HEADLINES = [
  'Merkez Bankası faiz artırdı, altına talep zayıfladı',
  'Dolar/TL geriledi, gram altın değer kaybediyor',
  'Altın ithalat vergisi kaldırıldı, arz arttı',
  'Küresel piyasalarda risk iştahı arttı, altından çıkış var',
  'Güçlü istihdam verileri geldi, altın baskı altında',
];

// Piyasa: dükkâna sürekli akan müşteri. İlk aşamada müşteriler sadece
// dükkânın stoğundan (toptancıdan alınan yatırım altını / takı) bir şey
// almak isteyip geliyor — pazarlıkla satılıyor. Ortalama ~1.2 saatte bir
// müşteri gelir; belirtilen süre içinde pazarlığa girilmezse müşteri ayrılır.
const INCOMING_CUSTOMER_CHECKS_PER_DAY = 20;
const INCOMING_CUSTOMER_TRIGGER_PROBABILITY = 1;
const INCOMING_CUSTOMER_PROBABILITY_PER_MINUTE =
  (INCOMING_CUSTOMER_CHECKS_PER_DAY * INCOMING_CUSTOMER_TRIGGER_PROBABILITY) / MINUTES_PER_DAY;
const INCOMING_CUSTOMER_EXPIRY_MINUTES = 90;

// Toptancı Güveni: borç aldığında bir vade başlar, vadeyi geç ödersen
// güven düşer ve vade yeniden ötelenir (kronik geç ödeyen daha çok
// puan kaybeder). Güven belirli bir eşiğin altına inerse toptancı
// artık kredi (borçla tamamlama) vermez.
const STARTING_WHOLESALER_TRUST = 65;
const LOAN_TERM_DAYS = 5;
const LATE_PAYMENT_TRUST_PENALTY = 15;
const MIN_TRUST_FOR_CREDIT = 30;

// Bölüm 4.6: Teklifler — kaydırma çubuğuyla gönderilen bir teklif anında
// sonuçlanmaz, müşterinin düşünmesi için bir süre "bekleyen" kalır. 4 oyun
// saati fazla uzun hissettirdiği için 30 oyun dakikasına düşürüldü.
export const OFFER_RESOLUTION_DELAY_MINUTES = 30;

// Kullanıcı kararı: takı (bilezik/yüzük/kolye) tek tek pazarlıkla
// satılmıyor — vitrine girip kendi kâr potansiyeline göre sürekli pasif
// gelir üretiyor (yüksek marjlı ürün günde daha çok kazandırır). 30 gün
// (vitrin vadesi) dolunca ürün "satılmış" sayılır: o güne kadar zaten
// beklenen kârının tamamını gün gün tahsil etmiştir, vade sonunda sadece
// ödediği maliyet nakde döner ve vitrinden kalkar. Yatırım altını
// (çeyrek/gram/vb.) ise doğrudan/aktif alınıp satılıyor, değeri güncel
// kurla dalgalanır, vade kavramı yok.
export const VITRIN_TERM_DAYS = 30;

// Bölüm 2: Sermaye Kademeleri — "Her kademe yeni bir kilit açar". Burada
// her yeni kademeye ulaşmak bir Yetenek Ağacı puanı kazandırıyor.
export const CAPITAL_TIERS = [100000, 500000, 2000000, 10000000, 50000000, 250000000];

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

function priceFromReference(reference: number): Pick<GoldPriceState, 'buyPricePerGram' | 'sellPricePerGram'> {
  return {
    buyPricePerGram: reference * (1 - SPREAD_RATIO),
    sellPricePerGram: reference * (1 + SPREAD_RATIO),
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
let nextOfferId = 1;
let nextIncomingCustomerId = 1;

interface GameState {
  capital: CapitalState;
  goldPrice: GoldPriceState;
  reputation: ReputationState;
  inventory: InventoryItem[];
  /** Bölüm 4.6: Bekleyen/Kabul/Red durumundaki tüm pazarlık teklifleri. */
  offers: Offer[];
  /** Piyasa: dükkânın stoğundan bir şey almak isteyip gelen, o an aktif müşteri. */
  incomingCustomer: IncomingCustomer | null;
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
  /**
   * Piyasa: Toptancıdan Stok Al — pazarlıksız, her an açık restok. Güncel
   * SATIŞ kurundan, sadece nakit yettiği kadar (borç/kredi yok) anında
   * satın alır.
   */
  buyInvestmentUnits: (
    spec: { name: string; karat: number; grams: number; category: InventoryCategory },
    quantity: number,
  ) => { success: true } | { success: false; reason: 'insufficient_cash' };
  /** Bir yatırım pozisyonundan istenen adedi (kısmi olabilir) güncel ALIŞ kurundan anında nakde çevirir. */
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
    willAccept: boolean;
  }) => void;
  /**
   * Aktif gelen müşteriye yanıt verir. Kabulde (accepted=true, saleAmountTl
   * ile) stoktan bir adet düşülür, karşılığında pazarlıkla anlaşılan tutar
   * nakde eklenir. Reddde müşteri elini boş dönüp gider.
   */
  resolveIncomingCustomer: (accepted: boolean, saleAmountTl?: number) => { profitTl: number } | null;
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

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  capital: {
    cashTl: STARTING_CAPITAL_GRAMS * STARTING_REFERENCE_PRICE,
    stockValueTl: 0,
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
  offers: [],
  incomingCustomer: null,
  day: 1,
  minuteOfDay: 0,
  speed: 1,
  referencePriceAtDayStart: STARTING_REFERENCE_PRICE,
  lastJumpEvent: null,
  wholesalerTrust: STARTING_WHOLESALER_TRUST,
  loanDueDay: null,
  lastVitrinMaturity: null,
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

    const currentReference = (state.goldPrice.buyPricePerGram + state.goldPrice.sellPricePerGram) / 2;
    const walkPercent = (Math.random() * 2 - 1) * MAX_PERCENT_PER_MINUTE * Math.sqrt(gameMinutes);
    let nextReference = currentReference * (1 + walkPercent / 100);

    let jumpEvent = state.lastJumpEvent;
    const jumpProbability = JUMP_PROBABILITY_PER_MINUTE * gameMinutes;
    if (Math.random() < jumpProbability) {
      const magnitude = 5 + Math.random() * 10; // %5-15
      const jumpPercent = Math.random() < 0.5 ? -magnitude : magnitude;
      nextReference *= 1 + jumpPercent / 100;
      const headlines = jumpPercent >= 0 ? POSITIVE_NEWS_HEADLINES : NEGATIVE_NEWS_HEADLINES;
      const headline = headlines[Math.floor(Math.random() * headlines.length)];
      jumpEvent = { percent: jumpPercent, day: state.day, headline };
    }
    nextReference = Math.max(nextReference, 100);
    const nextBuyPrice = nextReference * (1 - SPREAD_RATIO);
    const nextSellPrice = nextReference * (1 + SPREAD_RATIO);

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

    // Her takı kendi kâr potansiyeline göre günlük pasif gelir üretir;
    // vitrin vadesi (30 gün) dolan ürün "satılmış" sayılıp maliyeti
    // nakde döner ve envanterden kalkar.
    let vitrinIncomeTl = 0;
    let maturedCount = 0;
    let maturedPayoutTl = 0;
    let maturedSampleName = '';
    const inventory: InventoryItem[] = [];
    for (const item of postOfferState.inventory) {
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

    // Piyasa: aktif müşterinin süresi dolduysa ya da istediği ürün stoktan
    // tükendiyse müşteri elini boş dönüp gider; aktif müşteri yoksa stokta
    // satılabilir bir şey varken düşük bir olasılıkla yeni bir müşteri gelir.
    let incomingCustomer = postOfferState.incomingCustomer;
    if (incomingCustomer) {
      const target = inventory.find((i) => i.id === incomingCustomer!.inventoryItemId);
      if (
        !target ||
        target.quantity < incomingCustomer.unitsRequired ||
        currentTotalMinutes >= incomingCustomer.expiresAtTotalMinutes
      ) {
        incomingCustomer = null;
      }
    } else {
      // Cumhuriyet (Tam) Altını değerce 4 Çeyrek'e, Yarım Altın 2 Çeyrek'e
      // eşit olduğundan ayrı stok tutulmuyor — müşteri isteği Çeyrek
      // stoğundan bu kadarı düşülerek karşılanıyor.
      const candidates = inventory
        .filter((i) => (i.category === 'taki' || i.category === 'yatirim') && i.quantity > 0)
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

      if (candidates.length > 0 && Math.random() < INCOMING_CUSTOMER_PROBABILITY_PER_MINUTE * gameMinutes) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        const archetype =
          INCOMING_CUSTOMER_ARCHETYPES[Math.floor(Math.random() * INCOMING_CUSTOMER_ARCHETYPES.length)];
        const customerName =
          INCOMING_CUSTOMER_NAMES[Math.floor(Math.random() * INCOMING_CUSTOMER_NAMES.length)];
        const marketValueTl = equivalentGrams(candidate.displayGrams, candidate.displayKarat) * nextSellPrice;
        incomingCustomer = {
          id: String(nextIncomingCustomerId++),
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
    }

    const capital: CapitalState = {
      ...postOfferState.capital,
      cashTl: postOfferState.capital.cashTl + vitrinIncomeTl + maturedPayoutTl,
      stockValueTl: computeStockValueTl(inventory, nextBuyPrice),
    };

    // Bölüm 2/7: yeni bir Sermaye Kademesi'ne ulaşınca Yetenek Ağacı puanı kazanılır.
    const newTierIndex = tierIndexForNetWorth(computeNetWorthTl(capital));
    const gainedTiers = Math.max(0, newTierIndex - postOfferState.highestCapitalTierIndex);

    set({
      minuteOfDay,
      day,
      referencePriceAtDayStart,
      lastJumpEvent: jumpEvent,
      wholesalerTrust,
      loanDueDay,
      inventory,
      offers,
      incomingCustomer,
      lastVitrinMaturity,
      capital,
      highestCapitalTierIndex: gainedTiers > 0 ? newTierIndex : postOfferState.highestCapitalTierIndex,
      skillPoints: postOfferState.skillPoints + gainedTiers,
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

  buyInvestmentUnits: (spec, quantity) => {
    const state = get();
    if (quantity <= 0) return { success: false, reason: 'insufficient_cash' };

    const unitPriceTl = equivalentGrams(spec.grams, spec.karat) * state.goldPrice.sellPricePerGram;
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
    if (!customer) return null;

    if (!accepted) {
      set({ incomingCustomer: null });
      return null;
    }

    const item = state.inventory.find((i) => i.id === customer.inventoryItemId);
    if (!item || item.quantity < customer.unitsRequired) {
      set({ incomingCustomer: null });
      return null;
    }

    const amountTl = saleAmountTl ?? 0;
    const costBasisPerUnit = item.costBasisTl / item.quantity;
    const soldCostBasisTl = costBasisPerUnit * customer.unitsRequired;
    const profitTl = amountTl - soldCostBasisTl;
    const remainingQuantity = item.quantity - customer.unitsRequired;

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
      name: 'cepkaynak-save-v4',
      storage: createJSONStorage(() => AsyncStorage),
      // Skill tanımları/oyun kodu değişse bile eski kayıtlar yüklenebilsin diye
      // sadece serileştirilebilir oyun verisi tutulur — aksiyon fonksiyonları
      // ve geçici banner alanları (lastJumpEvent/lastVitrinMaturity/hasHydrated)
      // hariç tutulur.
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
        wholesalerTrust: state.wholesalerTrust,
        loanDueDay: state.loanDueDay,
        realizedTradingProfitTl: state.realizedTradingProfitTl,
        skillPoints: state.skillPoints,
        skillLevels: state.skillLevels,
        highestCapitalTierIndex: state.highestCapitalTierIndex,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
