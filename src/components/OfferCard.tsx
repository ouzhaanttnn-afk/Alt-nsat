import { StyleSheet, Text, View } from 'react-native';
import type { Offer, OfferStatus } from '../types/offer';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Badge, type BadgeTone } from './Badge';
import { Card } from './Card';
import { AvatarInitial } from './icons/AvatarInitial';

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  bekleyen: 'Bekleyen',
  kabul: 'Kabul edildi',
  red: 'Reddedildi',
};

const STATUS_TONE: Record<OfferStatus, BadgeTone> = {
  bekleyen: 'warning',
  kabul: 'positive',
  red: 'negative',
};

// Bölüm 4.6: Teklifler listesindeki tek bir pazarlık satırı.
export function OfferCard({
  offer,
  remainingLabel,
}: {
  offer: Offer;
  /** Sadece "bekleyen" tekliflerde: kalan süre metni. */
  remainingLabel?: string;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <AvatarInitial name={offer.customerName} />
        <View style={styles.info}>
          <Text style={styles.customer}>{offer.customerName}</Text>
          <Text style={styles.product}>
            {offer.productName} · {offer.karat} Ayar
          </Text>
        </View>
        <View style={styles.amountBlock}>
          <Text style={styles.amount}>{formatTl(offer.offerAmountTl)}</Text>
          <Badge tone={STATUS_TONE[offer.status]} label={OFFER_STATUS_LABEL[offer.status]} />
        </View>
      </View>
      {offer.status === 'bekleyen' && remainingLabel && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{remainingLabel}</Text>
        </View>
      )}
    </Card>
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
  customer: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  product: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 1,
  },
  amountBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.warning,
  },
});
