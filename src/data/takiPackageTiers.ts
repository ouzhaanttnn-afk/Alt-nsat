// Bölüm 18-20: Takı Yatırım Paketleri — 8/14/18/22 ayar kademeli, 30 gün
// kilitli yatırım ürünleri. Pırlanta (bkz. mockPirlanta.ts) bu merdivenin
// en tepesindeki, gerçek para ile de erişilebilen ayrı bir kalıcı katman —
// buradaki dört kademe tamamen oyun-içi altın/nakit ile alınabiliyor.
export interface TakiPackageTier {
  id: string;
  karat: number;
  name: string;
  principalTl: number;
  dailyPayoutTl: number;
}

export const TAKI_PACKAGE_TIERS: TakiPackageTier[] = [
  { id: '8-ayar', karat: 8, name: '8 Ayar Yatırım Paketi', principalTl: 50000, dailyPayoutTl: 900 },
  { id: '14-ayar', karat: 14, name: '14 Ayar Yatırım Paketi', principalTl: 150000, dailyPayoutTl: 2700 },
  { id: '18-ayar', karat: 18, name: '18 Ayar Yatırım Paketi', principalTl: 400000, dailyPayoutTl: 7400 },
  { id: '22-ayar', karat: 22, name: '22 Ayar Yatırım Paketi', principalTl: 900000, dailyPayoutTl: 17000 },
];
