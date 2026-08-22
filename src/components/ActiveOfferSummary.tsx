import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { AvatarInitial } from './icons/AvatarInitial';

export interface ActiveOffer {
  customerName: string;
  productName: string;
  offerAmountTl: number;
  status: string;
}

// Bölüm 4.1: aktif teklif özeti. "Devam Et" Pazarlık Ekranı'na (Adım 3)
// yönlenecek — o ekran kurulana kadar dokunma olayı bağlanmadı.
export function ActiveOfferSummary({ offer }: { offer: ActiveOffer }) {
  return (
    <Card style={styles.card}>
      <AvatarInitial name={offer.customerName} />
      <View style={styles.info}>
        <Text style={styles.customer}>
          {offer.customerName} <Text style={styles.status}>· {offer.status}</Text>
        </Text>
        <Text style={styles.product}>{offer.productName}</Text>
      </View>
      <View style={styles.amountBlock}>
        <Text style={styles.amount}>{formatTl(offer.offerAmountTl)}</Text>
        <Pressable style={styles.button}>
          <Text style={styles.buttonLabel}>Devam Et</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
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
  status: {
    fontFamily: fonts.bodyMedium,
    color: colors.inkMuted,
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
  button: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  buttonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.accent,
  },
});
