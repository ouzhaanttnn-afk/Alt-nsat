import type { InventoryCategory } from './game';

// Bölüm 4.6: Teklifler — Bekleyen/Kabul/Red durumundaki pazarlıkların
// listesi. "Tam Fiyatı Öde" ve "Reddet" anında sonuçlanır (bkz.
// NegotiationPanel); kaydırma çubuğuyla gönderilen bir teklif ise
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
  /** Bölüm 10: büyük işlemler — 1'den fazlaysa toplu bir lot. Belirtilmezse 1 kabul edilir. */
  quantity?: number;
  /** Bölüm 11-16: sadece işçilikli ürün — karat/grams beyan, bunlar gizli gerçek değerler. */
  actualKarat?: number;
  hasHiddenFlaw?: boolean;
  stoneValueTl?: number;
  status: OfferStatus;
  willAccept: boolean;
  createdDay: number;
  createdMinuteOfDay: number;
  resolvesAtTotalMinutes: number;
}
