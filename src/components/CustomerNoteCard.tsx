import { StyleSheet, Text, View } from 'react-native';
import type { NegotiationCustomer } from '../types/negotiation';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { AvatarInitial } from './icons/AvatarInitial';

const styleLabel: Record<NegotiationCustomer['bargainingStyle'], string> = {
  sert: 'Sert pazarlıkçı',
  dengeli: 'Dengeli',
  kolay: 'Kolay ikna olur',
};

// Bölüm 4.3: Müşteri notu — baş harf avatar + müşteri tipi + talep +
// bütçe/aciliyet/pazarlık eğilimi bilgisi.
export function CustomerNoteCard({ customer }: { customer: NegotiationCustomer }) {
  return (
    <Card style={styles.card}>
      <AvatarInitial name={customer.name} size={44} />
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{customer.name}</Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagLabel}>{customer.type}</Text>
          </View>
        </View>
        <Text style={styles.request}>“{customer.request}”</Text>
        <View style={styles.metaRow}>
          {customer.urgency && <Text style={styles.metaItem}>Aciliyet: {customer.urgency}</Text>}
          {customer.budgetTl && (
            <Text style={styles.metaItem}>Bütçe: ~{formatTl(customer.budgetTl)}</Text>
          )}
          <Text style={styles.metaItem}>{styleLabel[customer.bargainingStyle]}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  typeTag: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  typeTagLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  request: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
    marginTop: 4,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  metaItem: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
});
