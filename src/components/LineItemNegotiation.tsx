import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  COUNTER_OFFER_MAX_ROUNDS,
  COUNTER_OFFER_MEET_HALFWAY_RATIO,
  GENEROUS_OFFER_REPUTATION_BONUS,
  LOW_OFFER_REPUTATION_PENALTY,
  OFFER_PRESET_COMERT_RATIO,
  OFFER_PRESET_MAKUL_RATIO,
  OFFER_PRESET_OLUCU_RATIO,
  OFFER_RANGE_MAX_RATIO,
  OFFER_RANGE_MIN_RATIO,
  OLUCU_REPUTATION_PENALTY_PER_LEVEL,
  SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL,
  XP_BONUS_DEAL_COMPLETED,
  XP_BONUS_GOOD_BARGAIN,
} from '../config/economyConfig';
import { evaluateBuyOffer } from '../engine/negotiation';
import { equivalentGrams, useGameStore } from '../store/useGameStore';
import type { NegotiationCustomer, NegotiationProduct } from '../types/negotiation';
import type { ScaleReading } from './ScalePanel';
import { colors, fonts, fontSizes } from '../theme';
import { formatTl } from '../utils/format';
import { CounterOfferCard } from './CounterOfferCard';
import { NegotiationActions } from './NegotiationActions';
import { NegotiationProductCard } from './NegotiationProductCard';
import { OfferPresets } from './OfferPresets';
import { PriceBlock } from './PriceBlock';
import { ScalePanel } from './ScalePanel';
import { XpToast } from './XpToast';

const MEASURE_DURATION_MS = 900;
const OLUCU_AGGRESSIVE_OFFER_RATIO = 0.65;
const SIKI_PAZARLIKCI_REPUTATION_PENALTY = 1;

/**
 * [YENİ] v3 — Toplu Alım'ın TEK bir kalemi için bağımsız pazarlık akışı
 * (kendi terazi/teklif/karşı-teklif/sonuç döngüsü). NegotiationPanel bunu
 * her kalem için `key={lineIndex}` ile yeniden mount ederek sırayla işletir
 * — mevcut tek-ürün akışıyla (NegotiationPanel'in kendi buy-path'i) AYNI
 * pazarlık motorunu (evaluateBuyOffer) kullanır, kod kopyalanmıştır ama
 * MANTIK BİREBİR AYNIDIR (deterministik eşik + terminal red — spam istismarına kapalı).
 */
