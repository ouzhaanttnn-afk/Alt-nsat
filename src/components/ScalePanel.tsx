import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';
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
      <Text style={styles.caption}>HASSAS TERAZİ</Text>
      <View style={styles.readoutRow}>
        <Readout label="GRAM" value={displayGrams} />
        <Readout label="AYAR" value={displayKarat} />
        <Readout label="TEMİZLİK" value={displayClean} />
        <Pressable onPress={onTest} style={styles.testButton} hitSlop={8}>
          <Text style={styles.testButtonLabel}>TEST</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readout}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={styles.readoutValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // [DÜZELTME] Panel çok daha kompakt — tek bakışta gram/ayar/temizlik +
  // TEST butonu, ama ekranın yarısını kaplamıyor.
  panel: {
    backgroundColor: colors.lcdBg,
    borderRadius: radius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: glass.borderSoft,
    ...shadow,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 8,
    letterSpacing: 1.5,
    color: colors.lcdText,
    opacity: 0.7,
    marginBottom: 2,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  readout: {
    flex: 1,
    minWidth: 0,
  },
  readoutLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.lcdText,
    opacity: 0.75,
  },
  readoutValue: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.lcdText,
  },
  testButton: {
    backgroundColor: glass.gold,
    minWidth: 52,
    minHeight: 30,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#3A2A00',
  },
});
