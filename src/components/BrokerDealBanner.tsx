import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';

// Bölüm 9: oyuncu, borca yazılan bir alımı hemen kapatmadan Pazarlık
// ekranından çıktıysa (ya da uygulamayı arka plana alıp geri döndüyse),
// açık Toptancı Bağlantısı burada — süresi geçmeden önce son bir
// hatırlatma ve tek dokunuşluk kapatma imkânı olarak — gösterilir.
export function BrokerDealBanner({
  minutesLeft,
  onResolve,
}: {
  minutesLeft: number;
  onResolve: () => void;
}) {
  return (
    <Pressable style={styles.banner} onPress={onResolve}>
      <Text style={styles.title}>Toptancı Bağlantısı açık · {Math.max(0, Math.ceil(minutesLeft))} dk kaldı</Text>
      <Text style={styles.cta}>Toptancıya Hemen Sat →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
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
