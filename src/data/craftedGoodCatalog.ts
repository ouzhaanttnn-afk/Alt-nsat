// Bölüm 11: işçilikli ürün (kolye/yüzük/küpe/işlemeli bilezik/taşlı) tipleri
// — GDD'nin "Bilezik" örneği burada 22 Ayar Bilezik toptancı stoğuyla
// (sabit 10g/22 ayar, fungible) KARIŞTIRILMAMALI: bu, müşterinin getirdiği,
// her biri kendine has ağırlık/ayar taşıyan, benzersiz bir parça.
export interface CraftedGoodSpec {
  productType: string;
  minGrams: number;
  maxGrams: number;
  minKarat: number;
  maxKarat: number;
  /** Taşlı/pırlanta işlemeli — eritmede taşın ayrı bir değeri var (Taş Ustası olmadan kaybolur). */
  hasStone: boolean;
}

export const CRAFTED_GOOD_CATALOG: CraftedGoodSpec[] = [
  { productType: 'Kolye', minGrams: 5, maxGrams: 25, minKarat: 14, maxKarat: 22, hasStone: false },
  { productType: 'Yüzük', minGrams: 2, maxGrams: 8, minKarat: 14, maxKarat: 22, hasStone: false },
  { productType: 'Küpe', minGrams: 1, maxGrams: 6, minKarat: 14, maxKarat: 22, hasStone: false },
  { productType: 'İşlemeli Bilezik', minGrams: 10, maxGrams: 40, minKarat: 14, maxKarat: 22, hasStone: false },
  { productType: 'Taşlı Yüzük', minGrams: 3, maxGrams: 10, minKarat: 14, maxKarat: 22, hasStone: true },
  { productType: 'Pırlanta Küpe', minGrams: 2, maxGrams: 8, minKarat: 14, maxKarat: 22, hasStone: true },
];

/** Gerçek hayattaki yaygın kuyum ayarları — sahtecilik/yanlış beyan simülasyonunda kullanılır. */
export const REALISTIC_KARATS = [14, 18, 21, 22];
