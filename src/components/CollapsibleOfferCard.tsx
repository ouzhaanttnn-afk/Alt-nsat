import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, fontSizes } from '../theme';
import { glass } from '../theme/glass';
import { formatTl } from '../utils/format';
import { GlassCard } from './GlassCard';

/**
 * [YENİ] Referans tasarımı — teklif paneli artık tek, kompakt bir kart:
 * kapalı durumda sadece "TEKLİFİN: {tutar}" + küçük bir açma oku gösterir,
 * açıldığında Fiyat/Slider/Ölücü-Makul-Cömert/Gönder-Tam Öde-Reddet
 * içeriğini (children) gösterir. Mekanik değişmedi — sadece dış sarmalayıcı.
 */
export function CollapsibleOfferCard({
  offerValueTl,
  expanded,
  onToggle,
  children,
}: {
  offerValueTl: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <GlassCard style={styles.card}>
      <Pressable onPress={onToggle} style={styles.header} hitSlop={6}>
        <Text style={styles.headerLabel}>TEKLİFİN</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerValue} numberOfLines={1}>
            {formatTl(offerValueTl)}
          </Text>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </Pressable>
      {expanded && <View style={styles.body}>{children}</View>}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: glass.inkMuted,
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: glass.goldBright,
  },
  chevron: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.md,
    color: glass.gold,
  },
  body: {
    marginTop: 8,
  },
});
