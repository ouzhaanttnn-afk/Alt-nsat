import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';

// Toptancıyla alım/satım her zaman mümkün (Stok sekmesindeki "Toptancıdan
// Stok Al" ve "Sarrafiye Stoğun" bölümlerinin kendisi) — bu, o seçeneğin
// Dükkân ekranından da her zaman görünür/erişilebilir olmasını sağlayan
// kısayol. Toptancı Bağlantısı (bkz. BrokerDealBanner) ayrı, zaman
// sınırlı bir bonus fırsat; bununla karıştırılmamalı.
export function WholesalerAccessBanner({
  onBuy,
  onSell,
}: {
  onBuy: () => void;
  onSell: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.pill} onPress={onBuy}>
        <Text style={styles.pillLabel}>Toptancıdan Al →</Text>
      </Pressable>
      <Pressable style={styles.pill} onPress={onSell}>
        <Text style={styles.pillLabel}>Toptancıya Sat →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 7,
    alignItems: 'center',
    ...shadow,
  },
  pillLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.white,
  },
});
