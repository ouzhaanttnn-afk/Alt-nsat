import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

export type BadgeTone = 'positive' | 'warning' | 'negative' | 'neutral';

const toneColor: Record<BadgeTone, string> = {
  positive: colors.positive,
  warning: colors.warning,
  negative: colors.negative,
  neutral: colors.inkMuted,
};

// Bölüm 4.2/4.3'teki 🟢/🟡/🔴 durum göstergelerinin emojisiz karşılığı.
// Fintech modernizasyonu: dolgusuz kontur yerine yumuşak, açık ton dolgu ("soft chip").
export function Badge({ tone, label }: { tone: BadgeTone; label: string }) {
  const tint = toneColor[tone];
  return (
    <View style={[styles.badge, { backgroundColor: `${tint}17` }]}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 9,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
});
