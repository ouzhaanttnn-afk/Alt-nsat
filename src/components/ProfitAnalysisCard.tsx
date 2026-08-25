import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { fonts, fontSizes } from '../theme';
import { glass } from '../theme/glass';
import { formatTl } from '../utils/format';
import { GlassCard } from './GlassCard';

const DONUT_SIZE = 84;
const DONUT_STROKE_WIDTH = 12;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE_WIDTH) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

// Maliyet/kâr oranını gösteren, halka grafikli genel kart — hem tek bir
// pazarlığın anlık kâr analizinde (bkz. KarAnaliziCard) hem Profil'deki
// ömür boyu toplam alım-satım kârında kullanılır. Kârlıysa gri (maliyet)
// + yeşil (kâr) iki dilim; zararda negatif dilim anlamsız olduğundan tek
// renkli kırmızı halkaya düşer.
export function ProfitAnalysisCard({
  title = 'KÂR ANALİZİ',
  costLabel,
  profitLabel,
  costTl,
  profitTl,
  tip,
  showSaleValue,
  secondary,
}: {
  title?: string;
  costLabel: string;
  profitLabel: string;
  costTl: number;
  profitTl: number;
  tip?: string;
  /** "Toplam Satım" satırını (costTl + profitTl olarak türetilir) ayrıca gösterir. */
  showSaleValue?: boolean;
  /** Gerçekleşmemiş (stokta bekleyen) potansiyeli ayrı bir alt bölümde gösterir — Bölüm 6/7: gerçekleşen ile potansiyel birbirine karıştırılmasın. */
  secondary?: { label: string; valueTl: number; caption: string };
}) {
  const marginPercent = costTl > 0 ? (profitTl / costTl) * 100 : 0;
  const positive = profitTl >= 0;
  const saleValueTl = costTl + profitTl;
  const secondaryPositive = secondary ? secondary.valueTl >= 0 : true;

  return (
    <GlassCard>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.body}>
        <ProfitDonut costTl={costTl} profitTl={profitTl} marginPercent={marginPercent} />
        <View style={styles.rows}>
          <Row dotColor={glass.inkMuted} label={costLabel} value={formatTl(costTl)} />
          {showSaleValue && <Row dotColor={glass.inkMuted} label="Toplam Satım" value={formatTl(saleValueTl)} />}
          <Row
            dotColor={positive ? glass.positive : glass.negative}
            label={profitLabel}
            value={`${positive ? '+' : ''}${formatTl(profitTl)}`}
            valueColor={positive ? glass.positive : glass.negative}
            bold
          />
          <Row
            dotColor={positive ? glass.positive : glass.negative}
            label="Kâr Marjı"
            value={`%${marginPercent.toFixed(1)}`}
            valueColor={positive ? glass.positive : glass.negative}
          />
        </View>
      </View>
      {tip && <Text style={styles.tip}>{tip}</Text>}
      {secondary && (
        <View style={styles.secondaryBlock}>
          <View style={styles.secondaryRow}>
            <Text style={styles.secondaryLabel}>{secondary.label}</Text>
            <Text style={[styles.secondaryValue, { color: secondaryPositive ? glass.positive : glass.negative }]}>
              {secondaryPositive ? '+' : ''}
              {formatTl(secondary.valueTl)}
            </Text>
          </View>
          <Text style={styles.secondaryCaption}>{secondary.caption}</Text>
        </View>
      )}
    </GlassCard>
  );
}

function ProfitDonut({
  costTl,
  profitTl,
  marginPercent,
}: {
  costTl: number;
  profitTl: number;
  marginPercent: number;
}) {
  const positive = profitTl >= 0;
  const resaleTl = costTl + profitTl;
  const profitRatio = positive && resaleTl > 0 ? Math.min(1, profitTl / resaleTl) : 0;
  const profitLength = DONUT_CIRCUMFERENCE * profitRatio;
  const costLength = DONUT_CIRCUMFERENCE - profitLength;
  const costColor = positive ? glass.inkMuted : glass.negative;

  return (
    <View style={styles.donutWrap}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
        <G rotation="-90" origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}>
          <Circle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={DONUT_RADIUS}
            stroke={costColor}
            strokeWidth={DONUT_STROKE_WIDTH}
            strokeDasharray={`${costLength} ${DONUT_CIRCUMFERENCE - costLength}`}
            fill="none"
          />
          {profitLength > 0 && (
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_RADIUS}
              stroke={glass.positive}
              strokeWidth={DONUT_STROKE_WIDTH}
              strokeDasharray={`${profitLength} ${DONUT_CIRCUMFERENCE - profitLength}`}
              strokeDashoffset={-costLength}
              fill="none"
            />
          )}
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={[styles.donutMargin, { color: positive ? glass.positive : glass.negative }]}>
          %{marginPercent.toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

function Row({
  dotColor,
  label,
  value,
  valueColor,
  bold,
}: {
  dotColor: string;
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelGroup}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, bold && styles.rowValueBold, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: glass.inkMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  donutWrap: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutMargin: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.sm,
  },
  rows: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: glass.inkMuted,
  },
  rowValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: glass.ink,
  },
  rowValueBold: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
  },
  tip: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: glass.inkMuted,
    fontStyle: 'italic',
    marginTop: 10,
  },
  secondaryBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: glass.borderSoft,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: glass.inkMuted,
  },
  secondaryValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
  },
  secondaryCaption: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: glass.inkMuted,
    marginTop: 3,
  },
});
