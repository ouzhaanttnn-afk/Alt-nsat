import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

const SEGMENT_COUNT = 5;

// Bölüm 8: İtibar sistemi. Emoji yıldız yerine mat, dolum çubuğu segmentleri.
// Genelleştirildi: aynı gösterge Toptancı Güveni için de kullanılıyor.
// onDark: kart içine sarılmadan doğrudan koyu lacivert zemin üzerinde
// duruyorsa (bkz. DukkanScreen başlığı) açık tonlara geçer.
export function ReputationGauge({
  score,
  label = 'İTİBAR',
  align = 'flex-end',
  onDark = false,
}: {
  score: number;
  label?: string;
  align?: 'flex-start' | 'flex-end';
  onDark?: boolean;
}) {
  const filledSegments = Math.round((score / 100) * SEGMENT_COUNT);

  return (
    <View style={[styles.container, { alignItems: align }]}>
      <Text style={[styles.label, onDark && styles.labelOnDark]}>{label}</Text>
      <View style={styles.segmentsRow}>
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[styles.segment, onDark && styles.segmentOnDark, i < filledSegments && styles.segmentFilled]}
          />
        ))}
      </View>
      <Text style={[styles.score, onDark && styles.scoreOnDark]}>{score}/100</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  labelOnDark: {
    color: colors.inkMutedOnDark,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  segment: {
    width: 14,
    height: 6,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  segmentOnDark: {
    backgroundColor: 'rgba(243, 234, 211, 0.25)',
  },
  segmentFilled: {
    backgroundColor: colors.accent,
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.ink,
    marginTop: 3,
  },
  scoreOnDark: {
    color: colors.inkOnDark,
  },
});
