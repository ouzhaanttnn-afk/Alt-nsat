import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CUSTOMER_HYPE_ARRIVAL_MULTIPLIER } from '../config/economyConfig';
import { colors, fonts, fontSizes, radius } from '../theme';
import { Card } from './Card';

// Müşteri Hype — 4x hız kilidiyle aynı yer tutucu monetizasyon mantığı:
// reklam izleyince GERÇEK DÜNYA süresiyle ölçülen bir pencere için gelen
// müşteri tetiklenme olasılığı katlanır. Üst üste izlemek pencereyi uzatır.
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
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>MÜŞTERİ HYPE</Text>
        {active && <Text style={styles.countdown}>{Math.ceil(minutesLeft)} dk kaldı</Text>}
      </View>
      <Text style={styles.body}>
        {active
          ? `Hype aktif — dükkâna normalin ${CUSTOMER_HYPE_ARRIVAL_MULTIPLIER} katı müşteri geliyor.`
          : `Reklam izleyerek 15 dakikalığına gelen müşteri sayısını ${CUSTOMER_HYPE_ARRIVAL_MULTIPLIER} katına çıkar.`}
      </Text>
      <Pressable style={styles.adButton} onPress={onWatchAd}>
        <Text style={styles.adButtonLabel}>{active ? 'Reklam İzle · +15 dk' : 'Reklam İzle · 15 dk'}</Text>
      </Pressable>
      {!active && (
        <Text style={styles.hint}>
          Yer tutucu — gerçek reklam entegrasyonu bağlanınca burada gerçek akış çalışacak.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  countdown: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.positive,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: 6,
  },
  adButton: {
    marginTop: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: 'center',
  },
  adButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
