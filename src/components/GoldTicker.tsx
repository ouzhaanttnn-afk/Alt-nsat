import { StyleSheet, Text, View } from 'react-native';
import type { GoldPriceState } from '../types/game';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';
import { formatPercent, formatTl } from '../utils/format';

// Bölüm 2: Alış/satış fiyatı ayrı gösterilir (spread mantığı).
// LCD/dijital terazi ekranı görünümü — Bölüm 1'deki imza görsel dil.
// Bölüm 5: bugünkü değişim küçük ama görünür — "şimdi mi satsam, biraz
// daha bekleseydim mi" kararını besleyen basit bir piyasa hareketi sinyali.
export function GoldTicker({ goldPrice }: { goldPrice: GoldPriceState }) {
  const assets = goldPrice.marketAssets
    ? [
        goldPrice.marketAssets.gramAltin,
        goldPrice.marketAssets.ceyrekAltin,
        goldPrice.marketAssets.bilezik22,
        goldPrice.marketAssets.usdTry,
        goldPrice.marketAssets.eurTry,
      ]
    : [
        {
          id: 'gramAltin' as const,
          label: 'GRAM ALTIN',
          priceTl: goldPrice.buyPricePerGram,
          dailyChangePercent: goldPrice.dailyChangePercent,
        },
      ];
  return (
    <View style={styles.panel}>
      <View style={styles.assetRow}>
        {assets.map((asset) => {
          const trendPositive = asset.dailyChangePercent >= 0;
          return (
            <View key={asset.id} style={styles.assetCell}>
              <Text style={styles.caption} numberOfLines={1}>{asset.label}</Text>
              <Text style={styles.cellValue} numberOfLines={1}>{formatTl(asset.priceTl)}</Text>
              <Text style={[styles.trend, { color: trendPositive ? colors.positive : colors.negative }]} numberOfLines={1}>
                {trendPositive ? '▲' : '▼'} {formatPercent(asset.dailyChangePercent)}
              </Text>
            </View>
          );
        })}
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
  assetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  assetCell: {
    flex: 1,
    minWidth: 0,
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
    fontSize: fontSizes.xs,
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
