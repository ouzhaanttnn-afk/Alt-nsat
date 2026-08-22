export interface PirlantaCatalogItem {
  id: string;
  name: string;
  karat: number;
  grams: number;
  /** Mağaza fiyat etiketi — gerçek ödeme entegrasyonu bağlanınca App Store/Play Store fiyatıyla değişecek. */
  priceLabel: string;
  /** Kalıcı vitrin parçası, birim başına sabit günlük gelir. */
  dailyIncomeTl: number;
  /** Oyun içi sembolik değer (Stok/Net Servet'e yansır) — gerçek TL fiyatıyla birebir değil. */
  symbolicValueTl: number;
}

// Gerçek para (mağaza içi satın alma) ile edinilen kalıcı vitrin
// parçaları. Fiyat etiketleri şimdilik gösterge amaçlı — gerçek IAP
// entegrasyonu (App Store/Play Store) bağlanınca güncellenecek.
export const pirlantaCatalog: PirlantaCatalogItem[] = [
  {
    id: 'pirlanta-pastel-yuzuk',
    name: 'Pırlanta Pastel Yüzük',
    karat: 18,
    grams: 2.4,
    priceLabel: '₺49,99',
    dailyIncomeTl: 60,
    symbolicValueTl: 40000,
  },
  {
    id: 'pirlanta-gerdanlik',
    name: 'Pırlanta Gerdanlık',
    karat: 18,
    grams: 5.1,
    priceLabel: '₺99,99',
    dailyIncomeTl: 140,
    symbolicValueTl: 95000,
  },
  {
    id: 'pirlanta-vitrin-tacı',
    name: 'Pırlanta Vitrin Tacı',
    karat: 18,
    grams: 9.6,
    priceLabel: '₺199,99',
    dailyIncomeTl: 320,
    symbolicValueTl: 220000,
  },
];
