import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';

export type ActionToastState = {
  message: string;
  tone?: 'success' | 'error' | 'neutral';
};

export function ActionToast({ toast }: { toast: ActionToastState | null }) {
  if (!toast) return null;

  const tone = toast.tone ?? 'neutral';

  return (
    <View style={[styles.container, tone === 'success' && styles.success, tone === 'error' && styles.error]}>
      <Text style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
  success: {
    borderColor: colors.positive,
  },
  error: {
    borderColor: colors.negative,
  },
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
});
