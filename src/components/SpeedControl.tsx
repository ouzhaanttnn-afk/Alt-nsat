import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClockSpeed } from '../store/useGameStore';
import { colors, fonts, radius, shadow } from '../theme';

const OPTIONS: { label: string; value: ClockSpeed }[] = [
  { label: 'II', value: 0 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '4x', value: 4 },
];

// Ana Ekran'da zamanı hızlandırma/duraklatma kontrolü. Oyun saati bu
// hıza göre akar ve gram altın fiyatı bu saate bağlı dalgalanır.
// Bölüm 22: 1x/2x/duraklat her zaman serbest; 4x reklam/IAP ile açılana
// kadar kilitli görünür (bkz. onChange'in false dönmesi — DukkanScreen bu
// durumda reklam/IAP teklifini gösterir).
export function SpeedControl({
  speed,
  onChange,
  fourXLocked,
}: {
  speed: ClockSpeed;
  onChange: (speed: ClockSpeed) => void;
  fourXLocked?: boolean;
}) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = option.value === speed;
        const locked = option.value === 4 && fourXLocked;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.button, active && styles.buttonActive, locked && styles.buttonLocked]}
          >
            <Text style={[styles.label, active && styles.labelActive, locked && styles.labelLocked]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 3,
    gap: 2,
    ...shadow,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm - 2,
  },
  buttonActive: {
    backgroundColor: colors.accent,
  },
  buttonLocked: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.inkMuted,
  },
  labelActive: {
    color: colors.white,
  },
  labelLocked: {
    color: colors.inkMuted,
    opacity: 0.6,
  },
});
