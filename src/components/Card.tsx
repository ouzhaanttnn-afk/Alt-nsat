import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius } from '../theme';

// Bölüm 1: düz renk, ince kontur (1.5px), köşeler az yuvarlak (4px), gölgesiz.
export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
});
