import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { craftedGoodEstimatedValueTl, craftedGoodHasGrams, craftedGoodMetalValueTl } from '../engine/craftedGoods';
import { colors, fonts, fontSizes, radius } from '../theme';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';
import { formatTl } from '../utils/format';

// Bölüm 16: işçilikli ürün kartı — GDD'nin kesin kararı gereği burada
// "Sat" değil sadece "Erit" var; işçilikli ürün başka bir müşteriye asla
// işçilikli ürün olarak satılmıyor.
export function CraftedGoodCard({
  item,
  buyPricePerGram,
  onMelt,
  onHold,
  onStartWorkshop,
  onCollectWorkshop,
  meltDisabled,
  workshopLocked,
  workshopDisabled,
  requiredLevel,
  holdActive,
}: {
  item: InventoryItem;
  buyPricePerGram: number;
  onMelt: () => void;
  onHold: () => void;
  onStartWorkshop: () => void;
  onCollectWorkshop: () => void;
  meltDisabled?: boolean;
  workshopLocked?: boolean;
  workshopDisabled?: boolean;
  requiredLevel: number;
  holdActive?: boolean;
}) {
  const workshopStatus = item.workshopStatus ?? 'none';
  const isProcessing = workshopStatus === 'processing';
  const isReady = workshopStatus === 'ready';
  const hasGrams = craftedGoodHasGrams(item);
  const metalValueTl = craftedGoodMetalValueTl(item, buyPricePerGram);
  const estimatedValueTl = craftedGoodEstimatedValueTl(item, buyPricePerGram);
  const workshopButtonLabel = workshopLocked
    ? `ATÖLYE 🔒 Sv.${requiredLevel}`
    : isReady
      ? 'TESLİM AL'
      : isProcessing
        ? 'İŞLENİYOR'
        : item.workshopProcessed
          ? 'İŞLENDİ'
          : 'ATÖLYE';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ProductIcon category={item.category} name={item.name} size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.karat} Ayar (beyan), {item.grams.toLocaleString('tr-TR')}g
          </Text>
          <Text style={styles.source}>{item.source ?? 'Müşteri getirdi'}</Text>
        </View>
        <Text style={[styles.status, isReady && styles.readyStatus]}>
          {isReady ? 'ATÖLYE HAZIR' : isProcessing ? 'İŞLENİYOR' : holdActive ? 'BEKLETİLİYOR' : 'STOKTA'}
        </Text>
      </View>
      <View style={styles.valueGrid}>
        <View style={styles.valueCell}>
          <Text style={styles.valueLabel}>Alış</Text>
          <Text style={styles.valueText}>{formatTl(item.costBasisTl)}</Text>
        </View>
        <View style={styles.valueCell}>
          <Text style={styles.valueLabel}>Has</Text>
          <Text style={styles.valueText}>{hasGrams.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}g</Text>
        </View>
        <View style={styles.valueCell}>
          <Text style={styles.valueLabel}>Metal</Text>
          <Text style={styles.valueText}>{formatTl(metalValueTl)}</Text>
        </View>
        <View style={styles.valueCell}>
          <Text style={styles.valueLabel}>Tahmini</Text>
          <Text style={styles.valueText}>{formatTl(estimatedValueTl)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable disabled={isProcessing} onPress={onHold} style={[styles.secondaryButton, isProcessing && styles.disabled]}>
          <Text style={styles.secondaryButtonLabel}>BEKLET</Text>
        </Pressable>
        <Pressable
          disabled={meltDisabled || isProcessing || isReady}
          onPress={onMelt}
          style={[styles.meltButton, (meltDisabled || isProcessing || isReady) && styles.disabled]}
        >
          <Text style={styles.meltButtonLabel}>ERİT</Text>
        </Pressable>
        <Pressable
          disabled={workshopLocked || workshopDisabled || isProcessing || item.workshopProcessed}
          onPress={isReady ? onCollectWorkshop : onStartWorkshop}
          style={[
            styles.workshopButton,
            (workshopLocked || workshopDisabled || isProcessing || (item.workshopProcessed && !isReady)) && styles.disabled,
          ]}
        >
          <Text style={styles.workshopButtonLabel}>{workshopButtonLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.notesRow}>
        <Text style={styles.note}>Erit: hızlı likidite, işçilik kaybolur.</Text>
        <Text style={styles.note}>Atölye: zaman, tek seferlik işçilik primi.</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 1,
  },
  source: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 1,
  },
  status: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    color: colors.inkMuted,
  },
  readyStatus: {
    color: colors.positive,
  },
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
    marginTop: 10,
  },
  valueCell: {
    width: '50%',
  },
  valueLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkMuted,
  },
  valueText: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.xs,
    color: colors.ink,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkMuted,
  },
  meltButton: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  workshopButton: {
    flex: 1.25,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  meltButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.white,
  },
  workshopButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.white,
  },
  notesRow: {
    marginTop: 8,
    gap: 2,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
  },
});
