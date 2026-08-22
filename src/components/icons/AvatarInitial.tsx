import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

// Bölüm 1: İkonografi — müşteri için emoji yerine baş harf avatarı.
export function AvatarInitial({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: fonts.headingBold,
    color: colors.white,
  },
});
