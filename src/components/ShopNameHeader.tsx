import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';

// Bölüm 31: Profil — özelleştirilebilir oyuncu/dükkân adı. Kaleme
// dokununca düzenleme moduna geçer, onaylayınca (submit/blur) kaydeder.
// onDark: Dükkân başlığı gibi koyu lacivert zeminde mi (varsayılan) —
// bu durumda daha sade bir arayüz için küçük, altın parıltılı bir
// baloncuk içinde gösterilir — yoksa Profil'deki gibi krem bir Card
// içinde düz bir alan mı olduğu.
export function ShopNameHeader({
  name,
  onChange,
  onDark = true,
}: {
  name: string;
  onChange: (name: string) => void;
  onDark?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    onChange(draft);
    setEditing(false);
  };

  const wordmarkColor = onDark ? colors.brass : colors.ink;
  const pencilColor = onDark ? colors.inkMutedOnDark : colors.inkMuted;

  if (editing) {
    return (
      <View style={[styles.row, onDark && styles.bubble]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          onBlur={commit}
          autoFocus
          maxLength={40}
          style={[onDark ? styles.wordmarkBubble : styles.wordmark, styles.input, { color: wordmarkColor, borderBottomColor: wordmarkColor }]}
        />
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.row, onDark && styles.bubble]}
      onPress={() => {
        setDraft(name);
        setEditing(true);
      }}
      hitSlop={8}
    >
      <Text style={[onDark ? styles.wordmarkBubble : styles.wordmark, { color: wordmarkColor }]}>
        {name.toUpperCase()}
      </Text>
      <Text style={[styles.pencil, { color: pencilColor }]}>✎</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bubble: {
    backgroundColor: colors.lcdBg,
    borderRadius: radius.md + 8,
    borderWidth: 1,
    borderColor: colors.brass,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: colors.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
  },
  wordmark: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    letterSpacing: 1,
  },
  wordmarkBubble: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.sm,
    letterSpacing: 1,
  },
  pencil: {
    fontSize: 13,
  },
  input: {
    borderBottomWidth: 1,
    minWidth: 160,
    paddingVertical: 2,
  },
});
