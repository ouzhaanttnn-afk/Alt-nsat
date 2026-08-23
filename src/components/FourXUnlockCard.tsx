import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';
import { Card } from './Card';

// Bölüm 22: 4x hız reklam/IAP ile açılan bir monetizasyon özelliği —
// 1x/2x/duraklat her zaman serbest kalır. YER TUTUCU: gerçek reklam SDK'sı
// ve mağaza içi satın alma bağlanana kadar butonlar anında (izlendi/alındı
// sayılarak) çalışır.
export function FourXUnlockCard({
  onWatchAd,
  onBuyUnlimited,
}: {
  onWatchAd: () => void;
  onBuyUnlimited: () => void;
}) {
  return (
    <Card>
      <Text style={styles.title}>4x Hız Kilitli</Text>
      <Text style={styles.body}>
        4x, oyun saatini dört kat hızlandırır. Reklam izleyerek 15 dakikalığına aç, ya da sınırsız
        erişim satın al.
      </Text>
      <View style={styles.row}>
        <Pressable style={styles.adButton} onPress={onWatchAd}>
          <Text style={styles.adButtonLabel}>Reklam İzle · 15 dk</Text>
        </Pressable>
        <Pressable style={styles.buyButton} onPress={onBuyUnlimited}>
          <Text style={styles.buyButtonLabel}>Sınırsız Al</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Yer tutucu — gerçek reklam/mağaza entegrasyonu bağlanınca burada gerçek akış çalışacak.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  adButton: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: 'center',
  },
  adButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
  buyButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: 'center',
  },
  buyButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
