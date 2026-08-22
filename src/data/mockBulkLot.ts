import type { ScaleReading } from '../components/ScalePanel';
import type { NegotiationCustomer, NegotiationProduct } from '../types/negotiation';

// Büyük hacimli toplu parti senaryosu — Piyasa'da tek seferlik özel
// fırsat olarak gösterilir. Amaç: oyuncunun nakdi yetmediğinde ya
// piyasa değerinin belirgin altında teklif vermek zorunda kalması ya
// da borç alıp adil fiyatı ödemesi arasında seçim yapmasını sağlamak.
export const bulkLotCustomer: NegotiationCustomer = {
  name: 'Serdar Usta',
  type: 'Toplu Satıcı',
  request: 'Elimde 1,5 kilo karışık hurda altın var, nakit sıkıştım, bugün elden çıkarmam lazım.',
  urgency: 'Acil',
  bargainingStyle: 'sert',
  acceptanceThreshold: 0.9,
};

export const bulkLotProduct: NegotiationProduct = {
  name: 'Karışık Hurda Altın (1,5 kg)',
  source: 'Toplu parti',
  karat: 20,
  grams: 1500,
  marketValueTl: 8500000,
  sealVerified: false,
};

export const bulkLotScaleReading: ScaleReading = {
  grams: 1500,
  karat: 20,
  cleanliness: 'Karışık, ayrıştırma gerekiyor',
};
