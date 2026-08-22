import { StyleSheet, View, type ViewProps } from 'react-native';
import { border, colors, radius, shadow } from '../theme';

// Fintech modernizasyonu: beyaz yüzey + hafif gölge ile derinlik,
// kontur artık çok ince ve düşük kontrastlı bir ayraç niteliğinde.
export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    ...shadow,
  },
});
