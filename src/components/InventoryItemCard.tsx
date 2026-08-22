import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { RingIcon } from './icons/RingIcon';

// Kasam: vitrindeki takı (salt gösterim) ya da elde tutulan yatırım
// altını (satış butonlu) için tek envanter satırı.
export function InventoryItemCard({
  item,
  valueTl,
  onSell,
}: {
  item: InventoryItem;
  /** Güncel değer — yatırım için canlı kurdan, takı için sabit. */
  valueTl: number;
  onSell?: () => void;
}) {
  return (
    <Card style={styles.card}>
      <RingIcon size={26} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.karat} Ayar, {item.grams.toLocaleString('tr-TR')}g
        </Text>
      </View>
      <View style={styles.valueBlock}>
        <Text style={styles.value}>{formatTl(valueTl)}</Text>
        {onSell && (
          <Pressable style={styles.sellButton} onPress={onSell}>
            <Text style={styles.sellButtonLabel}>Sat</Text>
          </Pressable>
        )}
      </View>
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
  valueBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  sellButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  sellButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.white,
  },
});
