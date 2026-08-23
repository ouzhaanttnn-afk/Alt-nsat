import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IncomingCustomer } from '../types/incomingCustomer';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { calculateOpportunityScore } from '../utils/opportunityScore';
import { AvatarInitial } from './icons/AvatarInitial';
import { Badge } from './Badge';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';

// Bölüm 4.2/6: dükkâna gelen müşteri kartı — hem stoktan bir şey almak
// (direction:'satis') hem elindekini bozdurmak (direction:'bozdurma')
// isteyen müşteriler aynı kartla gösterilir. Fırsat Skoru sadece
// direction:'satis' için anlamlı (customer.acceptanceThreshold orada
// TAVAN oranı; bozdurmada TABAN oranı olduğundan aynı formül geçerli değil).
export function CustomerArrivalCard({
  incomingCustomer,
  scoreVisible,
  onPress,
}: {
  incomingCustomer: IncomingCustomer;
  scoreVisible: boolean;
  onPress: () => void;
}) {
  const { customer, product, direction } = incomingCustomer;
  const ceilingTl = product.marketValueTl * customer.acceptanceThreshold;
  const score = calculateOpportunityScore(product.marketValueTl, ceilingTl, 'positive');

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <AvatarInitial name={customer.name} />
          <View style={styles.info}>
            <Text style={styles.name}>
              {customer.name} <Text style={styles.type}>· {customer.type}</Text>
            </Text>
            <Text style={styles.request}>“{customer.request}”</Text>
          </View>
        </View>

        <View style={styles.productRow}>
          <ProductIcon category={product.category} name={product.name} size={22} />
          <Text style={styles.productName}>
            {product.quantity && product.quantity > 1 ? `${product.quantity} adet ` : ''}
            {product.name}
          </Text>
          <Text style={styles.productMeta}>
            {product.karat} Ayar, {product.grams.toLocaleString('tr-TR')}g
            {product.quantity && product.quantity > 1 ? '/adet' : ''}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.marketValue}>Piyasa değeri ≈ {formatTl(product.marketValueTl)}</Text>
          {direction === 'satis' &&
            (scoreVisible ? (
              <Badge tone="positive" label={`Fırsat Skoru: ${score}/100`} />
            ) : (
              <Text style={styles.scoreLocked}>Kilitli — Piyasa Sezgisi ile aç</Text>
            ))}
        </View>

        <Text style={styles.cta}>Dokun ve pazarlık yap →</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  type: {
    fontFamily: fonts.bodyMedium,
    color: colors.inkMuted,
  },
  request: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
    marginTop: 2,
    fontStyle: 'italic',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  productName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  productMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginLeft: 'auto',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  marketValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  scoreLocked: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  cta: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.accent,
    textAlign: 'center',
    marginTop: 12,
  },
});
