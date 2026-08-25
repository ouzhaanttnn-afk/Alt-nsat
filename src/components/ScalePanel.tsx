import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';
import { glass } from '../theme/glass';

export interface ScaleReading {
  grams: number;
  karat: number;
  cleanliness: string;
}

// Bölüm 4.3: Hassas Terazi paneli — imza bileşen. Gerçek dijital terazi
// görünümü (LCD zemin, segment font) + TEST kontrolü.
// [DÜZELTME] TEST butonu artık ayrı bir satır kaplamıyor — başlığın sağında,
// tek satırlık kompakt bir buton olarak duruyor (referans tasarım).
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
    <View style={styles.panel}>
      <View style={styles.captionRow}>
        <Text style={styles.caption}>HASSAS TERAZİ</Text>
        <Pressable onPress={onTest} style={styles.testButton} hitSlop={6}>
          <Text style={styles.testButtonLabel}>TEST</Text>
        </Pressable>
      </View>
      <View style={styles.readoutRow}>
        <Readout label="GRAM" value={displayGrams} />
        <Readout label="AYAR" value={displayKarat} />
        <Readout label="TEMİZLİK" value={displayClean} />
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

const styles = StyleSheet.create({
  // [DÜZELTME] Panel çok daha kompakt — tek bakışta gram/ayar/temizlik +
  // TEST butonu, ama ekranın yarısını kaplamıyor.
  panel: {
    backgroundColor: colors.lcdBg,
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: glass.borderSoft,
    ...shadow,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  testButton: {
    backgroundColor: glass.gold,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  testButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#3A2A00',
  },
});
