import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';

export interface ScaleReading {
  grams: number;
  karat: number;
  cleanliness: string;
}

// Bölüm 4.3: Hassas Terazi paneli — imza bileşen. Gerçek dijital terazi
// görünümü (LCD zemin, segment font) + TEST kontrolü.
export function ScalePanel({
  reading,
  tested,
  measuring,
  onTest,
}: {
  reading: ScaleReading;
  tested: boolean;
  measuring: boolean;
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
        </View>
        <View style={styles.readoutRow}>
          <Readout label="GRAM" value={displayGrams} />
          <Readout label="AYAR" value={displayKarat} />
          <Readout label="TEMİZLİK" value={displayClean} />
        </View>
      </View>

      <View style={styles.controlsRow}>
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
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.controlButton, primary && styles.controlButtonPrimary]}>
      <Text style={[styles.controlButtonLabel, primary && styles.controlButtonLabelLight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // [DÜZELTME] Panel ~%60 daha kompakt — tek bakışta gram/ayar/temizlik +
  // TEST butonu, ama ekranın yarısını kaplamıyor.
  panel: {
    backgroundColor: colors.lcdBg,
    borderRadius: radius.md,
    padding: 6,
    ...shadow,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.lcdText,
    opacity: 0.7,
  },
  readoutRow: {
    flexDirection: 'row',
  },
  readout: {
    flex: 1,
  },
  readoutLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.lcdText,
    opacity: 0.75,
  },
  readoutValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.sm,
    color: colors.lcdText,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  controlButtonPrimary: {
    backgroundColor: colors.ink,
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
