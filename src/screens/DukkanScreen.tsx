import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveOfferSummary, type ActiveOffer } from '../components/ActiveOfferSummary';
import { AvatarInitial } from '../components/icons/AvatarInitial';
import { EMERGENCY_MICRO_LOAN_MAX_CASH_TL, EMERGENCY_MICRO_LOAN_TL } from '../config/economyConfig';
import { BrokerDealBanner } from '../components/BrokerDealBanner';
import { CapitalSummary } from '../components/CapitalSummary';
import { CustomerHypeCard } from '../components/CustomerHypeCard';
import { FourXUnlockCard } from '../components/FourXUnlockCard';
import { GoldTicker } from '../components/GoldTicker';
import { NegotiationPanel } from '../components/NegotiationPanel';
import { OFFER_STATUS_LABEL } from '../components/OfferCard';
import { SectionLabel } from '../components/SectionLabel';
import { StokOzetiCard } from '../components/StokOzetiCard';
import { WholesalerAccessBanner } from '../components/WholesalerAccessBanner';
import type { MainTabsParamList } from '../navigation/types';
import type { ClockSpeed } from '../store/useGameStore';
import { MINUTES_PER_DAY, useGameStore, xpRequiredForLevel } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatGameTime, formatTl } from '../utils/format';
import type { IncomingCustomer } from '../types/incomingCustomer';

type DukkanNavigationProp = BottomTabNavigationProp<MainTabsParamList, 'Dükkân'>;

// [YENİ] Lüks referans tasarımı (fildişi + altın çerçeve + mor ışıltı) —
// KASITLI OLARAK sadece bu ekrana özel, yerel bir palet: uygulamanın geri
// kalanının (Stok/Yetenekler/Profil/Müşteriler) mevcut lacivert/krem/altın
// kimliği (theme/colors.ts) DEĞİŞTİRİLMEDİ — bu istek yalnızca DukkanScreen
// içindi. "Hero" bölümü koyu lacivert zemin üzerinde duran, kendi içinde
// tutarlı fildişi bir panel olarak kurgulandı.
const lux = {
  panelBg: '#F6F1E8',
  panelBgSoft: 'rgba(255,255,255,0.6)',
  glass: 'rgba(255,255,255,0.55)',
  glassStrong: 'rgba(255,255,255,0.78)',
  gold: '#D4AF37',
  goldBright: '#F3D77A',
  goldDeep: '#9C7A1E',
  purple: '#5A2A82',
  purpleBright: '#8C4FD1',
  ink: '#2E2440',
  inkMuted: '#7A6F8C',
};

