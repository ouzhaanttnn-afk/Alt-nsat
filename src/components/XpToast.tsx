import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes, radius, shadow } from '../theme';

// Bölüm 23-24 UX: "oyuncu XP neden geldi diye düşünmesin" — her kazanımda
// tek satırlık, otomatik kaybolan bir bildirim (bkz. NegotiationPanel/KasamScreen).
export function XpToast({ amount, reason, onDone }: { amount: number; reason: string; onDone: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const hideTimer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(onDone);
    }, 2200);
    return () => clearTimeout(hideTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (amount <= 0) return null;

  return (
    <Animated.View style={[styles.toast, { opacity: fade }]}>
      <Text style={styles.amount}>+{Math.round(amount)} XP</Text>
      <Text style={styles.reason}>{reason}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    gap: 7,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 11,
    ...shadow,
  },
  amount: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.sm,
    color: colors.brass,
  },
  reason: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.white,
    opacity: 0.85,
  },
});
