import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ATOLYE_GRAMS_PER_DAY_PER_LEVEL,
  ATOLYE_MAX_LEVEL,
  ATOLYE_UPGRADE_BASE_COST_TL,
  ATOLYE_UPGRADE_COST_MULTIPLIER_PER_LEVEL,
  BOZDURMA_BULK_LOT_MAX_GRAMS,
  BOZDURMA_BULK_LOT_MIN_GRAMS,
  BOZDURMA_BULK_LOT_PROBABILITY,
  BOZDURMA_DIRECTION_PROBABILITY,
  BROKER_DEAL_TIMEOUT_TRUST_PENALTY,
  BROKER_DEAL_WINDOW_MINUTES,
  CRAFTED_GOOD_BASE_COUNTERFEIT_RISK,
  CRAFTED_GOOD_CUSTOMER_PROBABILITY,
  CRAFTED_GOOD_KARAT_MISMATCH,
  CRAFTED_GOOD_MIN_COUNTERFEIT_RISK,
  CUSTOMER_HYPE_AD_DURATION_MINUTES,
  CUSTOMER_HYPE_ARRIVAL_MULTIPLIER,
  FOUR_X_AD_UNLOCK_MINUTES,
  GAME_MINUTES_PER_REAL_SECOND_AT_1X,
  GULER_YUZ_PATIENCE_MINUTES_PER_LEVEL,
  INCOMING_CUSTOMER_CHECKS_PER_DAY,
  INCOMING_CUSTOMER_EXPIRY_MINUTES,
  INCOMING_CUSTOMER_TRIGGER_PROBABILITY,
  LATE_PAYMENT_TRUST_PENALTY,
  LEVEL_MAX,
  LEVEL_MILESTONES,
  LEVEL_XP_BASE,
  LEVEL_XP_INCREMENT,
  LOAN_TERM_DAYS,
  MARKET_SPREAD_MAX_TL_PER_GRAM,
  MARKET_SPREAD_MIN_TL_PER_GRAM,
  MARKET_STEP_MAX_PERCENT,
  MARKET_STEP_MIN_PERCENT,
  MARKET_STEP_MINUTES,
  MAX_REAL_SECONDS_PER_TICK,
  MELTING_EFFICIENCY_MAX,
  MELTING_EFFICIENCY_MIN,
  MELTING_SMALL_LARGE_THRESHOLD_GRAMS,
  MELTING_TIME_LARGE_MAX_MINUTES,
  MELTING_TIME_LARGE_MIN_MINUTES,
  MELTING_TIME_SMALL_MAX_MINUTES,
  MELTING_TIME_SMALL_MIN_MINUTES,
  MILESTONE_BONUS_SKILL_POINTS,
  MIN_TRUST_FOR_CREDIT,
  MINUTES_PER_DAY,
  OFFER_RESOLUTION_DELAY_MINUTES,
  RESTART_FLUCTUATION_MAX_PERCENT,
  RESTART_FLUCTUATION_MIN_PERCENT,
  SKILL_POINTS_PER_LEVEL,
  SOGUKKANLI_PATIENCE_MINUTES_PER_LEVEL,
  STARTING_CAPITAL_GRAMS,
  STARTING_REFERENCE_PRICE,
  STARTING_WHOLESALER_TRUST,
  TAKI_PACKAGE_SET_BONUS_MULTIPLIER,
  TAKI_PACKAGE_TERM_DAYS,
  WHOLESALER_MARGIN_MAX_TL_PER_GRAM,
  WHOLESALER_MARGIN_MIN_TL_PER_GRAM,
  XP_PER_EQUIVALENT_GRAM_TRADED,
  YENIDEN_DOGUS_TIME_REDUCTION_PER_LEVEL,
} from '../config/economyConfig';
import type { ScaleReading } from '../components/ScalePanel';
import { BRAND_STAGES } from '../data/brandStages';
import { CRAFTED_GOOD_CATALOG, REALISTIC_KARATS } from '../data/craftedGoodCatalog';
import { TAKI_PACKAGE_TIERS } from '../data/takiPackageTiers';
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
  MINUTES_PER_DAY,
  OFFER_RESOLUTION_DELAY_MINUTES,
} from '../config/economyConfig';

// Bölüm 23-24: seviye n'e ulaşmak için gereken TOPLAM (kümülatif) XP —
// kapalı formül: sum_{i=1}^{n-1} [BASE + (i-1)*INCREMENT].
export function xpRequiredForLevel(level: number): number {
  const n = level - 1;
  if (n <= 0) return 0;
  return n * LEVEL_XP_BASE + (LEVEL_XP_INCREMENT * (n * (n - 1))) / 2;
}

/** Toplam ömür boyu XP'den güncel seviyeyi türetir (LEVEL_MAX'ta sınırlanır). */
export function levelForTotalXp(totalXp: number): number {
  let level = 1;
  while (level < LEVEL_MAX && xpRequiredForLevel(level + 1) <= totalXp) {
    level += 1;
  }
  return level;
}

