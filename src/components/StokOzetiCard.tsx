import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { colors, fonts, fontSizes } from '../theme';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';
import { SectionLabel } from './SectionLabel';

// Mockup birleşimi: Dükkân'ın altında stoğun kısa bir önizlemesi —
// tam envanter/atölye/yatırım detayları Stok sekmesinde.
function inventoryPreviewKey(item: InventoryItem, index: number): string {
  return [
    item.id || 'legacy-stock',
    item.category,
    item.name,
    item.karat,
    item.actualKarat ?? 'declared',
    item.grams,
    item.acquiredDay,
    index,
  ].join(':');
}

export function StokOzetiCard({ items, onSeeAll }: { items: InventoryItem[]; onSeeAll: () => void }) {
  const topItems = items.filter((i) => i.category !== 'pirlanta').slice(0, 4);

  return (
    <View>
      <SectionLabel>STOK ÖZETİ</SectionLabel>
      <Card style={styles.card}>
        {topItems.length === 0 ? (
          <Text style={styles.emptyHint}>Henüz stok yok — Stok sekmesinden toptancıdan al.</Text>
        ) : (
          <View style={styles.itemsRow}>
            {topItems.map((item, index) => (
              <View key={inventoryPreviewKey(item, index)} style={styles.itemCell}>
                <ProductIcon category={item.category} name={item.name} size={26} />
                <Text style={styles.itemQty}>{item.quantity} adet</Text>
              </View>
            ))}
          </View>
        )}
        <Pressable onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllLabel}>Tüm Stok →</Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  itemCell: {
    alignItems: 'center',
    gap: 4,
  },
  itemQty: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  seeAllButton: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  seeAllLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.accent,
    textAlign: 'center',
  },
});
