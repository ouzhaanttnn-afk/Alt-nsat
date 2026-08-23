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

// Bölüm 4.3/6: Müşteri notu — baş harf avatar + müşteri tipi + talep +
// bütçe/aciliyet/pazarlık eğilimi bilgisi. patienceRatio verilirse (Dükkân'a
// gömülü pazarlık paneli), müşterinin ne kadar sabrı kaldığını (oyun
// saatine göre) bir kum saati çubuğu olarak gösterir.
export function CustomerNoteCard({
  customer,
  patienceRatio,
}: {
  customer: NegotiationCustomer;
  patienceRatio?: number;
}) {
  return (
    <Card>
      <View style={styles.topRow}>
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
      </View>
      {patienceRatio !== undefined && (
        <View style={styles.patienceTrack}>
          <View style={[styles.patienceFill, { width: `${Math.round(Math.max(0, Math.min(1, patienceRatio)) * 100)}%` }]} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: {
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
  patienceTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceSunken,
    marginTop: 10,
    overflow: 'hidden',
  },
  patienceFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
  },
});
