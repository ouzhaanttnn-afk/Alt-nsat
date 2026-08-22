import type { ActiveOffer } from '../components/ActiveOfferSummary';
import type { DailyGoalStep } from '../components/DailyGoalCard';
import type { Opportunity } from '../components/OpportunityCard';

// Adım 2 iskeleti için statik örnek veri. Piyasa (Adım 4) ve Teklifler
// (Adım 6) ekranları kurulduğunda bu veriler gerçek store'dan gelecek.
export const dailyGoalSteps: DailyGoalStep[] = [
  { label: '3 ürün al', done: true },
  { label: '2 ürün sat', done: false },
  { label: '40.000₺ kâr', done: false },
];

export const todaysOpportunity: Opportunity = {
  productName: 'Burma Bilezik',
  source: 'Toptancı',
  karat: 22,
  grams: 21.73,
  buyPriceTl: 11800,
  estimatedSellPriceTl: 15200,
  expertiseRisk: { tone: 'warning', label: 'Ekspertiz riski: Orta' },
  sealVerified: true,
};

export const activeOffer: ActiveOffer = {
  customerName: 'Mehmet Bey',
  productName: 'Tektaş Yüzük — 14 Ayar',
  offerAmountTl: 8500,
  status: 'Yanıt bekliyor',
};
