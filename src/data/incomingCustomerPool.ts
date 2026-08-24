import type { BargainingStyle } from '../types/negotiation';

// v2 iterasyonu: Bölüm 6'nın satış/bozdurma için ayrı arketip listeleri
// TEK bir müşteri kişiliği havuzunda birleşti — aynı 5 kişilik hem "dükkândan
// almak" hem "dükkâna bozdurmak" isteyen müşterilerde kullanılıyor. Artık
// sadece ekranda yazan bir etiket değiller: bargainingStyle NegotiationPanel'in
// karşı teklif mantığını (bkz. COUNTER_OFFER_CHANCE/POSITION), patienceMinutes
// müşterinin gerçekten ne kadar bekleyeceğini (Bölüm 6'nın "sabrı" artık
// oyun saatine bağlı gerçek bir süre) doğrudan belirliyor.
export interface CustomerPersona {
  type: string;
  bargainingStyle: BargainingStyle;
  urgency: string;
  /** Müşterinin dükkânda gerçekten bekleyeceği süre (oyun-dakikası) — Soğukkanlı/Güler Yüz bunun üstüne eklenir. */
  patienceMinutes: number;
  /** Bozdurma (dükkân müşteriden alıyor): müşterinin kabul edeceği, piyasa değerine göre asgari (taban) oran. */
  minAcceptRatio: number;
  /** Satış (dükkân müşteriye satıyor): müşterinin ödemeye razı olduğu, piyasa değerine göre azami (tavan) oran. */
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

// 5 kişilik (Bölüm 15: "ilk playtest için 3-5 müşteri tipi yeterli"):
// Nakit Sıkışan/Bilinçli Satıcı/Sert Pazarlıkçı/Kolay İkna Olur kullanıcının
// birebir istediği isimler; Dengeli Müşteri nötr bir beşinci çeşitlilik.
export const CUSTOMER_PERSONAS: CustomerPersona[] = [
  {
    type: 'Nakit Sıkışan',
    bargainingStyle: 'kolay',
    urgency: 'Acil',
    // Beklemek istemez: kısa sabır, düşük teklifleri kolay kabul eder.
    patienceMinutes: 45,
    minAcceptRatio: 0.72,
    maxPayRatio: 1.15,
  },
  {
    type: 'Bilinçli Satıcı',
    bargainingStyle: 'sert',
    urgency: 'Acelesi yok',
    // Piyasa fiyatını bilir: düşük tekliflere sert tepki verir, kolay pes etmez.
    patienceMinutes: 100,
    minAcceptRatio: 0.9,
    maxPayRatio: 0.97,
  },
  {
    type: 'Sert Pazarlıkçı',
    bargainingStyle: 'sert',
    urgency: 'Normal',
    // Karşı teklif verme ihtimali yüksek, kolay vazgeçmez (uzun sabır).
    patienceMinutes: 110,
    minAcceptRatio: 0.85,
    maxPayRatio: 0.98,
  },
  {
    type: 'Kolay İkna Olur',
    bargainingStyle: 'kolay',
    urgency: 'Normal',
    patienceMinutes: 70,
    minAcceptRatio: 0.75,
    maxPayRatio: 1.1,
  },
  {
    type: 'Dengeli Müşteri',
    bargainingStyle: 'dengeli',
    urgency: 'Normal',
    patienceMinutes: 90,
    minAcceptRatio: 0.82,
    maxPayRatio: 1.02,
  },
];
