import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { PirlantaCard } from '../components/PirlantaCard';
import { SectionLabel } from '../components/SectionLabel';
import { TradingPositionCard } from '../components/TradingPositionCard';
import { pirlantaCatalog } from '../data/mockPirlanta';
import { currentPositionValueTl, useGameStore } from '../store/useGameStore';
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

  const [saleBanner, setSaleBanner] = useState<{ profitTl: number } | null>(null);
  const saleBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sarrafiyeItems = inventory.filter((item) => item.category !== 'pirlanta');
  const pirlantaItems = inventory.filter((item) => item.category === 'pirlanta');

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
    color: colors.ink,
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
    color: colors.inkMuted,
  },
});
