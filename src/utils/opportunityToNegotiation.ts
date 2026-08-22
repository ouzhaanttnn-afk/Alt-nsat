import type { Opportunity } from '../components/OpportunityCard';
import type { ScaleReading } from '../components/ScalePanel';
import type { NegotiationCustomer, NegotiationProduct } from '../types/negotiation';

const CLEANLINESS_BY_RISK: Record<string, string> = {
  positive: 'Temiz',
  warning: 'Hafif lekeli',
  negative: 'Şüpheli, dikkatli incele',
};

function sellerNameFromSource(source: string): string {
  return source.replace(/\s*getirdi\s*$/i, '').trim();
}

// Piyasa listesindeki bir fırsatı Pazarlık Ekranı'nın beklediği
// müşteri/ürün/terazi üçlüsüne çevirir. Toptancı fırsatları sabit
// fiyata yakın (sert pazarlıkçı, yüksek kabul eşiği), bozdurma
// fırsatları ise gerçek bir bireyle pazarlık hissi verir.
export function opportunityToNegotiation(opportunity: Opportunity): {
  customer: NegotiationCustomer;
  product: NegotiationProduct;
  scaleReading: ScaleReading;
} {
  const isWholesale = opportunity.sourceType === 'toptanci';

  const customer: NegotiationCustomer = isWholesale
    ? {
        name: 'Toptancı',
        type: 'Toptancı',
        request: `${opportunity.productName} için toptan fiyatımız bu, pazarlık payı yok.`,
        bargainingStyle: 'sert',
        acceptanceThreshold: 0.97,
      }
    : {
        name: sellerNameFromSource(opportunity.source) || 'Müşteri',
        type: 'Bozdurma müşterisi',
        request: `Bu ${opportunity.productName.toLowerCase()} bende duruyordu, değerlendirmek istiyorum.`,
        urgency: 'Normal',
        bargainingStyle: 'dengeli',
        acceptanceThreshold: 0.85,
      };

  const product: NegotiationProduct = {
    name: opportunity.productName,
    source: opportunity.source,
    category: opportunity.category,
    karat: opportunity.karat,
    grams: opportunity.grams,
    marketValueTl: opportunity.buyPriceTl,
    estimatedSellPriceTl: opportunity.estimatedSellPriceTl,
    sealVerified: opportunity.sealVerified,
  };

  const scaleReading: ScaleReading = {
    grams: opportunity.grams,
    karat: opportunity.karat,
    cleanliness: CLEANLINESS_BY_RISK[opportunity.expertiseRisk.tone] ?? 'Temiz',
  };

  return { customer, product, scaleReading };
}
