import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Badge, type BadgeTone } from './Badge';
import { Card } from './Card';
import { RingIcon } from './icons/RingIcon';
import { SealIcon } from './icons/SealIcon';

export interface Opportunity {
  productName: string;
  karat: number;
  grams: number;
  buyPriceTl: number;
  estimatedSellPriceTl: number;
  expertiseRisk: { tone: BadgeTone; label: string };
  opportunityScore: number;
  sealVerified?: boolean;
}

// Bölüm 4.2: Piyasa fırsat kartı — Ana Ekran'da "günün fırsatı" olarak
// tekil gösterim, Piyasa ekranında (Adım 4) liste halinde yeniden kullanılacak.
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const profit = opportunity.estimatedSellPriceTl - opportunity.buyPriceTl;

  return (
    <Card style={styles.card}>
      {opportunity.sealVerified && (
        <View style={styles.seal}>
          <SealIcon size={34} />
        </View>
      )}

      <View style={styles.header}>
        <RingIcon size={28} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{opportunity.productName}</Text>
          <Text style={styles.subtitle}>
            {opportunity.karat} Ayar, {opportunity.grams.toLocaleString('tr-TR')}g
          </Text>
        </View>
      </View>

      <Text style={styles.priceLine}>
        Alış: {formatTl(opportunity.buyPriceTl)} {'  |  '}
        Tahmini satış: {formatTl(opportunity.estimatedSellPriceTl)}
      </Text>

      <View style={styles.badgeRow}>
        <Badge tone="positive" label={`Kâr potansiyeli: +${formatTl(profit)}`} />
        <Badge tone={opportunity.expertiseRisk.tone} label={opportunity.expertiseRisk.label} />
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>Fırsat Skoru</Text>
        <Text style={styles.scoreValue}>{opportunity.opportunityScore}/100</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'visible',
  },
  seal: {
    position: 'absolute',
    top: -12,
    right: -8,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  priceLine: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.ink,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: colors.paperDark,
    paddingTop: 8,
  },
  scoreLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  scoreValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.accent,
  },
});
