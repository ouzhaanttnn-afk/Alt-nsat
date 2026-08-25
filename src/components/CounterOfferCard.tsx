import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
import { glass } from '../theme/glass';
import { formatTl } from '../utils/format';

// v2 pazarlık: müşterinin gerçek karşı teklifi. "Bu ürünü şu fiyata almalısın"
// gibi doğrudan bir tavsiye vermiyor — sadece müşterinin kendi pozisyonunu
// söylüyor, kararı (Kabul Et / meet-halfway / Vazgeç) tamamen oyuncuya bırakıyor.
export function CounterOfferCard({
  customerName,
  counterAmountTl,
  raiseLabel,
  onAccept,
  onMeetHalfway,
  onWalkAway,
}: {
  customerName: string;
  counterAmountTl: number;
  /** Alım yönünde "Teklifi Yükselt", satış yönünde "Fiyatı Düşür". */
  raiseLabel: string;
  onAccept: () => void;
  onMeetHalfway: () => void;
  onWalkAway: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Animated.View style={[styles.card, { opacity: fade }]}>
      <Text style={styles.speaker}>{customerName}</Text>
      <Text style={styles.line} numberOfLines={2}>
        “Bu fiyat bana düşük geldi — {formatTl(counterAmountTl)} olursa anlaşabiliriz.”
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptButtonLabel}>Kabul Et · {formatTl(counterAmountTl)}</Text>
        </Pressable>
        <View style={styles.secondaryRow}>
          <Pressable style={styles.secondaryButton} onPress={onMeetHalfway}>
            <Text style={styles.secondaryButtonLabel}>{raiseLabel}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, styles.walkAwayButton]} onPress={onWalkAway}>
            <Text style={[styles.secondaryButtonLabel, styles.walkAwayLabel]}>Vazgeç</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: glass.panelBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: glass.gold,
    padding: 8,
  },
  speaker: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: glass.goldBright,
  },
  line: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: glass.ink,
    fontStyle: 'italic',
    marginTop: 1,
  },
  actions: {
    marginTop: 6,
  },
  acceptButton: {
    backgroundColor: glass.gold,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#3A2A00',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: glass.chipBg,
    borderWidth: 1,
    borderColor: glass.borderSoft,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: glass.ink,
  },
  walkAwayButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: glass.negative,
  },
  walkAwayLabel: {
    color: glass.negative,
  },
});
