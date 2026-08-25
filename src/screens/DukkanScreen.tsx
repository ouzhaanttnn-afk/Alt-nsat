import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveOfferSummary, type ActiveOffer } from '../components/ActiveOfferSummary';
import { AvatarInitial } from '../components/icons/AvatarInitial';
import { BellIcon } from '../components/icons/BellIcon';
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
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import type { ClockSpeed } from '../store/useGameStore';
import { MINUTES_PER_DAY, useGameStore, xpRequiredForLevel } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatGameTime, formatTl } from '../utils/format';
import type { IncomingCustomer } from '../types/incomingCustomer';

// [DÜZELTME] "Müşteriler" artık bir sekme değil, üst stack'e (RootNavigator)
// ait bir modal — header'daki zile basınca oraya gitmek için sekme
// navigasyonu + üst stack navigasyonunu birleştiren bir composite tip gerekiyor.
type DukkanNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Dükkân'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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

  // [YENİ] Header zili — Müşteriler artık sekme değil, buradan açılan bir
  // modal. Badge, TekliflerScreen'in kendi tanımladığı "bekleyen" sayısıyla
  // birebir aynı metriği kullanıyor (offers, status:'bekleyen').
  const pendingCustomerCount = useMemo(
    () => offers.filter((offer) => offer.status === 'bekleyen').length,
    [offers],
  );

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

          {/* [DÜZELTME] Hız kontrolü artık ana içerik gibi büyük bir alan
              kaplamıyor — üst HUD'a ait, tek satırlık, küçük bir kontrol.
              Aynı satırda, sağda: Müşteriler'i açan zil + bekleyen rozeti. */}
          <View style={styles.hudSpeedRow}>
            <View style={styles.hudSpeedLeftGroup}>
              <Pressable
                onPress={() => handleSpeedChange(speed === 0 ? 1 : 0)}
                style={styles.hudPauseBtn}
                hitSlop={8}
              >
                <Text style={styles.hudPauseLabel}>{speed === 0 ? '▶' : 'II'}</Text>
              </Pressable>
              <View style={styles.hudSpeedCluster}>
                <Pressable
                  onPress={() => handleSpeedChange(1)}
                  style={[styles.hudSpeedBtn, speed === 1 && styles.hudSpeedBtnActive]}
                >
                  <Text style={[styles.hudSpeedLabel, speed === 1 && styles.hudSpeedLabelActive]}>1x</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSpeedChange(2)}
                  style={[styles.hudSpeedBtn, speed === 2 && styles.hudSpeedBtnActive]}
                >
                  <Text style={[styles.hudSpeedLabel, speed === 2 && styles.hudSpeedLabelActive]}>2x</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSpeedChange(4)}
                  style={[styles.hudSpeedBtn, speed === 4 && styles.hudSpeedBtnActive]}
                >
                  <Text style={[styles.hudSpeedLabel, speed === 4 && styles.hudSpeedLabelActive]}>
                    4x{!fourXUnlocked ? '🔒' : ''}
                  </Text>
                </Pressable>
              </View>
              {fourXMinutesLeft > 0 && (
                <Text style={styles.fourXCountdown}>4x: {Math.ceil(fourXMinutesLeft)} dk</Text>
              )}
            </View>
            <Pressable
              onPress={() => navigation.navigate('Müşteriler')}
              style={styles.hudBellBtn}
              hitSlop={8}
            >
              <BellIcon color={lux.purple} size={18} />
              {pendingCustomerCount > 0 && (
                <View style={styles.hudBellBadge}>
                  <Text style={styles.hudBellBadgeLabel}>
                    {pendingCustomerCount > 9 ? '9+' : pendingCustomerCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* [DÜZELTME] Karizma/Toptancı/Piyasa/Stok/Servet/Borç artık tek,
              yatay kaydırılabilir bir HUD şeridi — yardımcı bilgi, ana
              müşteri akışının önüne geçecek kadar yer kaplamıyor. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hudStatsRow}
          >
            <HudStatChip label="KARİZMA" value={`${reputation.score}/100`} />
            <HudStatChip label="TOPTANCI" value={`${wholesalerTrust}/100`} />
            <HudStatChip label="PİYASA" value={formatTl(goldPrice.buyPricePerGram)} />
            <HudStatChip label="STOK" value={formatTl(capital.stockValueTl)} />
            <HudStatChip label="SERVET" value={formatTl(capital.cashTl + capital.stockValueTl - capital.debtTl)} />
            <HudStatChip label="BORÇ" value={formatTl(capital.debtTl)} warn={capital.debtTl > 0} />
          </ScrollView>

          {/* [DÜZELTME] Kaba dev daire buton yerine şık, yatay hap (pill) buton —
              parlama artık arkaya çizilen bir şekilden değil, butonun kendi
              shadowColor/shadowRadius/elevation değerlerinden geliyor. */}
          <Pressable
            disabled={!canCallNext}
            onPress={() => callNextCustomerToCounter()}
            style={({ pressed }) => [
              styles.callButton,
              !canCallNext && styles.callButtonDisabled,
              pressed && canCallNext && styles.callButtonPressed,
            ]}
          >
            <Text style={styles.callButtonTitle}>
              {incomingCustomer
                ? 'TEZGÂH DOLU'
                : waitingCustomers.length > 0
                  ? 'Müşteriyi Karşıla'
                  : 'Boş'}
            </Text>
            <Text style={styles.callButtonSubtitle}>Bekleyen: {waitingCustomers.length}</Text>
          </Pressable>
        </View>

        {/* [DÜZELTME] Müşteri ve isteği artık hero'nun HEMEN altında, ekranın
            en üst kısmında — oyuncu kaydırmadan önce müşteriyi görmeli. Tüm
            ikincil banner/kartlar (kısayollar, tutorial, acil kredi, 4x,
            toptancı, müşteri akını) TEZGÂH'tan SONRA geliyor. */}
        <SectionLabel>TEZGÂH</SectionLabel>
        {activeNegotiation ? (
          <NegotiationPanel incomingCustomer={activeNegotiation} onClose={() => setActiveNegotiation(null)} />
        ) : (
          <Text style={styles.emptyHint}>
            {waitingCustomers.length > 0
              ? 'Kuyrukta bekleyen müşteri var — "Müşteriyi Karşıla"ya bas.'
              : 'Şu an kuyrukta müşteri yok — birazdan biri gelecek.'}
          </Text>
        )}

        {/* ================= Fonksiyonel bölümler (mevcut sistemler) ================= */}
        {/* [DÜZELTME] Envanter/pasif gelir kısayolları artık hero'da değil —
            ana müşteri akışından sonra, ikincil bir bölüm olarak duruyor. */}
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
        {!hasCompletedTutorial && (
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialText}>
              Kuyruktaki müşteriyi "Müşteriyi Karşıla"ya basarak çağır, sonra Hassas Terazi ile
              tart ve bir fiyat teklif et. Kabul/karşı teklif/red — pazarlık burada gerçekleşir.
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

function HudStatChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.hudStatChip}>
      <Text style={styles.hudStatChipLabel}>{label}</Text>
      <Text style={[styles.hudStatChipValue, warn && styles.hudStatChipValueWarn]} numberOfLines={1}>
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
    padding: 12,
    gap: 6,
  },

  // ---------- HERO ----------
  // [DÜZELTME] Aşırı dikey boşluklar (padding/gap) daraltıldı — amaç: Kasa,
  // Piyasa, Stok Özeti ve Tezgâha Al butonunun mümkün olduğunca kaydırmadan
  // görünmesi.
  hero: {
    backgroundColor: lux.panelBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: lux.gold,
    padding: 8,
    gap: 6,
    shadowColor: lux.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lux.glassStrong,
    borderWidth: 1,
    borderColor: lux.gold,
  },
  levelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  shieldBadge: {
    width: 24,
    height: 26,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  balanceText: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: lux.ink,
  },
  // [DÜZELTME] Hız kontrolü artık üst HUD'un parçası — tek satırlık, küçük.
  // Play/pause ayrı büyük bir buton değil, ufak bir daire; 1x/2x/4x tek bir
  // ince hap içinde. Amaç: hız kontrolü ana içerikmiş gibi görünmesin.
  hudSpeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudSpeedLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // [YENİ] Müşteriler artık sekme değil — bu zil header'daki tek erişim
  // noktası. Rozet, TekliflerScreen'in "bekleyen" sayısını yansıtır.
  hudBellBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: lux.glassStrong,
    borderWidth: 1,
    borderColor: lux.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudBellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.negative,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: lux.panelBg,
  },
  hudBellBadgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.white,
  },
  hudPauseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: lux.purple,
    borderWidth: 1,
    borderColor: lux.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudPauseLabel: {
    fontFamily: fonts.headingBold,
    fontSize: 10,
    color: lux.goldBright,
  },
  hudSpeedCluster: {
    flexDirection: 'row',
    backgroundColor: lux.glassStrong,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 999,
    padding: 2,
    gap: 2,
  },
  hudSpeedBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  hudSpeedBtnActive: {
    backgroundColor: lux.purple,
  },
  hudSpeedLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: lux.inkMuted,
  },
  hudSpeedLabelActive: {
    color: lux.goldBright,
  },
  // [DÜZELTME] Karizma/Toptancı/Piyasa/Stok/Servet/Borç artık tek, yatay
  // kaydırılabilir bir HUD şeridi — yardımcı bilgi, ana müşteri akışının
  // önüne geçecek kadar dikey yer kaplamıyor.
  hudStatsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  hudStatChip: {
    minWidth: 72,
    backgroundColor: lux.glass,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  hudStatChipLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 8,
    letterSpacing: 0.5,
    color: lux.inkMuted,
    textAlign: 'center',
  },
  hudStatChipValue: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    color: lux.ink,
    marginTop: 1,
    textAlign: 'center',
  },
  hudStatChipValueWarn: {
    color: colors.negative,
  },
  // [DÜZELTME] Kaba dev daire yerine şık, yatay hap (pill) buton. Parlama
  // efekti artık arkaya çizilen bir mor daireden değil, butonun kendi
  // shadowColor (mor) + elevation değerlerinden geliyor.
  callButton: {
    alignSelf: 'center',
    width: '90%',
    borderRadius: 16,
    backgroundColor: lux.gold,
    borderWidth: 2,
    borderColor: lux.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 1,
    shadowColor: lux.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  callButtonPressed: {
    backgroundColor: lux.goldDeep,
  },
  callButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0.15,
  },
  callButtonTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: '#3A2A00',
    letterSpacing: 0.4,
  },
  callButtonSubtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#4A3600',
  },
  statsRow3: {
    flexDirection: 'row',
    gap: 6,
  },
  bottomGlassCard: {
    flex: 1,
    backgroundColor: lux.glass,
    borderWidth: 1,
    borderColor: lux.gold,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  bottomCardIcon: {
    fontSize: 20,
  },
  bottomCardLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: lux.ink,
  },
  fourXCountdown: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: lux.inkMuted,
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
    padding: 10,
    gap: 4,
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
    padding: 10,
    gap: 6,
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
