import { useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MainTabsParamList, StokScrollTarget } from '../navigation/types';
import { AtolyeCard } from '../components/AtolyeCard';
import { BrandStageCard, type BrandStageStatus } from '../components/BrandStageCard';
import { Card } from '../components/Card';
import { CraftedGoodCard } from '../components/CraftedGoodCard';
import { JewelryTierCard } from '../components/JewelryTierCard';
import { MeltingJobBanner } from '../components/MeltingJobBanner';
import { PirlantaCard } from '../components/PirlantaCard';
import { SectionLabel } from '../components/SectionLabel';
import { StockCard } from '../components/StockCard';
import { TradingPositionCard } from '../components/TradingPositionCard';
import {
  ATOLYE_GRAMS_PER_DAY_PER_LEVEL,
  ATOLYE_MAX_LEVEL,
  ATOLYE_REQUIRED_LEVEL,
  ATOLYE_UPGRADE_BASE_COST_GRAMS,
  ATOLYE_UPGRADE_COST_MULTIPLIER_PER_LEVEL,
  JEWELRY_REQUIRED_LEVEL,
  LOW_CASH_WARNING_THRESHOLD_TL,
  MINUTES_PER_DAY,
  XP_BONUS_DEAL_COMPLETED,
  XP_BONUS_PROFITABLE_SALE,
  XP_PER_EQUIVALENT_GRAM_TRADED,
} from '../config/economyConfig';
import { XpToast } from '../components/XpToast';
import { BRAND_STAGES } from '../data/brandStages';
import { JEWELRY_PIECES, JEWELRY_TIERS } from '../data/jewelryInvestments';
import { pirlantaCatalog } from '../data/mockPirlanta';
import { computeJewelryPieceDailyReturnTl, computeJewelryPiecePriceTl, isJewelrySetComplete } from '../engine/jewelry';
import { toptanciStock } from '../data/toptanciStock';
import { currentPositionValueTl, equivalentGrams, useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';

const BANNER_VISIBLE_MS = 4000;

// Bölüm 2/GDD: sarrafiye stoğu (gram/çeyrek altın + 22 ayar bilezik) tek
// tip ağırlıklı ortalama maliyetle takip edilir — vitrin vadesi/pasif
// gelir kavramı yok, hepsi güncel kurdan (mark-to-market) değerlenip
// istenen an satılabilir. Pırlanta koleksiyonu ayrı, kalıcı bir raydır.
export function KasamScreen() {
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const sellInventoryItem = useGameStore((s) => s.sellInventoryItem);
  const sellInvestmentUnits = useGameStore((s) => s.sellInvestmentUnits);
  const realizedTradingProfitTl = useGameStore((s) => s.realizedTradingProfitTl);
  const purchasePirlanta = useGameStore((s) => s.purchasePirlanta);
  const meltingJob = useGameStore((s) => s.meltingJob);
  const meltCraftedGood = useGameStore((s) => s.meltCraftedGood);
  const startCraftedGoodWorkshop = useGameStore((s) => s.startCraftedGoodWorkshop);
  const collectCraftedGoodWorkshop = useGameStore((s) => s.collectCraftedGoodWorkshop);
  const day = useGameStore((s) => s.day);
  const minuteOfDay = useGameStore((s) => s.minuteOfDay);
  const cashTl = useGameStore((s) => s.capital.cashTl);
  const debtTl = useGameStore((s) => s.capital.debtTl);
  const loanDueDay = useGameStore((s) => s.loanDueDay);
  const repayDebt = useGameStore((s) => s.repayDebt);
  const atolyeLevel = useGameStore((s) => s.atolyeLevel);
  const upgradeAtolye = useGameStore((s) => s.upgradeAtolye);
  const jewelryHoldings = useGameStore((s) => s.jewelryHoldings);
  const buyJewelryPiece = useGameStore((s) => s.buyJewelryPiece);
  const level = useGameStore((s) => s.level);
  const highestBrandStageIndex = useGameStore((s) => s.highestBrandStageIndex);
  const purchaseBrandStage = useGameStore((s) => s.purchaseBrandStage);
  const wholesalerBuyMarginTlPerGram = useGameStore((s) => s.wholesalerBuyMarginTlPerGram);
  const buyInvestmentUnits = useGameStore((s) => s.buyInvestmentUnits);
  const grantBonusXp = useGameStore((s) => s.grantBonusXp);

  const [saleBanner, setSaleBanner] = useState<{ profitTl: number } | null>(null);
  const saleBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);
  // Bölüm 4: "Beklet" — satmayı erteleme kararını görünür kılan hafif bir
  // onay; hiçbir state'i değiştirmiyor, sadece kararın alındığını teyit ediyor.
  const [holdHintItemId, setHoldHintItemId] = useState<string | null>(null);
  const [craftedFeedback, setCraftedFeedback] = useState<string | null>(null);
  const holdHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const craftedFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCraftedFeedback = (message: string) => {
    setCraftedFeedback(message);
    if (craftedFeedbackTimer.current) clearTimeout(craftedFeedbackTimer.current);
    craftedFeedbackTimer.current = setTimeout(() => setCraftedFeedback(null), 2600);
  };
  const handleHold = (itemId: string) => {
    setHoldHintItemId(itemId);
    if (holdHintTimer.current) clearTimeout(holdHintTimer.current);
    holdHintTimer.current = setTimeout(() => setHoldHintItemId(null), 1800);
  };
  const handleMeltCraftedGood = (itemId: string) => {
    const item = inventory.find((inventoryItem) => inventoryItem.id === itemId);
    if (!item) return;
    if (meltCraftedGood(itemId)) {
      showCraftedFeedback(`${item.name} eritiliyor · işçilik değeri kaybedilecek.`);
    }
  };
  const handleStartWorkshop = (itemId: string) => {
    const item = inventory.find((inventoryItem) => inventoryItem.id === itemId);
    if (!item) return;
    if (startCraftedGoodWorkshop(itemId)) {
      showCraftedFeedback(`${item.name} atölyeye gönderildi.`);
    }
  };
  const handleCollectWorkshop = (itemId: string) => {
    const item = inventory.find((inventoryItem) => inventoryItem.id === itemId);
    if (!item) return;
    if (collectCraftedGoodWorkshop(itemId)) {
      showCraftedFeedback(`${item.name} atölyeden teslim alındı · işçilik değeri arttı.`);
    }
  };

  useEffect(
    () => () => {
      if (saleBannerTimer.current) clearTimeout(saleBannerTimer.current);
      if (holdHintTimer.current) clearTimeout(holdHintTimer.current);
      if (craftedFeedbackTimer.current) clearTimeout(craftedFeedbackTimer.current);
    },
    [],
  );

  // Hızlı Erişim (Dükkân): ilgili bölüme kaydırmalı geçiş için Y konumları.
  // Stok ekranı ilk kez mount olduğunda onLayout ölçümleri scrollTo efektinden
  // sonra gelebilir — bu yüzden her yeni ölçümde layoutTick artırılıp efekt
  // tekrar denenir.
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<StokScrollTarget, number>>>({});
  const [layoutTick, setLayoutTick] = useState(0);
  const recordSectionOffset = (target: StokScrollTarget, y: number) => {
    sectionOffsets.current[target] = y;
    setLayoutTick((v) => v + 1);
  };
  const route = useRoute<RouteProp<MainTabsParamList, 'Stok'>>();
  const scrollTo = route.params?.scrollTo;
  useEffect(() => {
    if (!scrollTo) return;
    const y = sectionOffsets.current[scrollTo];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  }, [scrollTo, layoutTick]);

  const sarrafiyeItems = inventory.filter((item) => item.category !== 'pirlanta' && item.category !== 'iscilikli');
  const sarrafiyeCurrentValueTl = sarrafiyeItems.reduce(
    (sum, item) => sum + currentPositionValueTl(item, goldPrice.buyPricePerGram),
    0,
  );
  const sarrafiyeCostBasisTl = sarrafiyeItems.reduce((sum, item) => sum + item.costBasisTl, 0);
  const unrealizedTradingProfitTl = sarrafiyeCurrentValueTl - sarrafiyeCostBasisTl;
  const craftedGoodItems = inventory.filter((item) => item.category === 'iscilikli');
  const pirlantaItems = inventory.filter((item) => item.category === 'pirlanta');
  const meltingMinutesLeft = meltingJob
    ? meltingJob.completesAtTotalMinutes - (day * MINUTES_PER_DAY + minuteOfDay)
    : 0;
  const atolyeLocked = level < ATOLYE_REQUIRED_LEVEL;
  const atolyeUpgradeCostTl =
    atolyeLevel >= ATOLYE_MAX_LEVEL
      ? null
      : ATOLYE_UPGRADE_BASE_COST_GRAMS *
        goldPrice.buyPricePerGram *
        Math.pow(ATOLYE_UPGRADE_COST_MULTIPLIER_PER_LEVEL, atolyeLevel);
  const jewelryLocked = level < JEWELRY_REQUIRED_LEVEL;

  const handleSell = (itemId: string) => {
    const result = sellInventoryItem(itemId);
    if (!result) return;
    setSaleBanner({ profitTl: result.profitTl });
    if (saleBannerTimer.current) clearTimeout(saleBannerTimer.current);
    saleBannerTimer.current = setTimeout(() => setSaleBanner(null), BANNER_VISIBLE_MS);

    // Bölüm 6 (STOK→SATIŞ→KÂR): satış gerçekten kâr getirdiyse "Kârlı satış"
    // bonusu, getirmediyse yine de tamamlanmış bir işlem bonusu — oyuncu
    // XP'nin nereden geldiğini her zaman görür.
    const bonus =
      result.profitTl > 0
        ? { amount: XP_BONUS_PROFITABLE_SALE, reason: 'Kârlı satış' }
        : { amount: XP_BONUS_DEAL_COMPLETED, reason: 'Müşteri işlemi tamamlandı' };
    grantBonusXp(bonus.amount);
    setXpToast({ amount: result.xpGained + bonus.amount, reason: bonus.reason });
  };
  const handleSellQuantity = (itemId: string, quantity: number) => {
    const item = inventory.find((inventoryItem) => inventoryItem.id === itemId);
    if (!item) return;
    const result = sellInvestmentUnits(itemId, quantity);
    if (!result) return;
    setSaleBanner({ profitTl: result.profitTl });
    if (saleBannerTimer.current) clearTimeout(saleBannerTimer.current);
    saleBannerTimer.current = setTimeout(() => setSaleBanner(null), BANNER_VISIBLE_MS);

    const bonus =
      result.profitTl > 0
        ? { amount: XP_BONUS_PROFITABLE_SALE, reason: 'Kârlı kısmi satış' }
        : { amount: XP_BONUS_DEAL_COMPLETED, reason: 'Kısmi satış tamamlandı' };
    grantBonusXp(bonus.amount);
    const baseXp = equivalentGrams(item.grams, item.karat) * result.quantity * XP_PER_EQUIVALENT_GRAM_TRADED;
    setXpToast({ amount: baseXp + bonus.amount, reason: bonus.reason });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Stok</Text>

        <Card>
          <View style={styles.cashDebtHeader}>
            <View>
              <Text style={styles.summaryLabel}>Nakit</Text>
              <Text style={[styles.cashValue, cashTl < LOW_CASH_WARNING_THRESHOLD_TL && styles.warningText]}>
                {formatTl(cashTl)}
              </Text>
            </View>
            <View style={styles.debtBlock}>
              <Text style={styles.summaryLabel}>Borç</Text>
              <Text style={[styles.cashValue, debtTl > 0 && styles.debtText]}>{formatTl(debtTl)}</Text>
            </View>
          </View>
          {debtTl > 0 && (
            <View style={styles.debtActionRow}>
              <Text style={styles.summaryHintMuted}>
                {loanDueDay !== null ? `Vade: Gün ${loanDueDay}` : 'Vade yok'} · ödeme nakitten düşer.
              </Text>
              <Pressable
                disabled={cashTl <= 0}
                style={[styles.debtPayButton, cashTl <= 0 && styles.disabledButton]}
                onPress={() => repayDebt(debtTl)}
              >
                <Text style={styles.debtPayButtonLabel}>Öde</Text>
              </Pressable>
            </View>
          )}
        </Card>

        <SectionLabel>TOPTANCIDAN STOK AL</SectionLabel>
        {toptanciStock.map((spec) => {
          const ownedItem = inventory.find(
            (item) =>
              item.category === spec.category &&
              item.name === spec.name &&
              item.karat === spec.karat &&
              item.grams === spec.grams,
          );
          return (
            <StockCard
              key={spec.id}
              spec={spec}
              goldPrice={goldPrice}
              wholesalerBuyMarginTlPerGram={wholesalerBuyMarginTlPerGram}
              cashTl={cashTl}
              ownedItem={ownedItem}
              onBuy={(quantity) => buyInvestmentUnits(spec, quantity)}
            />
          );
        })}

        {saleBanner && (
          <View
            style={[
              styles.banner,
              { backgroundColor: saleBanner.profitTl >= 0 ? colors.positive : colors.negative },
            ]}
          >
            <Text style={styles.bannerText}>
              Satış tamamlandı: {saleBanner.profitTl >= 0 ? '+' : ''}
              {formatTl(saleBanner.profitTl)} {saleBanner.profitTl >= 0 ? 'kâr' : 'zarar'}
            </Text>
          </View>
        )}
        {xpToast && (
          <XpToast amount={xpToast.amount} reason={xpToast.reason} onDone={() => setXpToast(null)} />
        )}

        <SectionLabel>SARRAFİYE STOĞUN</SectionLabel>
        <Card>
          <Text style={styles.summaryLabel}>Toplam Alım-Satım Kârı</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: realizedTradingProfitTl >= 0 ? colors.positive : colors.negative },
            ]}
          >
            {realizedTradingProfitTl >= 0 ? '+' : ''}
            {formatTl(realizedTradingProfitTl)}
          </Text>
          <Text style={styles.summaryHintMuted}>Alış ve satış fiyatın arasındaki makastan gelir.</Text>
          <View style={styles.divider} />
          <Text style={styles.summaryLabel}>Stok Potansiyeli</Text>
          <Text
            style={[
              styles.summaryValueSmall,
              { color: unrealizedTradingProfitTl >= 0 ? colors.positive : colors.negative },
            ]}
          >
            {unrealizedTradingProfitTl >= 0 ? '+' : ''}
            {formatTl(unrealizedTradingProfitTl)}
          </Text>
          <Text style={styles.summaryHintMuted}>
            Henüz gerçekleşmedi · stok satılırsa nakde döner.
          </Text>
        </Card>

        {sarrafiyeItems.length === 0 ? (
          <Text style={styles.emptyHint}>
            Elinde henüz gram/çeyrek altın ya da bilezik yok. Piyasa'daki Toptancıdan Stok Al
            bölümünden alınca burada listelenir, güncel kurdan istediğin an satabilirsin.
          </Text>
        ) : (
          sarrafiyeItems.map((item) => (
            <View key={item.id}>
              <TradingPositionCard
                item={item}
                currentValueTl={currentPositionValueTl(item, goldPrice.buyPricePerGram)}
                currentDay={day}
                onSell={() => handleSell(item.id)}
                onSellQuantity={(quantity) => handleSellQuantity(item.id, quantity)}
                onHold={() => handleHold(item.id)}
              />
              {holdHintItemId === item.id && (
                <Text style={styles.holdHint}>Stokta bekletiliyor — piyasa değişince tekrar bakabilirsin.</Text>
              )}
            </View>
          ))
        )}

        <View
          style={styles.sectionAnchor}
          onLayout={(e) => recordSectionOffset('iscilikli', e.nativeEvent.layout.y)}
        >
          <SectionLabel>İŞÇİLİKLİ ÜRÜNLER</SectionLabel>
          <Text style={styles.emptyHint}>
            Müşteriden gelen kolye/yüzük/küpe gibi parçalar. Erit hızlı likidite sağlar; Atölye
            zamanla işçilik değerini artırır.
          </Text>
          {craftedFeedback && <Text style={styles.craftedFeedback}>{craftedFeedback}</Text>}
          {meltingJob && <MeltingJobBanner job={meltingJob} minutesLeft={meltingMinutesLeft} />}
          {craftedGoodItems.length === 0 ? (
            <Text style={styles.emptyHint}>Elinde henüz eritilecek işçilikli ürün yok.</Text>
          ) : (
            craftedGoodItems.map((item) => (
              <CraftedGoodCard
                key={item.id}
                item={item}
                buyPricePerGram={goldPrice.buyPricePerGram}
                meltDisabled={meltingJob !== null}
                workshopLocked={atolyeLocked}
                workshopDisabled={false}
                requiredLevel={ATOLYE_REQUIRED_LEVEL}
                holdActive={holdHintItemId === item.id}
                onHold={() => handleHold(item.id)}
                onMelt={() => handleMeltCraftedGood(item.id)}
                onStartWorkshop={() => handleStartWorkshop(item.id)}
                onCollectWorkshop={() => handleCollectWorkshop(item.id)}
              />
            ))
          )}
        </View>

        <View
          style={styles.sectionAnchor}
          onLayout={(e) => recordSectionOffset('atolye', e.nativeEvent.layout.y)}
        >
          <SectionLabel>ATÖLYE</SectionLabel>
          <AtolyeCard
            level={atolyeLevel}
            maxLevel={ATOLYE_MAX_LEVEL}
            gramsPerDay={atolyeLevel * ATOLYE_GRAMS_PER_DAY_PER_LEVEL}
            upgradeCostTl={atolyeUpgradeCostTl}
            canAfford={atolyeUpgradeCostTl !== null && atolyeUpgradeCostTl <= cashTl}
            locked={atolyeLocked}
            requiredLevel={ATOLYE_REQUIRED_LEVEL}
            onUpgrade={upgradeAtolye}
          />
        </View>

        <View
          style={styles.sectionAnchor}
          onLayout={(e) => recordSectionOffset('yatirimlar', e.nativeEvent.layout.y)}
        >
        <SectionLabel>TAKI YATIRIMI</SectionLabel>
        <Text style={styles.emptyHint}>
          Anapara kilidi/vade yok — her ayar kademesindeki 4 parçayı (Kolye/Yüzük/Küpe/Bileklik)
          tek tek satın al, kalıcı günlük TL getiri kazan. Bir kademedeki 4 parçanın tamamı
          tamamlanınca o kademenin getirisine +%10 Set Bonusu eklenir.
        </Text>
        {JEWELRY_TIERS.map((tier) => {
          const piecePriceTl = computeJewelryPiecePriceTl(tier.id, goldPrice.buyPricePerGram);
          return (
            <JewelryTierCard
              key={tier.id}
              tier={tier}
              pieces={JEWELRY_PIECES}
              ownedPieces={Object.fromEntries(
                JEWELRY_PIECES.map((p) => [p.id, !!jewelryHoldings[`${tier.id}.${p.id}`]]),
              )}
              piecePriceTl={piecePriceTl}
              pieceDailyReturnTl={computeJewelryPieceDailyReturnTl(tier.id, goldPrice.buyPricePerGram)}
              hasSetBonus={isJewelrySetComplete(jewelryHoldings, tier.id)}
              canAfford={piecePriceTl <= cashTl}
              locked={jewelryLocked}
              requiredLevel={JEWELRY_REQUIRED_LEVEL}
              onBuyPiece={(pieceId) => buyJewelryPiece(tier.id, pieceId as (typeof JEWELRY_PIECES)[number]['id'])}
            />
          );
        })}

        <SectionLabel>PIRLANTA KOLEKSİYONU</SectionLabel>
        <Text style={styles.emptyHint}>
          Gerçek para ile edinilen kalıcı vitrin parçaları — vadesi yok, sonsuza kadar sabit gelir üretir.
        </Text>
        {pirlantaItems.map((item) => (
          <PirlantaCard
            key={item.id}
            name={item.name}
            karat={item.karat}
            grams={item.grams}
            dailyIncomeTl={(item.dailyIncomeTl ?? 0) * item.quantity}
            priceLabel={item.realMoneyPriceLabel ?? ''}
            owned
            quantity={item.quantity}
          />
        ))}
        {pirlantaCatalog.map((catalogItem) => (
          <PirlantaCard
            key={catalogItem.id}
            name={catalogItem.name}
            karat={catalogItem.karat}
            grams={catalogItem.grams}
            dailyIncomeTl={catalogItem.dailyIncomeTl}
            priceLabel={catalogItem.priceLabel}
            owned={false}
            onBuy={() => purchasePirlanta(catalogItem)}
          />
        ))}

        <SectionLabel>KURUMSAL MARKA</SectionLabel>
        <Text style={styles.emptyHint}>
          Uç oyun merdiveni — Şubeleşme → Marka Yönetimi → Kurumsallaşma sırayla açılır, her
          kademe seviye + nakit gerektirir ve kalıcı bir günlük gelir katar.
        </Text>
        {BRAND_STAGES.map((stage, index) => {
          const status: BrandStageStatus =
            index <= highestBrandStageIndex
              ? 'owned'
              : index !== highestBrandStageIndex + 1
                ? 'sequence-locked'
                : level < stage.requiredLevel
                  ? 'level-locked'
                  : 'available';
          return (
            <BrandStageCard
              key={stage.id}
              stage={stage}
              status={status}
              canAfford={stage.costTl <= cashTl}
              onPurchase={() => purchaseBrandStage(stage.id)}
            />
          );
        })}
        </View>
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
  // Hızlı Erişim'in kaydırdığı bölümleri saran view — dıştaki ScrollView
  // içeriğinin gap'ini kendi içinde de koruması için aynı gap tekrarlanır.
  sectionAnchor: {
    gap: 14,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.inkOnDark,
  },
  banner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bannerText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
    textAlign: 'center',
  },
  summaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  summaryValue: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginTop: 4,
  },
  summaryHintMuted: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: 4,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
  },
  holdHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMutedOnDark,
    marginTop: 6,
    textAlign: 'center',
  },
  summaryValueSmall: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    color: colors.ink,
    marginTop: 4,
  },
  cashDebtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  cashValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.lg,
    color: colors.ink,
    marginTop: 2,
  },
  debtBlock: {
    alignItems: 'flex-end',
  },
  debtText: {
    color: colors.negative,
  },
  warningText: {
    color: colors.warning,
  },
  debtActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  debtPayButton: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  disabledButton: {
    opacity: 0.45,
  },
  debtPayButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  craftedFeedback: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.accent,
    textAlign: 'center',
  },
});
