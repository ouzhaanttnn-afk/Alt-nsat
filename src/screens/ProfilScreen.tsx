import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { LevelProgressCard } from '../components/LevelProgressCard';
import { ReputationGauge } from '../components/ReputationGauge';
import { SectionLabel } from '../components/SectionLabel';
import { SkillNodeCard } from '../components/SkillNodeCard';
import { LEVEL_MAX } from '../config/economyConfig';
import { BRANCH_LABELS, skillTree, type SkillBranch } from '../data/skillTree';
import { useGameStore, xpRequiredForLevel } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';

const BRANCHES: SkillBranch[] = ['tuccar', 'usta', 'esnaf'];

// Bölüm 7/23-24: Yetenek Ağacı (Tüccar / Usta / Esnaf) + Seviye — seviye
// paradan bağımsız, yalnızca aktif alım-satımdan kazanılan XP ile ilerler.
export function ProfilScreen() {
  const reputation = useGameStore((s) => s.reputation);
  const wholesalerTrust = useGameStore((s) => s.wholesalerTrust);
  const level = useGameStore((s) => s.level);
  const totalXp = useGameStore((s) => s.totalXp);
  const skillPoints = useGameStore((s) => s.skillPoints);
  const skillLevels = useGameStore((s) => s.skillLevels);
  const levelUpSkill = useGameStore((s) => s.levelUpSkill);
  const resetSkills = useGameStore((s) => s.resetSkills);

  const isMaxLevel = level >= LEVEL_MAX;
  const xpForCurrentLevel = xpRequiredForLevel(level);
  const xpForNextLevel = xpRequiredForLevel(level + 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeLabel}>{skillPoints} puan</Text>
          </View>
        </View>

        <LevelProgressCard
          level={level}
          isMaxLevel={isMaxLevel}
          xpIntoLevel={totalXp - xpForCurrentLevel}
          xpNeededForLevel={xpForNextLevel - xpForCurrentLevel}
          onResetSkills={resetSkills}
        />

        <Card style={styles.gaugeCard}>
          <ReputationGauge score={reputation.score} label="İTİBAR" align="flex-start" />
          <ReputationGauge score={wholesalerTrust} label="TOPTANCI GÜVENİ" align="flex-start" />
        </Card>

        {BRANCHES.map((branch) => (
          <View key={branch}>
            <SectionLabel>{BRANCH_LABELS[branch].toUpperCase()}</SectionLabel>
            <View style={styles.skillGroup}>
              {skillTree
                .filter((skill) => skill.branch === branch)
                .map((skill) => (
                  <SkillNodeCard
                    key={skill.id}
                    definition={skill}
                    level={skillLevels[skill.id] ?? 0}
                    canLevelUp={skillPoints > 0}
                    onLevelUp={() => levelUpSkill(skill.id)}
                  />
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.inkOnDark,
  },
  pointsBadge: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  pointsBadgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  gaugeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  skillGroup: {
    gap: 10,
  },
});
