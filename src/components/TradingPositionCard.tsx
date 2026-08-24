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
  currentDay,
  onSell,
  onHold,
}: {
  item: InventoryItem;
  currentValueTl: number;
  /** Bölüm 4/6: kaç gündür stokta olduğunu göstermek için bugünün gün sayısı. */
  currentDay: number;
  onSell: () => void;
  /** "Beklet" — satmayı erteleme kararını görünür kılan, hafif bir dokunuş. */
  onHold?: () => void;
}) {
  const avgCostPerUnit = item.costBasisTl / item.quantity;
  const currentValuePerUnit = currentValueTl / item.quantity;
  const profitTl = currentValueTl - item.costBasisTl;
  const isProfit = profitTl >= 0;
  const daysHeld = Math.max(0, currentDay - item.acquiredDay);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ProductIcon category={item.category} name={item.name} size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} adet · {item.karat} Ayar,{' '}
            {item.grams.toLocaleString('tr-TR')}g/adet
          </Text>
          <Text style={styles.heldSince}>
            {daysHeld <= 0 ? 'Bugün alındı' : `${daysHeld} gündür stokta`}
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
        <View style={styles.buttonGroup}>
          {onHold && (
            <Pressable style={styles.holdButton} onPress={onHold}>
              <Text style={styles.holdButtonLabel}>Beklet</Text>
            </Pressable>
          )}
          <Pressable style={styles.sellButton} onPress={onSell}>
            <Text style={styles.sellButtonLabel}>Sat</Text>
          </Pressable>
        </View>
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
  heldSince: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  holdButton: {
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  holdButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkMuted,
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
