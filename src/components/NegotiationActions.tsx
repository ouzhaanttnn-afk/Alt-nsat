import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';

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
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.white,
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
    color: colors.warning,
    textAlign: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rejectButton: {
    borderColor: colors.negative,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  rejectLabel: {
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
    marginTop: 8,
  },
});
