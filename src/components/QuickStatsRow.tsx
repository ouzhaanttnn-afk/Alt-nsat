import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';
import { formatPercent, formatTl } from '../utils/format';

// Mockup birleşimi: Dükkân başlığındaki KASA/PİYASA/KARİZMA hızlı bilgi
// rozetleri — aşağıdaki kartların (CapitalSummary/GoldTicker/Reputation)
// bir özeti, ayrı bir ekrana gitmeden anlık durumu gösterir.
export function QuickStatsRow({
  cashTl,
  buyPricePerGram,
  reputationScore,
  dailyChangePercent,
}: {
  cashTl: number;
  buyPricePerGram: number;
  reputationScore: number;
  /** Bölüm 5: piyasa küçük ama görünür hareket etsin — "şimdi mi bekleyeyim mi" kararı için. */
  dailyChangePercent?: number;
}) {
  return (
    <View style={styles.row}>
      <StatChip label="KASA" value={formatTl(cashTl)} />
      <StatChip
        label="PİYASA"
        value={formatTl(buyPricePerGram)}
        trend={dailyChangePercent}
      />
      <StatChip label="KARİZMA" value={`${reputationScore}/100`} />
    </View>
  );
}

function StatChip({ label, value, trend }: { label: string; value: string; trend?: number }) {
  const trendPositive = (trend ?? 0) >= 0;
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {trend !== undefined && (
        <Text style={[styles.trend, { color: trendPositive ? colors.positive : colors.negative }]} numberOfLines={1}>
          {formatPercent(trend)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...shadow,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.inkMuted,
  },
  value: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.ink,
    marginTop: 2,
  },
  trend: {
    fontFamily: fonts.mono,
    fontSize: 10,
    marginTop: 1,
  },
});