export function LineItemNegotiation({
  product,
  reading,
  customer,
  lineLabel,
  onSettled,
}: {
  product: NegotiationProduct;
  reading: ScaleReading;
  customer: NegotiationCustomer;
  lineLabel: string;
  onSettled: (result: { accepted: boolean; amountTl: number }) => void;
}) {
  const reputationScore = useGameStore((s) => s.reputation.score);
  const skillLevels = useGameStore((s) => s.skillLevels);
  const cashTl = useGameStore((s) => s.capital.cashTl);
  const settleDeal = useGameStore((s) => s.settleDeal);
  const logCompletedOffer = useGameStore((s) => s.logCompletedOffer);
  const grantBonusXp = useGameStore((s) => s.grantBonusXp);
  const adjustReputation = useGameStore((s) => s.adjustReputation);
  const sikiPazarlikciLevel = skillLevels['siki-pazarlikci'] ?? 0;
  const oluluLevel = skillLevels['olucu'] ?? 0;

  const [tested, setTested] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [pendingCounter, setPendingCounter] = useState<{ counterAmountTl: number } | null>(null);
  const [roundsUsed, setRoundsUsed] = useState(0);
  const [result, setResult] = useState<{ accepted: boolean; amountTl: number; borrowedTl: number; xp: number; reason: string } | null>(
    null,
  );

  const baseMin = Math.round(product.marketValueTl * OFFER_RANGE_MIN_RATIO);
  const baseMax = Math.round(product.marketValueTl * OFFER_RANGE_MAX_RATIO);
  const sliderMax = Math.max(1, Math.min(baseMax, Math.round(cashTl)));
  const sliderMin = Math.min(baseMin, sliderMax);
  const clampOffer = (amount: number) => Math.max(sliderMin, Math.min(sliderMax, amount));

  const [offer, setOffer] = useState(() => clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_OLUCU_RATIO)));

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => onSettled({ accepted: result.accepted, amountTl: result.amountTl }), 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleTest = () => {
    if (measuring) return;
    setMeasuring(true);
    setTimeout(() => {
      setMeasuring(false);
      setTested(true);
    }, MEASURE_DURATION_MS);
  };

  const settleAccepted = (amount: number, originalThreshold: number, roundsUsedAtSettle: number) => {
    const offerRatio = amount / product.marketValueTl;
    if (offerRatio < OFFER_PRESET_OLUCU_RATIO) adjustReputation(-LOW_OFFER_REPUTATION_PENALTY);
    else if (offerRatio >= OFFER_PRESET_COMERT_RATIO) adjustReputation(GENEROUS_OFFER_REPUTATION_BONUS);
    if (amount < originalThreshold && sikiPazarlikciLevel > 0) adjustReputation(-SIKI_PAZARLIKCI_REPUTATION_PENALTY);
    if (oluluLevel > 0 && amount < product.marketValueTl * OLUCU_AGGRESSIVE_OFFER_RATIO) {
      adjustReputation(-OLUCU_REPUTATION_PENALTY_PER_LEVEL * oluluLevel);
    }

    const outcome = settleDeal(amount, {
      name: product.name,
      category: product.category,
      karat: product.karat,
      grams: product.grams,
      marketValueTl: product.marketValueTl,
      quantity: product.quantity,
    });
    setPendingCounter(null);
    if (!outcome.success) {
      setResult({ accepted: false, amountTl: amount, borrowedTl: 0, xp: 0, reason: 'Toptancı kredi vermedi' });
      return;
    }
    logCompletedOffer({
      customerName: customer.name,
      productName: product.name,
      category: product.category,
      karat: product.karat,
      grams: product.grams,
      offerAmountTl: amount,
      marketValueTl: product.marketValueTl,
      quantity: product.quantity,
      status: 'kabul',
    });
    const bonus = roundsUsedAtSettle > 0 ? { amount: XP_BONUS_GOOD_BARGAIN, reason: 'İyi pazarlık' } : { amount: XP_BONUS_DEAL_COMPLETED, reason: 'Müşteri işlemi tamamlandı' };
    grantBonusXp(bonus.amount);
    setResult({ accepted: true, amountTl: amount, borrowedTl: outcome.borrowedTl, xp: outcome.xpGained + bonus.amount, reason: bonus.reason });
  };

  const rejectLine = () => {
    setPendingCounter(null);
    logCompletedOffer({
      customerName: customer.name,
      productName: product.name,
      category: product.category,
      karat: product.karat,
      grams: product.grams,
      offerAmountTl: offer,
      marketValueTl: product.marketValueTl,
      quantity: product.quantity,
      status: 'red',
    });
    setResult({ accepted: false, amountTl: offer, borrowedTl: 0, xp: 0, reason: '' });
  };

  const sendOffer = (amount: number, roundsUsedNow: number) => {
    setOffer(amount);
    const originalThreshold = product.marketValueTl * customer.acceptanceThreshold;
    const adjustedThreshold = originalThreshold * (1 - sikiPazarlikciLevel * SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL);
    const outcome = evaluateBuyOffer({
      offerTl: amount,
      thresholdTl: adjustedThreshold,
      bargainingStyle: customer.bargainingStyle,
      karizmaScore: reputationScore,
      roundsUsed: roundsUsedNow,
      maxRounds: COUNTER_OFFER_MAX_ROUNDS,
    });
    if (outcome.kind === 'accept') {
      settleAccepted(amount, originalThreshold, roundsUsedNow);
      return;
    }
    if (outcome.kind === 'counter') {
      setPendingCounter({ counterAmountTl: outcome.counterAmountTl });
      setRoundsUsed(roundsUsedNow + 1);
      return;
    }
    rejectLine();
  };

  const canAct = tested && !measuring && result === null && pendingCounter === null;

  if (result) {
    return (
      <View style={styles.resultWrap}>
        <View style={[styles.resultBadge, { backgroundColor: result.accepted ? colors.positive : colors.negative }]}>
          <Text style={styles.resultBadgeLabel}>{result.accepted ? '✓' : '✕'}</Text>
        </View>
        <View style={styles.resultTextBlock}>
          <Text style={styles.resultTitle}>
            {result.accepted ? `${lineLabel} — kabul edildi` : `${lineLabel} — reddedildi`}
          </Text>
          {result.accepted && (
            <Text style={styles.resultSubtitle}>
              {formatTl(result.amountTl)} karşılığında {product.name.toLowerCase()} alındı.
            </Text>
          )}
        </View>
        {result.accepted && result.xp > 0 && <XpToast amount={result.xp} reason={result.reason} onDone={() => {}} />}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <Text style={styles.lineLabel}>{lineLabel}</Text>
      <NegotiationProductCard product={product} />
      <ScalePanel reading={reading} tested={tested} measuring={measuring} onTest={handleTest} />
      {!tested && <Text style={styles.hint}>Teklif vermeden önce ürünü tart — TEST'e bas.</Text>}

      {pendingCounter ? (
        <CounterOfferCard
          customerName={customer.name}
          counterAmountTl={pendingCounter.counterAmountTl}
          raiseLabel="Teklifi Yükselt"
          onAccept={() => settleAccepted(pendingCounter.counterAmountTl, product.marketValueTl * customer.acceptanceThreshold, roundsUsed)}
          onMeetHalfway={() => {
            const raised = Math.round(offer + (pendingCounter.counterAmountTl - offer) * COUNTER_OFFER_MEET_HALFWAY_RATIO);
            setPendingCounter(null);
            sendOffer(clampOffer(raised), roundsUsed);
          }}
          onWalkAway={rejectLine}
        />
      ) : (
        <>
          <PriceBlock
            marketValueTl={product.marketValueTl}
            min={sliderMin}
            max={sliderMax}
            value={offer}
            onChange={setOffer}
            disabled={!canAct}
            obscureValue={!tested}
          />
          <OfferPresets
            disabled={!canAct}
            presets={[
              {
                key: 'olucu',
                label: 'Ölücü',
                sublabel: `%${Math.round(OFFER_PRESET_OLUCU_RATIO * 100)}`,
                onPress: () => setOffer(clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_OLUCU_RATIO))),
              },
              {
                key: 'makul',
                label: 'Makul',
                sublabel: `%${Math.round(OFFER_PRESET_MAKUL_RATIO * 100)}`,
                onPress: () => setOffer(clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_MAKUL_RATIO))),
              },
              {
                key: 'comert',
                label: 'Cömert',
                sublabel: `%${Math.round(OFFER_PRESET_COMERT_RATIO * 100)}`,
                onPress: () => setOffer(clampOffer(Math.round(product.marketValueTl * OFFER_PRESET_COMERT_RATIO))),
              },
            ]}
          />
          <NegotiationActions
            disabled={!canAct}
            onSendOffer={() => sendOffer(offer, roundsUsed)}
            onPayFull={() => settleAccepted(product.marketValueTl, product.marketValueTl * customer.acceptanceThreshold, 0)}
            onReject={rejectLine}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  lineLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.accentDark,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMutedOnDark,
    textAlign: 'center',
    marginTop: -6,
  },
  resultWrap: { gap: 10 },
  resultBadge: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadgeLabel: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  resultTextBlock: { alignItems: 'center' },
  resultTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.inkOnDark,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkMutedOnDark,
    textAlign: 'center',
    marginTop: 2,
  },
});
