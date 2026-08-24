import { ProfitAnalysisCard } from './ProfitAnalysisCard';

// Bölüm 5/9: müşteriden alım/bozdurma pazarlığında, mevcut teklifin
// toptancıya (genel ALIŞ + toptancı marjı üzerinden, Toptancı Bağlantısı
// ile aynı formül) hemen devredilmesi hâlinde ne kazandıracağını canlı
// gösterir — piyasa değeri değil, gerçek kesin gelir üzerinden.
export function KarAnaliziCard({
  offerTl,
  estimatedResaleTl,
}: {
  offerTl: number;
  estimatedResaleTl: number;
}) {
  return (
    <ProfitAnalysisCard
      costLabel="Ortalama Maliyet"
      profitLabel="Tahmini Kâr"
      costTl={offerTl}
      profitTl={estimatedResaleTl - offerTl}
      tip="Daha düşük teklif kârını artırır ama kabul ihtimalini ve karizmanı düşürür."
    />
  );
}
