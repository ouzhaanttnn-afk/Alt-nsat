import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterTabs, type FilterOption } from '../components/FilterTabs';
import { OfferCard } from '../components/OfferCard';
import { MINUTES_PER_DAY, useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import type { OfferStatus } from '../types/offer';

type FilterValue = 'tumu' | OfferStatus;

const FILTER_OPTIONS: FilterOption<FilterValue>[] = [
  { label: 'Tümü', value: 'tumu' },
  { label: 'Bekleyen', value: 'bekleyen' },
  { label: 'Kabul', value: 'kabul' },
  { label: 'Red', value: 'red' },
];

function formatRemaining(remainingMinutes: number): string {
  const clamped = Math.max(0, Math.ceil(remainingMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  if (hours <= 0) return `${minutes} dk içinde yanıt verecek`;
  return `${hours} sa ${minutes} dk içinde yanıt verecek`;
}

// Bölüm 4.6: Teklifler — Bekleyen/Kabul/Red durumundaki tüm pazarlıkların
// listesi. Kaydırma çubuğuyla gönderilen teklifler bir süre "bekleyen"
// kalır (bkz. NegotiationPanel'deki sendPendingOffer), sonucu tick() içinde
// açığa çıkar.
export function TekliflerScreen() {
  const offers = useGameStore((s) => s.offers);
  const day = useGameStore((s) => s.day);
  const minuteOfDay = useGameStore((s) => s.minuteOfDay);
  const [filter, setFilter] = useState<FilterValue>('tumu');

  const currentTotalMinutes = day * MINUTES_PER_DAY + minuteOfDay;

  const pendingCount = useMemo(
    () => offers.filter((offer) => offer.status === 'bekleyen').length,
    [offers],
  );

  const filtered = useMemo(
    () => (filter === 'tumu' ? offers : offers.filter((offer) => offer.status === filter)),
    [offers, filter],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Müşteriler</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeLabel}>{pendingCount} bekleyen</Text>
            </View>
          )}
        </View>

        <FilterTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === 'tumu'
                ? 'Henüz gönderilmiş bir teklifin yok. Dükkân\'daki pazarlıkta "Teklifi Gönder" ile bir teklif bekletebilirsin.'
                : 'Bu durumda teklif yok.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                remainingLabel={
                  offer.status === 'bekleyen'
                    ? formatRemaining(offer.resolvesAtTotalMinutes - currentTotalMinutes)
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.inkOnDark,
  },
  pendingBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  pendingBadgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.accentDark,
  },
  list: {
    gap: 10,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
    textAlign: 'center',
    maxWidth: 260,
  },
});
