import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveOfferSummary, type ActiveOffer } from '../components/ActiveOfferSummary';
import { CapitalSummary } from '../components/CapitalSummary';
import { DailyGoalCard } from '../components/DailyGoalCard';
import { GoldTicker } from '../components/GoldTicker';
import { JumpEventBanner } from '../components/JumpEventBanner';
import { OFFER_STATUS_LABEL } from '../components/OfferCard';
import { OpportunityCard } from '../components/OpportunityCard';
import { ReputationGauge } from '../components/ReputationGauge';
import { SectionLabel } from '../components/SectionLabel';
import { SpeedControl } from '../components/SpeedControl';
import { dailyGoalSteps, todaysOpportunity } from '../data/mockHome';
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { useGameStore, type JumpEvent } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatGameTime } from '../utils/format';

const JUMP_BANNER_VISIBLE_MS = 4000;

// Ana ekrandan Teklifler gibi kardeş sekmelere de, Pazarlık gibi üstteki
// modal Stack ekranına da gidebilmek için birleşik gezinme tipi.
type DukkanNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Dükkân'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Bölüm 4.1: Ana Ekran — Sermaye, gün sayacı, itibar, günün hedefi,
// günün fırsatı, aktif teklif özeti, gram altın ticker, zaman hızı kontrolü.
export function DukkanScreen() {
  const navigation = useNavigation<DukkanNavigationProp>();
  const capital = useGameStore((s) => s.capital);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const reputation = useGameStore((s) => s.reputation);
  const day = useGameStore((s) => s.day);
  const minuteOfDay = useGameStore((s) => s.minuteOfDay);
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const lastJumpEvent = useGameStore((s) => s.lastJumpEvent);
  const wholesalerTrust = useGameStore((s) => s.wholesalerTrust);
  const loanDueDay = useGameStore((s) => s.loanDueDay);
  const repayDebt = useGameStore((s) => s.repayDebt);
  const offers = useGameStore((s) => s.offers);
  const hasPiyasaSezgisi = useGameStore((s) => (s.skillLevels['piyasa-sezgisi'] ?? 0) > 0);

  // En son gönderilen bekleyen teklif öncelikli gösterilir; bekleyen yoksa
  // en son sonuçlanan teklif gösterilir (offers dizisi en yeniden en eskiye sıralı).
  const activeOffer: ActiveOffer | null = useMemo(() => {
    const source = offers.find((offer) => offer.status === 'bekleyen') ?? offers[0] ?? null;
    if (!source) return null;
    return {
      customerName: source.customerName,
      productName: `${source.productName} — ${source.karat} Ayar`,
      offerAmountTl: source.offerAmountTl,
      status: OFFER_STATUS_LABEL[source.status],
    };
  }, [offers]);

  const [visibleJump, setVisibleJump] = useState<JumpEvent | null>(null);
  const seenJumpRef = useRef<JumpEvent | null>(null);

  useEffect(() => {
    if (lastJumpEvent && lastJumpEvent !== seenJumpRef.current) {
      seenJumpRef.current = lastJumpEvent;
      setVisibleJump(lastJumpEvent);
      const timer = setTimeout(() => setVisibleJump(null), JUMP_BANNER_VISIBLE_MS);
      return () => clearTimeout(timer);
    }
  }, [lastJumpEvent]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>CEPKAYNAK</Text>
            <Text style={styles.dayLabel}>
              Gün {day} · {formatGameTime(minuteOfDay)}
            </Text>
          </View>
          <ReputationGauge score={reputation.score} />
        </View>

        <View style={styles.speedRow}>
          <SpeedControl speed={speed} onChange={setSpeed} />
        </View>

        {visibleJump && <JumpEventBanner event={visibleJump} />}

        <CapitalSummary
          capital={capital}
          goldPrice={goldPrice}
          wholesalerTrust={wholesalerTrust}
          loanDueDay={loanDueDay}
          currentDay={day}
          onRepayDebt={() => repayDebt(capital.cashTl)}
        />
        <GoldTicker goldPrice={goldPrice} />

        <DailyGoalCard steps={dailyGoalSteps} />

        <SectionLabel>GÜNÜN FIRSATI</SectionLabel>
        <OpportunityCard opportunity={todaysOpportunity} scoreVisible={hasPiyasaSezgisi} />

        {activeOffer && (
          <>
            <SectionLabel>AKTİF TEKLİF</SectionLabel>
            <ActiveOfferSummary offer={activeOffer} onContinue={() => navigation.navigate('Teklifler')} />
          </>
        )}
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
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
