import { StyleSheet, Text, View } from 'react-native';
import type { NegotiationProduct } from '../types/negotiation';
import { colors, fonts, fontSizes } from '../theme';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';
import { SealIcon } from './icons/SealIcon';

// Bölüm 4.3/10: Ürün kartı — ürün adı, kaynağı, ayar/gram rozetleri,
// varsa ayar onaylı mührü, büyük işlemlerde ("10 Çeyrek" gibi) adet.
export function NegotiationProductCard({ product }: { product: NegotiationProduct }) {
  const hasQuantity = (product.quantity ?? 1) > 1;
  return (
    <Card style={styles.card}>
      {product.sealVerified && (
        <View style={styles.seal}>
          <SealIcon size={32} />
        </View>
      )}
      <View style={styles.row}>
        <ProductIcon category={product.category} name={product.name} size={30} />
        <View style={styles.info}>
          <Text style={styles.name}>
            {hasQuantity ? `${product.quantity} adet ${product.name}` : product.name}
          </Text>
          <Text style={styles.source}>{product.source}</Text>
        </View>
      </View>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{product.karat} Ayar</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>
            {product.grams.toLocaleString('tr-TR')} g{hasQuantity ? '/adet' : ''}
          </Text>
        </View>
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
    top: -10,
    right: -6,
    zIndex: 1,
  },
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
  source: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  badgeLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.ink,
  },
});
