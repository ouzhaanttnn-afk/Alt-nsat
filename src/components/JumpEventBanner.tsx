import { StyleSheet, Text, View } from 'react-native';
import type { JumpEvent } from '../store/useGameStore';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatPercent } from '../utils/format';

// Bölüm 9 / Bölüm 2: nadir büyük altın fiyatı sıçraması bildirimi.
export function JumpEventBanner({ event }: { event: JumpEvent }) {
  const positive = event.percent >= 0;
  return (
    <View style={[styles.banner, { backgroundColor: positive ? colors.positive : colors.negative }]}>
      <Text style={styles.text}>
        Altın fiyatında ani hareket: {formatPercent(event.percent)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
    textAlign: 'center',
  },
});
