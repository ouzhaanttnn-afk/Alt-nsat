import { StyleSheet, Text, View } from 'react-native';
import type { GoldPriceState } from '../types/game';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';
import { formatPercent, formatTl } from '../utils/format';

// Bölüm 2: Alış/satış fiyatı ayrı gösterilir (spread mantığı).
// LCD/dijital terazi ekranı görünümü — Bölüm 1'deki imza görsel dil.
// Bölüm 5: bugünkü değişim küçük ama görünür — "şimdi mi satsam, biraz
// daha bekleseydim mi" kararını besleyen basit bir piyasa hareketi sinyali.
export function GoldTicker({ goldPrice }: { goldPrice: GoldPriceState }) {
  const trendPositive = goldPrice.dailyChangePercent >= 0;
  return (
    <View style={styles.panel}>
      <View style={styles.captionRow}>
        <Text style={styles.caption}>GRAM ALTIN</Text>
        <Text style={[styles.trend, { color: trendPositive ? colors.positive : colors.negative }]}>
          {formatPercent(goldPrice.dailyChangePercent)} bugün
        </Text>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>ALIŞ</Text>
          <Text style={styles.cellValue}>{formatTl(goldPrice.buyPricePerGram)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>SATIŞ</Text>
          <Text style={styles.cellValue}>{formatTl(goldPrice.sellPricePerGram)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.lcdBg,
    borderRadius: radius.md,
    padding: 12,
    ...shadow,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.lcdText,
    opacity: 0.7,
  },
  trend: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
  },
  cellLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.lcdText,
    opacity: 0.75,
  },
  cellValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.lg,
    color: colors.lcdText,
  },
  separator: {
    width: 1.5,
    height: '100%',
    backgroundColor: colors.lcdText,
    opacity: 0.25,
    marginHorizontal: 12,
  },
});