/** Belirli bir seviyeye kadar (dahil) kazanılan toplam yetenek puanı — 1/seviye + kilometre taşı bonusu. */
export function skillPointsForLevel(level: number): number {
  let points = 0;
  for (let lvl = 2; lvl <= level; lvl++) {
    points += SKILL_POINTS_PER_LEVEL;
    if (LEVEL_MILESTONES.includes(lvl)) points += MILESTONE_BONUS_SKILL_POINTS;
  }
  return points;
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
export function equivalentGrams(grams: number, karat: number): number {
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

/**
 * Has altın karşılığı gram/maliyet miktarını mevcut Gram Altın (Has)
 * pozisyonuyla (fungible) birleştirir — eritme geri kazanımı (Bölüm 12)
 * ve Atölye üretimi (Bölüm 17) aynı stok kalemine akar.
 */
function mergeIntoGramAltin(
  inventory: InventoryItem[],
  grams: number,
  costBasisTl: number,
  acquiredDay: number,
): InventoryItem[] {
  if (grams <= 0) return inventory;
  const gramSpec = toptanciStock.find((s) => s.id === 'gram-altin')!;
  const existingIndex = inventory.findIndex(
    (i) =>
      i.name === gramSpec.name && i.category === gramSpec.category && i.karat === gramSpec.karat && i.grams === gramSpec.grams,
  );
  return existingIndex >= 0
    ? inventory.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + grams, costBasisTl: i.costBasisTl + costBasisTl } : i,
      )
    : [
        ...inventory,
        {
          id: String(nextInventoryId++),
          name: gramSpec.name,
          category: gramSpec.category,
          karat: gramSpec.karat,
          grams: gramSpec.grams,
          quantity: grams,
          costBasisTl,
          acquiredDay,
        } satisfies InventoryItem,
      ];
}

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

/**
 * Bölüm 23-24: bir aktif alım-satım işlemi tamamlandığında çağrılır —
 * kazanılan XP toplam XP'ye eklenir, seviye atlandıysa yetenek puanı(ları)
 * kazanılır. Saf bir hesaplama: çağıran, döndürülen alanları kendi set()
 * çağrısına ekler (ayrı bir set() tetiklemez, tek işlemde birleşir).
 */
function applyXpGain(
  state: Pick<GameState, 'totalXp' | 'level' | 'skillPoints'>,
  xpGained: number,
): { totalXp: number; level: number; skillPoints: number } {
  const totalXp = state.totalXp + Math.max(0, xpGained);
  const level = levelForTotalXp(totalXp);
  const gainedSkillPoints = level > state.level ? skillPointsForLevel(level) - skillPointsForLevel(state.level) : 0;
  return { totalXp, level, skillPoints: state.skillPoints + gainedSkillPoints };
}

interface CraftedGoodCandidate {
  productType: string;
  claimedKarat: number;
  actualKarat: number;
  grams: number;
  hasHiddenFlaw: boolean;
  stoneValueTl: number;
}

/**
 * Bölüm 11/14: müşteriden gelen işçilikli ürün üretir — beyan edilen ayar
 * her zaman gerçek olmayabilir (sahtecilik/yanlış beyan riski), gizli
 * kusur ve taş değeri de saklı tutulur (Uzman Görüşü ile açığa çıkar).
 * `uzmanGorusuLevel` arttıkça şüpheli müşterilerin denk gelme ihtimali
 * azalır (Bölüm 37: sahtecilik riski %10-20 → skil ile %2-5).
 */
function pickCraftedGoodCandidate(uzmanGorusuLevel: number): CraftedGoodCandidate {
  const spec = CRAFTED_GOOD_CATALOG[Math.floor(Math.random() * CRAFTED_GOOD_CATALOG.length)];
  const claimedKarat = REALISTIC_KARATS[Math.floor(Math.random() * REALISTIC_KARATS.length)];
  const grams = Math.round(randomInRange(spec.minGrams, spec.maxGrams) * 10) / 10;

  const counterfeitRisk = Math.max(
    CRAFTED_GOOD_MIN_COUNTERFEIT_RISK,
    CRAFTED_GOOD_BASE_COUNTERFEIT_RISK - (CRAFTED_GOOD_BASE_COUNTERFEIT_RISK - CRAFTED_GOOD_MIN_COUNTERFEIT_RISK) * (uzmanGorusuLevel / 5),
  );
  const isMismatched = Math.random() < counterfeitRisk;
  const actualKarat = isMismatched ? Math.max(8, claimedKarat - CRAFTED_GOOD_KARAT_MISMATCH) : claimedKarat;
  const hasHiddenFlaw = isMismatched && Math.random() < 0.5;
  const stoneValueTl = spec.hasStone ? Math.round(randomInRange(2000, 15000)) : 0;

  return { productType: spec.productType, claimedKarat, actualKarat, grams, hasHiddenFlaw, stoneValueTl };
}

// Bölüm 9: büyük bozdurmalar + Toptancı Bağlantısı — müşteriden nakit
// yetmeyen bir alım borca yazıldığında, o alımın tam bu miktarı sınırlı
// bir süre için toptancıya kâr marjıyla anında satılabilir hale gelir.
export interface BrokerDeal {
  inventoryItemId: string;
  /** Bu bağlantıyla korunan, bu işlemden gelen adet (envanterdeki toplam adet değil). */
  quantity: number;
  expiresAtTotalMinutes: number;
}

// Bölüm 12: eritme — işçilikli bir ürün, envanterden çıkıp bir süreliğine
// "ocakta" kalır; süre dolunca gerçek ayar/kusur/verim üzerinden hesaplanan
// has altın Gram Altın stoğuna, varsa taş değeri nakit olarak kasaya eklenir.
export interface MeltingJob {
  productName: string;
  recoveredGrams: number;
  stoneValueTl: number;
  /** Eritilen işçilikli ürün için orijinal ödenen tutar — geri kazanılan altının maliyet tabanı (kâr/zarar burada gizli kalmaz). */
  costBasisTl: number;
  completesAtTotalMinutes: number;
}

