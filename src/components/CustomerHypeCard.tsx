import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';

// Müşteri Akını — günde bir kez kalan organik müşteri potansiyelini artırır.
// UI teknik multiplier/percent göstermez; oyuncuya doğal bir dükkân hareketi
// geri bildirimi verir.
export function CustomerHypeCard({
  active,
  onWatchAd,
}: {
  active: boolean;
  onWatchAd: () => void;
}) {
  return (
    <Pressable style={styles.banner} onPress={onWatchAd}>
      <Text style={styles.title} numberOfLines={1}>
        {active ? 'Müşteri Akını aktif' : 'MÜŞTERİ AKINI'}
      </Text>
      <Text style={styles.cta} numberOfLines={1}>
        {active ? 'Bugün daha fazla müşteri dükkâna uğrar.' : 'Bugün daha fazla müşteri dükkâna uğrasın.'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
    ...shadow,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.white,
    textAlign: 'center',
  },
  cta: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.white,
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 1,
  },
});
