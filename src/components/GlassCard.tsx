import { StyleSheet, View, type ViewProps } from 'react-native';
import { glass } from '../theme/glass';

/**
 * [YENİ] Premium mor+altın referans tasarımı — Dükkân/pazarlık akışındaki
 * kartlar artık krem değil, ince altın çerçeveli, ZENGİN/DOYGUN koyu mor
 * "cam" yüzeyler (düşük opaklıklı, siyaha kaçan bir overlay değil).
 * KASITLI OLARAK sadece müşteri/pazarlık akışına özel: Stok/Yetenekler/
 * Profil/Müşteriler ekranlarının mevcut krem `Card` bileşeni DEĞİŞMEDİ.
 */
export function GlassCard({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: glass.panelBg,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: 16,
    padding: 12,
    shadowColor: glass.purple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
});
