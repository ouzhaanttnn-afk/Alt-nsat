import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { colors, fonts, fontSizes, radius } from '../theme';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';

// Bölüm 16: işçilikli ürün kartı — GDD'nin kesin kararı gereği burada
// "Sat" değil sadece "Erit" var; işçilikli ürün başka bir müşteriye asla
// işçilikli ürün olarak satılmıyor.
export function CraftedGoodCard({
  item,
  onMelt,
  disabled,
}: {
  item: InventoryItem;
  onMelt: () => void;
  disabled?: boolean;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ProductIcon category={item.category} name={item.name} size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.karat} Ayar (beyan), {item.grams.toLocaleString('tr-TR')}g
          </Text>
        </View>
      </View>
      <Pressable
        disabled={disabled}
        onPress={onMelt}
        style={[styles.meltButton, disabled && styles.disabled]}
      >
        <Text style={styles.meltButtonLabel}>Erit</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
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
  meltButton: {
    marginTop: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  meltButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
});
