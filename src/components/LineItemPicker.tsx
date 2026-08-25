import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NegotiationLine } from '../types/incomingCustomer';
import { colors, fonts, fontSizes, radius } from '../theme';
import { ProductIcon } from './icons/ProductIcon';

/**
 * [YENİ] UX revizyonu — Toplu Alım'ın "ne getirdiğini bir bakışta göster"
 * adımı: müşterinin getirdiği TÜM kalemleri kompakt "ürün baloncukları"
 * (2 sütunlu mini kart grid'i) halinde gösterir. Oyuncu bir baloncuğa
 * dokununca o kalemin bağımsız pazarlık akışı (LineItemNegotiation) açılır
 * — bkz. NegotiationPanel'deki BulkLineNegotiationView. Test edilmiş ama
 * henüz sonuçlanmamış kalemler "Test Edildi" rozetiyle ayırt edilir.
 */
export function LineItemPicker({
  lines,
  results,
  testedMap,
  activeIndex,
  onSelect,
}: {
  lines: NegotiationLine[];
  results: Record<number, { accepted: boolean; amountTl: number }>;
  testedMap: Record<number, boolean>;
  activeIndex: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>GETİRDİĞİ ÜRÜNLER</Text>
      <View style={styles.grid}>
        {lines.map((line, index) => {
          const result = results[index];
          const tested = testedMap[index];
          const isActive = activeIndex === index;
          const hasQuantity = (line.product.quantity ?? 1) > 1;
          return (
            <Pressable
              key={index}
              onPress={() => onSelect(index)}
              style={({ pressed }) => [
                styles.bubble,
                isActive && styles.bubbleActive,
                pressed && styles.bubblePressed,
              ]}
            >
              <View style={styles.bubbleTopRow}>
                <ProductIcon category={line.product.category} name={line.product.name} size={20} />
                {!result && tested && (
                  <View style={styles.testedPill}>
                    <Text style={styles.testedPillLabel}>TEST EDİLDİ</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {hasQuantity ? `${line.product.quantity} adet ${line.product.name}` : line.product.name}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {line.product.karat} Ayar · {line.product.grams.toLocaleString('tr-TR')} g
                {hasQuantity ? '/adet' : ''}
              </Text>
              {result && (
                <Text style={[styles.status, result.accepted ? styles.statusAccepted : styles.statusRejected]}>
                  {result.accepted ? '✓ Kabul edildi' : '✕ Reddedildi'}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  heading: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkMutedOnDark,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bubble: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 8,
    gap: 2,
  },
  bubbleActive: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  bubblePressed: {
    backgroundColor: colors.surfaceSunken,
  },
  bubbleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkMuted,
  },
  status: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    marginTop: 1,
  },
  statusAccepted: {
    color: colors.positive,
  },
  statusRejected: {
    color: colors.negative,
  },
  testedPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  testedPillLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 7,
    letterSpacing: 0.2,
    color: colors.accentDark,
  },
});
