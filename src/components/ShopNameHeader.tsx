import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

// Bölüm 31: Profil — özelleştirilebilir oyuncu/dükkân adı. Kaleme
// dokununca düzenleme moduna geçer, onaylayınca (submit/blur) kaydeder.
// onDark: Dükkân başlığı gibi koyu lacivert zeminde mi (varsayılan),
// yoksa Profil'deki gibi krem bir Card içinde mi kullanıldığı.
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
      <View style={styles.row}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          onBlur={commit}
          autoFocus
          maxLength={40}
          style={[styles.input, { color: wordmarkColor, borderBottomColor: wordmarkColor }]}
        />
      </View>
    );
  }

  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        setDraft(name);
        setEditing(true);
      }}
      hitSlop={8}
    >
      <Text style={[styles.wordmark, { color: wordmarkColor }]}>{name.toUpperCase()}</Text>
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
  wordmark: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    letterSpacing: 1,
  },
  pencil: {
    fontSize: 13,
  },
  input: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.lg,
    letterSpacing: 1,
    borderBottomWidth: 1,
    minWidth: 160,
    paddingVertical: 2,
  },
});
