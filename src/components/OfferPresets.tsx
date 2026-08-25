import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';

export interface OfferPreset {
  key: string;
  label: string;
  sublabel: string;
  onPress: () => void;
}

// Bölüm 7: Pazarlık çubuğu için hızlı ön ayarlar — sadece müşteriden
// alım/bozdurma modunda gösterilir. Düşük teklif (Ölücü) daha yüksek kâr
// ama daha düşük kabul ihtimali ve karizma riski taşır; yüksek teklif
// (Cömert) daha düşük kâr ama daha iyi kabul ihtimali ve karizma getirir.
export function OfferPresets({ presets, disabled }: { presets: OfferPreset[]; disabled?: boolean }) {
  return (
    <View style={styles.row}>
      {presets.map((preset) => (
        <Pressable
          key={preset.key}
          disabled={disabled}
          onPress={preset.onPress}
          style={[styles.button, disabled && styles.disabled]}
        >
          <Text style={styles.label}>{preset.label}</Text>
          <Text style={styles.sublabel}>{preset.sublabel}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  sublabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 1,
  },
});
