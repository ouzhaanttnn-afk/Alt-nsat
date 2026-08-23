import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';

// Bölüm 5/9: müşteriden alım/bozdurma pazarlığında, mevcut teklifin
// toptancıya (genel ALIŞ + toptancı marjı üzerinden, Toptancı Bağlantısı
// ile aynı formül) hemen devredilmesi hâlinde ne kazandıracağını canlı
// gösterir — piyasa değeri değil, gerçek kesin gelir üzerinden.
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
      <Row label="Bu Teklif" value={formatTl(offerTl)} />
      <Row label="Tahmini Toptancı Değeri" value={formatTl(estimatedResaleTl)} />
      <Row
        label="Tahmini Kâr"
        value={`${positive ? '+' : ''}${formatTl(profitTl)}`}
        valueColor={positive ? colors.positive : colors.negative}
        bold
      />
      <Row
        label="Kâr Marjı"
        value={`%${marginPercent.toFixed(1)}`}
        valueColor={positive ? colors.positive : colors.negative}
      />
      <Text style={styles.tip}>Daha düşük teklif kârını artırır ama kabul ihtimalini ve karizmanı düşürür.</Text>
    </Card>
  );
}

function Row({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
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
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
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
    marginTop: 8,
  },
});
