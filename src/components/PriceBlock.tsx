import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
import { glass } from '../theme/glass';
import { formatTl } from '../utils/format';
import { OfferSlider } from './OfferSlider';

// Bölüm 4.3: Fiyat bloğu — piyasa değeri (üstü çizili referans),
// kaydırmalı teklif çubuğu, canlı güncellenen teklif tutarı.
// [DÜZELTME] Artık kendi Card'ını/"TEKLİFİN" başlığını taşımıyor — dışarıdan
// CollapsibleOfferCard tarafından sarmalanıyor (tek, kompakt panel).
export function PriceBlock({
  marketValueTl,
  min,
  max,
  value,
  onChange,
  disabled,
  cashLimited,
  unitPriceTl,
  obscureValue,
}: {
  marketValueTl: number;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Teklif çubuğunun tavanı nakit yetersizliğinden mi kısıtlandı. */
  cashLimited?: boolean;
  /** Sadece alım/bozdurma modu: mevcut teklifin has gram başına karşılığı — piyasa ALIŞ fiyatıyla karşılaştırma kolaylığı için. */
  unitPriceTl?: number;
  /** Hassas Terazi zorunluluğu (v3): test edilmeden kesin piyasa değeri/birim fiyat gösterilmez. */
  obscureValue?: boolean;
}) {
  return (
    <View>
      <View style={styles.priceSection}>
        <Text style={styles.marketValue} numberOfLines={1}>
          {obscureValue
            ? 'Piyasa değeri için önce tart.'
            : `Piyasa ${formatTl(marketValueTl)}${unitPriceTl !== undefined ? ` · ${formatTl(unitPriceTl)}/g` : ''}`}
        </Text>
        {!obscureValue && unitPriceTl !== undefined && (
          <Text style={styles.unitPrice} numberOfLines={1}>Has altın birim fiyatı</Text>
        )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  priceSection: {
    marginBottom: 3,
  },
  marketValue: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: glass.inkMuted,
    textDecorationLine: 'line-through',
  },
  unitPrice: {
    fontFamily: fonts.mono,
    fontSize: 8.5,
    color: glass.inkMuted,
    marginTop: 0,
  },
  sliderWrap: {
    paddingHorizontal: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 1,
    paddingHorizontal: 2,
  },
  rangeLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: glass.inkMuted,
  },
  cashHint: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: glass.warning,
    marginTop: 3,
  },
});
