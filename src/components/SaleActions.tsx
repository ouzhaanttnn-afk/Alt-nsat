import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, fontSizes, radius } from '../theme';
import { glass } from '../theme/glass';

// Bölüm 4.3 satış modu: dükkâna gelen müşteriye satarken sadece iki
// aksiyon var — kredi/tam fiyat kavramları alım moduna özgü, burada yok.
export function SaleActions({
  disabled,
  onOfferPrice,
  onReject,
  rejectionHint,
}: {
  disabled?: boolean;
  onOfferPrice: () => void;
  onReject: () => void;
  /** Müşteri bir önceki teklifi reddettiğinde gösterilen, kalan hak sayısını belirten uyarı. */
  rejectionHint?: string;
}) {
  return (
    <View>
      {rejectionHint && <Text style={styles.rejectionHint}>{rejectionHint}</Text>}

      <Pressable
        disabled={disabled}
        onPress={onOfferPrice}
        style={[styles.primaryButton, disabled && styles.disabled]}
      >
        <Text style={styles.primaryButtonLabel}>Fiyatı Öner</Text>
      </Pressable>

      <Pressable
        disabled={disabled}
        onPress={onReject}
        style={[styles.secondaryButton, disabled && styles.disabled]}
      >
        <Text style={styles.secondaryButtonLabel}>Satmak İstemiyorum</Text>
      </Pressable>

      <Text style={styles.warning}>Fiyatı çok yüksek tutarsan müşteri alışveriş yapmadan ayrılabilir.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: glass.gold,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: '#3A2A00',
  },
  secondaryButton: {
    marginTop: 8,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: glass.chipBg,
    borderWidth: 1,
    borderColor: glass.negative,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: glass.negative,
  },
  disabled: {
    opacity: 0.4,
  },
  warning: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: glass.inkMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  rejectionHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: glass.warning,
    textAlign: 'center',
    marginBottom: 8,
  },
});
