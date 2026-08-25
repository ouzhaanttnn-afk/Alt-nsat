import { StyleSheet, Text, View } from 'react-native';
import { UZMAN_GORUSU_BASE_ERROR_PERCENT, UZMAN_GORUSU_ERROR_REDUCTION_PER_LEVEL } from '../config/economyConfig';
import type { NegotiationProduct } from '../types/negotiation';
import { colors, fonts, fontSizes } from '../theme';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';
import { SealIcon } from './icons/SealIcon';

// Bölüm 4.3/10/11: Ürün kartı — ürün adı, kaynağı, ayar/gram rozetleri,
// varsa ayar onaylı mührü, büyük işlemlerde ("10 Çeyrek" gibi) adet.
// İşçilikli ürünlerde (Bölüm 13-14) `karat` alanı müşterinin BEYANI —
// Uzman Görüşü yatırılmadıkça gerçek ayar/kusur gizli kalır.
export function NegotiationProductCard({
  product,
  uzmanGorusuLevel = 0,
  tested,
}: {
  product: NegotiationProduct;
  uzmanGorusuLevel?: number;
  /** [YENİ] Terazi ile tartıldıysa küçük bir "TEST EDİLDİ" rozeti gösterir. */
  tested?: boolean;
}) {
  const hasQuantity = (product.quantity ?? 1) > 1;
  const isCraftedGood = product.category === 'iscilikli';

  let expertRange: { min: number; max: number } | null = null;
  if (isCraftedGood && uzmanGorusuLevel > 0 && product.actualKarat !== undefined) {
    const errorPercent = Math.max(
      0,
      UZMAN_GORUSU_BASE_ERROR_PERCENT - (uzmanGorusuLevel - 1) * UZMAN_GORUSU_ERROR_REDUCTION_PER_LEVEL,
    );
    const errorMagnitude = Math.round(product.actualKarat * (errorPercent / 100));
    expertRange = {
      min: Math.max(8, product.actualKarat - errorMagnitude),
      max: Math.min(24, product.actualKarat + errorMagnitude),
    };
  }
  const revealsFlaw = isCraftedGood && uzmanGorusuLevel >= 5;

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
        {tested && (
          <View style={styles.testedBadge}>
            <Text style={styles.testedBadgeLabel}>TEST EDİLDİ</Text>
          </View>
        )}
      </View>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{product.karat} Ayar {isCraftedGood ? '(beyan)' : ''}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>
            {product.grams.toLocaleString('tr-TR')} g{hasQuantity ? '/adet' : ''}
          </Text>
        </View>
      </View>

      {isCraftedGood && (
        <View style={styles.expertBox}>
          {expertRange ? (
            <>
              <Text style={styles.expertLabel}>UZMAN GÖRÜŞÜ</Text>
              <Text style={styles.expertValue}>
                Tahmini gerçek ayar: {expertRange.min}–{expertRange.max}
              </Text>
              {revealsFlaw && (
                <Text style={styles.expertValue}>
                  {product.hasHiddenFlaw ? 'Gizli kusur tespit edildi.' : 'Gizli kusur yok, sağlam.'}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.expertLocked}>Kilitli — Uzman Görüşü ile gerçek ayarı gör</Text>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  // [DÜZELTME] Ürün kartı da kompaktlaştırıldı — test/teklif alanına daha
  // az kaydırmayla ulaşılsın.
  card: {
    overflow: 'visible',
    padding: 10,
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
    gap: 8,
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
  testedBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  testedBadgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.3,
    color: colors.positive,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.ink,
  },
  expertBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expertLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  expertValue: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  expertLocked: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
});
