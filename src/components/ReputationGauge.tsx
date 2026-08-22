import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

const SEGMENT_COUNT = 5;

// Bölüm 8: İtibar sistemi. Emoji yıldız yerine mat, dolum çubuğu segmentleri.
export function ReputationGauge({ score }: { score: number }) {
  const filledSegments = Math.round((score / 100) * SEGMENT_COUNT);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>İTİBAR</Text>
      <View style={styles.segmentsRow}>
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[styles.segment, i < filledSegments && styles.segmentFilled]}
          />
        ))}
      </View>
      <Text style={styles.score}>{score}/100</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkMuted,
    marginBottom: 4,
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
  segmentFilled: {
    backgroundColor: colors.accent,
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.ink,
    marginTop: 3,
  },
});
