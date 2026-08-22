import { StyleSheet, Text, View } from 'react-native';
import type { CapitalState, GoldPriceState } from '../types/game';
import { colors, fonts, fontSizes } from '../theme';
import { formatGram, formatPercent, formatTl } from '../utils/format';
import { Card } from './Card';

// Bölüm 2: Sermaye Gösterimi + Nakit/Stok/Borç Ayrımı.
export function CapitalSummary({
  capital,
  goldPrice,
}: {
  capital: CapitalState;
  goldPrice: GoldPriceState;
}) {
  const totalTl = capital.goldGrams * goldPrice.sellPricePerGram;
  const netWorth = capital.cashTl + capital.stockValueTl - capital.debtTl;
  const isUp = goldPrice.dailyChangePercent >= 0;

  return (
    <Card>
      <Text style={styles.label}>SERMAYEN</Text>
      <View style={styles.headlineRow}>
        <Text style={styles.headline}>{formatGram(capital.goldGrams)} altın</Text>
        <Text style={styles.headlineApprox}>≈ {formatTl(totalTl)}</Text>
      </View>
      <Text style={[styles.change, { color: isUp ? colors.positive : colors.negative }]}>
        {formatPercent(goldPrice.dailyChangePercent)} (bugün)
      </Text>

      <View style={styles.divider} />

      <Row label="Nakit (Kasa)" value={formatTl(capital.cashTl)} />
      <Row label="Stok değeri (has altın karşılığı)" value={formatTl(capital.stockValueTl)} />
      <Row label="Borç" value={formatTl(capital.debtTl)} valueColor={colors.negative} />
      <View style={styles.divider} />
      <Row label="Net Servet" value={formatTl(netWorth)} bold />
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          bold && styles.rowValueBold,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  headline: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  headlineApprox: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.md,
    color: colors.inkMuted,
  },
  change: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.paperDark,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  rowLabelBold: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  rowValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  rowValueBold: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
  },
});
