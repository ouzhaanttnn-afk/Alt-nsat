import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';
import { Card } from './Card';

// Bölüm 23-24/31: Profil — seviye paradan bağımsız, sadece aktif
// alım-satımdan kazanılan XP ile ilerler. Bölüm 30: Yetenek Sıfırlama
// buradan tetiklenir — YER TUTUCU: gerçek reklam SDK'sı bağlanana kadar
// anında (izlenmiş sayılarak) çalışır, hiçbir zaman gerçek para istemez.
export function LevelProgressCard({
  level,
  isMaxLevel,
  xpIntoLevel,
  xpNeededForLevel,
  onResetSkills,
}: {
  level: number;
  isMaxLevel: boolean;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  onResetSkills: () => void;
}) {
  const progress = isMaxLevel ? 1 : Math.min(1, xpNeededForLevel > 0 ? xpIntoLevel / xpNeededForLevel : 0);

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.levelLabel}>SEVİYE {level}</Text>
        <Pressable onPress={onResetSkills} hitSlop={8}>
          <Text style={styles.resetLabel}>Yetenekleri Sıfırla (Reklam) ↻</Text>
        </Pressable>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.xpLabel}>
        {isMaxLevel
          ? 'Maksimum seviyedesin'
          : `${Math.round(xpIntoLevel).toLocaleString('tr-TR')} / ${Math.round(xpNeededForLevel).toLocaleString('tr-TR')} XP`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelLabel: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  resetLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.accent,
  },
  barTrack: {
    height: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  xpLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 6,
    textAlign: 'right',
  },
});
