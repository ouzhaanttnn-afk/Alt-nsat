import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { LevelProgressCard } from '../components/LevelProgressCard';
import { ReputationGauge } from '../components/ReputationGauge';
import { ShopNameHeader } from '../components/ShopNameHeader';
import { LEVEL_MAX } from '../config/economyConfig';
import { useGameStore, xpRequiredForLevel } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';

// Bölüm 31: Profil — oyuncu/dükkân adı, seviye, XP, karizma, toplam kâr.
// Yetenek ağacı artık ayrı bir sekmede (bkz. YeteneklerScreen).
export function ProfilScreen() {
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const shopName = useGameStore((s) => s.shopName);
  const setShopName = useGameStore((s) => s.setShopName);
  const reputation = useGameStore((s) => s.reputation);
  const wholesalerTrust = useGameStore((s) => s.wholesalerTrust);
  const level = useGameStore((s) => s.level);
  const totalXp = useGameStore((s) => s.totalXp);
  const resetSkills = useGameStore((s) => s.resetSkills);
  const realizedTradingProfitTl = useGameStore((s) => s.realizedTradingProfitTl);

  const isMaxLevel = level >= LEVEL_MAX;
  const xpForCurrentLevel = xpRequiredForLevel(level);
  const xpForNextLevel = xpRequiredForLevel(level + 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>

        <Card>
          <Field label="OYUNCU ADI" value={playerName} onChange={setPlayerName} />
          <View style={styles.fieldDivider} />
          <Field label="DÜKKÂN ADI" value={shopName} onChange={setShopName} />
        </Card>

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

        <Card>
          <Text style={styles.statLabel}>TOPLAM ALIM-SATIM KÂRI</Text>
          <Text
            style={[
              styles.statValue,
              { color: realizedTradingProfitTl >= 0 ? colors.positive : colors.negative },
            ]}
          >
            {realizedTradingProfitTl >= 0 ? '+' : ''}
            {formatTl(realizedTradingProfitTl)}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ShopNameHeader name={value} onChange={onChange} onDark={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.inkOnDark,
    marginBottom: 2,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  gaugeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    marginTop: 4,
  },
});
