import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BrandStage } from '../data/brandStages';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';

export type BrandStageStatus = 'owned' | 'available' | 'level-locked' | 'sequence-locked';

// Bölüm 28-29: Kurumsal Marka merdiveni — Şubeleşme → Marka Yönetimi →
// Kurumsallaşma sırayla açılır, her biri seviye + nakit gerektirir.
export function BrandStageCard({
  stage,
  status,
  canAfford,
  onPurchase,
}: {
  stage: BrandStage;
  status: BrandStageStatus;
  canAfford: boolean;
  onPurchase: () => void;
}) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{stage.name}</Text>
        {status === 'owned' && <Text style={styles.ownedLabel}>Sahipsin</Text>}
      </View>
      <Text style={styles.description}>{stage.description}</Text>
      <Text style={styles.meta}>
        Seviye {stage.requiredLevel}+ · {formatTl(stage.costTl)} · Günlük {formatTl(stage.dailyIncomeTl)}
      </Text>

      {status === 'available' && (
        <Pressable
          disabled={!canAfford}
          onPress={onPurchase}
          style={[styles.button, !canAfford && styles.disabled]}
        >
          <Text style={styles.buttonLabel}>Satın Al</Text>
        </Pressable>
      )}
      {status === 'level-locked' && (
        <Text style={styles.lockedHint}>Kilitli — Seviye {stage.requiredLevel} gerekiyor</Text>
      )}
      {status === 'sequence-locked' && (
        <Text style={styles.lockedHint}>Kilitli — önce bir önceki kademeye sahip olmalısın</Text>
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
  ownedLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.positive,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: 4,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
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
  lockedHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
