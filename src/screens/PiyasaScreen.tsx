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

// Bölüm 4.2/6: Piyasa — iki bölümden oluşuyor: (1) Toptancıdan Stok Al —
// sarrafiye stoğu (gram/çeyrek altın + bilezik) için her an açık,
// pazarlıksız restok masası; (2) dükkâna sürekli akan, oyunun ilk
// dakikasından itibaren hem "almak" hem "bozdurmak" isteyen müşteri —
// dokununca yönüne göre Pazarlık ekranını satış ya da alış modunda açar.
export function PiyasaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const wholesalerBuyMarginTlPerGram = useGameStore((s) => s.wholesalerBuyMarginTlPerGram);
  const cashTl = useGameStore((s) => s.capital.cashTl);
  const buyInvestmentUnits = useGameStore((s) => s.buyInvestmentUnits);
  const incomingCustomer = useGameStore((s) => s.incomingCustomer);
  const hasPiyasaSezgisi = useGameStore((s) => (s.skillLevels['piyasa-sezgisi'] ?? 0) > 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Piyasa</Text>
          <Text style={styles.subtitle}>Toptancıdan stokla, gelen müşterilere pazarlıkla al/sat</Text>
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
              wholesalerBuyMarginTlPerGram={wholesalerBuyMarginTlPerGram}
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
              incomingCustomer.direction === 'bozdurma'
                ? navigation.navigate('Pazarlik', {
                    mode: 'alis',
                    customer: incomingCustomer.customer,
                    product: incomingCustomer.product,
                    scaleReading: incomingCustomer.scaleReading,
                    incomingCustomerId: incomingCustomer.id,
                  })
                : navigation.navigate('Pazarlik', {
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
    color: colors.inkOnDark,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
    marginTop: 2,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMutedOnDark,
  },
});