// Bölüm 18-20: aktif bir Takı Yatırım Paketi — 30 gün kilitli, günlük
// sabit getiri öder, vade sonunda anaparayı iade eder.
export interface ActiveTakiPackage {
  id: string;
  tierId: string;
  principalTl: number;
  dailyPayoutTl: number;
  startedDay: number;
  maturesDay: number;
}

interface GameState {
  /** Bölüm 31: Profil — oyuncunun özelleştirebildiği oyuncu ve dükkân adı. */
  playerName: string;
  setPlayerName: (name: string) => void;
  shopName: string;
  setShopName: (name: string) => void;
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
  /**
   * Yeni bir müşteri belirdiği anda (Pazarlık paneli render olmadan ÖNCE,
   * React'ın render döngüsünü beklemeden tick() içinde) oyun otomatik
   * duraklatılır — müşterinin sabrı oyuncu tepki verene kadar tükenmesin.
   * Bu alan, müşteri kapanınca hangi hıza dönüleceğini tutar.
   */
  preNegotiationSpeed: ClockSpeed | null;
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
  /** Bölüm 9: açık Toptancı Bağlantısı — süresi içinde toptancıya satılmazsa güven düşer. */
  brokerDeal: BrokerDeal | null;
  /** Bölüm 12: aktif eritme işi — tamamlanınca has altın Gram Altın stoğuna eklenir. */
  meltingJob: MeltingJob | null;
  /** Bölüm 17: Atölye seviyesi (0 = kurulmamış) — her seviye günde sabit has altın üretir. */
  atolyeLevel: number;
  /** Bölüm 18-20: aktif Takı Yatırım Paketleri (30 gün kilitli). */
  takiPackages: ActiveTakiPackage[];
  /** Bölüm 22: 4x hızın açık olduğu GERÇEK DÜNYA epoch ms'i (Date.now() ile karşılaştırılır) — reklamla kazanılır, yoksa null. */
  fourXUnlockedUntilMs: number | null;
  /** Bölüm 22: küçük bir IAP ile alınan kalıcı sınırsız 4x hakkı. */
  fourXUnlimited: boolean;
  /** Bölüm 28-29: Kurumsal Marka — sahip olunan en yüksek kademe sırası (-1 = hiçbiri, BRAND_STAGES.length-1 = Kurumsallaşma). */
  highestBrandStageIndex: number;
  /** Sıradaki Kurumsal Marka kademesini satın alır — sıra dışı, seviye yetersiz ya da nakit yetersizse false döner. */
  purchaseBrandStage: (stageId: string) => boolean;
  /**
   * 1x/2x/duraklat her zaman serbest; 4x sadece reklam penceresi açıkken
   * ya da sınırsız hak alınmışsa uygulanır — aksi halde speed değişmez ve
   * false döner (arayüz bunu reklam/IAP teklifini göstermek için kullanır).
   */
  setSpeed: (speed: ClockSpeed) => boolean;
  /** Bölüm 22 YER TUTUCU: "reklam izlendi" onayından sonra çağrılır — 4x'i FOUR_X_AD_UNLOCK_MINUTES kadar (üst üste eklenerek) açar. */
  unlockFourXViaAd: () => void;
  /** Bölüm 22 YER TUTUCU: "satın alındı" onayından sonra çağrılır — 4x'i kalıcı ve sınırsız açar. */
  purchaseFourXUnlimited: () => void;
  /** Müşteri Hype'ın açık olduğu GERÇEK DÜNYA epoch ms'i (Date.now() ile karşılaştırılır) — reklamla kazanılır, yoksa null. */
  customerHypeUntilMs: number | null;
  /** YER TUTUCU: "reklam izlendi" onayından sonra çağrılır — gelen müşteri tetiklenme olasılığını CUSTOMER_HYPE_AD_DURATION_MINUTES kadar (üst üste eklenerek) CUSTOMER_HYPE_ARRIVAL_MULTIPLIER katına çıkarır. */
  watchAdForCustomerHype: () => void;
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
      /** Bölüm 11-16: sadece category:'iscilikli' — karat/grams beyan, bunlar gizli gerçek değerler. */
      actualKarat?: number;
      hasHiddenFlaw?: boolean;
      stoneValueTl?: number;
    },
  ) => { success: true; borrowedTl: number } | { success: false; borrowedTl: 0 };
  /**
   * Bölüm 9: açık Toptancı Bağlantısı'nı hemen kullanır — o işlemden gelen
   * malı toptancıya (genel ALIŞ + toptancı marjı üzerinden) anında satar,
   * kesin bir kâr cebe atar. Bağlantı yoksa ya da süresi geçmişse null döner.
   */
  resolveBrokerDeal: () => { saleValueTl: number; profitTl: number } | null;
  /**
   * Bölüm 12/16: bir işçilikli ürünü eritmeye başlar — envanterden hemen
   * kalkar, bir süre sonra (Yeniden Doğuş kısaltır) gerçek ayar/kusur
   * üzerinden hesaplanan has altın Gram Altın stoğuna, taş değeri (Taş
   * Ustası şartıyla) nakit olarak eklenir. İşçilikli ürün asla başka bir
   * müşteriye satılmaz — tek çıkış yolu budur.
   */
  meltCraftedGood: (itemId: string) => boolean;
  /** Bölüm 17: Atölye'yi bir seviye yükseltir (TL karşılığında) — para yoksa ya da zaten maksimumdaysa false döner. */
  upgradeAtolye: () => boolean;
  /** Bölüm 18-20: belirtilen ayar kademesinde yeni bir Takı Yatırım Paketi başlatır — o kademede zaten aktif bir paket varsa ya da nakit yetmiyorsa false döner. */
  startTakiPackage: (tierId: string) => boolean;
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
    actualKarat?: number;
    hasHiddenFlaw?: boolean;
    stoneValueTl?: number;
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

  // Bölüm 23-24: Seviye — paradan bağımsız, yalnızca aktif alım-satımdan
  // (asla pasif gelirden) kazanılan XP ile ilerler. Her seviye bir yetenek
  // puanı, Sv.10/20/30/40/50'de ekstra puan kazandırır.
  totalXp: number;
  level: number;
  // Bölüm 7: Yetenek Ağacı — puanlar skillTree'deki yeteneklere harcanır.
  skillPoints: number;
  skillLevels: Record<string, number>;
  /** Bir yeteneği bir seviye yükseltir; puan yoksa ya da zaten maksimumdaysa false döner. */
  levelUpSkill: (skillId: string) => boolean;
  /** Bölüm 30: Yetenekleri sıfırlar, o seviyeye kadar kazanılan tüm puanları iade eder. YER TUTUCU: reklam SDK'sı bağlanınca burası gerçek "reklam izlendi" onayından sonra çağrılacak. */
  resetSkills: () => void;
  /** İtibarı 0-100 aralığında sınırlayarak değiştirir (skill etkileri, gelecekte olaylar vb. için). */
  adjustReputation: (delta: number) => void;

  /** Kalıcı kayıt (AsyncStorage) yüklenene kadar false — bkz. App.tsx'teki yükleme ekranı. */
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

