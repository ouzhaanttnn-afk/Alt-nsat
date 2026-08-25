import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
import { glass } from '../theme/glass';

// Bölüm 4.3: Üç aksiyon — Teklifi Gönder (birincil) / Tam Fiyatı Öde + Reddet (ikili sıra).
export function NegotiationActions({
  disabled,
  onSendOffer,
  onPayFull,
  onReject,
  payFullHint,
}: {
  disabled?: boolean;
  onSendOffer: () => void;
  onPayFull: () => void;
  onReject: () => void;
  /** Nakit yetmediğinde "Tam Fiyatı Öde"nin borç alacağını hatırlatan not. */
  payFullHint?: string;
}) {
  return (
    <View>
      <Pressable
        disabled={disabled}
        onPress={onSendOffer}
        style={[styles.primaryButton, disabled && styles.disabled]}
      >
        <Text style={styles.primaryButtonLabel}>Teklifi Gönder</Text>
      </Pressable>

      <View style={styles.secondaryRow}>
        <View style={styles.secondaryColumn}>
          <Pressable
            disabled={disabled}
            onPress={onPayFull}
            style={[styles.secondaryButton, disabled && styles.disabled]}
          >
            <Text style={styles.secondaryButtonLabel}>Tam Fiyatı Öde</Text>
          </Pressable>
          {payFullHint && <Text style={styles.payFullHint} numberOfLines={1}>{payFullHint}</Text>}
        </View>
        <Pressable
          disabled={disabled}
          onPress={onReject}
          style={[styles.secondaryButton, styles.rejectButton, disabled && styles.disabled]}
        >
          <Text style={[styles.secondaryButtonLabel, styles.rejectLabel]}>Reddet</Text>
        </Pressable>
      </View>
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
  secondaryRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    alignItems: 'flex-start',
  },
  secondaryColumn: {
    flex: 1,
  },
  payFullHint: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: glass.warning,
    textAlign: 'center',
    marginTop: 2,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: glass.chipBg,
    borderWidth: 1,
    borderColor: glass.borderSoft,
  },
  rejectButton: {
    borderColor: glass.negative,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: glass.ink,
  },
  rejectLabel: {
    color: glass.negative,
  },
  disabled: {
    opacity: 0.4,
  },
});
