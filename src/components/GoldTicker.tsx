import { StyleSheet, Text, View } from 'react-native';
import type { GoldPriceState } from '../types/game';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';

// Bölüm 2: Alış/satış fiyatı ayrı gösterilir (spread mantığı).
// LCD/dijital terazi ekranı görünümü — Bölüm 1'deki imza görsel dil.
export function GoldTicker({ goldPrice }: { goldPrice: GoldPriceState }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.caption}>GRAM ALTIN</Text>
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
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.lcdText,
    opacity: 0.7,
    marginBottom: 4,
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
