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
  grams: number;
  marketValueTl: number;
  sealVerified?: boolean;
}
