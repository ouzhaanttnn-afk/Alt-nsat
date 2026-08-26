// v0.2 Faz 6 — Takı Yatırımları: müşteriden alınan işçilikli ürünlerden
// tamamen ayrı, 30 oyun günlük sermaye bağlama kontratları. Fiyat/ROI
// değerleri economyConfig.PASSIVE_INVESTMENT_CONFIG içinden gelir; burada
// yalnızca UI ve identity için kullanılan ayar/parça tanımları durur.
export type JewelryTierId = 'ayar8' | 'ayar14' | 'ayar18' | 'ayar22';
export type JewelryPieceType = 'kolye' | 'yuzuk' | 'kupe' | 'bileklik';

export interface JewelryTierSpec {
  id: JewelryTierId;
  label: string;
  karat: number;
}

export interface JewelryPieceSpec {
  id: JewelryPieceType;
  label: string;
}

export const JEWELRY_TIERS: JewelryTierSpec[] = [
  { id: 'ayar8', label: '8 Ayar', karat: 8 },
  { id: 'ayar14', label: '14 Ayar', karat: 14 },
  { id: 'ayar18', label: '18 Ayar', karat: 18 },
  { id: 'ayar22', label: '22 Ayar', karat: 22 },
];

export const JEWELRY_PIECES: JewelryPieceSpec[] = [
  { id: 'kolye', label: 'Kolye' },
  { id: 'yuzuk', label: 'Yüzük' },
  { id: 'kupe', label: 'Küpe' },
  { id: 'bileklik', label: 'Bileklik' },
];
