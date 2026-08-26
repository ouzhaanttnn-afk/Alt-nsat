// Bölüm 2: Sermaye ve Ekonomi Modeli. Kullanıcı kararı: ayrı bir "rezerv"
// kavramı yok — 1 kg'lik başlangıç sermayesinin tamamı doğrudan kullanılabilir
// nakde çevrilir. "Kaç gram altına karşılık geliyor" artık saklanan bir alan
// değil, kasadaki nakit güncel kurdan bölünerek her an türetilen bir gösterge.
export interface CapitalState {
  cashTl: number; // kasadaki nakit (TL) — sermayenin tamamı burada
  stockValueTl: number; // envanterdeki mal değeri (has altın karşılığı, TL)
  debtTl: number; // borç (TL)
}

export interface GoldPriceState {
  buyPricePerGram: number; // TL / gram (alış)
  sellPricePerGram: number; // TL / gram (satış)
  dailyChangePercent: number; // bugünkü değişim yüzdesi
}

export interface ReputationState {
  score: number; // 0-100
}

export interface WorkshopState {
  /** Atölye kurulmuş mu; level > 0 ise true kabul edilir. */
  unlocked: boolean;
  /** 0 = kurulmamış, 1-10 = üretim seviyesi. */
  level: number;
  /** Atölye'nin ömür boyu ürettiği toplam HAS gramı. */
  totalHasProduced: number;
  /** Gün sonu üretiminin idempotent olması için son üretim yapılan oyun günü. */
  lastProductionDay: number | null;
}

// "taki"/"yatirim": sarrafiye stoğu (gram/çeyrek altın, 22 ayar bilezik) —
// fungible, güncel kurdan mark-to-market, doğrudan satılabilir.
// "pirlanta": gerçek para (mağaza içi satın alma) ile edinilen kalıcı,
// vadesiz vitrin parçası — oyun içi altın ekonomisine (nakit/borç) hiç
// dokunmaz, ayrı bir satın alma yoluyla (bkz. purchasePirlanta) eklenir.
// "iscilikli": Bölüm 11/16 — müşteriden bozdurma yoluyla alınan kolye/
// yüzük/küpe/taşlı gibi benzersiz işçilikli parçalar. Fungible DEĞİL,
// asla başka bir müşteriye satılmaz — tek çıkış yolu eritme (bkz.
// meltCraftedGood). Bu yüzden sellInventoryItem/sellInvestmentUnits bu
// kategoriyi kasıtlı olarak reddeder.
export type InventoryCategory = 'taki' | 'yatirim' | 'pirlanta' | 'iscilikli';

// Aynı ürün (ör. "Çeyrek Altın") farklı fiyatlardan birden fazla kez
// alınabilir — bunlar tek bir pozisyonda toplanır, maliyet ortalaması
// alınır. Kullanıcı örneği: 10 tane 11.200'den + 5 tane 11.480'den →
// costBasisTl = 10*11.200 + 5*11.480, ortalama = costBasisTl/quantity.
// Kâr = satış anındaki güncel değer - costBasisTl (alış-satış makası).
export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  karat: number;
  grams: number; // birim başına gram
  quantity: number; // adet
  /** Bu pozisyon için toplam ödenen maliyet (adet başına ortalama = costBasisTl / quantity). */
  costBasisTl: number;
  acquiredDay: number;
  acquiredMinuteOfDay?: number;
  source?: string;
  /**
   * Sadece takı: vitrin vadesi (30 gün) sonunda ulaşılacak tahmini satış
   * değeri. Günlük pasif gelir = (estimatedValueTl - costBasisTl) / 30 gün
   * — yani her takı kendi kâr potansiyeline göre kazandırır. Yatırımda
   * kullanılmıyor (o zaten canlı kurdan, istenen an satılabiliyor).
   */
  estimatedValueTl?: number;
  /** Sadece pırlanta: kalıcı, sabit günlük gelir (birim başına). */
  dailyIncomeTl?: number;
  /** Sadece pırlanta: mağaza fiyat etiketi (ör. "₺99,99"), bilgi amaçlı. */
  realMoneyPriceLabel?: string;
  /**
   * Sadece işçilikli ürün: gerçek ayar — `karat` alanı müşterinin BEYAN
   * ettiği ayarı taşır (Uzman Görüşü olmadan bilinen tek değer); bu alan
   * eritme anında gerçek geri kazanımı belirler, beyandan farklı olabilir
   * (sahtecilik/yanlış beyan riski, bkz. Bölüm 14).
   */
  actualKarat?: number;
  /** Sadece işçilikli ürün: gizli kusur (içi boş/dolgu vb.) — eritme veriminden ekstra düşer. */
  hasHiddenFlaw?: boolean;
  /** Sadece işçilikli/taşlı ürün: taşın altından bağımsız ayrı değeri — Taş Ustası olmadan eritmede kaybolur. */
  stoneValueTl?: number;
  /**
   * @deprecated Eski v0.2 Aşama 4 ürün-bazlı Atölye denemesinden kalma
   * alanlar. Yeni gameplay bunları yazmaz, göstermez ve hesapta kullanmaz;
   * eski save'leri güvenle okuyabilmek için opsiyonel bırakıldı.
   */
  workshopStatus?: 'none' | 'processing' | 'ready';
  workshopStartedAtTotalMinutes?: number;
  workshopEndsAtTotalMinutes?: number;
  workshopProcessed?: boolean;
  workshopValueAddedTl?: number;
  workshopCostTl?: number;
}
