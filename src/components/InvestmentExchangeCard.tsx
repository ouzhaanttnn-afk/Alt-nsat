import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InvestmentProductSpec } from '../data/investmentProducts';
import type { GoldPriceState, InventoryItem } from '../types/game';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Badge } from './Badge';
import { Card } from './Card';
import { RingIcon } from './icons/RingIcon';

// Bölüm 4.5: Yatırımlar — pazarlıksız borsa masası satırı. Piyasa'daki
// tek seferlik fırsatların aksine burada ürün hiç tükenmez, her an
// güncel ALIŞ/SATIŞ kurundan istenen adette anında alım-satım yapılır.
export function InvestmentExchangeCard({
  spec,
  goldPrice,
  cashTl,
  ownedItem,
  onBuy,
  onSell,
  sellable = true,
}: {
  spec: InvestmentProductSpec;
  goldPrice: GoldPriceState;
  cashTl: number;
  ownedItem?: InventoryItem;
  onBuy: (quantity: number) => void;
  onSell?: (quantity: number) => void;
  /** false ise sadece restok (Satın Al) — takı gibi müşteriye pazarlıkla satılan stoklar için. */
  sellable?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);

  const equivGrams = spec.grams * (spec.karat / 24);
  const unitBuyPriceTl = equivGrams * goldPrice.sellPricePerGram;
  const unitSellPriceTl = equivGrams * goldPrice.buyPricePerGram;
  const totalBuyCostTl = unitBuyPriceTl * quantity;
  const totalSellProceedsTl = unitSellPriceTl * quantity;

  const ownedQuantity = ownedItem?.quantity ?? 0;
  const canBuy = totalBuyCostTl <= cashTl;
  const canSell = ownedQuantity >= quantity;

  const currentValueTl = ownedItem ? equivGrams * ownedItem.quantity * goldPrice.buyPricePerGram : 0;
  const profitTl = ownedItem ? currentValueTl - ownedItem.costBasisTl : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <RingIcon size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>{spec.name}</Text>
          <Text style={styles.meta}>
            {spec.karat} Ayar, {spec.grams.toLocaleString('tr-TR')}g/adet
          </Text>
        </View>
        {ownedItem && sellable && (
          <Badge
            tone={profitTl >= 0 ? 'positive' : 'negative'}
            label={`${ownedQuantity} adet · ${profitTl >= 0 ? '+' : ''}${formatTl(profitTl)}`}
          />
        )}
        {ownedItem && !sellable && (
          <Badge tone="neutral" label={`${ownedQuantity} adet stokta`} />
        )}
      </View>

      <View style={styles.priceRow}>
        {sellable && (
          <View style={styles.priceColumn}>
            <Text style={styles.priceLabel}>ALIŞ (satarsın)</Text>
            <Text style={styles.priceValue}>{formatTl(unitSellPriceTl)}</Text>
          </View>
        )}
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>SATIŞ (alırsın)</Text>
          <Text style={styles.priceValue}>{formatTl(unitBuyPriceTl)}</Text>
        </View>
      </View>

      <View style={styles.stepperRow}>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.stepperButtonLabel}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{quantity}</Text>
          <Pressable style={styles.stepperButton} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.stepperButtonLabel}>+</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          {sellable && onSell && (
            <Pressable
              disabled={!canSell}
              onPress={() => onSell(quantity)}
              style={[styles.actionButton, styles.sellButton, !canSell && styles.actionButtonDisabled]}
            >
              <Text style={[styles.actionButtonLabel, styles.sellButtonLabel]}>
                Sat · {formatTl(totalSellProceedsTl)}
              </Text>
            </Pressable>
          )}
          <Pressable
            disabled={!canBuy}
            onPress={() => onBuy(quantity)}
            style={[styles.actionButton, styles.buyButton, !canBuy && styles.actionButtonDisabled]}
          >
            <Text style={[styles.actionButtonLabel, styles.buyButtonLabel]}>
              Satın Al · {formatTl(totalBuyCostTl)}
            </Text>
          </Pressable>
        </View>
      </View>
      {!canBuy && (
        <Text style={styles.hint}>Nakdin yetmiyor — bu masada borç/kredi yok.</Text>
      )}
      {sellable === false && ownedQuantity > 0 && (
        <Text style={styles.hintMuted}>Elindeki stok müşteriye pazarlıkla satılır.</Text>
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    minWidth: 20,
    textAlign: 'center',
  },
  actions: {
    flex: 1,
    gap: 6,
  },
  actionButton: {
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  buyButton: {
    backgroundColor: colors.accent,
  },
  buyButtonLabel: {
    color: colors.white,
  },
  sellButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellButtonLabel: {
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.warning,
    marginTop: 6,
    textAlign: 'center',
  },
  hintMuted: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});
