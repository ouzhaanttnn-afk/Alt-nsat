import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GENEROUS_OFFER_REPUTATION_BONUS,
  LOW_OFFER_REPUTATION_PENALTY,
  OFFER_PRESET_COMERT_RATIO,
  OFFER_PRESET_MAKUL_RATIO,
  OFFER_PRESET_OLUCU_RATIO,
  OFFER_RANGE_MAX_RATIO,
  OFFER_RANGE_MIN_RATIO,
  SALE_OFFER_MAX_RATIO,
  SALE_OFFER_MIN_RATIO,
  SALE_REJECTION_ATTEMPTS,
} from '../config/economyConfig';
import type { IncomingCustomer } from '../types/incomingCustomer';
import { equivalentGrams, MINUTES_PER_DAY, useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { calculateOpportunityScore } from '../utils/opportunityScore';
import { Badge } from './Badge';
import { CustomerNoteCard } from './CustomerNoteCard';
import { KarAnaliziCard } from './KarAnaliziCard';
import { NegotiationActions } from './NegotiationActions';
import { NegotiationProductCard } from './NegotiationProductCard';
import { OfferPresets } from './OfferPresets';
import { PriceBlock } from './PriceBlock';
import { SaleActions } from './SaleActions';
import { ScalePanel } from './ScalePanel';

type Result = 'accepted' | 'rejected' | 'creditDenied' | 'timedOut' | 'sent' | null;

const MEASURE_DURATION_MS = 900;
// Bölüm 7: Sıkı Pazarlıkçı kabul eşiğini düşürür (Sv.1 %5 → Sv.5 %25).
const SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL = 0.05;
const OLUCU_AGGRESSIVE_OFFER_RATIO = 0.65;
const OLUCU_REPUTATION_PENALTY_PER_LEVEL = 2;
const SIKI_PAZARLIKCI_REPUTATION_PENALTY = 1;

// Mockup birleşimi: Bölüm 4.3'ün Pazarlık ekranı artık ayrı bir modal
// değil, Dükkân'a gömülü bu panel — hem alım/bozdurma (terazi + kredi +
// Toptancı Bağlantısı) hem satış modunu, gerçek zamanlı sayaç yerine
// oyun saatine bağlı sabır çubuğuyla (bkz. CustomerNoteCard) yürütür.
export function NegotiationPanel({
  incomingCustomer,
  onClose,
}: {
  incomingCustomer: IncomingCustomer;
  onClose: () => void;
}) {
  const isSale = incomingCustomer.direction === 'satis';
  const customer = incomingCustomer.customer;
  const product = incomingCustomer.product;
  const reading = incomingCustomer.scaleReading ?? { grams: product.grams, karat: product.karat, cleanliness: 'Temiz' };
  const incomingCustomerId = incomingCustomer.id;

  const day = useGameStore((s) => s.day);
  const minuteOfDay = useGameStore((s) => s.minuteOfDay);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const wholesalerSellMarginTlPerGram = useGameStore((s) => s.wholesalerSellMarginTlPerGram);
  const cashTl = useGameStore((s) => s.capital.cashTl);
  const settleDeal = useGameStore((s) => s.settleDeal);
  const sendPendingOffer = useGameStore((s) => s.sendPendingOffer);
  const resolveIncomingCustomer = useGameStore((s) => s.resolveIncomingCustomer);
  const clearIncomingCustomer = useGameStore((s) => s.clearIncomingCustomer);
  const adjustReputation = useGameStore((s) => s.adjustReputation);
  const skillLevels = useGameStore((s) => s.skillLevels);
  const brokerDeal = useGameStore((s) => s.brokerDeal);
  const resolveBrokerDeal = useGameStore((s) => s.resolveBrokerDeal);

  const sikiPazarlikciLevel = skillLevels['siki-pazarlikci'] ?? 0;
  const oluluLevel = skillLevels['olucu'] ?? 0;
  const uzmanGorusuLevel = skillLevels['uzman-gorusu'] ?? 0;
  const piyasaSezgisiLevel = skillLevels['piyasa-sezgisi'] ?? 0;

  const [tested, setTested] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [held, setHeld] = useState(false);

  // Bölüm 6: müşterinin sabrı artık oyun saatine bağlı — Soğukkanlı/Güler
  // Yüz zaten bu süreyi store'da (incomingCustomer üretilirken) uzattı.
  const currentTotalMinutes = day * MINUTES_PER_DAY + minuteOfDay;
  const [totalPatienceMinutes] = useState(() =>
    Math.max(1, incomingCustomer.expiresAtTotalMinutes - currentTotalMinutes),
  );
  const minutesLeft = Math.max(0, incomingCustomer.expiresAtTotalMinutes - currentTotalMinutes);
  const patienceRatio = minutesLeft / totalPatienceMinutes;

  // Satış modunda (dükkândan müşteriye) nakit sınırı yok — istediğin fiyatı
  // isteyebilirsin, tavan/taban sadece piyasa değerine göre makul bir aralık.
  // Alım/bozdurma modunda ise Bölüm 7'nin %15-100 aralığı geçerli.
  const baseMin = isSale
    ? Math.round(product.marketValueTl * SALE_OFFER_MIN_RATIO)
    : Math.round(product.marketValueTl * OFFER_RANGE_MIN_RATIO);
  const baseMax = isSale
    ? Math.round(product.marketValueTl * SALE_OFFER_MAX_RATIO)
    : Math.round(product.marketValueTl * OFFER_RANGE_MAX_RATIO);
  const sliderMax = isSale ? baseMax : Math.max(1, Math.min(baseMax, Math.round(cashTl)));
  const sliderMin = Math.min(baseMin, sliderMax);
  const cashLimited = !isSale && sliderMax < baseMax;
  const clampOffer = (amount: number) => Math.max(sliderMin, Math.min(sliderMax, amount));

  const [offer, setOffer] = useState(() =>
    isSale
      ? Math.round(product.marketValueTl)
      : clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_OLUCU_RATIO)),
  );

  const [result, setResult] = useState<Result>(null);
  const [borrowedTl, setBorrowedTl] = useState(0);
  // Müşteri fiyatı çok yüksek bulup reddederse oyuncu SALE_REJECTION_ATTEMPTS
  // kadar tekrar fiyat önerebilir — sadece son denemede de reddedilirse
  // müşteri gerçekten ayrılır.
  const [saleRejectionCount, setSaleRejectionCount] = useState(0);

  useEffect(() => {
    if (result !== null || minutesLeft > 0) return;
    if (isSale) resolveIncomingCustomer(false);
    else if (incomingCustomerId) clearIncomingCustomer(incomingCustomerId);
    setResult('timedOut');
  }, [minutesLeft, result, isSale, resolveIncomingCustomer, incomingCustomerId, clearIncomingCustomer]);

  const handleTare = () => {
    if (held) return;
    setMeasuring(false);
    setTested(false);
  };

  const handleHold = () => setHeld((prev) => !prev);

  const handleTest = () => {
    if (held || measuring) return;
    setMeasuring(true);
    setTimeout(() => {
      setMeasuring(false);
      setTested(true);
    }, MEASURE_DURATION_MS);
  };

  const completeDeal = (amount: number) => {
    const outcome = settleDeal(amount, {
      name: product.name,
      category: product.category,
      karat: product.karat,
      grams: product.grams,
      marketValueTl: product.marketValueTl,
      estimatedSellPriceTl: product.estimatedSellPriceTl,
      quantity: product.quantity,
      actualKarat: product.actualKarat,
      hasHiddenFlaw: product.hasHiddenFlaw,
      stoneValueTl: product.stoneValueTl,
    });
    setOffer(amount);
    if (incomingCustomerId) clearIncomingCustomer(incomingCustomerId);
    if (!outcome.success) {
      setResult('creditDenied');
      return;
    }
    setBorrowedTl(outcome.borrowedTl);
    setResult('accepted');
  };

  // Bölüm 4.2 satış modu: dükkâna gelen müşteriye anında sonuçlanan satış.
  // customer.acceptanceThreshold burada müşterinin ödemeye razı olduğu
  // TAVAN oran olarak yorumlanıyor (alım modunda taban olmasının simetriği).
  const resolveSale = (amount: number) => {
    const ceiling = product.marketValueTl * customer.acceptanceThreshold;
    setOffer(amount);
    if (amount > ceiling) {
      const nextRejectionCount = saleRejectionCount + 1;
      if (nextRejectionCount < SALE_REJECTION_ATTEMPTS) {
        setSaleRejectionCount(nextRejectionCount);
        return;
      }
      resolveIncomingCustomer(false);
      setResult('rejected');
      return;
    }
    resolveIncomingCustomer(true, amount);
    setResult('accepted');
  };

  // Bölüm 4.6: Kaydırma çubuğuyla "Teklifi Gönder" anında sonuçlanmaz —
  // müşterinin kararı zaten burada belirlenir (willAccept) ama açıklaması
  // Teklifler/Müşteriler sekmesinde bir süre sonra gerçekleşir.
  const resolveOffer = (amount: number) => {
    const originalThreshold = product.marketValueTl * customer.acceptanceThreshold;
    const adjustedThreshold =
      originalThreshold * (1 - sikiPazarlikciLevel * SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL);
    const willAccept = amount >= adjustedThreshold;
    setOffer(amount);

    if (willAccept) {
      const offerRatio = amount / product.marketValueTl;
      if (offerRatio < OFFER_PRESET_OLUCU_RATIO) {
        adjustReputation(-LOW_OFFER_REPUTATION_PENALTY);
      } else if (offerRatio >= OFFER_PRESET_COMERT_RATIO) {
        adjustReputation(GENEROUS_OFFER_REPUTATION_BONUS);
      }
      if (amount < originalThreshold && sikiPazarlikciLevel > 0) {
        adjustReputation(-SIKI_PAZARLIKCI_REPUTATION_PENALTY);
      }
      if (oluluLevel > 0 && amount < product.marketValueTl * OLUCU_AGGRESSIVE_OFFER_RATIO) {
        adjustReputation(-OLUCU_REPUTATION_PENALTY_PER_LEVEL * oluluLevel);
      }
    }

    sendPendingOffer({
      customerName: customer.name,
      productName: product.name,
      category: product.category,
      karat: product.karat,
      grams: product.grams,
      offerAmountTl: amount,
      marketValueTl: product.marketValueTl,
      estimatedSellPriceTl: product.estimatedSellPriceTl,
      quantity: product.quantity,
      actualKarat: product.actualKarat,
      hasHiddenFlaw: product.hasHiddenFlaw,
      stoneValueTl: product.stoneValueTl,
      willAccept,
    });
    if (incomingCustomerId) clearIncomingCustomer(incomingCustomerId);
    setResult('sent');
  };

  const canAct = isSale ? result === null : tested && !measuring && result === null;
  const fullPriceShortfall = Math.max(0, product.marketValueTl - cashTl);

  // Bölüm 5/9: kâr analizi sadece sarrafiye (gerçek ayarı kesin bilinen)
  // kalemlerde gösterilir — işçilikli üründe gerçek ayar Uzman Görüşü'yle
  // açığa çıkana kadar belirsiz, yanıltıcı bir kâr rakamı göstermemek için.
  const showKarAnalizi = !isSale && product.category !== 'iscilikli';
  // Bölüm 4.2: Piyasa Sezgisi — satış modunda müşteriye ne kadar iyi
  // satabileceğini (Fırsat Skoru) pazarlığa girmeden gösterir.
  const showFirsatSkoru = isSale && piyasaSezgisiLevel > 0;
  const firsatSkoru = showFirsatSkoru
    ? calculateOpportunityScore(product.marketValueTl, product.marketValueTl * customer.acceptanceThreshold, 'positive')
    : 0;
  const estimatedResaleTl =
    equivalentGrams(product.grams, product.karat) *
    (product.quantity ?? 1) *
    (goldPrice.buyPricePerGram + wholesalerSellMarginTlPerGram);

  if (result) {
    return (
      <NegotiationResult
        result={result}
        isSale={isSale}
        offerAmount={offer}
        borrowedTl={borrowedTl}
        customerName={customer.name}
        productName={product.name}
        hasBrokerDeal={!isSale && borrowedTl > 0 && brokerDeal !== null}
        onResolveBrokerDeal={resolveBrokerDeal}
        onClose={onClose}
      />
    );
  }

  return (
    <View style={styles.stack}>
      <CustomerNoteCard customer={customer} patienceRatio={patienceRatio} />
      <NegotiationProductCard product={product} uzmanGorusuLevel={uzmanGorusuLevel} />
      {showFirsatSkoru && (
        <View style={styles.scoreRow}>
          <Badge tone="positive" label={`Fırsat Skoru: ${firsatSkoru}/100`} />
        </View>
      )}

      {!isSale && (
        <>
          <ScalePanel
            reading={reading}
            tested={tested}
            measuring={measuring}
            held={held}
            onTare={handleTare}
            onHold={handleHold}
            onTest={handleTest}
          />
          {!tested && <Text style={styles.hint}>Teklif vermeden önce ürünü tart — TEST'e bas.</Text>}
        </>
      )}

      <PriceBlock
        marketValueTl={product.marketValueTl}
        min={sliderMin}
        max={sliderMax}
        value={offer}
        onChange={setOffer}
        disabled={!canAct}
        cashLimited={cashLimited}
      />

      {!isSale && (
        <OfferPresets
          disabled={!canAct}
          presets={[
            {
              key: 'olucu',
              label: 'Ölücü',
              sublabel: `%${Math.round(OFFER_PRESET_OLUCU_RATIO * 100)}`,
              onPress: () => setOffer(clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_OLUCU_RATIO))),
            },
            {
              key: 'makul',
              label: 'Makul',
              sublabel: `%${Math.round(OFFER_PRESET_MAKUL_RATIO * 100)}`,
              onPress: () => setOffer(clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_MAKUL_RATIO))),
            },
            {
              key: 'comert',
              label: 'Cömert',
              sublabel: `%${Math.round(OFFER_PRESET_COMERT_RATIO * 100)}`,
              onPress: () => setOffer(clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_COMERT_RATIO))),
            },
          ]}
        />
      )}

      {showKarAnalizi && <KarAnaliziCard offerTl={offer} estimatedResaleTl={estimatedResaleTl} />}

      {isSale ? (
        <SaleActions
          disabled={!canAct}
          onOfferPrice={() => resolveSale(offer)}
          onReject={() => {
            resolveIncomingCustomer(false);
            setResult('rejected');
          }}
          rejectionHint={
            saleRejectionCount > 0
              ? `Müşteri bu fiyatı çok yüksek buldu. Kalan hakkın: ${SALE_REJECTION_ATTEMPTS - saleRejectionCount}.`
              : undefined
          }
        />
      ) : (
        <NegotiationActions
          disabled={!canAct}
          onSendOffer={() => resolveOffer(offer)}
          onPayFull={() => completeDeal(product.marketValueTl)}
          onReject={() => {
            if (incomingCustomerId) clearIncomingCustomer(incomingCustomerId);
            setResult('rejected');
          }}
          payFullHint={
            fullPriceShortfall > 0 ? `Nakdin yetmiyor — ${formatTl(fullPriceShortfall)} borç alınacak` : undefined
          }
        />
      )}
    </View>
  );
}

