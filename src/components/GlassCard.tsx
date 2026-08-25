import { StyleSheet, View, type ViewProps } from 'react-native';

/**
 * [YENİ] Premium mor+altın referans tasarımı — Dükkân/pazarlık akışındaki
 * kartlar artık krem değil, ince altın çerçeveli koyu mor "cam" yüzeyler.
 * KASITLI OLARAK sadece müşteri/pazarlık akışına özel: Stok/Yetenekler/
 * Profil/Müşteriler ekranlarının mevcut krem `Card` bileşeni DEĞİŞMEDİ.
 */
export function GlassCard({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(46, 26, 82, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
});
