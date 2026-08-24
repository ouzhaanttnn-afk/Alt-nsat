import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';

// Mockup'taki "HIZLI ERİŞİM" şeridinin sade bir uygulaması — Stok
// sekmesindeki ilgili bölüme doğrudan kaydırmalı geçiş sağlar (bkz.
// KasamScreen'in scroll-to efekti). Mevcut ekran yapısını bozmayan,
// bağımsız küçük bir ek.
export function QuickAccessRow({
  onIscilikli,
  onAtolye,
  onYatirimlar,
}: {
  onIscilikli: () => void;
  onAtolye: () => void;
  onYatirimlar: () => void;
}) {
  return (
    <View style={styles.row}>
      <Item icon="💎" label="İşçilikli" onPress={onIscilikli} />
      <Item icon="⚒️" label="Atölye" onPress={onAtolye} />
      <Item icon="🏦" label="Yatırımlar" onPress={onYatirimlar} />
    </View>
  );
}

function Item({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  item: {
    flex: 1,
    backgroundColor: colors.lcdBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brassDark,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 3,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMutedOnDark,
  },
});
