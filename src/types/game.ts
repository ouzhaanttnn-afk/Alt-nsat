// Bölüm 2: Sermaye ve Ekonomi Modeli — temel tipler (iskelet, ileride genişletilecek).
export interface CapitalState {
  goldGrams: number; // toplam sermaye (gram has altın cinsinden)
  cashTl: number; // kasadaki nakit (TL)
  stockValueTl: number; // stok değeri (has altın karşılığı, TL)
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
export type InventoryCategory = 'taki' | 'yatirim';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  karat: number;
  grams: number;
  /** Takı için sabit vitrin değeri; yatırım ürününde satışta güncel kurla yeniden hesaplanır. */
  valueTl: number;
  acquiredDay: number;
}
