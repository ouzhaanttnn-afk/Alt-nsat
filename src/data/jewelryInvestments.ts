// [YENİ] v3 — "Mavi Tema Yatırım Modeli (Parça & Set)": eski 30 gün kilitli
// anapara paketleri (bkz. eski takiPackageTiers.ts) yerine, Oyun B'nin
// (kuyumcu-simulatoru-mobile) parça bazlı takı yatırımı modeli birebir
// portlandı. Oyuncu her ayar kademesindeki 4 parçayı (Kolye/Yüzük/Küpe/
// Bileklik) TEK TEK satın alabilir; bir kademedeki 4 parçanın TAMAMI
// tamamlanınca o kademenin günlük getirisine +%10 Set Bonusu eklenir.
// Anapara kilidi/vade YOK — kalıcı, likit olmayan bir pasif gelir kaynağı
// (Pırlanta koleksiyonuyla aynı ray, ama gerçek para değil oyun-içi TL ile).
export type JewelryTierId = 'ayar8' | 'ayar14' | 'ayar18' | 'ayar22';
export type JewelryPieceType = 'kolye' | 'yuzuk' | 'kupe' | 'bileklik';

export interface JewelryTierSpec {
  id: JewelryTierId;
  label: string;
  karat: number;
  /** Bir parçanın taban fiyatı: güncel piyasa gram fiyatı × bu çarpan × taban ağırlık. */
  priceMultiplier: number;
}

export interface JewelryPieceSpec {
  id: JewelryPieceType;
  label: string;
}

export const JEWELRY_TIERS: JewelryTierSpec[] = [
  { id: 'ayar8', label: '8 Ayar', karat: 8, priceMultiplier: 1 },
  { id: 'ayar14', label: '14 Ayar', karat: 14, priceMultiplier: 1.8 },
  { id: 'ayar18', label: '18 Ayar', karat: 18, priceMultiplier: 3 },
  { id: 'ayar22', label: '22 Ayar', karat: 22, priceMultiplier: 5 },
];

export const JEWELRY_PIECES: JewelryPieceSpec[] = [
  { id: 'kolye', label: 'Kolye' },
  { id: 'yuzuk', label: 'Yüzük' },
  { id: 'kupe', label: 'Küpe' },
  { id: 'bileklik', label: 'Bileklik' },
];
