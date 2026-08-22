import { StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
});
