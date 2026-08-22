import type { InventoryCategory } from '../types/game';

export interface StockSpec {
  id: string;
  name: string;
  karat: number;
  grams: number;
  category: InventoryCategory;
}

// Piyasa: Toptancıdan Stok Al — sarrafiye stoğunun tamamı üç kalemden
// oluşuyor. Gram/Çeyrek yatırım altını canlı kurdan değerlenir (yatirim),
// bilezik işçilik değeri taşıdığı için sabit maliyet üzerinden tutulur
// (taki). Yarım Altın ve Cumhuriyet (Tam) Altını ayrı bir stok kalemi
// DEĞİL — değerce 2 ve 4 Çeyrek'e eşit olduğu için müşteri isteği bu
// stoktan otomatik karşılanıyor (bkz. useGameStore'daki bileşik ürün
// mantığı). Toptancıdan sadece alınır; müşteriye pazarlıkla satılır.
export const toptanciStock: StockSpec[] = [
  { id: 'gram-altin', name: 'Gram Altın (Has)', karat: 24, grams: 1, category: 'yatirim' },
  { id: 'ceyrek-altin', name: 'Çeyrek Altın', karat: 22, grams: 1.75, category: 'yatirim' },
  { id: '22-ayar-bilezik', name: '22 Ayar Bilezik', karat: 22, grams: 10, category: 'taki' },
];
