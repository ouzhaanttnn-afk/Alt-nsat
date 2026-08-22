import type { Opportunity } from '../components/OpportunityCard';

// Bölüm 4.2: Toptancı + müşteri bozdurma fırsatları birleşik tek liste.
// Piyasa (Adım 6: Teklifler/gerçek toptancı sistemi) kurulduğunda bu
// statik veri gerçek üretim mantığıyla değişecek.
export const marketOpportunities: Opportunity[] = [
  {
    productName: 'Burma Bilezik',
    source: 'Toptancı',
    karat: 22,
    grams: 21.73,
    buyPriceTl: 11800,
    estimatedSellPriceTl: 15200,
    expertiseRisk: { tone: 'warning', label: 'Ekspertiz riski: Orta' },
    sealVerified: true,
  },
  {
    productName: 'Tektaş Yüzük',
    source: 'Ayşe Hanım getirdi',
    karat: 14,
    grams: 3.85,
    buyPriceTl: 7200,
    estimatedSellPriceTl: 9900,
    expertiseRisk: { tone: 'positive', label: 'Ekspertiz riski: Düşük' },
  },
  {
    productName: 'Set (Kolye + Küpe)',
    source: 'Toptancı',
    karat: 22,
    grams: 34.2,
    buyPriceTl: 19500,
    estimatedSellPriceTl: 23800,
    expertiseRisk: { tone: 'positive', label: 'Ekspertiz riski: Düşük' },
    sealVerified: true,
  },
  {
    productName: 'Zincir Kolye',
    source: 'Hasan Bey getirdi',
    karat: 14,
    grams: 12.4,
    buyPriceTl: 8100,
    estimatedSellPriceTl: 9200,
    expertiseRisk: { tone: 'negative', label: 'Ekspertiz riski: Yüksek' },
  },
  {
    productName: 'Alyans Çifti',
    source: 'Toptancı',
    karat: 22,
    grams: 9.6,
    buyPriceTl: 6300,
    estimatedSellPriceTl: 8500,
    expertiseRisk: { tone: 'positive', label: 'Ekspertiz riski: Düşük' },
  },
  {
    productName: 'Beşibiryerde',
    source: 'Fatma Hanım getirdi',
    karat: 22,
    grams: 15.5,
    buyPriceTl: 13400,
    estimatedSellPriceTl: 15100,
    expertiseRisk: { tone: 'warning', label: 'Ekspertiz riski: Orta' },
  },
];
