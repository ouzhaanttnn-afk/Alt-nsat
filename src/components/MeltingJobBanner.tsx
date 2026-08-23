import { StyleSheet, Text, View } from 'react-native';
import type { MeltingJob } from '../store/useGameStore';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';
import { formatTl } from '../utils/format';

// Bölüm 12: aktif eritme işinin ilerleme banner'ı — v1 basitleştirmesi
// gereği aynı anda sadece tek bir eritme işi olabilir.
export function MeltingJobBanner({ job, minutesLeft }: { job: MeltingJob; minutesLeft: number }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Eritiliyor: {job.productName}</Text>
      <Text style={styles.sub}>
        {Math.max(0, Math.ceil(minutesLeft))} dk kaldı · ~{job.recoveredGrams.toLocaleString('tr-TR')}g has altın
        {job.stoneValueTl > 0 ? ` + ${formatTl(job.stoneValueTl)} taş değeri` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.brass,
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
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2,
  },
});
