import type { InvestmentProductSpec } from './investmentProducts';

// Piyasa: Toptancıdan Stok Al — takı ürünleri için her an açık, pazarlıksız
// restok masası (yatırım altınının borsa masasıyla aynı mantık, bkz.
// investmentProducts). Buradan alınan stok müşteriye pazarlıkla satılır —
// bu yüzden InvestmentExchangeCard burada sadece "Satın Al" ile kullanılır.
export const toptanciTakiStock: InvestmentProductSpec[] = [
  { id: '22-ayar-bilezik', name: '22 Ayar Bilezik', karat: 22, grams: 10, category: 'taki' },
];