const STARTING_MARKET_SPREAD_TL_PER_GRAM = randomInRange(
  MARKET_SPREAD_MIN_TL_PER_GRAM,
  MARKET_SPREAD_MAX_TL_PER_GRAM,
);

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  playerName: 'Oyuncu',
  setPlayerName: (name) => set({ playerName: name.trim().length > 0 ? name.trim().slice(0, 40) : 'Oyuncu' }),
  shopName: 'Kuyumcum',
  setShopName: (name) => set({ shopName: name.trim().length > 0 ? name.trim().slice(0, 40) : 'Kuyumcum' }),
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
  preNegotiationSpeed: null,
  referencePriceAtDayStart: STARTING_REFERENCE_PRICE,
  marketSpreadTlPerGram: STARTING_MARKET_SPREAD_TL_PER_GRAM,
  wholesalerBuyMarginTlPerGram: randomInRange(WHOLESALER_MARGIN_MIN_TL_PER_GRAM, WHOLESALER_MARGIN_MAX_TL_PER_GRAM),
  wholesalerSellMarginTlPerGram: randomInRange(WHOLESALER_MARGIN_MIN_TL_PER_GRAM, WHOLESALER_MARGIN_MAX_TL_PER_GRAM),
  wholesalerTrust: STARTING_WHOLESALER_TRUST,
  loanDueDay: null,
  brokerDeal: null,
  meltingJob: null,
  atolyeLevel: 0,
  takiPackages: [],
  fourXUnlockedUntilMs: null,
  fourXUnlimited: false,
  customerHypeUntilMs: null,
  highestBrandStageIndex: -1,
  realizedTradingProfitTl: 0,
  totalXp: 0,
  level: 1,
  skillPoints: 0,
  skillLevels: {},

  setSpeed: (speed) => {
    const state = get();
    if (speed === 4) {
      const fourXUnlocked =
        state.fourXUnlimited || (state.fourXUnlockedUntilMs !== null && state.fourXUnlockedUntilMs > Date.now());
      if (!fourXUnlocked) return false;
    }
    set({ speed });
    return true;
  },

  unlockFourXViaAd: () => {
    const state = get();
    const now = Date.now();
    const currentDeadline = state.fourXUnlockedUntilMs !== null ? Math.max(state.fourXUnlockedUntilMs, now) : now;
    set({ fourXUnlockedUntilMs: currentDeadline + FOUR_X_AD_UNLOCK_MINUTES * 60 * 1000 });
  },

  purchaseFourXUnlimited: () => {
    set({ fourXUnlimited: true });
  },

  watchAdForCustomerHype: () => {
    const state = get();
    const now = Date.now();
    const currentDeadline = state.customerHypeUntilMs !== null ? Math.max(state.customerHypeUntilMs, now) : now;
    set({ customerHypeUntilMs: currentDeadline + CUSTOMER_HYPE_AD_DURATION_MINUTES * 60 * 1000 });
  },

  tick: (realSecondsElapsedRaw) => {
    const state = get();
    if (state.speed === 0) return;

    // Bölüm 22: 4x'in reklamla açılan GERÇEK DÜNYA penceresi süresi
    // dolduysa (sınırsız hak yoksa) hız burada otomatik 1x'e düşer —
    // oyuncu uygulamayı 4x açıkken arka planda bıraksa bile geçerli.
    let speed = state.speed;
    if (speed === 4 && !state.fourXUnlimited) {
      const stillUnlocked = state.fourXUnlockedUntilMs !== null && state.fourXUnlockedUntilMs > Date.now();
      if (!stillUnlocked) {
        speed = 1;
        set({ speed });
      }
    }

    const realSecondsElapsed = Math.min(realSecondsElapsedRaw, MAX_REAL_SECONDS_PER_TICK);
    const gameMinutes = realSecondsElapsed * speed * GAME_MINUTES_PER_REAL_SECOND_AT_1X;
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
    let daysElapsed = 0;
    while (minuteOfDay >= MINUTES_PER_DAY) {
      minuteOfDay -= MINUTES_PER_DAY;
      day += 1;
      daysElapsed += 1;
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
        actualKarat: offer.actualKarat,
        hasHiddenFlaw: offer.hasHiddenFlaw,
        stoneValueTl: offer.stoneValueTl,
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

    // Bölüm 9: Toptancı Bağlantısı'nın süresi doldu ama kullanılmadıysa —
    // toptancı güveni düşer, bağlantı kapanır (mal normal stokta kalır).
    let brokerDeal = postOfferState.brokerDeal;
    if (brokerDeal && currentTotalMinutes >= brokerDeal.expiresAtTotalMinutes) {
      wholesalerTrust = Math.max(0, wholesalerTrust - BROKER_DEAL_TIMEOUT_TRUST_PENALTY);
      brokerDeal = null;
    }

    // Bölüm 12: eritme süresi dolduysa geri kazanılan has altın, mevcut
    // Gram Altın pozisyonuyla (fungible) birleşerek stoğa eklenir; orijinal
    // işçilikli ürüne ödenen tutar maliyet tabanı olarak taşınır (kâr/zarar
    // gizlenmez). Taş değeri varsa (Taş Ustası şartıyla) doğrudan nakde girer.
    let inventory = postOfferState.inventory;
    let meltingJob = postOfferState.meltingJob;
    let meltingCashBonus = 0;
    if (meltingJob && currentTotalMinutes >= meltingJob.completesAtTotalMinutes) {
      inventory = mergeIntoGramAltin(inventory, meltingJob.recoveredGrams, meltingJob.costBasisTl, day);
      meltingCashBonus = meltingJob.stoneValueTl;
      meltingJob = null;
    }

    // Bölüm 17: Atölye — oyun hızından bağımsız, sürekli ve pasif has altın
    // üretimi (XP üretmez — GDD'nin "XP sadece aktif alım-satımdan" kuralı).
    const atolyeGramsProduced =
      postOfferState.atolyeLevel * ATOLYE_GRAMS_PER_DAY_PER_LEVEL * (gameMinutes / MINUTES_PER_DAY);
    inventory = mergeIntoGramAltin(inventory, atolyeGramsProduced, 0, day);

    // Bölüm 18-20: Takı Yatırım Paketleri — 30 gün kilitli, her GÜN
    // (dakika değil) sabit getiri öder, vade sonunda anaparayı iade eder.
    // Dört ayar kademesi (8/14/18/22) aynı anda aktifse set bonusu uygulanır.
    let takiPackages = postOfferState.takiPackages;
    let takiPackageCashDelta = 0;
    if (daysElapsed > 0 && takiPackages.length > 0) {
      const activeTierIds = new Set(takiPackages.map((p) => p.tierId));
      const hasFullSet = TAKI_PACKAGE_TIERS.every((t) => activeTierIds.has(t.id));
      const bonusMultiplier = hasFullSet ? TAKI_PACKAGE_SET_BONUS_MULTIPLIER : 1;
      for (let d = 0; d < daysElapsed; d++) {
        for (const pkg of takiPackages) {
          takiPackageCashDelta += pkg.dailyPayoutTl * bonusMultiplier;
        }
      }
      const maturedPackages = takiPackages.filter((p) => day >= p.maturesDay);
      takiPackageCashDelta += maturedPackages.reduce((sum, p) => sum + p.principalTl, 0);
      takiPackages = takiPackages.filter((p) => day < p.maturesDay);
    }

    // Bölüm 28-29: Kurumsal Marka — sahip olunan her kademe kalıcı,
    // kümülatif bir günlük nakit geliri katar (Kurumsallaşma'ya sahip olmak
    // Şubeleşme/Marka Yönetimi'nin gelirini de korur, hepsi üst üste eklenir).
    let brandStageCashDelta = 0;
    if (daysElapsed > 0 && postOfferState.highestBrandStageIndex >= 0) {
      const dailyBrandIncomeTl = BRAND_STAGES.slice(0, postOfferState.highestBrandStageIndex + 1).reduce(
        (sum, s) => sum + s.dailyIncomeTl,
        0,
      );
      brandStageCashDelta = dailyBrandIncomeTl * daysElapsed;
    }

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
      // Müşteri Hype (reklamla açılan GERÇEK DÜNYA penceresi) aktifken gelen
      // müşteri tetiklenme olasılığı katlanır.
      const hypeActive = state.customerHypeUntilMs !== null && state.customerHypeUntilMs > Date.now();
      const hypeMultiplier = hypeActive ? CUSTOMER_HYPE_ARRIVAL_MULTIPLIER : 1;
      const willTrigger =
        Math.random() <
        ((INCOMING_CUSTOMER_CHECKS_PER_DAY * INCOMING_CUSTOMER_TRIGGER_PROBABILITY) / MINUTES_PER_DAY) *
          gameMinutes *
          hypeMultiplier;

      if (willTrigger) {
        const direction: 'satis' | 'bozdurma' =
          Math.random() < BOZDURMA_DIRECTION_PROBABILITY ? 'bozdurma' : 'satis';
        const customerName =
          INCOMING_CUSTOMER_NAMES[Math.floor(Math.random() * INCOMING_CUSTOMER_NAMES.length)];
        // Bölüm 7: Soğukkanlı ve Güler Yüz müşterinin sabrını (oyun-dakikası
        // cinsinden) uzatır — her iki yön için de geçerli.
        const patienceMinutes =
          INCOMING_CUSTOMER_EXPIRY_MINUTES +
          (state.skillLevels['sogukkanli'] ?? 0) * SOGUKKANLI_PATIENCE_MINUTES_PER_LEVEL +
          (state.skillLevels['guler-yuz'] ?? 0) * GULER_YUZ_PATIENCE_MINUTES_PER_LEVEL;

        if (direction === 'satis') {
          // Cumhuriyet (Tam) Altını değerce 4 Çeyrek'e, Yarım Altın 2
          // Çeyrek'e eşit olduğundan ayrı stok tutulmuyor — müşteri isteği
          // Çeyrek stoğundan bu kadarı düşülerek karşılanıyor.
          // İşçilikli ürün (Bölüm 16) hariç — GDD'nin kararı gereği asla
          // başka bir müşteriye işçilikli ürün olarak satılmaz.
          const candidates = inventory
            .filter((i) => i.category !== 'pirlanta' && i.category !== 'iscilikli' && i.quantity > 0)
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
                // yorumlanmasının simetriği) — bkz. NegotiationPanel satış modu.
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
              expiresAtTotalMinutes: currentTotalMinutes + patienceMinutes,
            };
          }
        } else if (Math.random() < CRAFTED_GOOD_CUSTOMER_PROBABILITY) {
          // Bölüm 11/14: işçilikli ürün müşterisi — beyan edilen ayar
          // (karat) her zaman gerçek olmayabilir; gerçek ayar/kusur/taş
          // değeri Uzman Görüşü ile açığa çıkana kadar gizli kalır.
          const uzmanGorusuLevel = state.skillLevels['uzman-gorusu'] ?? 0;
          const good = pickCraftedGoodCandidate(uzmanGorusuLevel);
          const archetype =
            BOZDURMA_CUSTOMER_ARCHETYPES[Math.floor(Math.random() * BOZDURMA_CUSTOMER_ARCHETYPES.length)];
          // Piyasa değeri, oyuncunun görebildiği tek bilgi olan BEYAN edilen
          // ayar üzerinden hesaplanır — gerçek değer eritmede ortaya çıkar.
          const marketValueTl = equivalentGrams(good.grams, good.claimedKarat) * nextBuyPrice + good.stoneValueTl;
          const scaleReading: ScaleReading = {
            grams: good.grams,
            karat: good.claimedKarat,
            cleanliness: good.hasHiddenFlaw ? 'Şüpheli, dikkatli incelenmeli' : 'Temiz',
          };
          incomingCustomer = {
            id: String(nextIncomingCustomerId++),
            direction: 'bozdurma',
            customer: {
              name: customerName,
              type: archetype.type,
              request: `${good.productType} bozdurmak istiyorum, ${good.claimedKarat} ayar diyorum.`,
              urgency: archetype.urgency,
              bargainingStyle: archetype.bargainingStyle,
              acceptanceThreshold: archetype.minAcceptRatio,
            },
            product: {
              name: good.productType,
              source: 'Müşteri getirdi',
              category: 'iscilikli',
              karat: good.claimedKarat,
              grams: good.grams,
              marketValueTl,
              actualKarat: good.actualKarat,
              hasHiddenFlaw: good.hasHiddenFlaw,
              stoneValueTl: good.stoneValueTl,
            },
            scaleReading,
            expiresAtTotalMinutes: currentTotalMinutes + patienceMinutes,
          };
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
              // Bölüm 4.3: alım modunda (bkz. NegotiationPanel) bu, oyuncunun
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
            expiresAtTotalMinutes: currentTotalMinutes + patienceMinutes,
          };
        }
      }
    }

    const capital: CapitalState = {
      ...postOfferState.capital,
      cashTl: postOfferState.capital.cashTl + meltingCashBonus + takiPackageCashDelta + brandStageCashDelta,
      stockValueTl: computeStockValueTl(inventory, nextBuyPrice),
    };

    // Yeni bir müşteri bu tick'te belirdiyse oyun anında duraklatılır — bu,
    // Pazarlık paneli React render döngüsünde ekrana gelmeden ÖNCE, tick()
    // içinde tek seferde olur; böylece müşterinin sabrı oyuncu henüz tepki
    // vermeden (özellikle 2x/4x hızda) asla tükenmez.
    const customerJustArrived = !postOfferState.incomingCustomer && incomingCustomer !== null;
    const speedOverride = customerJustArrived ? { speed: 0 as ClockSpeed, preNegotiationSpeed: speed } : {};

    set({
      minuteOfDay,
      day,
      referencePriceAtDayStart,
      marketSpreadTlPerGram,
      wholesalerBuyMarginTlPerGram,
      wholesalerSellMarginTlPerGram,
      wholesalerTrust,
      loanDueDay,
      brokerDeal,
      meltingJob,
      takiPackages,
      inventory,
      offers,
      incomingCustomer,
      capital,
      goldPrice: {
        buyPricePerGram: nextBuyPrice,
        sellPricePerGram: nextSellPrice,
        dailyChangePercent,
      },
      ...speedOverride,
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
    // İşçilikli ürün (Bölüm 11/16) hiçbir zaman birleşmez — her parça
    // kendine has gerçek ayar/kusur/taş değeri taşıyan benzersiz bir kayıt.
    const existingIndex =
      item.category === 'iscilikli'
        ? -1
        : state.inventory.findIndex(
            (i) => i.name === item.name && i.category === item.category && i.karat === item.karat && i.grams === item.grams,
          );

    const settledItemId = existingIndex >= 0 ? state.inventory[existingIndex].id : String(nextInventoryId);
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
              actualKarat: item.actualKarat,
              hasHiddenFlaw: item.hasHiddenFlaw,
              stoneValueTl: item.stoneValueTl,
            } satisfies InventoryItem,
          ];

    // Bölüm 9: nakit yetmeyip borca yazıldıysa, bu işlemin tam bu miktarı
    // sınırlı bir süre için toptancıya kâr marjıyla anında satılabilir
    // hale gelir ("Toptancı Bağlantısı") — açık bir bağlantı varsa yenisi
    // onun yerine geçer (basitleştirme, bkz. yorum). İşçilikli ürün hariç:
    // GDD'nin "asla işlenmemiş satılmaz" kuralı gereği doğrudan toptancıya
    // devredilemez, önce eritilmesi şart.
    const totalMinutesNow = state.day * MINUTES_PER_DAY + state.minuteOfDay;
    const brokerDeal: BrokerDeal | null =
      shortfall > 0 && item.category !== 'iscilikli'
        ? { inventoryItemId: settledItemId, quantity, expiresAtTotalMinutes: totalMinutesNow + BROKER_DEAL_WINDOW_MINUTES }
        : state.brokerDeal;

    // Bölüm 23-24: aktif alım — XP, işlemdeki has altın karşılığı hacme göre kazanılır.
    const xpGained = equivalentGrams(item.grams, item.karat) * quantity * XP_PER_EQUIVALENT_GRAM_TRADED;

    set({
      inventory,
      capital: {
        ...state.capital,
        cashTl,
        debtTl: state.capital.debtTl + shortfall,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      loanDueDay,
      brokerDeal,
      ...applyXpGain(state, xpGained),
    });
    return { success: true, borrowedTl: shortfall };
  },

  resolveBrokerDeal: () => {
    const state = get();
    const deal = state.brokerDeal;
    if (!deal) return null;
    const item = state.inventory.find((i) => i.id === deal.inventoryItemId);
    const sellQuantity = item ? Math.min(deal.quantity, item.quantity) : 0;
    if (!item || sellQuantity <= 0) {
      set({ brokerDeal: null });
      return null;
    }

    // Bölüm 5/9: toptancı, genel piyasa ALIŞ fiyatının marjı kadar
    // üstünden alır — az önce müşteriden alınan malı buraya anında
    // devretmek, aradaki farkı kesin kâr olarak cebe atar.
    const wholesalerPricePerGram = state.goldPrice.buyPricePerGram + state.wholesalerSellMarginTlPerGram;
    const unitPriceTl = equivalentGrams(item.grams, item.karat) * wholesalerPricePerGram;
    const saleValueTl = unitPriceTl * sellQuantity;
    const soldCostBasisTl = (item.costBasisTl / item.quantity) * sellQuantity;
    const profitTl = saleValueTl - soldCostBasisTl;
    const remainingQuantity = item.quantity - sellQuantity;

    const inventory =
      remainingQuantity > 0
        ? state.inventory.map((i) =>
            i.id === item.id
              ? { ...i, quantity: remainingQuantity, costBasisTl: i.costBasisTl - soldCostBasisTl }
              : i,
          )
        : state.inventory.filter((i) => i.id !== item.id);

    const xpGained = equivalentGrams(item.grams, item.karat) * sellQuantity * XP_PER_EQUIVALENT_GRAM_TRADED;

    set({
      inventory,
      brokerDeal: null,
      realizedTradingProfitTl: state.realizedTradingProfitTl + profitTl,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + saleValueTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      ...applyXpGain(state, xpGained),
    });
    return { saleValueTl, profitTl };
  },

  meltCraftedGood: (itemId) => {
    const state = get();
    // v1 basitleştirmesi: aynı anda tek eritme işi — GDD'nin süre/verim
    // mekaniğini bozmadan basit tutar; ikinci bir ürün ilki bitene kadar bekler.
    if (state.meltingJob) return false;
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.category !== 'iscilikli') return false;

    const actualKarat = item.actualKarat ?? item.karat;
    const hasHiddenFlaw = item.hasHiddenFlaw ?? false;
    const yenidenDogusLevel = state.skillLevels['yeniden-dogus'] ?? 0;
    // Bölüm 15: Taş Ustası olmadan taşın ayrı değeri eritmede kaybolur.
    const tasUstasiLevel = state.skillLevels['tas-ustasi'] ?? 0;

    // Bölüm 12/14: gizli kusurlu bir parça eritmede ekstra kayıp verir.
    const efficiency = randomInRange(MELTING_EFFICIENCY_MIN, MELTING_EFFICIENCY_MAX) * (hasHiddenFlaw ? 0.85 : 1);
    const recoveredGrams = Math.round(equivalentGrams(item.grams, actualKarat) * efficiency * 100) / 100;
    const stoneValueTl = tasUstasiLevel > 0 ? (item.stoneValueTl ?? 0) : 0;

    const isSmall = item.grams <= MELTING_SMALL_LARGE_THRESHOLD_GRAMS;
    const baseMinutes = isSmall
      ? randomInRange(MELTING_TIME_SMALL_MIN_MINUTES, MELTING_TIME_SMALL_MAX_MINUTES)
      : randomInRange(MELTING_TIME_LARGE_MIN_MINUTES, MELTING_TIME_LARGE_MAX_MINUTES);
    const timeReduction = Math.min(0.75, yenidenDogusLevel * YENIDEN_DOGUS_TIME_REDUCTION_PER_LEVEL);
    const minutes = Math.max(1, Math.round(baseMinutes * (1 - timeReduction)));

    const inventory = state.inventory.filter((i) => i.id !== itemId);
    const totalMinutesNow = state.day * MINUTES_PER_DAY + state.minuteOfDay;

    set({
      inventory,
      capital: {
        ...state.capital,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      meltingJob: {
        productName: item.name,
        recoveredGrams,
        stoneValueTl,
        costBasisTl: item.costBasisTl,
        completesAtTotalMinutes: totalMinutesNow + minutes,
      },
    });
    return true;
  },

  upgradeAtolye: () => {
    const state = get();
    if (state.atolyeLevel >= ATOLYE_MAX_LEVEL) return false;
    const cost =
      ATOLYE_UPGRADE_BASE_COST_TL * Math.pow(ATOLYE_UPGRADE_COST_MULTIPLIER_PER_LEVEL, state.atolyeLevel);
    if (cost > state.capital.cashTl) return false;

    set({
      atolyeLevel: state.atolyeLevel + 1,
      capital: { ...state.capital, cashTl: state.capital.cashTl - cost },
    });
    return true;
  },

  startTakiPackage: (tierId) => {
    const state = get();
    const tier = TAKI_PACKAGE_TIERS.find((t) => t.id === tierId);
    if (!tier) return false;
    if (state.takiPackages.some((p) => p.tierId === tierId)) return false;
    if (tier.principalTl > state.capital.cashTl) return false;

    const newPackage: ActiveTakiPackage = {
      id: String(nextInventoryId++),
      tierId: tier.id,
      principalTl: tier.principalTl,
      dailyPayoutTl: tier.dailyPayoutTl,
      startedDay: state.day,
      maturesDay: state.day + TAKI_PACKAGE_TERM_DAYS,
    };

    set({
      takiPackages: [...state.takiPackages, newPackage],
      capital: { ...state.capital, cashTl: state.capital.cashTl - tier.principalTl },
    });
    return true;
  },

  purchaseBrandStage: (stageId) => {
    const state = get();
    const stageIndex = BRAND_STAGES.findIndex((s) => s.id === stageId);
    if (stageIndex === -1) return false;
    // Bölüm 28-29: kademeler sırayla alınır — bir öncekine sahip olmadan sıradakine geçilemez.
    if (stageIndex !== state.highestBrandStageIndex + 1) return false;
    const stage = BRAND_STAGES[stageIndex];
    if (state.level < stage.requiredLevel) return false;
    if (stage.costTl > state.capital.cashTl) return false;

    set({
      highestBrandStageIndex: stageIndex,
      capital: { ...state.capital, cashTl: state.capital.cashTl - stage.costTl },
    });
    return true;
  },

  sellInventoryItem: (itemId) => {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    // İşçilikli ürün (Bölüm 16) burada da hariç: asla doğrudan satılmaz, tek çıkış yolu eritme.
    if (!item || item.category === 'pirlanta' || item.category === 'iscilikli') return null;

    const saleValueTl = currentPositionValueTl(item, state.goldPrice.buyPricePerGram);
    const profitTl = saleValueTl - item.costBasisTl;
    const inventory = state.inventory.filter((i) => i.id !== itemId);
    const xpGained = equivalentGrams(item.grams, item.karat) * item.quantity * XP_PER_EQUIVALENT_GRAM_TRADED;

    set({
      inventory,
      realizedTradingProfitTl: state.realizedTradingProfitTl + profitTl,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + saleValueTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      ...applyXpGain(state, xpGained),
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

    const xpGained = equivalentGrams(spec.grams, spec.karat) * quantity * XP_PER_EQUIVALENT_GRAM_TRADED;

    set({
      inventory,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl - totalCostTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      ...applyXpGain(state, xpGained),
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

    const xpGained = equivalentGrams(item.grams, item.karat) * sellQuantity * XP_PER_EQUIVALENT_GRAM_TRADED;

    set({
      inventory,
      realizedTradingProfitTl: state.realizedTradingProfitTl + profitTl,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + saleValueTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      ...applyXpGain(state, xpGained),
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
      actualKarat: offer.actualKarat,
      hasHiddenFlaw: offer.hasHiddenFlaw,
      stoneValueTl: offer.stoneValueTl,
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

    const xpGained = equivalentGrams(item.grams, item.karat) * unitsRequired * XP_PER_EQUIVALENT_GRAM_TRADED;

    set({
      inventory,
      incomingCustomer: null,
      realizedTradingProfitTl: state.realizedTradingProfitTl + profitTl,
      capital: {
        ...state.capital,
        cashTl: state.capital.cashTl + amountTl,
        stockValueTl: computeStockValueTl(inventory, state.goldPrice.buyPricePerGram),
      },
      ...applyXpGain(state, xpGained),
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

  resetSkills: () => {
    const state = get();
    set({ skillLevels: {}, skillPoints: skillPointsForLevel(state.level) });
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
      name: 'cepkaynak-save-v12',
      storage: createJSONStorage(() => AsyncStorage),
      // Skill tanımları/oyun kodu değişse bile eski kayıtlar yüklenebilsin diye
      // sadece serileştirilebilir oyun verisi tutulur — aksiyon fonksiyonları
      // ve geçici alanlar (hasHydrated) hariç tutulur.
      partialize: (state) => ({
        playerName: state.playerName,
        shopName: state.shopName,
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
        brokerDeal: state.brokerDeal,
        meltingJob: state.meltingJob,
        atolyeLevel: state.atolyeLevel,
        takiPackages: state.takiPackages,
        fourXUnlockedUntilMs: state.fourXUnlockedUntilMs,
        fourXUnlimited: state.fourXUnlimited,
        customerHypeUntilMs: state.customerHypeUntilMs,
        highestBrandStageIndex: state.highestBrandStageIndex,
        realizedTradingProfitTl: state.realizedTradingProfitTl,
        totalXp: state.totalXp,
        level: state.level,
        skillPoints: state.skillPoints,
        skillLevels: state.skillLevels,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Bölüm 4.4: "oyun kapatılıp açıldığında ekstra dalgalanma".
        state?.applyRestartFluctuation();
      },
    },
  ),
);
