import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerNoteCard } from '../components/CustomerNoteCard';
import { NegotiationActions } from '../components/NegotiationActions';
import { NegotiationProductCard } from '../components/NegotiationProductCard';
import { PriceBlock } from '../components/PriceBlock';
import { SaleActions } from '../components/SaleActions';
import { ScalePanel } from '../components/ScalePanel';
import { negotiationCustomer, negotiationProduct, scaleReading } from '../data/mockNegotiation';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';

type Result = 'accepted' | 'rejected' | 'creditDenied' | 'timedOut' | 'sent' | null;

const MEASURE_DURATION_MS = 900;
// Bölüm 7: Soğukkanlı ve Güler Yüz bu süreyi uzatır.
const NEGOTIATION_BASE_SECONDS = 60;
const SOGUKKANLI_SECONDS_PER_LEVEL = 15;
const GULER_YUZ_SECONDS_PER_LEVEL = 10;
// Bölüm 7: Sıkı Pazarlıkçı kabul eşiğini düşürür (Sv.1 %5 → Sv.5 %25).
const SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL = 0.05;
// Bölüm 7: Ölücü teklif tabanını daha da aşağı çeker.
const OLUCU_MIN_RATIO_REDUCTION_PER_LEVEL = 0.04;
const OLUCU_AGGRESSIVE_OFFER_RATIO = 0.65;
const OLUCU_REPUTATION_PENALTY_PER_LEVEL = 2;
const SIKI_PAZARLIKCI_REPUTATION_PENALTY = 1;

