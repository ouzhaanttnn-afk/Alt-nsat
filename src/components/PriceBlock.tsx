import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { OfferSlider } from './OfferSlider';

// Bölüm 4.3: Fiyat bloğu — piyasa değeri (üstü çizili referans),
// kaydırmalı teklif çubuğu, canlı güncellenen teklif tutarı.
export function PriceBlock({
  marketValueTl,
  min,
  max,
  value,
  onChange,
  disabled,
  cashLimited,
}: {
  marketValueTl: number;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Teklif çubuğunun tavanı nakit yetersizliğinden mi kısıtlandı. */
  cashLimited?: boolean;
}) {
  return (
    <Card>
      <Text style={styles.label}>TEKLİFİN</Text>
      <View style={styles.priceRow}>
        <Text style={styles.marketValue}>{formatTl(marketValueTl)}</Text>
        <Text style={styles.offerValue}>{formatTl(value)}</Text>
      </View>

      <View style={styles.sliderWrap}>
        <OfferSlider value={value} min={min} max={max} onChange={onChange} disabled={disabled} />
      </View>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>{formatTl(min)}</Text>
        <Text style={styles.rangeLabel}>{formatTl(max)}</Text>
      </View>
      {cashLimited && (
        <Text style={styles.cashHint}>
          Nakdin bu teklife yetiyor kadar — çubuğun tavanı kasandaki parayla sınırlı.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 14,
  },
  marketValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  offerValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.xxl,
    color: colors.ink,
  },
  sliderWrap: {
    paddingHorizontal: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  rangeLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
  cashHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.warning,
    marginTop: 10,
  },
});
