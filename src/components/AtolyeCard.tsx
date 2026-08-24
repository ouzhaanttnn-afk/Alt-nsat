import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';

// Bölüm 17: Atölye — oyun hızından bağımsız, sürekli çalışan pasif has
// altın üretimi. Yükseltme parayla, anlamlı bir fırsat maliyeti kararı;
// kurulduktan sonra günlük yönetim istemez.
export function AtolyeCard({
  level,
  maxLevel,
  gramsPerDay,
  upgradeCostTl,
  canAfford,
  locked,
  requiredLevel,
  onUpgrade,
}: {
  level: number;
  maxLevel: number;
  gramsPerDay: number;
  upgradeCostTl: number | null;
  canAfford: boolean;
  /** v3: Seviye 7'den önce erişilemez — erken oyunda pasif gelire kaçışı engeller. */
  locked?: boolean;
  requiredLevel?: number;
  onUpgrade: () => void;
}) {
  const isMax = upgradeCostTl === null;
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>ATÖLYE</Text>
        <Text style={styles.level}>
          Sv.{level}/{maxLevel}
        </Text>
      </View>
      {locked ? (
        <Text style={styles.production}>Kilitli — Seviye {requiredLevel} gerekiyor</Text>
      ) : (
        <Text style={styles.production}>
          {gramsPerDay > 0 ? `Günde ${gramsPerDay.toLocaleString('tr-TR')}g has altın üretiyor` : 'Henüz kurulmadı'}
        </Text>
      )}
      <Pressable
        disabled={locked || isMax || !canAfford}
        onPress={onUpgrade}
        style={[styles.button, (locked || isMax || !canAfford) && styles.disabled]}
      >
        <Text style={styles.buttonLabel}>
          {locked
            ? `Kilitli — Sv.${requiredLevel}`
            : isMax
              ? 'Maksimum Seviye'
              : `${level === 0 ? 'Kur' : 'Yükselt'} · ${formatTl(upgradeCostTl!)}`}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  level: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  production: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
    marginTop: 6,
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
