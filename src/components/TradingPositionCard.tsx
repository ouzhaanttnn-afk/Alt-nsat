import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Badge } from './Badge';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';

// Kasam / Yatırım Ürünlerin: alım-satım pozisyonu — adet, maliyet
// ortalaması, güncel değer ve aradaki makastan doğan kâr/zarar.
// Kullanıcı kararı: farklı fiyatlardan yapılan alımlar tek pozisyonda
// birikip ağırlıklı ortalama maliyet üzerinden kâr hesaplanıyor.
export function TradingPositionCard({
  item,
  currentValueTl,
  onSell,
}: {
  item: InventoryItem;
  currentValueTl: number;
  onSell: () => void;
}) {
  const avgCostPerUnit = item.costBasisTl / item.quantity;
  const currentValuePerUnit = currentValueTl / item.quantity;
  const profitTl = currentValueTl - item.costBasisTl;
  const isProfit = profitTl >= 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ProductIcon category={item.category} name={item.name} size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.quantity} adet · {item.karat} Ayar, {item.grams.toLocaleString('tr-TR')}g/adet
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Ort. Maliyet</Text>
          <Text style={styles.priceValue}>{formatTl(avgCostPerUnit)}</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Güncel Değer</Text>
          <Text style={styles.priceValue}>{formatTl(currentValuePerUnit)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Badge
          tone={isProfit ? 'positive' : 'negative'}
          label={`${isProfit ? 'Kâr' : 'Zarar'}: ${isProfit ? '+' : ''}${formatTl(profitTl)}`}
        />
        <Pressable style={styles.sellButton} onPress={onSell}>
          <Text style={styles.sellButtonLabel}>Sat</Text>
        </Pressable>
      </View>
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
  priceRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  priceColumn: {
    flex: 1,
  },
  priceLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  priceValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sellButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  sellButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
});
