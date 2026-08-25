import { StyleSheet, Text, View } from 'react-native';
import type { NegotiationCustomer } from '../types/negotiation';
import { fonts, fontSizes } from '../theme';
import { glass } from '../theme/glass';
import { formatTl } from '../utils/format';
import { GlassCard } from './GlassCard';
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
// [YENİ] `compact` — müşteri+ürün artık yan yana iki panel: bu modda kart
// daha az yer kaplar (küçük avatar, tip etiketi yok, talep 2 satıra sınırlı,
// aciliyet/pazarlık tek satırda birleşik).
export function CustomerNoteCard({
  customer,
  patienceRatio,
  compact,
}: {
  customer: NegotiationCustomer;
  patienceRatio?: number;
  compact?: boolean;
}) {
  const metaLine = [customer.urgency, styleLabel[customer.bargainingStyle]].filter(Boolean).join(' · ');

  if (compact) {
    return (
      <GlassCard style={styles.compactCard}>
        <View style={styles.compactTopRow}>
          <AvatarInitial name={customer.name} size={20} />
          <Text style={styles.compactName} numberOfLines={1}>
            {customer.name}
          </Text>
        </View>
        <Text style={styles.compactRequest} numberOfLines={2}>
          “{customer.request}”
        </Text>
        <Text style={styles.compactMeta} numberOfLines={1}>
          {metaLine}
        </Text>
        {patienceRatio !== undefined && (
          <View style={styles.patienceTrack}>
            <View
              style={[
                styles.patienceFill,
                { width: `${Math.round(Math.max(0, Math.min(1, patienceRatio)) * 100)}%` },
              ]}
            />
          </View>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.topRow}>
        <AvatarInitial name={customer.name} size={36} />
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
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  // [DÜZELTME] Müşteri kartı gereksiz dikey padding'den arındırıldı — oyuncu
  // müşteriyi ve isteğini kaydırmadan, ilk bakışta görmeli.
  card: {
    padding: 10,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
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
    color: glass.ink,
  },
  typeTag: {
    backgroundColor: glass.sunken,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  typeTagLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: glass.inkMuted,
  },
  request: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: glass.ink,
    marginTop: 2,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  metaItem: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: glass.inkMuted,
  },
  patienceTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: glass.sunken,
    marginTop: 6,
    overflow: 'hidden',
  },
  patienceFill: {
    height: '100%',
    backgroundColor: glass.warning,
    borderRadius: 3,
  },
  // ---------- compact (yan yana Müşteri + Ürün düzeni) ----------
  compactCard: {
    flex: 1,
    minWidth: 0,
    padding: 7,
    gap: 3,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compactName: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: glass.ink,
  },
  compactRequest: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: glass.ink,
    fontStyle: 'italic',
    lineHeight: 12,
  },
  compactMeta: {
    fontFamily: fonts.mono,
    fontSize: 8.5,
    color: glass.inkMuted,
  },
});
