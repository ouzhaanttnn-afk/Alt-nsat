import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { InventoryItemCard } from '../components/InventoryItemCard';
import { SectionLabel } from '../components/SectionLabel';
import { hasEquivalentGrams, TAKI_PASSIVE_INCOME_RATE_PER_DAY, useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';

// Kullanıcı kararı: takı (bilezik/yüzük/kolye) tek tek pazarlıkla
// satılmıyor — vitrine girip toplam değerinin sabit bir günlük oranı
// kadar sürekli pasif gelir üretiyor. Yatırım altını (çeyrek/gram/vb.)
// doğrudan/aktif satılabiliyor.
export function KasamScreen() {
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const sellInventoryItem = useGameStore((s) => s.sellInventoryItem);

  const vitrinItems = inventory.filter((item) => item.category === 'taki');
  const yatirimItems = inventory.filter((item) => item.category === 'yatirim');

  const vitrinValueTl = vitrinItems.reduce((sum, item) => sum + item.valueTl, 0);
  const dailyIncomeTl = vitrinValueTl * TAKI_PASSIVE_INCOME_RATE_PER_DAY;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Kasam</Text>

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
          vitrinItems.map((item) => (
            <InventoryItemCard key={item.id} item={item} valueTl={item.valueTl} />
          ))
        )}

        <SectionLabel>YATIRIM ÜRÜNLERİN</SectionLabel>
        {yatirimItems.length === 0 ? (
          <Text style={styles.emptyHint}>
            Elinde çeyrek/gram/yarım/tam gibi yatırım altını yok. Piyasa'dan alınca
            burada listelenir, istediğin an güncel kurdan satabilirsin.
          </Text>
        ) : (
          yatirimItems.map((item) => {
            const liveValueTl = hasEquivalentGrams(item) * goldPrice.buyPricePerGram;
            return (
              <InventoryItemCard
                key={item.id}
                item={item}
                valueTl={liveValueTl}
                onSell={() => sellInventoryItem(item.id)}
              />
            );
          })
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
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
});
