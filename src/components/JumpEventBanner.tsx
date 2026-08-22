import { StyleSheet, Text, View } from 'react-native';
import type { JumpEvent } from '../store/useGameStore';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatPercent } from '../utils/format';

// Bölüm 9 / Bölüm 2: nadir büyük altın fiyatı sıçraması bildirimi — bir
// haber başlığıyla bağlamlanır, karar gerektirmez, salt bilgilendirmedir.
export function JumpEventBanner({ event }: { event: JumpEvent }) {
  const positive = event.percent >= 0;
  return (
    <View style={[styles.banner, { backgroundColor: positive ? colors.positive : colors.negative }]}>
      <Text style={styles.headline}>{event.headline}</Text>
      <Text style={styles.percent}>Gram altın {formatPercent(event.percent)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },
  headline: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
    textAlign: 'center',
  },
  percent: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.white,
    opacity: 0.85,
    textAlign: 'center',
  },
});
