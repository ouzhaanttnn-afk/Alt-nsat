import type { ScaleReading } from '../components/ScalePanel';
import type { NegotiationCustomer, NegotiationProduct } from '../types/negotiation';

// Adım 3 iskeleti için statik pazarlık senaryosu — Ana Ekran'daki
// "aktif teklif" ile aynı müşteri/ürün. Teklifler sistemi (Adım 6)
// kurulduğunda gerçek verilerle değişecek.
export const negotiationCustomer: NegotiationCustomer = {
  name: 'Mehmet Bey',
  type: 'Bozdurma müşterisi',
  request: 'Bu yüzüğü bozdurmak istiyorum, acil ihtiyacım var abi.',
  urgency: 'Acil',
  bargainingStyle: 'dengeli',
  acceptanceThreshold: 0.86,
};

export const negotiationProduct: NegotiationProduct = {
  name: 'Tektaş Yüzük',
  source: 'Müşteri getirdi',
  karat: 14,
  grams: 3.85,
  marketValueTl: 9900,
  sealVerified: false,
};

export const scaleReading: ScaleReading = {
  grams: 3.85,
  karat: 14,
  cleanliness: 'Hafif lekeli',
};
