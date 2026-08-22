export interface InvestmentProductSpec {
  id: string;
  name: string;
  karat: number;
  grams: number;
}

// Bölüm 4.5: Yatırımlar — basılı yatırım altınının sabit teknik
// özellikleri (Piyasa'daki fırsat listesinden bağımsız: buradaki ürünler
// her an açık, sabit spesifikasyonlu bir borsa masası gibi işliyor).
export const investmentProducts: InvestmentProductSpec[] = [
  { id: 'gram-altin', name: 'Gram Altın (Has)', karat: 24, grams: 1 },
  { id: 'ceyrek-altin', name: 'Çeyrek Altın', karat: 22, grams: 1.75 },
  { id: 'yarim-altin', name: 'Yarım Altın', karat: 22, grams: 3.5 },
  { id: 'tam-altin', name: 'Tam Altın (Cumhuriyet)', karat: 22, grams: 7.02 },
  { id: 'ata-lira', name: 'Ata Lira', karat: 22, grams: 7.2 },
];
