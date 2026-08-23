import type { BargainingStyle } from '../types/negotiation';

// Piyasa: sürekli akan müşteri havuzu. İlk aşamada müşteriler sadece
// dükkânın stoğundan bir şey almak isteyip geliyor (bkz. useGameStore'daki
// üretim mantığı) — müşteriden alım (bozdurma) ayrı bir aşamada açılacak.
export interface CustomerArchetype {
  type: string;
  bargainingStyle: BargainingStyle;
  urgency: string;
  /** Dükkânın normal satış fiyatına (canlı kur) göre, müşterinin ödemeye razı olduğu tavan oranı. */
  maxPayRatio: number;
}

export const INCOMING_CUSTOMER_NAMES = [
  'Mehmet Bey',
  'Ayşe Hanım',
  'Kemal Bey',
  'Hasan Bey',
  'Fatma Hanım',
  'Serpil Hanım',
  'Cengiz Bey',
  'Nur Hanım',
  'Ali Bey',
  'Zeynep Hanım',
];

export const INCOMING_CUSTOMER_ARCHETYPES: CustomerArchetype[] = [
  { type: 'Normal Müşteri', bargainingStyle: 'dengeli', urgency: 'Normal', maxPayRatio: 1.0 },
  { type: 'Pazarlıkçı', bargainingStyle: 'sert', urgency: 'Acelesi yok', maxPayRatio: 0.9 },
  { type: 'Aceleci Müşteri', bargainingStyle: 'kolay', urgency: 'Acil', maxPayRatio: 1.12 },
];

export interface BozdurmaCustomerArchetype {
  type: string;
  bargainingStyle: BargainingStyle;
  urgency: string;
  /** Bölüm 5/8: müşterinin bozdurma için kabul edeceği, piyasa değerine göre asgari (taban) oran. */
  minAcceptRatio: number;
}

// Bölüm 6: müşteriden alım (bozdurma) — Pazarlık ekranının mevcut 'alis'
// modu (taban oranı yorumu) yeniden kullanılır, bu yüzden oranlar o
// ekranın teklif aralığıyla (piyasa değerinin ~%30-95'i) uyumlu, ulaşılabilir.
export const BOZDURMA_CUSTOMER_ARCHETYPES: BozdurmaCustomerArchetype[] = [
  { type: 'Bozdurma Müşterisi', bargainingStyle: 'dengeli', urgency: 'Normal', minAcceptRatio: 0.85 },
  { type: 'Nakit Sıkışan', bargainingStyle: 'kolay', urgency: 'Acil', minAcceptRatio: 0.78 },
  { type: 'Bilinçli Satıcı', bargainingStyle: 'sert', urgency: 'Acelesi yok', minAcceptRatio: 0.92 },
];
