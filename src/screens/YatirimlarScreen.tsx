import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoldTicker } from '../components/GoldTicker';
import { InvestmentExchangeCard } from '../components/InvestmentExchangeCard';
import { SectionLabel } from '../components/SectionLabel';
import { investmentProducts } from '../data/investmentProducts';
import { useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';

const BANNER_VISIBLE_MS = 3000;

// Bölüm 4.5: Yatırımlar — basılı yatırım altını (gram/çeyrek/yarım/tam/
// ata lira) için pazarlıksız, her an açık borsa masası. Piyasa'daki tek
// seferlik fırsatlardan farklı olarak burada ürün hiç tükenmez; güncel
// ALIŞ/SATIŞ kurundan istenen adette anında alım-satım yapılır, borç/kredi
// yok — sadece nakit yettiği kadar alınabilir.
export function YatirimlarScreen() {
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const cashTl = useGameStore((s) => s.capital.cashTl);
  const buyInvestmentUnits = useGameStore((s) => s.buyInvestmentUnits);
  const sellInvestmentUnits = useGameStore((s) => s.sellInvestmentUnits);

  const [banner, setBanner] = useState<{ text: string; positive: boolean } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = (text: string, positive: boolean) => {
    setBanner({ text, positive });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), BANNER_VISIBLE_MS);
  };

  const handleBuy = (productName: string, spec: { name: string; karat: number; grams: number }, quantity: number) => {
    const result = buyInvestmentUnits(spec, quantity);
    if (!result.success) {
      showBanner('Nakit yetersiz.', false);
      return;
    }
    showBanner(`${quantity} adet ${productName} alındı.`, true);
  };

  const handleSell = (productName: string, itemId: string, quantity: number) => {
    const result = sellInvestmentUnits(itemId, quantity);
    if (!result) return;
    showBanner(
      `${result.quantity} adet ${productName} satıldı: ${result.profitTl >= 0 ? '+' : ''}${formatTl(result.profitTl)}`,
      result.profitTl >= 0,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Yatırımlar</Text>
        <Text style={styles.subtitle}>
          Basılı yatırım altını burada pazarlıksız — güncel kurdan, istediğin adette anında al-sat.
        </Text>

        {banner && (
          <View
            style={[styles.banner, { backgroundColor: banner.positive ? colors.positive : colors.negative }]}
          >
            <Text style={styles.bannerText}>{banner.text}</Text>
          </View>
        )}

        <GoldTicker goldPrice={goldPrice} />

        <SectionLabel>BORSA MASASI</SectionLabel>
        {investmentProducts.map((spec) => {
          const ownedItem = inventory.find(
            (item) =>
              item.category === 'yatirim' &&
              item.name === spec.name &&
              item.karat === spec.karat &&
              item.grams === spec.grams,
          );
          return (
            <InvestmentExchangeCard
              key={spec.id}
              spec={spec}
              goldPrice={goldPrice}
              cashTl={cashTl}
              ownedItem={ownedItem}
              onBuy={(quantity) => handleBuy(spec.name, spec, quantity)}
              onSell={(quantity) => ownedItem && handleSell(spec.name, ownedItem.id, quantity)}
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
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: -8,
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
});