function NegotiationResult({
  result,
  isSale,
  offerAmount,
  borrowedTl,
  customerName,
  productName,
  hasBrokerDeal,
  onResolveBrokerDeal,
  onClose,
}: {
  result: 'accepted' | 'rejected' | 'creditDenied' | 'timedOut' | 'sent';
  isSale: boolean;
  offerAmount: number;
  borrowedTl: number;
  customerName: string;
  productName: string;
  hasBrokerDeal: boolean;
  onResolveBrokerDeal: () => { saleValueTl: number; profitTl: number } | null;
  onClose: () => void;
}) {
  const [brokerOutcome, setBrokerOutcome] = useState<{ profitTl: number } | null>(null);
  const [brokerResolved, setBrokerResolved] = useState(false);
  const accepted = result === 'accepted';
  const badgeColor =
    result === 'accepted'
      ? colors.positive
      : result === 'creditDenied'
        ? colors.warning
        : result === 'sent'
          ? colors.accent
          : colors.negative;
  const title =
    result === 'accepted'
      ? isSale
        ? 'Satıldı'
        : 'Teklif kabul edildi'
      : result === 'creditDenied'
        ? 'Toptancı kredi vermedi'
        : result === 'timedOut'
          ? 'Süre doldu'
          : result === 'sent'
            ? 'Teklif gönderildi'
            : isSale
              ? 'Satış olmadı'
              : 'Teklif reddedildi';
  const subtitle =
    result === 'accepted'
      ? isSale
        ? `${customerName}, ${formatTl(offerAmount)} karşılığında ${productName.toLowerCase()} satın aldı.`
        : `${customerName}, ${formatTl(offerAmount)} karşılığında ${productName.toLowerCase()} bıraktı.`
      : result === 'creditDenied'
        ? 'Toptancı Güvenin çok düşük olduğu için borç vermiyorlar. Önce nakit biriktir ya da borcunu öde.'
        : result === 'timedOut'
          ? `${customerName} sabrını yitirip dükkândan ayrıldı.`
          : result === 'sent'
            ? `${customerName}, ${formatTl(offerAmount)} teklifini değerlendiriyor. Sonucu Müşteriler sekmesinden takip edebilirsin.`
            : isSale
              ? `${customerName} alışveriş yapmadan dükkândan ayrıldı.`
              : `${customerName} teklifi düşük buldu ve dükkândan ayrıldı.`;

  return (
    <View style={styles.resultContainer}>
      <View style={[styles.resultBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.resultBadgeLabel}>
          {result === 'accepted' ? '✓' : result === 'creditDenied' ? '!' : result === 'sent' ? '…' : '✕'}
        </Text>
      </View>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultSubtitle}>{subtitle}</Text>
      {accepted && borrowedTl > 0 && (
        <Text style={styles.borrowedNote}>Kasadaki nakit yetmediği için {formatTl(borrowedTl)} borca yazıldı.</Text>
      )}
      {accepted && hasBrokerDeal && !brokerResolved && (
        <>
          <Text style={styles.brokerHint}>
            Toptancı Bağlantısı açık: az önce aldığını hemen toptancıya devredip kesin kâr cebe atabilirsin.
          </Text>
          <Pressable
            style={styles.brokerButton}
            onPress={() => {
              const outcome = onResolveBrokerDeal();
              setBrokerResolved(true);
              if (outcome) setBrokerOutcome(outcome);
            }}
          >
            <Text style={styles.brokerButtonLabel}>Toptancıya Hemen Sat</Text>
          </Pressable>
        </>
      )}
      {brokerOutcome && (
        <Text style={styles.brokerOutcomeNote}>
          Toptancıya devredildi: +{formatTl(brokerOutcome.profitTl)} kâr cebe girdi.
        </Text>
      )}
      <Pressable style={styles.resultButton} onPress={onClose}>
        <Text style={styles.resultButtonLabel}>Devam Et</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  scoreRow: {
    marginTop: -6,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMutedOnDark,
    textAlign: 'center',
    marginTop: -6,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  resultBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultBadgeLabel: {
    fontFamily: fonts.headingBold,
    fontSize: 28,
    color: colors.white,
  },
  resultTitle: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.inkOnDark,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  borrowedNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 10,
  },
  brokerHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMutedOnDark,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
  },
  brokerButton: {
    marginTop: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  brokerButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  brokerOutcomeNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.positive,
    textAlign: 'center',
    marginTop: 10,
  },
  resultButton: {
    marginTop: 28,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  resultButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
});