// Bölüm 4.3: Pazarlık Ekranı — en detaylı tasarlanmış ekran. Adım 3'te
// fonksiyonel hale getirildi, sonrasında gerçek nakit/borç etkisi,
// route parametreleri ve Bölüm 7 yetenek etkileri eklendi.
export function PazarlikScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Pazarlik'>>();

  const mode = route.params?.mode ?? 'alis';
  const isSale = mode === 'satis';
  const customer = route.params?.customer ?? negotiationCustomer;
  const product = route.params?.product ?? negotiationProduct;
  const reading = route.params?.scaleReading ?? scaleReading;
  const incomingCustomerId = route.params?.incomingCustomerId;

  const cashTl = useGameStore((s) => s.capital.cashTl);
  const settleDeal = useGameStore((s) => s.settleDeal);
  const sendPendingOffer = useGameStore((s) => s.sendPendingOffer);
  const resolveIncomingCustomer = useGameStore((s) => s.resolveIncomingCustomer);
  const clearIncomingCustomer = useGameStore((s) => s.clearIncomingCustomer);
  const adjustReputation = useGameStore((s) => s.adjustReputation);
  const skillLevels = useGameStore((s) => s.skillLevels);

  const sikiPazarlikciLevel = skillLevels['siki-pazarlikci'] ?? 0;
  const oluluLevel = skillLevels['olucu'] ?? 0;
  const sogukkanliLevel = skillLevels['sogukkanli'] ?? 0;
  const gulerYuzLevel = skillLevels['guler-yuz'] ?? 0;

  const [tested, setTested] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [held, setHeld] = useState(false);
  const measureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSeconds =
    NEGOTIATION_BASE_SECONDS +
    sogukkanliLevel * SOGUKKANLI_SECONDS_PER_LEVEL +
    gulerYuzLevel * GULER_YUZ_SECONDS_PER_LEVEL;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  // Satış modunda (dükkândan müşteriye) nakit sınırı yok — istediğin fiyatı
  // isteyebilirsin, tavan/taban sadece piyasa değerine göre makul bir aralık.
  const minRatio = Math.max(0.3, 0.5 - oluluLevel * OLUCU_MIN_RATIO_REDUCTION_PER_LEVEL);
  const baseMin = isSale ? Math.round(product.marketValueTl * 0.7) : Math.round(product.marketValueTl * minRatio);
  const baseMax = isSale ? Math.round(product.marketValueTl * 1.3) : Math.round(product.marketValueTl * 0.95);
  const sliderMax = isSale ? baseMax : Math.max(1, Math.min(baseMax, Math.round(cashTl)));
  const sliderMin = Math.min(baseMin, sliderMax);
  const cashLimited = !isSale && sliderMax < baseMax;

  const [offer, setOffer] = useState(() =>
    isSale ? Math.round(product.marketValueTl) : Math.min(Math.round(product.marketValueTl * 0.85), sliderMax),
  );

  const [result, setResult] = useState<Result>(null);
  const [borrowedTl, setBorrowedTl] = useState(0);

  useEffect(() => {
    if (result !== null) return;
    if (secondsLeft <= 0) {
      if (isSale) resolveIncomingCustomer(false);
      else if (incomingCustomerId) clearIncomingCustomer(incomingCustomerId);
      setResult('timedOut');
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, result, isSale, resolveIncomingCustomer, incomingCustomerId, clearIncomingCustomer]);

  const handleTare = () => {
    if (held) return;
    if (measureTimer.current) clearTimeout(measureTimer.current);
    setMeasuring(false);
    setTested(false);
  };

  const handleHold = () => setHeld((prev) => !prev);

  const handleTest = () => {
    if (held || measuring) return;
    setMeasuring(true);
    measureTimer.current = setTimeout(() => {
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
      // Müşteri gerçekten dükkândan ayrılıyor — store'daki aktif müşteri de
      // temizlenmeli, yoksa Piyasa'da aynı müşteri asılı kalır.
      resolveIncomingCustomer(false);
      setResult('rejected');
      return;
    }
    resolveIncomingCustomer(true, amount);
    setResult('accepted');
  };

  // Bölüm 4.6: Kaydırma çubuğuyla "Teklifi Gönder" anında sonuçlanmaz —
  // müşterinin kararı zaten burada belirlenir (willAccept) ama açıklaması
  // Teklifler sekmesinde bir süre sonra gerçekleşir (bkz. sendPendingOffer).
  const resolveOffer = (amount: number) => {
    const originalThreshold = product.marketValueTl * customer.acceptanceThreshold;
    const adjustedThreshold =
      originalThreshold * (1 - sikiPazarlikciLevel * SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL);
    const willAccept = amount >= adjustedThreshold;
    setOffer(amount);

    if (willAccept) {
      // Bölüm 7: Sıkı Pazarlıkçı normalde reddedilecek bir teklifi kurtardıysa itibar hafif düşer.
      if (amount < originalThreshold && sikiPazarlikciLevel > 0) {
        adjustReputation(-SIKI_PAZARLIKCI_REPUTATION_PENALTY);
      }
      // Bölüm 7: Ölücü ile piyasa değerinin çok altında kapatılan agresif bir anlaşma itibar riski taşır.
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
      willAccept,
    });
    if (incomingCustomerId) clearIncomingCustomer(incomingCustomerId);
    setResult('sent');
  };

  const canAct = isSale ? result === null : tested && !measuring && result === null;
  const fullPriceShortfall = Math.max(0, product.marketValueTl - cashTl);
  const timerWarning = secondsLeft <= 15;

  if (result) {
    return (
      <ResultScreen
        result={result}
        isSale={isSale}
        offerAmount={offer}
        borrowedTl={borrowedTl}
        customerName={customer.name}
        productName={product.name}
        onClose={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pazarlık</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.timer, timerWarning && styles.timerWarning]}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.closeLabel}>Kapat</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CustomerNoteCard customer={customer} />
        <NegotiationProductCard product={product} />

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
            {!tested && (
              <Text style={styles.hint}>
                Teklif vermeden önce ürünü tart — TEST'e bas.
              </Text>
            )}
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

        {isSale ? (
          <SaleActions
            disabled={!canAct}
            onOfferPrice={() => resolveSale(offer)}
            onReject={() => {
              resolveIncomingCustomer(false);
              setResult('rejected');
            }}
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
              fullPriceShortfall > 0
                ? `Nakdin yetmiyor — ${formatTl(fullPriceShortfall)} borç alınacak`
                : undefined
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultScreen({
  result,
  isSale,
  offerAmount,
  borrowedTl,
  customerName,
  productName,
  onClose,
}: {
  result: 'accepted' | 'rejected' | 'creditDenied' | 'timedOut' | 'sent';
  isSale: boolean;
  offerAmount: number;
  borrowedTl: number;
  customerName: string;
  productName: string;
  onClose: () => void;
}) {
  const accepted = result === 'accepted';
  const badgeColor =
    result === 'accepted'
      ? colors.positive
      : result === 'creditDenied'
        ? colors.warning
        : result === 'sent'
          ? colors.brass
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
            ? `${customerName}, ${formatTl(offerAmount)} teklifini değerlendiriyor. Sonucu Teklifler sekmesinden takip edebilirsin.`
            : isSale
              ? `${customerName} alışveriş yapmadan dükkândan ayrıldı.`
              : `${customerName} teklifi düşük buldu ve dükkândan ayrıldı.`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.resultContainer}>
        <View style={[styles.resultBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.resultBadgeLabel}>
            {result === 'accepted' ? '✓' : result === 'creditDenied' ? '!' : result === 'sent' ? '…' : '✕'}
          </Text>
        </View>
        <Text style={styles.resultTitle}>{title}</Text>
        <Text style={styles.resultSubtitle}>{subtitle}</Text>
        {accepted && borrowedTl > 0 && (
          <Text style={styles.borrowedNote}>
            Kasadaki nakit yetmediği için {formatTl(borrowedTl)} borca yazıldı.
          </Text>
        )}
        <Pressable style={styles.resultButton} onPress={onClose}>
          <Text style={styles.resultButtonLabel}>Dükkâna Dön</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  timer: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.inkMuted,
  },
  timerWarning: {
    color: colors.negative,
  },
  closeLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: -6,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    color: colors.ink,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  borrowedNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.warning,
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
