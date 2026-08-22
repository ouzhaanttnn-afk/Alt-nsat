import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerArrivalCard } from '../components/CustomerArrivalCard';
import { SectionLabel } from '../components/SectionLabel';
import { StockCard } from '../components/StockCard';
import { toptanciStock } from '../data/toptanciStock';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';

// Bölüm 4.2: Piyasa — artık tek seferlik statik fırsat listesi değil, iki
// bölümden oluşuyor: (1) Toptancıdan Stok Al — sarrafiye stoğu (gram/çeyrek
// altın + bilezik) için her an açık, pazarlıksız restok masası; (2)
// dükkâna sürekli akan, stoktan bir şey almak isteyen müşteri — dokununca
// Pazarlık ekranını satış modunda açar.
export function PiyasaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const cashTl = useGameStore((s) => s.capital.cashTl);
  const buyInvestmentUnits = useGameStore((s) => s.buyInvestmentUnits);
  const incomingCustomer = useGameStore((s) => s.incomingCustomer);
  const hasPiyasaSezgisi = useGameStore((s) => (s.skillLevels['piyasa-sezgisi'] ?? 0) > 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Piyasa</Text>
          <Text style={styles.subtitle}>Toptancıdan stokla, gelen müşterilere pazarlıkla sat</Text>
        </View>

        <SectionLabel>TOPTANCIDAN STOK AL</SectionLabel>
        {toptanciStock.map((spec) => {
          const ownedItem = inventory.find(
            (item) =>
              item.category === spec.category &&
              item.name === spec.name &&
              item.karat === spec.karat &&
              item.grams === spec.grams,
          );
          return (
            <StockCard
              key={spec.id}
              spec={spec}
              goldPrice={goldPrice}
              cashTl={cashTl}
              ownedItem={ownedItem}
              onBuy={(quantity) => buyInvestmentUnits(spec, quantity)}
            />
          );
        })}

        <SectionLabel>MÜŞTERİLER</SectionLabel>
        {incomingCustomer ? (
          <CustomerArrivalCard
            incomingCustomer={incomingCustomer}
            scoreVisible={hasPiyasaSezgisi}
            onPress={() =>
              navigation.navigate('Pazarlik', {
                mode: 'satis',
                customer: incomingCustomer.customer,
                product: incomingCustomer.product,
              })
            }
          />
        ) : (
          <Text style={styles.emptyHint}>
            Şu an dükkânda müşteri yok — birazdan biri gelecek.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  header: {
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
});
