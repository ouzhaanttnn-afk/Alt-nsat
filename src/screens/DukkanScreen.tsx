import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveOfferSummary, type ActiveOffer } from '../components/ActiveOfferSummary';
import { BrokerDealBanner } from '../components/BrokerDealBanner';
import { CapitalSummary } from '../components/CapitalSummary';
import { DailyGoalCard } from '../components/DailyGoalCard';
import { FourXUnlockCard } from '../components/FourXUnlockCard';
import { GoldTicker } from '../components/GoldTicker';
import { OFFER_STATUS_LABEL } from '../components/OfferCard';
import { ReputationGauge } from '../components/ReputationGauge';
import { SectionLabel } from '../components/SectionLabel';
import { SpeedControl } from '../components/SpeedControl';
import type { ClockSpeed } from '../store/useGameStore';
import { dailyGoalSteps } from '../data/mockHome';
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { MINUTES_PER_DAY, useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatGameTime } from '../utils/format';

// Ana ekrandan Teklifler gibi kardeş sekmelere de, Pazarlık gibi üstteki
// modal Stack ekranına da gidebilmek için birleşik gezinme tipi.
type DukkanNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Dükkân'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Bölüm 4.1: Ana Ekran — Sermaye, gün sayacı, itibar, günün hedefi,
// aktif teklif özeti, gram altın ticker, zaman hızı kontrolü.
export function DukkanScreen() {
  const navigation = useNavigation<DukkanNavigationProp>();
  const capital = useGameStore((s) => s.capital);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const reputation = useGameStore((s) => s.reputation);
  const day = useGameStore((s) => s.day);
  const minuteOfDay = useGameStore((s) => s.minuteOfDay);
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const wholesalerTrust = useGameStore((s) => s.wholesalerTrust);
  const loanDueDay = useGameStore((s) => s.loanDueDay);
  const repayDebt = useGameStore((s) => s.repayDebt);
  const offers = useGameStore((s) => s.offers);
  const brokerDeal = useGameStore((s) => s.brokerDeal);
  const resolveBrokerDeal = useGameStore((s) => s.resolveBrokerDeal);
  const fourXUnlockedUntilMs = useGameStore((s) => s.fourXUnlockedUntilMs);
  const fourXUnlimited = useGameStore((s) => s.fourXUnlimited);
  const unlockFourXViaAd = useGameStore((s) => s.unlockFourXViaAd);
  const purchaseFourXUnlimited = useGameStore((s) => s.purchaseFourXUnlimited);

  const currentTotalMinutes = day * MINUTES_PER_DAY + minuteOfDay;
  const brokerMinutesLeft = brokerDeal ? brokerDeal.expiresAtTotalMinutes - currentTotalMinutes : 0;

  // Bölüm 22: 4x'in reklamla açılan penceresi GERÇEK DÜNYA süresiyle
  // ölçülür (oyun saatiyle değil) — canlı geri sayım için ayrı, saniyede
  // bir tetiklenen bir saat gerekiyor.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const fourXUnlocked = fourXUnlimited || (fourXUnlockedUntilMs !== null && fourXUnlockedUntilMs > nowMs);
  const fourXMinutesLeft =
    !fourXUnlimited && fourXUnlockedUntilMs !== null ? Math.max(0, (fourXUnlockedUntilMs - nowMs) / 60000) : 0;

  const [showFourXOffer, setShowFourXOffer] = useState(false);
  const handleSpeedChange = (nextSpeed: ClockSpeed) => {
    const applied = setSpeed(nextSpeed);
    setShowFourXOffer(nextSpeed === 4 && !applied);
  };

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
          <View style={styles.speedColumn}>
            {fourXMinutesLeft > 0 && (
              <Text style={styles.fourXCountdown}>4x: {Math.ceil(fourXMinutesLeft)} dk kaldı</Text>
            )}
            <SpeedControl speed={speed} onChange={handleSpeedChange} fourXLocked={!fourXUnlocked} />
          </View>
        </View>

        {showFourXOffer && (
          <FourXUnlockCard
            onWatchAd={() => {
              unlockFourXViaAd();
              setSpeed(4);
              setShowFourXOffer(false);
            }}
            onBuyUnlimited={() => {
              purchaseFourXUnlimited();
              setSpeed(4);
              setShowFourXOffer(false);
            }}
          />
        )}

        {brokerDeal && brokerMinutesLeft > 0 && (
          <BrokerDealBanner minutesLeft={brokerMinutesLeft} onResolve={() => resolveBrokerDeal()} />
        )}

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
  speedColumn: {
    alignItems: 'flex-end',
  },
  fourXCountdown: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
    marginBottom: 4,
  },
});
