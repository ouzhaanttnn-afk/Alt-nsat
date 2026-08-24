import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { LevelProgressCard } from '../components/LevelProgressCard';
import { ProfitAnalysisCard } from '../components/ProfitAnalysisCard';
import { ReputationGauge } from '../components/ReputationGauge';
import { ShopNameHeader } from '../components/ShopNameHeader';
import { LEVEL_MAX } from '../config/economyConfig';
import { currentPositionValueTl, useGameStore, xpRequiredForLevel } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';

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
  const totalTradingCostBasisTl = useGameStore((s) => s.totalTradingCostBasisTl);
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);

  const isMaxLevel = level >= LEVEL_MAX;
  const xpForCurrentLevel = xpRequiredForLevel(level);
  const xpForNextLevel = xpRequiredForLevel(level + 1);

  // Bölüm 6/7: elde tutulan (henüz SATILMAMIŞ) sarrafiye stoğunun şu anki
  // kurdan potansiyel kâr/zararı — Gerçekleşen Kâr'dan kasıtlı olarak ayrı
  // gösterilir, playtest'te en çok kafa karıştıran nokta buydu.
  const stockPotentialTl = useMemo(
    () =>
      inventory.reduce((sum, item) => {
        if (item.category === 'pirlanta' || item.category === 'iscilikli') return sum;
        return sum + (currentPositionValueTl(item, goldPrice.buyPricePerGram) - item.costBasisTl);
      }, 0),
    [inventory, goldPrice.buyPricePerGram],
  );

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
          <ReputationGauge score={reputation.score} label="KARİZMA" align="flex-start" />
          <ReputationGauge score={wholesalerTrust} label="TOPTANCI GÜVENİ" align="flex-start" />
        </Card>

        <ProfitAnalysisCard
          title="ALIM-SATIM KÂR ANALİZİ"
          costLabel="Satılan Stoğun Maliyeti"
          profitLabel="Gerçekleşen Kâr"
          costTl={totalTradingCostBasisTl}
          profitTl={realizedTradingProfitTl}
          showSaleValue
          tip="Gerçekleşen kâr, sadece SATILAN stoktan hesaplanır — elindeki stoğu satmadan kâr sayılmaz."
          secondary={{
            label: 'Stok Potansiyeli',
            valueTl: stockPotentialTl,
            caption: 'Şu an elindeki (henüz satılmamış) stoğu bugünkü kurdan satarsan oluşacak kâr/zarar.',
          }}
        />
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
});
