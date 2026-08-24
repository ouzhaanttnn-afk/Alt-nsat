import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveOfferSummary, type ActiveOffer } from '../components/ActiveOfferSummary';
import { BrokerDealBanner } from '../components/BrokerDealBanner';
import { CapitalSummary } from '../components/CapitalSummary';
import { CustomerHypeCard } from '../components/CustomerHypeCard';
import { FourXUnlockCard } from '../components/FourXUnlockCard';
import { GoldTicker } from '../components/GoldTicker';
import { NegotiationPanel } from '../components/NegotiationPanel';
import { OFFER_STATUS_LABEL } from '../components/OfferCard';
import { QuickStatsRow } from '../components/QuickStatsRow';
import { SectionLabel } from '../components/SectionLabel';
import { ShopNameHeader } from '../components/ShopNameHeader';
import { SpeedControl } from '../components/SpeedControl';
import { StokOzetiCard } from '../components/StokOzetiCard';
import { WholesalerAccessBanner } from '../components/WholesalerAccessBanner';
import type { MainTabsParamList } from '../navigation/types';
import type { ClockSpeed } from '../store/useGameStore';
import { MINUTES_PER_DAY, useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatGameTime } from '../utils/format';
import type { IncomingCustomer } from '../types/incomingCustomer';

type DukkanNavigationProp = BottomTabNavigationProp<MainTabsParamList, 'Dükkân'>;

// Mockup birleşimi: Dükkân artık sadece sermaye/gün özeti değil — gelen
// müşteriyle pazarlık (NegotiationPanel) doğrudan burada, ayrı bir modal
// ekrana gitmeden yürüyor (bkz. Bölüm 4.1-4.3, artık tek ekranda).
export function DukkanScreen() {
  const navigation = useNavigation<DukkanNavigationProp>();
  const shopName = useGameStore((s) => s.shopName);
  const setShopName = useGameStore((s) => s.setShopName);
  const capital = useGameStore((s) => s.capital);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const reputation = useGameStore((s) => s.reputation);
  const inventory = useGameStore((s) => s.inventory);
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
  const customerHypeUntilMs = useGameStore((s) => s.customerHypeUntilMs);
  const watchAdForCustomerHype = useGameStore((s) => s.watchAdForCustomerHype);
  const incomingCustomer = useGameStore((s) => s.incomingCustomer);

  const currentTotalMinutes = day * MINUTES_PER_DAY + minuteOfDay;
  const brokerMinutesLeft = brokerDeal ? brokerDeal.expiresAtTotalMinutes - currentTotalMinutes : 0;

  // Bölüm 6: dükkâna gelen müşteri belirdiğinde bir kez yakalanır — pazarlık
  // paneli kendi sonuç ekranını gösterirken store'daki incomingCustomer
  // (kabul/red/gönderildi anında) null'a dönse bile panel ekranda kalmaya
  // devam eder, oyuncu "Devam Et"e basınca kapanır.
  const [activeNegotiation, setActiveNegotiation] = useState<IncomingCustomer | null>(null);
  useEffect(() => {
    if (incomingCustomer && !activeNegotiation) {
      setActiveNegotiation(incomingCustomer);
    }
  }, [incomingCustomer, activeNegotiation]);

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

  const customerHypeActive = customerHypeUntilMs !== null && customerHypeUntilMs > nowMs;
  const customerHypeMinutesLeft = customerHypeActive ? Math.max(0, (customerHypeUntilMs! - nowMs) / 60000) : 0;

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
          <ShopNameHeader name={shopName} onChange={setShopName} />
          <Text style={styles.dayLabel}>
            Gün {day} · {formatGameTime(minuteOfDay)}
          </Text>
        </View>

        <QuickStatsRow
          cashTl={capital.cashTl}
          buyPricePerGram={goldPrice.buyPricePerGram}
          reputationScore={reputation.score}
        />

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

        <WholesalerAccessBanner
          onBuy={() => navigation.navigate('Stok')}
          onSell={() => navigation.navigate('Stok')}
        />

        <CustomerHypeCard
          active={customerHypeActive}
          minutesLeft={customerHypeMinutesLeft}
          onWatchAd={watchAdForCustomerHype}
        />

        <SectionLabel>MÜŞTERİ</SectionLabel>
        {activeNegotiation ? (
          <NegotiationPanel incomingCustomer={activeNegotiation} onClose={() => setActiveNegotiation(null)} />
        ) : (
          <Text style={styles.emptyHint}>Şu an dükkânda müşteri yok — birazdan biri gelecek.</Text>
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

        <StokOzetiCard items={inventory} onSeeAll={() => navigation.navigate('Stok')} />

        {activeOffer && (
          <>
            <SectionLabel>AKTİF TEKLİF</SectionLabel>
            <ActiveOfferSummary offer={activeOffer} onContinue={() => navigation.navigate('Müşteriler')} />
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
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
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
    color: colors.inkMutedOnDark,
    marginBottom: 4,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
  },
});
