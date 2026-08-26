import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InventoryItem } from '../types/game';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Badge } from './Badge';
import { Card } from './Card';
import { ProductIcon } from './icons/ProductIcon';

// Kasam / Yatırım Ürünlerin: alım-satım pozisyonu — adet, maliyet
// ortalaması, güncel değer ve aradaki makastan doğan kâr/zarar.
// Kullanıcı kararı: farklı fiyatlardan yapılan alımlar tek pozisyonda
// birikip ağırlıklı ortalama maliyet üzerinden kâr hesaplanıyor.
export function TradingPositionCard({
  item,
  currentValueTl,
  currentDay,
  onSell,
  onSellQuantity,
  onHold,
}: {
  item: InventoryItem;
  currentValueTl: number;
  /** Bölüm 4/6: kaç gündür stokta olduğunu göstermek için bugünün gün sayısı. */
  currentDay: number;
  onSell: () => void;
  onSellQuantity?: (quantity: number) => void;
  /** "Beklet" — satmayı erteleme kararını görünür kılan, hafif bir dokunuş. */
  onHold?: () => void;
}) {
  const initialSellQuantity = Math.min(1, item.quantity);
  const [sellQuantity, setSellQuantity] = useState(initialSellQuantity);
  const avgCostPerUnit = item.costBasisTl / item.quantity;
  const currentValuePerUnit = currentValueTl / item.quantity;
  const profitTl = currentValueTl - item.costBasisTl;
  const selectedQuantity = Math.min(item.quantity, Math.max(initialSellQuantity, sellQuantity));
  const selectedSaleValueTl = currentValuePerUnit * selectedQuantity;
  const selectedCostBasisTl = avgCostPerUnit * selectedQuantity;
  const selectedProfitTl = selectedSaleValueTl - selectedCostBasisTl;
  const isProfit = profitTl >= 0;
  const daysHeld = Math.max(0, currentDay - item.acquiredDay);
  const canPartialSell = !!onSellQuantity && item.quantity > initialSellQuantity;
  const changeSellQuantity = (delta: number) => {
    setSellQuantity((current) => Math.min(item.quantity, Math.max(initialSellQuantity, current + delta)));
  };
  const sellSelected = () => {
    if (!onSellQuantity) {
      onSell();
      return;
    }
    onSellQuantity(selectedQuantity);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ProductIcon category={item.category} name={item.name} size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} adet · {item.karat} Ayar,{' '}
            {item.grams.toLocaleString('tr-TR')}g/adet
          </Text>
          <Text style={styles.heldSince}>
            {daysHeld <= 0 ? 'Bugün alındı' : `${daysHeld} gündür stokta`}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Ort. Maliyet</Text>
          <Text style={styles.priceValue}>{formatTl(avgCostPerUnit)}</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Güncel Değer</Text>
          <Text style={styles.priceValue}>{formatTl(currentValuePerUnit)}</Text>
        </View>
      </View>

      {canPartialSell && (
        <View style={styles.sellQuantityRow}>
          <Text style={styles.priceLabel}>Satılacak adet</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepperButton} onPress={() => changeSellQuantity(-1)}>
              <Text style={styles.stepperButtonLabel}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>
              {selectedQuantity.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
            </Text>
            <Pressable style={styles.stepperButton} onPress={() => changeSellQuantity(1)}>
              <Text style={styles.stepperButtonLabel}>+</Text>
            </Pressable>
            <Pressable style={styles.allButton} onPress={() => setSellQuantity(item.quantity)}>
              <Text style={styles.allButtonLabel}>Tümü</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Badge
          tone={isProfit ? 'positive' : 'negative'}
          label={`Potansiyel ${isProfit ? 'kâr' : 'zarar'}: ${isProfit ? '+' : ''}${formatTl(profitTl)}`}
        />
        <View style={styles.buttonGroup}>
          {onHold && (
            <Pressable style={styles.holdButton} onPress={onHold}>
              <Text style={styles.holdButtonLabel}>Beklet</Text>
            </Pressable>
          )}
          <Pressable style={styles.sellButton} onPress={sellSelected}>
            <Text style={styles.sellButtonLabel}>
              TOPTANCIYA SAT · {formatTl(canPartialSell ? selectedSaleValueTl : currentValueTl)}
            </Text>
          </Pressable>
        </View>
      </View>
      {canPartialSell && (
        <Text style={[styles.selectedHint, { color: selectedProfitTl >= 0 ? colors.positive : colors.negative }]}>
          Seçili satış sonucu: {selectedProfitTl >= 0 ? '+' : ''}
          {formatTl(selectedProfitTl)}
        </Text>
      )}
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
  heldSince: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  priceColumn: {
    flex: 1,
  },
  priceLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  priceValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sellQuantityRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
  },
  stepperButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  stepperValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
    minWidth: 34,
    textAlign: 'center',
  },
  allButton: {
    paddingHorizontal: 9,
    height: 30,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  allButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  holdButton: {
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  holdButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkMuted,
  },
  sellButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  selectedHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  sellButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
});
