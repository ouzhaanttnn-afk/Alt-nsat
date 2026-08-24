import { Pressable, StyleSheet, Text } from 'react-native';
import { CUSTOMER_HYPE_ARRIVAL_MULTIPLIER } from '../config/economyConfig';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';

// Müşteri Hype — 4x hız kilidiyle aynı yer tutucu monetizasyon mantığı:
// reklam izleyince GERÇEK DÜNYA süresiyle ölçülen bir pencere için gelen
// müşteri tetiklenme olasılığı katlanır. Üst üste izlemek pencereyi uzatır.
// BrokerDealBanner ile aynı kompakt tek-satır banner deseni — sayfa
// aşırı uzamasın diye ayrı bir Card yerine tek dokunuşluk bir şerit.
export function CustomerHypeCard({
  active,
  minutesLeft,
  onWatchAd,
}: {
  active: boolean;
  minutesLeft: number;
  onWatchAd: () => void;
}) {
  return (
    <Pressable style={styles.banner} onPress={onWatchAd}>
      <Text style={styles.title}>
        {active ? `Müşteri Hype aktif · ${Math.ceil(minutesLeft)} dk kaldı` : 'Müşteri Hype'}
      </Text>
      <Text style={styles.cta}>
        {active
          ? 'Reklam İzle · +15 dk'
          : `Reklam İzle · ${CUSTOMER_HYPE_ARRIVAL_MULTIPLIER}x müşteri · 15 dk →`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...shadow,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
    textAlign: 'center',
  },
  cta: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.white,
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 2,
  },
});