// Mockup birleşimi: Dükkân artık sadece sermaye/gün özeti değil — gelen
// müşteriyle pazarlık (NegotiationPanel) doğrudan burada, ayrı bir modal
// ekrana gitmeden yürüyor (bkz. Bölüm 4.1-4.3, artık tek ekranda).
export function DukkanScreen() {
  const navigation = useNavigation<DukkanNavigationProp>();
  const playerName = useGameStore((s) => s.playerName);
  const shopName = useGameStore((s) => s.shopName);
  const capital = useGameStore((s) => s.capital);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const reputation = useGameStore((s) => s.reputation);
  const inventory = useGameStore((s) => s.inventory);
  const day = useGameStore((s) => s.day);
  const minuteOfDay = useGameStore((s) => s.minuteOfDay);
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const level = useGameStore((s) => s.level);
  const totalXp = useGameStore((s) => s.totalXp);
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
  const waitingCustomers = useGameStore((s) => s.waitingCustomers);
  const callNextCustomerToCounter = useGameStore((s) => s.callNextCustomerToCounter);
  const hasCompletedTutorial = useGameStore((s) => s.hasCompletedTutorial);
  const completeTutorial = useGameStore((s) => s.completeTutorial);
  const takeEmergencyMicroLoan = useGameStore((s) => s.takeEmergencyMicroLoan);

  const currentTotalMinutes = day * MINUTES_PER_DAY + minuteOfDay;
  const brokerMinutesLeft = brokerDeal ? brokerDeal.expiresAtTotalMinutes - currentTotalMinutes : 0;

  const xpForCurrentLevel = xpRequiredForLevel(level);
  const xpForNextLevel = xpRequiredForLevel(level + 1);
  const xpProgress = Math.max(
    0,
    Math.min(1, (totalXp - xpForCurrentLevel) / Math.max(1, xpForNextLevel - xpForCurrentLevel)),
  );

  // Bölüm 6: dükkâna gelen (artık: TEZGAHA ÇAĞRILAN) müşteri belirdiğinde
  // bir kez yakalanır — pazarlık paneli kendi sonuç ekranını gösterirken
  // store'daki incomingCustomer (kabul/red/gönderildi anında) null'a dönse
  // bile panel ekranda kalmaya devam eder, oyuncu "Devam Et"e basınca kapanır.
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

  const canCallNext = !incomingCustomer && waitingCustomers.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ================= HERO — referans tasarım ================= */}
        <View style={styles.hero}>
          {/* Üst bar: avatar, seviye rozeti + XP çubuğu, kasa */}
          <View style={styles.topBar}>
            <View style={styles.avatarRing}>
              <AvatarInitial name={playerName || shopName} size={40} />
            </View>
            <View style={styles.levelGroup}>
              <View style={styles.shieldBadge}>
                <Text style={styles.shieldLabel}>{level}</Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${Math.round(xpProgress * 100)}%` }]} />
              </View>
            </View>
            <View style={styles.balancePill}>
              <Text style={styles.balanceText} numberOfLines={1}>
                {formatTl(capital.cashTl)}
              </Text>
            </View>
          </View>

          {/* 2'li küçük kartlar: Karizma + Toptancı Güveni */}
          <View style={styles.topSmallRow}>
            <View style={styles.smallGlassCard}>
              <Text style={styles.smallCardLabel}>KARİZMA</Text>
              <Text style={styles.smallCardValue}>{reputation.score}/100</Text>
            </View>
            <View style={styles.smallGlassCard}>
              <Text style={styles.smallCardLabel}>TOPTANCI GÜVENİ</Text>
              <Text style={styles.smallCardValue}>{wholesalerTrust}/100</Text>
            </View>
          </View>

          {/* Orta-üst boşluk — ileride 3D karakter/mağaza sahnesi için
              KASITLI OLARAK boş bırakıldı, sadece dekoratif ışıltı halkaları var. */}
          <View style={styles.stageArea} pointerEvents="none">
            <View style={styles.stageGlowLeft} />
            <View style={styles.stageGlowRight} />
          </View>

          {/* 4'lü dikey cam istatistik kartları */}
          <View style={styles.statsRow4}>
            <StatCardLux label="PİYASA" value={formatTl(goldPrice.buyPricePerGram)} />
            <StatCardLux label="STOK DEĞERİ" value={formatTl(capital.stockValueTl)} />
            <StatCardLux label="NET SERVET" value={formatTl(capital.cashTl + capital.stockValueTl - capital.debtTl)} />
            <StatCardLux label="BORÇ" value={formatTl(capital.debtTl)} warn={capital.debtTl > 0} />
          </View>

          {/* Dev altın buton — müşteriyi tezgaha çağırır */}
          <View style={styles.giantButtonWrap}>
            <View style={styles.giantButtonGlow} />
            <Pressable
              disabled={!canCallNext}
              onPress={() => callNextCustomerToCounter()}
              style={({ pressed }) => [
                styles.giantButton,
                !canCallNext && styles.giantButtonDisabled,
                pressed && canCallNext && styles.giantButtonPressed,
              ]}
            >
              <Text style={styles.giantButtonTitle}>
                {incomingCustomer ? 'TEZGÂH DOLU' : 'TEZGÂHA AL'}
              </Text>
              <Text style={styles.giantButtonSubtitle}>Bekleyen: {waitingCustomers.length}</Text>
            </Pressable>
          </View>

          {/* 3'lü alt cam kartlar — envanter/pasif gelir kısayolları */}
          <View style={styles.statsRow3}>
            <Pressable
              style={styles.bottomGlassCard}
              onPress={() => navigation.navigate('Stok', { scrollTo: 'iscilikli' })}
            >
              <Text style={styles.bottomCardIcon}>💎</Text>
              <Text style={styles.bottomCardLabel}>İşçilikli</Text>
            </Pressable>
            <Pressable
              style={styles.bottomGlassCard}
              onPress={() => navigation.navigate('Stok', { scrollTo: 'atolye' })}
            >
              <Text style={styles.bottomCardIcon}>⚒️</Text>
              <Text style={styles.bottomCardLabel}>Atölye</Text>
            </Pressable>
            <Pressable
              style={styles.bottomGlassCard}
              onPress={() => navigation.navigate('Stok', { scrollTo: 'yatirimlar' })}
            >
              <Text style={styles.bottomCardIcon}>🏦</Text>
              <Text style={styles.bottomCardLabel}>Yatırımlar</Text>
            </Pressable>
          </View>

          {/* Alt bar: hız kontrolü, ortadaki nokta duraklat/devam */}
          <View style={styles.bottomBar}>
            <Pressable
              onPress={() => handleSpeedChange(1)}
              style={[styles.bottomBarSpeedButton, speed === 1 && styles.bottomBarSpeedButtonActive]}
            >
              <Text style={[styles.bottomBarSpeedLabel, speed === 1 && styles.bottomBarSpeedLabelActive]}>1x</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSpeedChange(2)}
              style={[styles.bottomBarSpeedButton, speed === 2 && styles.bottomBarSpeedButtonActive]}
            >
              <Text style={[styles.bottomBarSpeedLabel, speed === 2 && styles.bottomBarSpeedLabelActive]}>2x</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSpeedChange(speed === 0 ? 1 : 0)}
              style={styles.centerDotWrap}
              hitSlop={10}
            >
              <View style={styles.centerDot}>
                <Text style={styles.centerDotLabel}>{speed === 0 ? '▶' : 'II'}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleSpeedChange(4)}
              style={[styles.bottomBarSpeedButton, speed === 4 && styles.bottomBarSpeedButtonActive]}
            >
              <Text style={[styles.bottomBarSpeedLabel, speed === 4 && styles.bottomBarSpeedLabelActive]}>
                4x{!fourXUnlocked ? ' 🔒' : ''}
              </Text>
            </Pressable>
          </View>
          {fourXMinutesLeft > 0 && (
            <Text style={styles.fourXCountdown}>4x: {Math.ceil(fourXMinutesLeft)} dk kaldı</Text>
          )}
        </View>

        {/* ================= Fonksiyonel bölümler (mevcut sistemler) ================= */}
        {!hasCompletedTutorial && (
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialText}>
              Kuyruktaki müşteriyi TEZGÂHA AL'a basarak çağır, sonra Hassas Terazi ile tart ve bir
              fiyat teklif et. Kabul/karşı teklif/red — pazarlık burada gerçekleşir.
            </Text>
            <Pressable onPress={completeTutorial} hitSlop={8}>
              <Text style={styles.tutorialDismiss}>Anladım</Text>
            </Pressable>
          </View>
        )}

        {capital.cashTl <= EMERGENCY_MICRO_LOAN_MAX_CASH_TL && (
          <View style={styles.emergencyCard}>
            <Text style={styles.emergencyText}>Kasan neredeyse boş — hiçbir işlem yapamayabilirsin.</Text>
            <Pressable style={styles.emergencyButton} onPress={takeEmergencyMicroLoan}>
              <Text style={styles.emergencyButtonLabel}>
                Acil Mikro Kredi Al · +{formatTl(EMERGENCY_MICRO_LOAN_TL)}
              </Text>
            </Pressable>
          </View>
        )}

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

        <SectionLabel>TEZGÂH</SectionLabel>
        {activeNegotiation ? (
          <NegotiationPanel incomingCustomer={activeNegotiation} onClose={() => setActiveNegotiation(null)} />
        ) : (
          <Text style={styles.emptyHint}>
            {waitingCustomers.length > 0
              ? 'Kuyrukta bekleyen müşteri var — TEZGÂHA AL\'a bas.'
              : 'Şu an kuyrukta müşteri yok — birazdan biri gelecek.'}
          </Text>
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

function StatCardLux({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.statCardLux}>
      <Text style={styles.statCardLuxLabel}>{label}</Text>
      <Text style={[styles.statCardLuxValue, warn && styles.statCardLuxValueWarn]} numberOfLines={1}>
        {value}
      </Text>
    </View>
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

  // ---------- HERO ----------
  hero: {
    backgroundColor: lux.panelBg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: lux.gold,
    padding: 14,
    gap: 14,
    shadowColor: lux.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lux.glassStrong,
    borderWidth: 1,
    borderColor: lux.gold,
  },
  levelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shieldBadge: {
    width: 26,
    height: 30,
    borderRadius: 6,
    backgroundColor: lux.purple,
    borderWidth: 1,
    borderColor: lux.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldLabel: {
    fontFamily: fonts.headingBold,
    fontSize: 12,
    color: lux.goldBright,
  },
  xpTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(90,42,130,0.15)',
    borderWidth: 1,
    borderColor: lux.gold,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: lux.purpleBright,
  },
  balancePill: {
    maxWidth: 140,
    backgroundColor: lux.glassStrong,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  balanceText: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: lux.ink,
  },
  topSmallRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smallGlassCard: {
    flex: 1,
    backgroundColor: lux.glass,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  smallCardLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: lux.inkMuted,
  },
  smallCardValue: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: lux.ink,
    marginTop: 2,
  },
  stageArea: {
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageGlowLeft: {
    position: 'absolute',
    left: -40,
    top: 10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: lux.purple,
    opacity: 0.25,
  },
  stageGlowRight: {
    position: 'absolute',
    right: -40,
    top: 10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: lux.purple,
    opacity: 0.25,
  },
  statsRow4: {
    flexDirection: 'row',
    gap: 8,
  },
  statCardLux: {
    flex: 1,
    backgroundColor: lux.glass,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statCardLuxLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 8,
    letterSpacing: 0.6,
    color: lux.inkMuted,
    textAlign: 'center',
  },
  statCardLuxValue: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    color: lux.ink,
    marginTop: 4,
    textAlign: 'center',
  },
  statCardLuxValueWarn: {
    color: colors.negative,
  },
  giantButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  giantButtonGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: lux.purpleBright,
    opacity: 0.45,
  },
  giantButton: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: lux.gold,
    borderWidth: 3,
    borderColor: lux.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: lux.goldDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
  },
  giantButtonPressed: {
    backgroundColor: lux.goldDeep,
  },
  giantButtonDisabled: {
    opacity: 0.45,
  },
  giantButtonTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: '#3A2A00',
    letterSpacing: 0.5,
  },
  giantButtonSubtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#4A3600',
  },
  statsRow3: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomGlassCard: {
    flex: 1,
    backgroundColor: lux.glass,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  bottomCardIcon: {
    fontSize: 20,
  },
  bottomCardLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: lux.ink,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: lux.glassStrong,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomBarSpeedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  bottomBarSpeedButtonActive: {
    backgroundColor: lux.purple,
  },
  bottomBarSpeedLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: lux.inkMuted,
  },
  bottomBarSpeedLabelActive: {
    color: lux.goldBright,
  },
  centerDotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: lux.purple,
    borderWidth: 2,
    borderColor: lux.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDotLabel: {
    fontFamily: fonts.headingBold,
    fontSize: 12,
    color: lux.goldBright,
  },
  fourXCountdown: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: lux.inkMuted,
    textAlign: 'center',
  },

  // ---------- Fonksiyonel bölümler (mevcut karanlık kimlik) ----------
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
  },
  tutorialCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  tutorialText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  tutorialDismiss: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.accentDark,
    alignSelf: 'flex-end',
  },
  emergencyCard: {
    backgroundColor: colors.negative,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  emergencyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  emergencyButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  emergencyButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.negative,
  },
});
