import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { InventoryItemCard } from '../components/InventoryItemCard';
import { PirlantaCard } from '../components/PirlantaCard';
import { SectionLabel } from '../components/SectionLabel';
import { TradingPositionCard } from '../components/TradingPositionCard';
import { pirlantaCatalog } from '../data/mockPirlanta';
import {
  currentPositionValueTl,
  useGameStore,
  VITRIN_TERM_DAYS,
  type VitrinMaturityEvent,
} from '../store/useGameStore';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';

const BANNER_VISIBLE_MS = 4000;

// Kullanıcı kararı: takı (bilezik/yüzük/kolye, 14 veya 22 ayar fark
// etmez) tek tek pazarlıkla satılmıyor — vitrine girip kendi kâr
// potansiyeline göre günlük pasif gelir üretiyor. 30 günlük vitrin
// vadesi dolunca ürün otomatik "satılmış" sayılır, maliyeti nakde
// döner. Yatırım altını (çeyrek/gram/vb.) doğrudan/aktif satılabiliyor;
// farklı fiyatlardan yapılan alımlar tek pozisyonda ağırlıklı ortalama
// maliyetle birikip alış-satış makasından gerçek kâr/zarar hesaplanıyor.
export function KasamScreen() {
  const inventory = useGameStore((s) => s.inventory);
  const goldPrice = useGameStore((s) => s.goldPrice);
  const day = useGameStore((s) => s.day);
  const sellInventoryItem = useGameStore((s) => s.sellInventoryItem);
  const realizedTradingProfitTl = useGameStore((s) => s.realizedTradingProfitTl);
  const lastVitrinMaturity = useGameStore((s) => s.lastVitrinMaturity);
  const purchasePirlanta = useGameStore((s) => s.purchasePirlanta);

  const [saleBanner, setSaleBanner] = useState<{ profitTl: number } | null>(null);
  const saleBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [maturityBanner, setMaturityBanner] = useState<VitrinMaturityEvent | null>(null);
  const maturityBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenMaturityRef = useRef<VitrinMaturityEvent | null>(null);

  useEffect(() => {
    if (lastVitrinMaturity && lastVitrinMaturity !== seenMaturityRef.current) {
      seenMaturityRef.current = lastVitrinMaturity;
      setMaturityBanner(lastVitrinMaturity);
      if (maturityBannerTimer.current) clearTimeout(maturityBannerTimer.current);
      maturityBannerTimer.current = setTimeout(() => setMaturityBanner(null), BANNER_VISIBLE_MS);
    }
  }, [lastVitrinMaturity]);

  useEffect(
    () => () => {
      if (saleBannerTimer.current) clearTimeout(saleBannerTimer.current);
      if (maturityBannerTimer.current) clearTimeout(maturityBannerTimer.current);
    },
    [],
  );

  const vitrinItems = inventory.filter((item) => item.category === 'taki');
  const yatirimItems = inventory.filter((item) => item.category === 'yatirim');
  const pirlantaItems = inventory.filter((item) => item.category === 'pirlanta');

  const vitrinValueTl = vitrinItems.reduce((sum, item) => sum + item.costBasisTl, 0);
  const vitrinDailyIncomeTl = vitrinItems.reduce((sum, item) => {
    const expectedProfitTl = (item.estimatedValueTl ?? item.costBasisTl) - item.costBasisTl;
    return sum + expectedProfitTl / VITRIN_TERM_DAYS;
  }, 0);

  const handleSell = (itemId: string) => {
    const result = sellInventoryItem(itemId);
    if (!result) return;
    setSaleBanner({ profitTl: result.profitTl });
    if (saleBannerTimer.current) clearTimeout(saleBannerTimer.current);
    saleBannerTimer.current = setTimeout(() => setSaleBanner(null), BANNER_VISIBLE_MS);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Kasam</Text>

        {saleBanner && (
          <View
            style={[
              styles.banner,
              { backgroundColor: saleBanner.profitTl >= 0 ? colors.positive : colors.negative },
            ]}
          >
            <Text style={styles.bannerText}>
              Satış tamamlandı: {saleBanner.profitTl >= 0 ? '+' : ''}
              {formatTl(saleBanner.profitTl)} {saleBanner.profitTl >= 0 ? 'kâr' : 'zarar'}
            </Text>
          </View>
        )}
        {maturityBanner && (
          <View style={[styles.banner, { backgroundColor: colors.accent }]}>
            <Text style={styles.bannerText}>
              {maturityBanner.count > 1
                ? `${maturityBanner.count} ürünün vitrin vadesi doldu`
                : `${maturityBanner.sampleName} vitrin vadesi doldu`}
              , {formatTl(maturityBanner.totalPayoutTl)} sermaye nakde döndü
            </Text>
          </View>
        )}

        <SectionLabel>VİTRİN</SectionLabel>
        <Card>
          <Text style={styles.summaryLabel}>Vitrin Değeri</Text>
          <Text style={styles.summaryValue}>{formatTl(vitrinValueTl)}</Text>
          <Text style={styles.summaryHint}>
            Günde ≈ {formatTl(vitrinDailyIncomeTl)} pasif gelir üretiyor · {VITRIN_TERM_DAYS} gün vade
          </Text>
        </Card>

        {vitrinItems.length === 0 ? (
          <Text style={styles.emptyHint}>
            Vitrinde henüz takı yok. Piyasa'dan bilezik/yüzük/kolye gibi ürünler alınca
            burada birikip pasif gelir üretmeye başlar.
          </Text>
        ) : (
          vitrinItems.map((item) => {
            const expectedProfitTl = (item.estimatedValueTl ?? item.costBasisTl) - item.costBasisTl;
            return (
              <InventoryItemCard
                key={item.id}
                item={item}
                dailyIncomeTl={expectedProfitTl / VITRIN_TERM_DAYS}
                daysRemaining={VITRIN_TERM_DAYS - (day - item.acquiredDay)}
              />
            );
          })
        )}

        <SectionLabel>PIRLANTA KOLEKSİYONU</SectionLabel>
        <Text style={styles.emptyHint}>
          Gerçek para ile edinilen kalıcı vitrin parçaları — vadesi yok, sonsuza kadar sabit gelir üretir.
        </Text>
        {pirlantaItems.map((item) => (
          <PirlantaCard
            key={item.id}
            name={item.name}
            karat={item.karat}
            grams={item.grams}
            dailyIncomeTl={(item.dailyIncomeTl ?? 0) * item.quantity}
            priceLabel={item.realMoneyPriceLabel ?? ''}
            owned
            quantity={item.quantity}
          />
        ))}
        {pirlantaCatalog.map((catalogItem) => (
          <PirlantaCard
            key={catalogItem.id}
            name={catalogItem.name}
            karat={catalogItem.karat}
            grams={catalogItem.grams}
            dailyIncomeTl={catalogItem.dailyIncomeTl}
            priceLabel={catalogItem.priceLabel}
            owned={false}
            onBuy={() => purchasePirlanta(catalogItem)}
          />
        ))}

        <SectionLabel>YATIRIM ÜRÜNLERİN</SectionLabel>
        <Card>
          <Text style={styles.summaryLabel}>Toplam Alım-Satım Kârı</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: realizedTradingProfitTl >= 0 ? colors.positive : colors.negative },
            ]}
          >
            {realizedTradingProfitTl >= 0 ? '+' : ''}
            {formatTl(realizedTradingProfitTl)}
          </Text>
          <Text style={styles.summaryHintMuted}>Alış ve satış fiyatın arasındaki makastan gelir.</Text>
        </Card>

        {yatirimItems.length === 0 ? (
          <Text style={styles.emptyHint}>
            Elinde çeyrek/gram/yarım/tam gibi yatırım altını yok. Piyasa'dan alınca
            burada listelenir, istediğin an güncel kurdan satabilirsin.
          </Text>
        ) : (
          yatirimItems.map((item) => (
            <TradingPositionCard
              key={item.id}
              item={item}
              currentValueTl={currentPositionValueTl(item, goldPrice.buyPricePerGram)}
              onSell={() => handleSell(item.id)}
            />
          ))
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
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  banner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bannerText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.white,
    textAlign: 'center',
  },
  summaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  summaryValue: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginTop: 4,
  },
  summaryHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.positive,
    marginTop: 4,
  },
  summaryHintMuted: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    marginTop: 4,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
});
