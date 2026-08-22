import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';
import { Card } from './Card';

export interface DailyGoalStep {
  label: string;
  done: boolean;
}

// Bölüm 4.1: günün hedefi ("3 ürün al → 2 ürün sat → 40.000₺ kâr hedefle").
export function DailyGoalCard({ steps }: { steps: DailyGoalStep[] }) {
  return (
    <Card>
      <Text style={styles.title}>GÜNÜN HEDEFİ</Text>
      <View style={styles.stepsRow}>
        {steps.map((step, i) => (
          <View key={step.label} style={styles.stepGroup}>
            {i > 0 && <Text style={styles.arrow}>→</Text>}
            <View style={styles.step}>
              <View style={[styles.marker, step.done && styles.markerDone]} />
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                {step.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrow: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.inkMuted,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  markerDone: {
    backgroundColor: colors.accent,
  },
  stepLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  stepLabelDone: {
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
  },
});
