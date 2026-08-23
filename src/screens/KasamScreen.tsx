import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtolyeCard } from '../components/AtolyeCard';
import { BrandStageCard, type BrandStageStatus } from '../components/BrandStageCard';
import { Card } from '../components/Card';
import { CraftedGoodCard } from '../components/CraftedGoodCard';
import { MeltingJobBanner } from '../components/MeltingJobBanner';
import { PirlantaCard } from '../components/PirlantaCard';
import { SectionLabel } from '../components/SectionLabel';
import { TakiPackageCard } from '../components/TakiPackageCard';
import { TradingPositionCard } from '../components/TradingPositionCard';
import { ATOLYE_GRAMS_PER_DAY_PER_LEVEL, ATOLYE_MAX_LEVEL, ATOLYE_UPGRADE_BASE_COST_TL, ATOLYE_UPGRADE_COST_MULTIPLIER_PER_LEVEL } from '../config/economyConfig';
import { BRAND_STAGES } from '../data/brandStages';
import { pirlantaCatalog } from '../data/mockPirlanta';
import { TAKI_PACKAGE_TIERS } from '../data/takiPackageTiers';
import { currentPositionValueTl, MINUTES_PER_DAY, useGameStore } from '../store/useGameStore';
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
  const realizedTradingProfitTl = useGameStore((s) => s.realizedTradingProfitTl);
  const purchasePirlanta = useGameStore((s) => s.purchasePirlanta);
  const meltingJob = useGameStore((s) => s.meltingJob);
  const meltCraftedGood = useGameStore((s) => s.meltCraftedGood);
  const day = useGameStore((s) => s.day);
  const minuteOfDay = useGameStore((s) => s.minuteOfDay);
  const cashTl = useGameStore((s) => s.capital.cashTl);
  const atolyeLevel = useGameStore((s) => s.atolyeLevel);
  const upgradeAtolye = useGameStore((s) => s.upgradeAtolye);
  const takiPackages = useGameStore((s) => s.takiPackages);
  const startTakiPackage = useGameStore((s) => s.startTakiPackage);
  const level = useGameStore((s) => s.level);
  const highestBrandStageIndex = useGameStore((s) => s.highestBrandStageIndex);
  const purchaseBrandStage = useGameStore((s) => s.purchaseBrandStage);

  const [saleBanner, setSaleBanner] = useState<{ profitTl: number } | null>(null);
  const saleBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sarrafiyeItems = inventory.filter((item) => item.category !== 'pirlanta' && item.category !== 'iscilikli');
  const craftedGoodItems = inventory.filter((item) => item.category === 'iscilikli');
  const pirlantaItems = inventory.filter((item) => item.category === 'pirlanta');
  const meltingMinutesLeft = meltingJob
    ? meltingJob.completesAtTotalMinutes - (day * MINUTES_PER_DAY + minuteOfDay)
    : 0;
  const atolyeUpgradeCostTl =
    atolyeLevel >= ATOLYE_MAX_LEVEL
      ? null
      : ATOLYE_UPGRADE_BASE_COST_TL * Math.pow(ATOLYE_UPGRADE_COST_MULTIPLIER_PER_LEVEL, atolyeLevel);
  const activeTierIds = new Set(takiPackages.map((p) => p.tierId));
  const hasFullTakiSet = TAKI_PACKAGE_TIERS.every((t) => activeTierIds.has(t.id));

  const handleSell = (itemId: string) => {
    const result = sellInventoryItem(itemId);
    if (!result) return;
    setSaleBanner({ profitTl: result.profitTl });
    if (saleBannerTimer.current) clearTimeout(saleBannerTimer.current);
    saleBannerTimer.current = setTimeout(() => setSaleBanner(null), BANNER_VISIBLE_MS);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Kasam</Text>

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
        </Card>

        {sarrafiyeItems.length === 0 ? (
          <Text style={styles.emptyHint}>
            Elinde henüz gram/çeyrek altın ya da bilezik yok. Piyasa'daki Toptancıdan Stok Al
            bölümünden alınca burada listelenir, güncel kurdan istediğin an satabilirsin.
          </Text>
        ) : (
          sarrafiyeItems.map((item) => (
            <TradingPositionCard
              key={item.id}
              item={item}
              currentValueTl={currentPositionValueTl(item, goldPrice.buyPricePerGram)}
              onSell={() => handleSell(item.id)}
            />
          ))
        )}

        <SectionLabel>İŞÇİLİKLİ ÜRÜNLER (ERİTİLECEK)</SectionLabel>
        <Text style={styles.emptyHint}>
          Müşteriden bozdurma yoluyla gelen kolye/yüzük/küpe gibi parçalar — GDD kararı gereği
          başka bir müşteriye asla işçilikli ürün olarak satılmaz, tek çıkış yolu eritmek.
        </Text>
        {meltingJob && <MeltingJobBanner job={meltingJob} minutesLeft={meltingMinutesLeft} />}
        {craftedGoodItems.length === 0 ? (
          <Text style={styles.emptyHint}>Elinde henüz eritilecek işçilikli ürün yok.</Text>
        ) : (
          craftedGoodItems.map((item) => (
            <CraftedGoodCard
              key={item.id}
              item={item}
              disabled={meltingJob !== null}
              onMelt={() => meltCraftedGood(item.id)}
            />
          ))
        )}

        <SectionLabel>ATÖLYE</SectionLabel>
        <AtolyeCard
          level={atolyeLevel}
          maxLevel={ATOLYE_MAX_LEVEL}
          gramsPerDay={atolyeLevel * ATOLYE_GRAMS_PER_DAY_PER_LEVEL}
          upgradeCostTl={atolyeUpgradeCostTl}
          canAfford={atolyeUpgradeCostTl !== null && atolyeUpgradeCostTl <= cashTl}
          onUpgrade={upgradeAtolye}
        />

        <SectionLabel>TAKI YATIRIM PAKETLERİ</SectionLabel>
        <Text style={styles.emptyHint}>
          30 gün kilitli, sabit günlük getiri + vade sonunda anapara iadesi. Dört ayar kademesinin
          tümü aynı anda aktifse toplam getiriye %10 set bonusu eklenir.
        </Text>
        {TAKI_PACKAGE_TIERS.map((tier) => {
          const activePackage = takiPackages.find((p) => p.tierId === tier.id);
          return (
            <TakiPackageCard
              key={tier.id}
              tier={tier}
              active={!!activePackage}
              daysLeft={activePackage ? activePackage.maturesDay - day : 0}
              hasSetBonus={hasFullTakiSet}
              canAfford={tier.principalTl <= cashTl}
              onStart={() => startTakiPackage(tier.id)}
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
});
