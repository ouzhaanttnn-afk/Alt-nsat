import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SkillDefinition } from '../data/skillTree';
import { colors, fonts, fontSizes, radius } from '../theme';

// Bölüm 7: Yetenek Ağacı — tek bir yetenek düğümü. "pending" durumundaki
// yetenekler puan harcanabilir ve seviyelenir ama etkileri karşılık gelen
// sistem kurulana kadar devrede değildir — bu açıkça bir rozetle belirtilir.
export function SkillNodeCard({
  definition,
  level,
  canLevelUp,
  onLevelUp,
}: {
  definition: SkillDefinition;
  level: number;
  canLevelUp: boolean;
  onLevelUp: () => void;
}) {
  const maxed = level >= definition.maxLevel;
  const isPending = definition.effectStatus === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{definition.name}</Text>
        <View style={[styles.statusTag, isPending ? styles.statusTagPending : styles.statusTagActive]}>
          <Text style={[styles.statusTagLabel, isPending && styles.statusTagLabelPending]}>
            {isPending ? 'BEKLEMEDE' : 'AKTİF'}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{definition.description}</Text>
      {isPending && definition.pendingNote && (
        <Text style={styles.pendingNote}>{definition.pendingNote}</Text>
      )}

      <View style={styles.footer}>
        <View style={styles.pipsRow}>
          {Array.from({ length: definition.maxLevel }).map((_, i) => (
            <View key={i} style={[styles.pip, i < level && styles.pipFilled]} />
          ))}
          <Text style={styles.levelLabel}>
            {level}/{definition.maxLevel}
          </Text>
        </View>

        <Pressable
          disabled={!canLevelUp || maxed}
          onPress={onLevelUp}
          style={[styles.levelUpButton, (!canLevelUp || maxed) && styles.levelUpButtonDisabled]}
        >
          <Text style={styles.levelUpButtonLabel}>{maxed ? 'Maksimum' : 'Yükselt'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  statusTag: {
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  statusTagActive: {
    backgroundColor: `${colors.positive}17`,
  },
  statusTagPending: {
    backgroundColor: colors.background,
  },
  statusTagLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.positive,
  },
  statusTagLabelPending: {
    color: colors.inkMuted,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 6,
  },
  pendingNote: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontStyle: 'italic',
    color: colors.inkMuted,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pip: {
    width: 12,
    height: 6,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  pipFilled: {
    backgroundColor: colors.accent,
  },
  levelLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
    marginLeft: 4,
  },
  levelUpButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  levelUpButtonDisabled: {
    backgroundColor: colors.border,
  },
  levelUpButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
});
