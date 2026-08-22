import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerNoteCard } from '../components/CustomerNoteCard';
import { NegotiationActions } from '../components/NegotiationActions';
import { NegotiationProductCard } from '../components/NegotiationProductCard';
import { PriceBlock } from '../components/PriceBlock';
import { ScalePanel } from '../components/ScalePanel';
import { negotiationCustomer, negotiationProduct, scaleReading } from '../data/mockNegotiation';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';

type Result = 'accepted' | 'rejected' | 'creditDenied' | null;

const MEASURE_DURATION_MS = 900;

// Bölüm 4.3: Pazarlık Ekranı — en detaylı tasarlanmış ekran. Adım 3'te
// fonksiyonel hale getirildi, sonrasında gerçek nakit/borç etkisi ve
// route parametreleriyle farklı senaryoları (ör. Piyasa'daki büyük
// parti) destekleyecek şekilde genelleştirildi.
export function PazarlikScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Pazarlik'>>();

  const customer = route.params?.customer ?? negotiationCustomer;
  const product = route.params?.product ?? negotiationProduct;
  const reading = route.params?.scaleReading ?? scaleReading;
  const listingId = route.params?.listingId;

  const cashTl = useGameStore((s) => s.capital.cashTl);
  const settleDeal = useGameStore((s) => s.settleDeal);
  const removeMarketListing = useGameStore((s) => s.removeMarketListing);

  const [tested, setTested] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [held, setHeld] = useState(false);
  const measureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseMin = Math.round(product.marketValueTl * 0.5);
  const baseMax = Math.round(product.marketValueTl * 0.95);
  const sliderMax = Math.max(1, Math.min(baseMax, Math.round(cashTl)));
  const sliderMin = Math.min(baseMin, sliderMax);
  const cashLimited = sliderMax < baseMax;

  const [offer, setOffer] = useState(() => Math.min(Math.round(product.marketValueTl * 0.85), sliderMax));

  const [result, setResult] = useState<Result>(null);
  const [borrowedTl, setBorrowedTl] = useState(0);

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
    });
    setOffer(amount);
    if (!outcome.success) {
      setResult('creditDenied');
      return;
    }
    setBorrowedTl(outcome.borrowedTl);
    setResult('accepted');
    if (listingId) removeMarketListing(listingId);
  };

  const resolveOffer = (amount: number) => {
    const threshold = product.marketValueTl * customer.acceptanceThreshold;
    setOffer(amount);
    if (amount >= threshold) {
      completeDeal(amount);
    } else {
      setResult('rejected');
    }
  };

  const canAct = tested && !measuring && result === null;
  const fullPriceShortfall = Math.max(0, product.marketValueTl - cashTl);

  if (result) {
    return (
      <ResultScreen
        result={result}
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
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.closeLabel}>Kapat</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CustomerNoteCard customer={customer} />
        <NegotiationProductCard product={product} />

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

        <PriceBlock
          marketValueTl={product.marketValueTl}
          min={sliderMin}
          max={sliderMax}
          value={offer}
          onChange={setOffer}
          disabled={!canAct}
          cashLimited={cashLimited}
        />

        <NegotiationActions
          disabled={!canAct}
          onSendOffer={() => resolveOffer(offer)}
          onPayFull={() => completeDeal(product.marketValueTl)}
          onReject={() => setResult('rejected')}
          payFullHint={
            fullPriceShortfall > 0
              ? `Nakdin yetmiyor — ${formatTl(fullPriceShortfall)} borç alınacak`
              : undefined
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultScreen({
  result,
  offerAmount,
  borrowedTl,
  customerName,
  productName,
  onClose,
}: {
  result: 'accepted' | 'rejected' | 'creditDenied';
  offerAmount: number;
  borrowedTl: number;
  customerName: string;
  productName: string;
  onClose: () => void;
}) {
  const accepted = result === 'accepted';
  const badgeColor =
    result === 'accepted' ? colors.positive : result === 'creditDenied' ? colors.warning : colors.negative;
  const title =
    result === 'accepted'
      ? 'Teklif kabul edildi'
      : result === 'creditDenied'
        ? 'Toptancı kredi vermedi'
        : 'Teklif reddedildi';
  const subtitle =
    result === 'accepted'
      ? `${customerName}, ${formatTl(offerAmount)} karşılığında ${productName.toLowerCase()} bıraktı.`
      : result === 'creditDenied'
        ? 'Toptancı Güvenin çok düşük olduğu için borç vermiyorlar. Önce nakit biriktir ya da borcunu öde.'
        : `${customerName} teklifi düşük buldu ve dükkândan ayrıldı.`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.resultContainer}>
        <View style={[styles.resultBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.resultBadgeLabel}>
            {result === 'accepted' ? '✓' : result === 'creditDenied' ? '!' : '✕'}
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
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    color: colors.ink,
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
