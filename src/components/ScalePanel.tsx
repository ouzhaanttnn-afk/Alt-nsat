import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';

export interface ScaleReading {
  grams: number;
  karat: number;
  cleanliness: string;
}

// Bölüm 4.3: Hassas Terazi paneli — imza bileşen. Gerçek dijital terazi
// görünümü (LCD zemin, segment font) + TARE/HOLD/TEST kontrolleri.
export function ScalePanel({
  reading,
  tested,
  measuring,
  held,
  onTare,
  onHold,
  onTest,
}: {
  reading: ScaleReading;
  tested: boolean;
  measuring: boolean;
  held: boolean;
  onTare: () => void;
  onHold: () => void;
  onTest: () => void;
}) {
  const displayGrams = measuring ? '- - -' : tested ? `${reading.grams.toFixed(2)} g` : '0.00 g';
  const displayKarat = measuring ? '- -' : tested ? `${reading.karat}K` : '--';
  const displayClean = measuring ? '- - - -' : tested ? reading.cleanliness : '--';

  return (
    <View>
      <View style={styles.panel}>
        <View style={styles.captionRow}>
          <Text style={styles.caption}>HASSAS TERAZİ</Text>
          {held && <Text style={styles.heldTag}>TUTULDU</Text>}
        </View>
        <View style={styles.readoutRow}>
          <Readout label="GRAM" value={displayGrams} />
          <Readout label="AYAR" value={displayKarat} />
          <Readout label="TEMİZLİK" value={displayClean} />
        </View>
      </View>

      <View style={styles.controlsRow}>
        <ControlButton label="TARE" onPress={onTare} />
        <ControlButton label="HOLD" onPress={onHold} active={held} />
        <ControlButton label="TEST" onPress={onTest} primary />
      </View>
    </View>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readout}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={styles.readoutValue}>{value}</Text>
    </View>
  );
}

function ControlButton({
  label,
  onPress,
  primary,
  active,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.controlButton,
        primary && styles.controlButtonPrimary,
        active && styles.controlButtonActive,
      ]}
    >
      <Text
        style={[
          styles.controlButtonLabel,
          (primary || active) && styles.controlButtonLabelLight,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.lcdBg,
    borderRadius: radius.md,
    padding: 12,
    ...shadow,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.lcdText,
    opacity: 0.7,
  },
  heldTag: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.lcdText,
  },
  readoutRow: {
    flexDirection: 'row',
  },
  readout: {
    flex: 1,
  },
  readoutLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.lcdText,
    opacity: 0.75,
  },
  readoutValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.lcdText,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  controlButtonPrimary: {
    backgroundColor: colors.ink,
  },
  controlButtonActive: {
    backgroundColor: colors.accent,
  },
  controlButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.inkMuted,
  },
  controlButtonLabelLight: {
    color: colors.white,
  },
});
