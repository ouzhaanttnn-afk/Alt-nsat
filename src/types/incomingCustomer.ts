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
  expiresAtTotalMinutes: number;
}
