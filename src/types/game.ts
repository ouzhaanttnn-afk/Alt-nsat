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
