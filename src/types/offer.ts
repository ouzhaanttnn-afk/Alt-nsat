import type { InventoryCategory } from './game';

// Bölüm 4.6: Teklifler — Bekleyen/Kabul/Red durumundaki pazarlıkların
// listesi. "Tam Fiyatı Öde" ve "Reddet" anında sonuçlanır (bkz.
// PazarlikScreen); kaydırma çubuğuyla gönderilen bir teklif ise
// müşterinin düşünmesi için bir süre "bekleyen" kalır, sonra otomatik
// kabul/red olur — sonucu aslında gönderildiği anda belirlenir
// (willAccept), sadece açıklanması gecikir.
export type OfferStatus = 'bekleyen' | 'kabul' | 'red';

export interface Offer {
  id: string;
  customerName: string;
  productName: string;
  category: InventoryCategory;
  karat: number;
  grams: number;
  offerAmountTl: number;
  marketValueTl: number;
  estimatedSellPriceTl?: number;
  status: OfferStatus;
  willAccept: boolean;
  createdDay: number;
  createdMinuteOfDay: number;
  resolvesAtTotalMinutes: number;
}
