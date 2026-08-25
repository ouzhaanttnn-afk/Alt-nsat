import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, fontSizes, radius } from '../theme';
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
          {payFullHint && <Text style={styles.payFullHint}>{payFullHint}</Text>}
        </View>
        <Pressable
          disabled={disabled}
          onPress={onReject}
          style={[styles.secondaryButton, styles.rejectButton, disabled && styles.disabled]}
        >
          <Text style={[styles.secondaryButtonLabel, styles.rejectLabel]}>Reddet</Text>
        </Pressable>
      </View>

      <Text style={styles.warning}>
        Düşük teklif verirsen müşteri başka dükkâna gidebilir.
      </Text>
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
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  secondaryColumn: {
    flex: 1,
  },
  payFullHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: glass.warning,
    textAlign: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
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
    fontSize: fontSizes.sm,
    color: glass.ink,
  },
  rejectLabel: {
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
});
