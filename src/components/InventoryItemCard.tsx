import { StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { RingIcon } from './icons/RingIcon';

// Kasam / Vitrin: salt gösterim takı satırı — tek tek pazarlıkla
// satılmıyor, kendi kâr potansiyeline göre günlük pasif gelir üretiyor,
// vade (30 gün) dolunca otomatik "satılıp" vitrinden kalkıyor.
export function InventoryItemCard({
  item,
  dailyIncomeTl,
  daysRemaining,
}: {
  item: InventoryItem;
  dailyIncomeTl: number;
  daysRemaining: number;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <RingIcon size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.karat} Ayar, {item.grams.toLocaleString('tr-TR')}g
          </Text>
        </View>
        <Text style={styles.value}>{formatTl(item.costBasisTl)}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Günde ≈ {formatTl(dailyIncomeTl)}</Text>
        <Text style={styles.footerText}>Vade: {Math.max(0, daysRemaining)} gün kaldı</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.positive,
  },
});
