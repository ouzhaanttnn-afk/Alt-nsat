import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerNoteCard } from '../components/CustomerNoteCard';
import { NegotiationActions } from '../components/NegotiationActions';
import { NegotiationProductCard } from '../components/NegotiationProductCard';
import { PriceBlock } from '../components/PriceBlock';
import { ScalePanel } from '../components/ScalePanel';
import { negotiationCustomer, negotiationProduct, scaleReading } from '../data/mockNegotiation';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';

type Result = 'accepted' | 'rejected' | null;

const MEASURE_DURATION_MS = 900;

// Bölüm 4.3: Pazarlık Ekranı — en detaylı tasarlanmış ekran. Adım 3'te
// tam fonksiyonel hale getirildi: terazi testi zorunlu, teklif çubuğu
// canlı günceller, sonuç müşterinin kabul eşiğine göre hesaplanır.
export function PazarlikScreen() {
  const navigation = useNavigation();

  const [tested, setTested] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [held, setHeld] = useState(false);
  const measureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const min = Math.round(negotiationProduct.marketValueTl * 0.5);
  const max = Math.round(negotiationProduct.marketValueTl * 0.95);
  const [offer, setOffer] = useState(8500);

  const [result, setResult] = useState<Result>(null);

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

  const resolveOffer = (amount: number) => {
    const threshold = negotiationProduct.marketValueTl * negotiationCustomer.acceptanceThreshold;
    setOffer(amount);
    setResult(amount >= threshold ? 'accepted' : 'rejected');
  };

  const canAct = tested && !measuring && result === null;

  if (result) {
    return (
      <ResultScreen
        result={result}
        offerAmount={offer}
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
        <CustomerNoteCard customer={negotiationCustomer} />
        <NegotiationProductCard product={negotiationProduct} />

        <ScalePanel
          reading={scaleReading}
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
          marketValueTl={negotiationProduct.marketValueTl}
          min={min}
          max={max}
          value={offer}
          onChange={setOffer}
          disabled={!canAct}
        />

        <NegotiationActions
          disabled={!canAct}
          onSendOffer={() => resolveOffer(offer)}
          onPayFull={() => resolveOffer(negotiationProduct.marketValueTl)}
          onReject={() => setResult('rejected')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultScreen({
  result,
  offerAmount,
  onClose,
}: {
  result: 'accepted' | 'rejected';
  offerAmount: number;
  onClose: () => void;
}) {
  const accepted = result === 'accepted';
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.resultContainer}>
        <View
          style={[
            styles.resultBadge,
            { backgroundColor: accepted ? colors.positive : colors.negative },
          ]}
        >
          <Text style={styles.resultBadgeLabel}>{accepted ? '✓' : '✕'}</Text>
        </View>
        <Text style={styles.resultTitle}>
          {accepted ? 'Teklif kabul edildi' : 'Teklif reddedildi'}
        </Text>
        <Text style={styles.resultSubtitle}>
          {accepted
            ? `${negotiationCustomer.name}, ${formatTl(offerAmount)} karşılığında ${negotiationProduct.name.toLowerCase()} bıraktı.`
            : `${negotiationCustomer.name} teklifi düşük buldu ve dükkândan ayrıldı.`}
        </Text>
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
