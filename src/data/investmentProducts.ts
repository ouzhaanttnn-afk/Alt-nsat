import type { InventoryCategory } from '../types/game';

export interface InvestmentProductSpec {
  id: string;
  name: string;
  karat: number;
  grams: number;
  category: InventoryCategory;
}

// Bölüm 4.5: Yatırımlar — basılı yatırım altınının sabit teknik
// özellikleri. Her an açık, sabit spesifikasyonlu bir borsa masası gibi
// işliyor: canlı kurdan anında al-sat, pazarlık yok.
export const investmentProducts: InvestmentProductSpec[] = [
  { id: 'gram-altin', name: 'Gram Altın (Has)', karat: 24, grams: 1, category: 'yatirim' },
  { id: 'ceyrek-altin', name: 'Çeyrek Altın', karat: 22, grams: 1.75, category: 'yatirim' },
  { id: 'yarim-altin', name: 'Yarım Altın', karat: 22, grams: 3.5, category: 'yatirim' },
  { id: 'tam-altin', name: 'Tam Altın (Cumhuriyet)', karat: 22, grams: 7.02, category: 'yatirim' },
  { id: 'ata-lira', name: 'Ata Lira', karat: 22, grams: 7.2, category: 'yatirim' },
];
