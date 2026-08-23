import type { InventoryCategory } from './game';

// Bölüm 4.3 (Pazarlık Ekranı) ve Bölüm 6 (Müşteri Sistemi) — iskelet tipler.
export type BargainingStyle = 'sert' | 'dengeli' | 'kolay';

export interface NegotiationCustomer {
  name: string;
  type: string; // Bölüm 6: Normal / Bozdurma müşterisi / VIP vb.
  request: string; // tek cümlelik talep
  budgetTl?: number;
  urgency?: string;
  bargainingStyle: BargainingStyle;
  /** Piyasa değerinin yüzdesi olarak müşterinin kabul edeceği asgari teklif. */
  acceptanceThreshold: number;
}

export interface NegotiationProduct {
  name: string;
  source: string; // ürünün kaynağı (ör. "Müşteri getirdi")
  category: InventoryCategory;
  karat: number;
  grams: number; // birim başına gram
  marketValueTl: number; // TOPLAM işlem değeri (adet dahil)
  /** Bölüm 10: büyük işlemler — 1'den fazlaysa "10 Çeyrek" gibi toplu bir lot. Belirtilmezse 1 kabul edilir. */
  quantity?: number;
  /** Sadece takı: vitrin vadesi sonunda beklenen satış değeri (pasif gelir oranını belirler). */
  estimatedSellPriceTl?: number;
  sealVerified?: boolean;
  /** Bölüm 11-16: sadece işçilikli ürün — `karat`/`grams` müşterinin beyanı, bunlar gizli gerçek değerler (settleDeal ile envantere aynen taşınır). */
  actualKarat?: number;
  hasHiddenFlaw?: boolean;
  stoneValueTl?: number;
}
