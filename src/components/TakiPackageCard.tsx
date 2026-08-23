import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TakiPackageTier } from '../data/takiPackageTiers';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Badge } from './Badge';
import { Card } from './Card';

// Bölüm 18-20: Takı Yatırım Paketi kartı — 30 gün kilitli, sabit günlük
// getiri + vade sonunda anapara iadesi. Aktifken kalan gün sayısı, dört
// kademe de aynı anda aktifse set bonusu rozeti gösterilir.
export function TakiPackageCard({
  tier,
  active,
  daysLeft,
  hasSetBonus,
  canAfford,
  onStart,
}: {
  tier: TakiPackageTier;
  active: boolean;
  daysLeft: number;
  hasSetBonus: boolean;
  canAfford: boolean;
  onStart: () => void;
}) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{tier.name}</Text>
        {active && hasSetBonus && <Badge tone="positive" label="Set Bonusu +%10" />}
      </View>
      <Text style={styles.meta}>
        Anapara {formatTl(tier.principalTl)} · Günlük {formatTl(tier.dailyPayoutTl)} · 30 gün kilitli
      </Text>
      {active ? (
        <Text style={styles.activeStatus}>Aktif — vadeye {daysLeft} gün kaldı</Text>
      ) : (
        <Pressable
          disabled={!canAfford}
          onPress={onStart}
          style={[styles.button, !canAfford && styles.disabled]}
        >
          <Text style={styles.buttonLabel}>Paketi Başlat</Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 4,
  },
  activeStatus: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.positive,
    marginTop: 10,
  },
  button: {
    marginTop: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
});
