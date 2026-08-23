import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';

// Bölüm 4.3 satış modu: dükkâna gelen müşteriye satarken sadece iki
// aksiyon var — kredi/tam fiyat kavramları alım moduna özgü, burada yok.
export function SaleActions({
  disabled,
  onOfferPrice,
  onReject,
}: {
  disabled?: boolean;
  onOfferPrice: () => void;
  onReject: () => void;
}) {
  return (
    <View>
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
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.negative,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.negative,
  },
  disabled: {
    opacity: 0.4,
  },
  warning: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMutedOnDark,
    textAlign: 'center',
    marginTop: 12,
  },
});
