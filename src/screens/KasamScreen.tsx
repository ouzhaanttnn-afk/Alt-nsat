import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { InventoryItemCard } from '../components/InventoryItemCard';
import { SectionLabel } from '../components/SectionLabel';
import { TradingPositionCard } from '../components/TradingPositionCard';
import { currentPositionValueTl, TAKI_PASSIVE_INCOME_RATE_PER_DAY, useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';

const SALE_BANNER_VISIBLE_MS = 4000;

// Kullanıcı kararı: takı (bilezik/yüzük/kolye) tek tek pazarlıkla
// satılmıyor — vitrine girip toplam değerinin sabit bir günlük oranı
// kadar sürekli pasif gelir üretiyor. Yatırım altını (çeyrek/gram/vb.)
// doğrudan/aktif satılabiliyor; farklı fiyatlardan yapılan alımlar tek
// pozisyonda ağırlıklı ortalama maliyetle birikip alış-satış makasından
// gerçek kâr/zarar hesaplanıyor.
export function KasamScreen() {
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const sellInventoryItem = useGameStore((s) => s.sellInventoryItem);
  const realizedTradingProfitTl = useGameStore((s) => s.realizedTradingProfitTl);

  const [saleBanner, setSaleBanner] = useState<{ profitTl: number } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
  }, []);

  const vitrinItems = inventory.filter((item) => item.category === 'taki');
  const yatirimItems = inventory.filter((item) => item.category === 'yatirim');

  const vitrinValueTl = vitrinItems.reduce((sum, item) => sum + item.costBasisTl, 0);
  const dailyIncomeTl = vitrinValueTl * TAKI_PASSIVE_INCOME_RATE_PER_DAY;

  const handleSell = (itemId: string) => {
    const result = sellInventoryItem(itemId);
    if (!result) return;
    setSaleBanner({ profitTl: result.profitTl });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setSaleBanner(null), SALE_BANNER_VISIBLE_MS);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Kasam</Text>

        {saleBanner && (
          <View
            style={[
              styles.saleBanner,
              { backgroundColor: saleBanner.profitTl >= 0 ? colors.positive : colors.negative },
            ]}
          >
            <Text style={styles.saleBannerText}>
              Satış tamamlandı: {saleBanner.profitTl >= 0 ? '+' : ''}
              {formatTl(saleBanner.profitTl)} {saleBanner.profitTl >= 0 ? 'kâr' : 'zarar'}
            </Text>
          </View>
        )}

        <SectionLabel>VİTRİN</SectionLabel>
        <Card>
          <Text style={styles.summaryLabel}>Vitrin Değeri</Text>
          <Text style={styles.summaryValue}>{formatTl(vitrinValueTl)}</Text>
          <Text style={styles.summaryHint}>
            Günde ≈ {formatTl(dailyIncomeTl)} pasif gelir üretiyor
          </Text>
        </Card>

        {vitrinItems.length === 0 ? (
          <Text style={styles.emptyHint}>
            Vitrinde henüz takı yok. Piyasa'dan bilezik/yüzük/kolye gibi ürünler alınca
            burada birikip pasif gelir üretmeye başlar.
          </Text>
        ) : (
          vitrinItems.map((item) => <InventoryItemCard key={item.id} item={item} />)
        )}

        <SectionLabel>YATIRIM ÜRÜNLERİN</SectionLabel>
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

        {yatirimItems.length === 0 ? (
          <Text style={styles.emptyHint}>
            Elinde çeyrek/gram/yarım/tam gibi yatırım altını yok. Piyasa'dan alınca
            burada listelenir, istediğin an güncel kurdan satabilirsin.
          </Text>
        ) : (
          yatirimItems.map((item) => (
            <TradingPositionCard
              key={item.id}
              item={item}
              currentValueTl={currentPositionValueTl(item, goldPrice.buyPricePerGram)}
              onSell={() => handleSell(item.id)}
            />
          ))
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
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  saleBanner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  saleBannerText: {
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
  summaryHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.positive,
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
