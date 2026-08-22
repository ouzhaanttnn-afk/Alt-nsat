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

// Kullanıcı kararı: takı ürünleri (bilezik/yüzük/kolye) tek tek pazarlıkla
// satılmıyor — vitrine konup sürekli oranlı pasif gelir üretiyor. Yatırımlık
// ürünler (çeyrek/gram/yarım/tam/ata lira) ise doğrudan/aktif alınıp satılıyor.
// "pirlanta": gerçek para (mağaza içi satın alma) ile edinilen kalıcı,
// vadesiz vitrin parçası — oyun içi altın ekonomisine (nakit/borç) hiç
// dokunmaz, ayrı bir satın alma yoluyla (bkz. purchasePirlanta) eklenir.
export type InventoryCategory = 'taki' | 'yatirim' | 'pirlanta';

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
}
