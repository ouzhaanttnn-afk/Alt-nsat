import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NegotiationLine } from '../types/incomingCustomer';
import { border, colors, fonts, fontSizes, radius } from '../theme';
import { ProductIcon } from './icons/ProductIcon';

/**
 * [YENİ] UX revizyonu — Toplu Alım'ın "ne getirdiğini bir bakışta göster"
 * adımı: müşterinin getirdiği TÜM kalemleri doğal, tek bir liste halinde
 * gösterir. Oyuncu bir satıra dokununca o kalemin bağımsız pazarlık akışı
 * (LineItemNegotiation) açılır — bkz. NegotiationPanel'deki
 * BulkLineNegotiationView.
 */
export function LineItemPicker({
  lines,
  results,
  onSelect,
}: {
  lines: NegotiationLine[];
  results: Record<number, { accepted: boolean; amountTl: number }>;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>GETİRDİĞİ ÜRÜNLER</Text>
      {lines.map((line, index) => {
        const result = results[index];
        const hasQuantity = (line.product.quantity ?? 1) > 1;
        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.rowDivider,
              pressed && styles.rowPressed,
            ]}
          >
            <ProductIcon category={line.product.category} name={line.product.name} size={26} />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {hasQuantity ? `${line.product.quantity} adet ${line.product.name}` : line.product.name}
              </Text>
              <Text style={styles.subtitle}>
                {line.product.karat} Ayar · {line.product.grams.toLocaleString('tr-TR')} g
                {hasQuantity ? '/adet' : ''}
              </Text>
            </View>
            {result ? (
              <Text style={[styles.status, result.accepted ? styles.statusAccepted : styles.statusRejected]}>
                {result.accepted ? '✓ Kabul edildi' : '✕ Reddedildi'}
              </Text>
            ) : (
              <Text style={styles.chevron}>›</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  heading: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkMuted,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  rowDivider: {
    borderTopWidth: border.width,
    borderTopColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  status: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  statusAccepted: {
    color: colors.positive,
  },
  statusRejected: {
    color: colors.negative,
  },
  chevron: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    color: colors.accent,
  },
});
