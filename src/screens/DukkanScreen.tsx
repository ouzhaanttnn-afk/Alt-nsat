import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveOfferSummary } from '../components/ActiveOfferSummary';
import { CapitalSummary } from '../components/CapitalSummary';
import { DailyGoalCard } from '../components/DailyGoalCard';
import { GoldTicker } from '../components/GoldTicker';
import { OpportunityCard } from '../components/OpportunityCard';
import { ReputationGauge } from '../components/ReputationGauge';
import { SectionLabel } from '../components/SectionLabel';
import { activeOffer, dailyGoalSteps, todaysOpportunity } from '../data/mockHome';
import { useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';

// Bölüm 4.1: Ana Ekran — Sermaye, gün sayacı, itibar, günün hedefi,
// günün fırsatı, aktif teklif özeti, gram altın ticker.
export function DukkanScreen() {
  const capital = useGameStore((s) => s.capital);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const reputation = useGameStore((s) => s.reputation);
  const day = useGameStore((s) => s.day);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>CEPKAYNAK</Text>
            <Text style={styles.dayLabel}>Gün {day}</Text>
          </View>
          <ReputationGauge score={reputation.score} />
        </View>

        <CapitalSummary capital={capital} goldPrice={goldPrice} />
        <GoldTicker goldPrice={goldPrice} />

        <DailyGoalCard steps={dailyGoalSteps} />

        <SectionLabel>GÜNÜN FIRSATI</SectionLabel>
        <OpportunityCard opportunity={todaysOpportunity} />

        <SectionLabel>AKTİF TEKLİF</SectionLabel>
        <ActiveOfferSummary offer={activeOffer} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  wordmark: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    color: colors.accentDark,
    letterSpacing: 1,
  },
  dayLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
});
