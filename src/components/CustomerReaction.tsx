import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
import { glass } from '../theme/glass';

export function CustomerReaction({
  customerName,
  reaction,
  patience,
}: {
  customerName: string;
  reaction: string;
  patience: number;
}) {
  const visiblePatience = Math.max(0, Math.min(4, patience));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{customerName}</Text>
        <Text accessibilityLabel={`Sabır ${visiblePatience}`} style={styles.patience}>
          {'●'.repeat(visiblePatience)}{'○'.repeat(Math.max(0, 3 - visiblePatience))}
        </Text>
      </View>
      <Text style={styles.reaction} numberOfLines={2}>“{reaction}”</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderColor: glass.borderSoft,
    paddingTop: 5,
    gap: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: glass.goldBright,
  },
  patience: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: glass.warning,
    letterSpacing: 1,
  },
  reaction: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: glass.ink,
    fontStyle: 'italic',
  },
});
