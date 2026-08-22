import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Card } from './Card';
import { RingIcon } from './icons/RingIcon';

// Kasam / Pırlanta Koleksiyonu: gerçek para (mağaza içi satın alma) ile
// edinilen kalıcı, vadesiz vitrin parçaları. "owned" true ise elindeki
// parçayı gösterir (KALICI etiketi + günlük gelir); değilse mağaza
// kataloğundaki satın alınabilir bir ürünü (yer tutucu "Satın Al" butonu
// ile — gerçek ödeme entegrasyonu henüz bağlı değil).
export function PirlantaCard({
  name,
  karat,
  grams,
  dailyIncomeTl,
  priceLabel,
  owned,
  quantity,
  onBuy,
}: {
  name: string;
  karat: number;
  grams: number;
  dailyIncomeTl: number;
  priceLabel: string;
  owned: boolean;
  quantity?: number;
  onBuy?: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <RingIcon size={26} />
        <View style={styles.info}>
          <Text style={styles.name}>
            {name}
            {owned && quantity && quantity > 1 ? ` ×${quantity}` : ''}
          </Text>
          <Text style={styles.meta}>
            {karat} Ayar, {grams.toLocaleString('tr-TR')}g
          </Text>
        </View>
        {owned && (
          <View style={styles.permanentTag}>
            <Text style={styles.permanentTagLabel}>KALICI</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.incomeText}>Günde ≈ {formatTl(dailyIncomeTl)}</Text>
        {owned ? (
          <Text style={styles.ownedHint}>Vadesiz, sonsuza kadar üretir</Text>
        ) : (
          <Pressable style={styles.buyButton} onPress={onBuy}>
            <Text style={styles.buyButtonLabel}>Satın Al · {priceLabel}</Text>
          </Pressable>
        )}
      </View>
      {!owned && (
        <Text style={styles.placeholderNote}>
          Yer tutucu — gerçek ödeme (mağaza) entegrasyonu bağlanınca aktif olacak.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 1,
  },
  permanentTag: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  permanentTagLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.accent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  incomeText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.positive,
  },
  ownedHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  buyButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  buyButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
  placeholderNote: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
