import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterTabs } from '../components/FilterTabs';
import { OpportunityCard, type OpportunitySource } from '../components/OpportunityCard';
import { marketOpportunities } from '../data/mockMarket';
import { colors, fonts, fontSizes } from '../theme';
import { calculateOpportunityScore } from '../utils/opportunityScore';

type SourceFilter = OpportunitySource | 'hepsi';

const FILTER_OPTIONS: { label: string; value: SourceFilter }[] = [
  { label: 'Tümü', value: 'hepsi' },
  { label: 'Toptancı', value: 'toptanci' },
  { label: 'Bozdurma', value: 'bozdurma' },
];

// Bölüm 4.2: Piyasa — toptancı + müşteri bozdurma fırsatları birleşik
// tek liste, Fırsat Skoru'na göre sıralı (yüksekten düşüğe).
export function PiyasaScreen() {
  const [filter, setFilter] = useState<SourceFilter>('hepsi');

  const sortedOpportunities = useMemo(() => {
    return [...marketOpportunities]
      .filter((item) => filter === 'hepsi' || item.sourceType === filter)
      .sort((a, b) => {
        const scoreA = calculateOpportunityScore(a.buyPriceTl, a.estimatedSellPriceTl, a.expertiseRisk.tone);
        const scoreB = calculateOpportunityScore(b.buyPriceTl, b.estimatedSellPriceTl, b.expertiseRisk.tone);
        return scoreB - scoreA;
      });
  }, [filter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Piyasa</Text>
          <Text style={styles.subtitle}>Toptancı ve bozdurma fırsatları, Fırsat Skoru'na göre sıralı</Text>
        </View>

        <FilterTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        {sortedOpportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.productName + opportunity.source} opportunity={opportunity} />
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
});
