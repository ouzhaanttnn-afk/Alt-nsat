import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { FilterTabs } from '../components/FilterTabs';
import { OpportunityCard, type OpportunitySource } from '../components/OpportunityCard';
import { bulkLotCustomer, bulkLotProduct, bulkLotScaleReading } from '../data/mockBulkLot';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { calculateOpportunityScore } from '../utils/opportunityScore';
import { opportunityToNegotiation } from '../utils/opportunityToNegotiation';

type SourceFilter = OpportunitySource | 'hepsi';

const FILTER_OPTIONS: { label: string; value: SourceFilter }[] = [
  { label: 'Tümü', value: 'hepsi' },
  { label: 'Toptancı', value: 'toptanci' },
  { label: 'Bozdurma', value: 'bozdurma' },
];

// Bölüm 4.2: Piyasa — toptancı + müşteri bozdurma fırsatları birleşik
// tek liste, Fırsat Skoru'na göre sıralı (yüksekten düşüğe). Her karta
// dokunmak Pazarlık Ekranı'nı açar; kabul edilen fırsat listeden kalkar.
export function PiyasaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const marketListings = useGameStore((s) => s.marketListings);
  const [filter, setFilter] = useState<SourceFilter>('hepsi');

  const sortedOpportunities = useMemo(() => {
    return [...marketListings]
      .filter((item) => filter === 'hepsi' || item.sourceType === filter)
      .sort((a, b) => {
        const scoreA = calculateOpportunityScore(a.buyPriceTl, a.estimatedSellPriceTl, a.expertiseRisk.tone);
        const scoreB = calculateOpportunityScore(b.buyPriceTl, b.estimatedSellPriceTl, b.expertiseRisk.tone);
        return scoreB - scoreA;
      });
  }, [marketListings, filter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Piyasa</Text>
          <Text style={styles.subtitle}>Toptancı ve bozdurma fırsatları, Fırsat Skoru'na göre sıralı</Text>
        </View>

        <Pressable
          onPress={() =>
            navigation.navigate('Pazarlik', {
              customer: bulkLotCustomer,
              product: bulkLotProduct,
              scaleReading: bulkLotScaleReading,
            })
          }
        >
          <Card style={styles.bulkCard}>
            <View style={styles.bulkTag}>
              <Text style={styles.bulkTagLabel}>BÜYÜK PARTİ</Text>
            </View>
            <Text style={styles.bulkTitle}>{bulkLotProduct.name}</Text>
            <Text style={styles.bulkSubtitle}>
              {bulkLotProduct.source} · Piyasa değeri ≈ {formatTl(bulkLotProduct.marketValueTl)}
            </Text>
            <Text style={styles.bulkHint}>
              Bu kadar nakdin yoksa düşük teklif vermek ya da borç almak zorunda kalabilirsin.
            </Text>
          </Card>
        </Pressable>

        <FilterTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        {sortedOpportunities.length === 0 && (
          <Text style={styles.emptyHint}>
            Şu an piyasada başka fırsat yok — mevcutları satın aldın.
          </Text>
        )}

        {sortedOpportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            onPress={() => {
              const negotiation = opportunityToNegotiation(opportunity);
              navigation.navigate('Pazarlik', { ...negotiation, listingId: opportunity.id });
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  header: {
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  bulkCard: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  bulkTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  bulkTagLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.white,
  },
  bulkTitle: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  bulkSubtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  bulkHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 8,
  },
});
