import type { NegotiationCustomer, NegotiationProduct } from './negotiation';

// Bölüm 4.2/4.3 — sürekli akan müşteri: Piyasa artık statik, tek seferlik
// "fırsat" listesi değil, dükkâna gerçek zamanlı gelen bir müşteri akışı.
// İlk aşamada sadece dükkânın stoğundan bir şey almak isteyen müşteriler
// geliyor (bkz. inventoryItemId — elindeki stoktan hangi kalemi istiyor);
// müşteriden alım (bozdurma) ayrı bir aşamada açılacak.
export interface IncomingCustomer {
  id: string;
  customer: NegotiationCustomer;
  product: NegotiationProduct;
  /** Müşterinin almak istediği, dükkânın stoğundaki envanter kalemi. */
  inventoryItemId: string;
  /**
   * Satış tamamlanınca inventoryItemId'den düşülecek adet. Çoğu zaman 1;
   * Cumhuriyet (Tam) Altını 4 Çeyrek'e, Yarım Altın 2 Çeyrek'e değerce eşit
   * olduğundan bunlar için stok tutmak yerine Çeyrek stoğundan bu kadarı
   * düşülür (bkz. useGameStore'daki bileşik ürün mantığı).
   */
  unitsRequired: number;
  expiresAtTotalMinutes: number;
}
