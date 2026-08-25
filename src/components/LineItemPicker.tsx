import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NegotiationLine } from '../types/incomingCustomer';
import { fonts, fontSizes, radius } from '../theme';
import { glass } from '../theme/glass';
import { ProductIcon } from './icons/ProductIcon';

/**
 * [YENİ] UX revizyonu — Toplu Alım'ın "ne getirdiğini bir bakışta göster"
 * adımı: müşterinin getirdiği TÜM kalemleri kompakt "ürün baloncukları"
 * halinde gösterir. Oyuncu bir baloncuğa dokununca o kalemin bağımsız
 * pazarlık akışı (LineItemNegotiation) açılır — bkz. NegotiationPanel'deki
 * BulkLineNegotiationView. Test edilmiş ama henüz sonuçlanmamış kalemler
 * "Test Edildi" rozetiyle ayırt edilir.
 *
 * `layout="row"` — Müşteri+Ürün yan yana yerleşiminde, dar sağ panelin
 * içine sığması için 2 sütunlu grid yerine tek satır, yatay kaydırılabilir
 * kompakt çip şeridi (başlıksız, dış kart zaten "GETİRDİĞİ ÜRÜNLER" etiketini taşır).
 */
export function LineItemPicker({
  lines,
  results,
  testedMap,
  activeIndex,
  onSelect,
  layout = 'grid',
}: {
  lines: NegotiationLine[];
  results: Record<number, { accepted: boolean; amountTl: number }>;
  testedMap: Record<number, boolean>;
  activeIndex: number | null;
  onSelect: (index: number) => void;
  layout?: 'grid' | 'row';
}) {
  const bubbles = lines.map((line, index) => {
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
          layout === 'row' && styles.bubbleRow,
          isActive && styles.bubbleActive,
          pressed && styles.bubblePressed,
        ]}
      >
        <View style={styles.bubbleTopRow}>
          <ProductIcon category={line.product.category} name={line.product.name} size={layout === 'row' ? 16 : 20} />
          {!result && tested && (
            <View style={styles.testedPill}>
              <Text style={styles.testedPillLabel}>{layout === 'row' ? '✓' : 'TEST EDİLDİ'}</Text>
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
            {result.accepted ? '✓ Kabul' : '✕ Red'}
          </Text>
        )}
      </Pressable>
    );
  });

  if (layout === 'row') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContainer}>
        {bubbles}
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>GETİRDİĞİ ÜRÜNLER</Text>
      <View style={styles.grid}>{bubbles}</View>
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
    color: glass.inkMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  bubble: {
    width: '47%',
    backgroundColor: glass.panelBgAlt,
    borderWidth: 1,
    borderColor: glass.borderSoft,
    borderRadius: radius.md,
    padding: 8,
    gap: 2,
  },
  bubbleRow: {
    width: 108,
    padding: 6,
  },
  bubbleActive: {
    borderColor: glass.gold,
    borderWidth: 1.5,
  },
  bubblePressed: {
    backgroundColor: glass.panelBg,
  },
  bubbleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: glass.ink,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: glass.inkMuted,
  },
  status: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    marginTop: 1,
  },
  statusAccepted: {
    color: glass.positive,
  },
  statusRejected: {
    color: glass.negative,
  },
  testedPill: {
    backgroundColor: glass.purpleSoft,
    borderRadius: 999,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  testedPillLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 7,
    letterSpacing: 0.2,
    color: glass.goldBright,
  },
});
