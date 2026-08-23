import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionLabel } from '../components/SectionLabel';
import { SkillNodeCard } from '../components/SkillNodeCard';
import { BRANCH_LABELS, skillTree, type SkillBranch } from '../data/skillTree';
import { useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';

const BRANCHES: SkillBranch[] = ['tuccar', 'usta', 'esnaf'];

// Bölüm 7: Yetenek Ağacı — Tüccar / Usta / Esnaf. Puanlar (Bölüm 23-24'ün
// seviye sisteminden kazanılır, bkz. Profil) burada yeteneklere harcanır.
export function YeteneklerScreen() {
  const skillPoints = useGameStore((s) => s.skillPoints);
  const skillLevels = useGameStore((s) => s.skillLevels);
  const levelUpSkill = useGameStore((s) => s.levelUpSkill);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Yetenekler</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeLabel}>{skillPoints} puan</Text>
          </View>
        </View>

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
  skillGroup: {
    gap: 10,
  },
});
