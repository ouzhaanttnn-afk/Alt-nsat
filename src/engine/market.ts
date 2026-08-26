import {
  MARKET_DAILY_NOISE_COMPONENT_MAX,
  MARKET_DAILY_RETURN_CLAMP,
  MARKET_DAILY_TREND_COMPONENT_MAX,
  MARKET_DAILY_VOLATILITY_COMPONENT_MAX,
  STARTING_EUR_TRY,
  STARTING_USD_TRY,
} from '../config/economyConfig';
import { equivalentGrams } from './pricing';

export interface MarketAssetQuote {
  id: 'gramAltin' | 'ceyrekAltin' | 'bilezik22' | 'usdTry' | 'eurTry';
  label: string;
  priceTl: number;
  dailyChangePercent: number;
}

export interface MarketAssetState {
  gramAltin: MarketAssetQuote;
  ceyrekAltin: MarketAssetQuote;
  bilezik22: MarketAssetQuote;
  usdTry: MarketAssetQuote;
  eurTry: MarketAssetQuote;
}

export type Rng = () => number;

export function clampDailyReturn(value: number): number {
  return Math.max(-MARKET_DAILY_RETURN_CLAMP, Math.min(MARKET_DAILY_RETURN_CLAMP, value));
}

function signed(rng: Rng, maxAbs: number): number {
  return (rng() * 2 - 1) * maxAbs;
}

export function computeDailyMarketReturn(rng: Rng = Math.random): number {
  const trendComponent = signed(rng, MARKET_DAILY_TREND_COMPONENT_MAX);
  const volatilitySign = rng() < 0.5 ? -1 : 1;
  const volatilityMagnitude = Math.pow(rng(), 2.1) * MARKET_DAILY_VOLATILITY_COMPONENT_MAX;
  const volatilityComponent = volatilitySign * volatilityMagnitude;
  const noiseComponent = signed(rng, MARKET_DAILY_NOISE_COMPONENT_MAX);
  return clampDailyReturn(trendComponent + volatilityComponent + noiseComponent);
}

export function stepMarketReferenceDaily(previousClose: number, rng: Rng = Math.random): { reference: number; dailyReturn: number } {
  const dailyReturn = computeDailyMarketReturn(rng);
  return { reference: Math.max(1, previousClose * (1 + dailyReturn)), dailyReturn };
}

function quote(id: MarketAssetQuote['id'], label: string, priceTl: number, previousCloseTl: number): MarketAssetQuote {
  return {
    id,
    label,
    priceTl,
    dailyChangePercent: previousCloseTl > 0 ? ((priceTl - previousCloseTl) / previousCloseTl) * 100 : 0,
  };
}

export function buildMarketAssets(reference: number, previousReference: number, usdTry = STARTING_USD_TRY, eurTry = STARTING_EUR_TRY): MarketAssetState {
  const ceyrekEquivalentGrams = equivalentGrams(1.754, 22);
  const bilezik22EquivalentGrams = equivalentGrams(10, 22);
  const usdPrevious = usdTry / (1 + clampDailyReturn((reference - previousReference) / Math.max(1, previousReference)) * 0.18);
  const eurPrevious = eurTry / (1 + clampDailyReturn((reference - previousReference) / Math.max(1, previousReference)) * 0.14);
  return {
    gramAltin: quote('gramAltin', 'GRAM ALTIN', reference, previousReference),
    ceyrekAltin: quote('ceyrekAltin', 'ÇEYREK ALTIN', reference * ceyrekEquivalentGrams, previousReference * ceyrekEquivalentGrams),
    bilezik22: quote('bilezik22', 'BİLEZİK', reference * bilezik22EquivalentGrams, previousReference * bilezik22EquivalentGrams),
    usdTry: quote('usdTry', 'DOLAR', usdTry, usdPrevious),
    eurTry: quote('eurTry', 'EURO', eurTry, eurPrevious),
  };
}
