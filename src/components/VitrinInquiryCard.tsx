import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { VitrinSaleInquiry } from '../types/vitrinInquiry';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { AvatarInitial } from './icons/AvatarInitial';

// Vitrin Alıcısı: pasif gelir akışının yanında, ara sıra vitrindeki bir
// takı için gerçek bir müşteri çıkıp vade beklemeden anında satın almak
// ister. Kabul edilirse ürün hemen o fiyata satılır, reddedilirse (ya da
// süresi dolarsa) vitrinde pasif gelir üretmeye devam eder.
export function VitrinInquiryCard({
  inquiry,
  remainingLabel,
  onAccept,
  onReject,
}: {
  inquiry: VitrinSaleInquiry;
  remainingLabel: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>ALICI VAR</Text>
      </View>
      <View style={styles.row}>
        <AvatarInitial name={inquiry.customerName} />
        <View style={styles.info}>
          <Text style={styles.customer}>{inquiry.customerName}</Text>
          <Text style={styles.product}>{inquiry.itemName} için hemen satın almak istiyor</Text>
        </View>
        <Text style={styles.amount}>{formatTl(inquiry.offerAmountTl)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.rejectButton]} onPress={onReject}>
          <Text style={[styles.buttonLabel, styles.rejectLabel]}>Reddet</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.acceptButton]} onPress={onAccept}>
          <Text style={[styles.buttonLabel, styles.acceptLabel]}>Hemen Sat</Text>
        </Pressable>
      </View>
      <Text style={styles.remaining}>{remainingLabel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  badgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.accent,
  },
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
  amount: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.accent,
  },
  rejectButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
  },
  acceptLabel: {
    color: colors.white,
  },
  rejectLabel: {
    color: colors.ink,
  },
  remaining: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 8,
  },
});
