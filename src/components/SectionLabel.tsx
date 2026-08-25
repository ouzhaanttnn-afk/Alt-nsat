import { StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

// Ekranın koyu lacivert zemininde doğrudan duran bölüm başlığı — altın
// tonu, kart içeriğinden ayrışan bir "vitrin etiketi" hissi verir.
export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.brass,
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 2,
  },
});
