import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
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
        onPress={onReject}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonLabel}>Satmak İstemiyorum</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: glass.gold,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#3A2A00',
  },
  secondaryButton: {
    marginTop: 6,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: glass.chipBg,
    borderWidth: 1,
    borderColor: glass.negative,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: glass.negative,
  },
  disabled: {
    opacity: 0.4,
  },
  rejectionHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: glass.warning,
    textAlign: 'center',
    marginBottom: 5,
  },
});
