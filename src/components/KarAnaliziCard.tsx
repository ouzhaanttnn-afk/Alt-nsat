import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';

const DONUT_SIZE = 84;
const DONUT_STROKE_WIDTH = 12;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE_WIDTH) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

// Bölüm 5/9: müşteriden alım/bozdurma pazarlığında, mevcut teklifin
// toptancıya (genel ALIŞ + toptancı marjı üzerinden, Toptancı Bağlantısı
// ile aynı formül) hemen devredilmesi hâlinde ne kazandıracağını canlı
// gösterir — piyasa değeri değil, gerçek kesin gelir üzerinden. Halka
// grafik, toptancı değerini maliyet/kâr olarak ikiye bölüp merkezde
// kâr marjını gösterir; zararda tek renkli halkaya düşer.
export function KarAnaliziCard({
  offerTl,
  estimatedResaleTl,
}: {
  offerTl: number;
  estimatedResaleTl: number;
}) {
  const profitTl = estimatedResaleTl - offerTl;
  const marginPercent = offerTl > 0 ? (profitTl / offerTl) * 100 : 0;
  const positive = profitTl >= 0;

  return (
    <Card>
      <Text style={styles.label}>KÂR ANALİZİ</Text>
      <View style={styles.body}>
        <ProfitDonut offerTl={offerTl} profitTl={profitTl} marginPercent={marginPercent} />
        <View style={styles.rows}>
          <Row dotColor={colors.inkMuted} label="Ortalama Maliyet" value={formatTl(offerTl)} />
          <Row
            dotColor={positive ? colors.positive : colors.negative}
            label="Tahmini Kâr"
            value={`${positive ? '+' : ''}${formatTl(profitTl)}`}
            valueColor={positive ? colors.positive : colors.negative}
            bold
          />
          <Row
            dotColor={positive ? colors.positive : colors.negative}
            label="Kâr Marjı"
            value={`%${marginPercent.toFixed(1)}`}
            valueColor={positive ? colors.positive : colors.negative}
          />
        </View>
      </View>
      <Text style={styles.tip}>Daha düşük teklif kârını artırır ama kabul ihtimalini ve karizmanı düşürür.</Text>
    </Card>
  );
}

function ProfitDonut({
  offerTl,
  profitTl,
  marginPercent,
}: {
  offerTl: number;
  profitTl: number;
  marginPercent: number;
}) {
  const positive = profitTl >= 0;
  const resaleTl = offerTl + profitTl;
  const profitRatio = positive && resaleTl > 0 ? Math.min(1, profitTl / resaleTl) : 0;
  const profitLength = DONUT_CIRCUMFERENCE * profitRatio;
  const costLength = DONUT_CIRCUMFERENCE - profitLength;
  const costColor = positive ? colors.inkMuted : colors.negative;

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
              stroke={colors.positive}
              strokeWidth={DONUT_STROKE_WIDTH}
              strokeDasharray={`${profitLength} ${DONUT_CIRCUMFERENCE - profitLength}`}
              strokeDashoffset={-costLength}
              fill="none"
            />
          )}
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={[styles.donutMargin, { color: positive ? colors.positive : colors.negative }]}>
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
    color: colors.inkMuted,
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
    color: colors.inkMuted,
  },
  rowValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  rowValueBold: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
  },
  tip: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: 10,
  },
});
