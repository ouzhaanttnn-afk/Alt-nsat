import type { ScaleReading } from '../components/ScalePanel';
import type { NegotiationCustomer, NegotiationProduct } from './negotiation';

/**
 * [YENİ] v3 — Toplu Alım (Kalem Bazlı Pazarlık): bir bozdurma müşterisi
 * birden fazla FARKLI üründen (ör. Çeyrek + Gram + Bilezik) aynı anda
 * gelebilir. Her kalem kendi tartımı ve kendi teklif/kabul/karşı-teklif
 * sonucuyla, TEK sepet fiyatı OLMADAN bağımsız pazarlık edilir.
 */
export interface NegotiationLine {
  product: NegotiationProduct;
  scaleReading: ScaleReading;
}

// Bölüm 4.2/6 — sürekli akan müşteri: dükkâna gerçek zamanlı gelen bir
// müşteri akışı, oyunun ilk dakikasından itibaren iki yönlü çalışır:
// 'satis' — müşteri dükkânın stoğundan bir şey almak istiyor (mevcut
// davranış, Pazarlık ekranı 'satis' modunda açılır); 'bozdurma' —
// müşteri elindeki altını dükkâna satmak/bozdurmak istiyor (Pazarlık
// ekranının mevcut 'alis' modu — terazi + kredi mantığı — yeniden
// kullanılır, hiçbir yeni ekran icat edilmedi).
export interface IncomingCustomer {
  id: string;
  customer: NegotiationCustomer;
  product: NegotiationProduct;
  direction: 'satis' | 'bozdurma';
  /** Sadece direction:'satis' — müşterinin almak istediği, dükkânın stoğundaki envanter kalemi. */
  inventoryItemId?: string;
  /**
   * Sadece direction:'satis' — satış tamamlanınca inventoryItemId'den
   * düşülecek adet. Çoğu zaman 1; Cumhuriyet (Tam) Altını 4 Çeyrek'e,
   * Yarım Altın 2 Çeyrek'e değerce eşit olduğundan bunlar için stok
   * tutmak yerine Çeyrek stoğundan bu kadarı düşülür.
   */
  unitsRequired?: number;
  /** Sadece direction:'bozdurma' — Pazarlık ekranının terazi paneli için sahte ölçüm. */
  scaleReading?: ScaleReading;
  /**
   * [YENİ] v3 — sadece direction:'bozdurma': birden fazla FARKLI ürünle
   * gelen "Toplu Alım" müşterisi. Varsa NegotiationPanel `product`/
   * `scaleReading` yerine bu diziyi kalem kalem işler (bkz. lines[0] =
   * product/scaleReading ile tutarlı, geriye dönük uyum için ayna).
   */
  lines?: NegotiationLine[];
  expiresAtTotalMinutes: number;
}
