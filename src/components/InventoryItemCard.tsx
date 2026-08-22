import { StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { RingIcon } from './icons/RingIcon';

// Kasam / Vitrin: salt gösterim takı satırı — tek tek pazarlıkla
// satılmıyor, toplam değeri pasif gelir üretiyor (bkz. KasamScreen).
export function InventoryItemCard({ item }: { item: InventoryItem }) {
  return (
    <Card style={styles.card}>
      <RingIcon size={26} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.quantity > 1 ? `${item.quantity} adet · ` : ''}
          {item.karat} Ayar, {item.grams.toLocaleString('tr-TR')}g{item.quantity > 1 ? '/adet' : ''}
        </Text>
      </View>
      <Text style={styles.value}>{formatTl(item.costBasisTl)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 1,
  },
  value: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
});
