const fs = require('node:fs');
const path = require('node:path');

const RUNS_PER_SCENARIO = 1000;
const REAL_SESSION_MINUTES = 30;
const OUTPUT_DIR = path.join(__dirname, '..', 'simulation');

const BASE_ECONOMY = {
  startingCashTl: 100_000,
  startingGoldBuyTl: 6845,
  startingGoldSellTl: 7045,
  marketStepMinPct: 0.3,
  marketStepMaxPct: 1.2,
  marketSpreadMinTl: 150,
  marketSpreadMaxTl: 400,
};

// Snapshot of production WORKSHOP_CONFIG for analysis only. Do not rebalance
// production config from this script; it intentionally writes reports only.
const WORKSHOP_CONFIG = {
  requiredLevel: 7,
  maxLevel: 10,
  unlockCostEquivalentHasGrams: 200,
  levels: [
    { level: 1, upgradeCostEquivalentHasGrams: 200, dailyHasOutput: 0.25 },
    { level: 2, upgradeCostEquivalentHasGrams: 260, dailyHasOutput: 0.4 },
    { level: 3, upgradeCostEquivalentHasGrams: 340, dailyHasOutput: 0.6 },
    { level: 4, upgradeCostEquivalentHasGrams: 450, dailyHasOutput: 0.85 },
    { level: 5, upgradeCostEquivalentHasGrams: 600, dailyHasOutput: 1.15 },
    { level: 6, upgradeCostEquivalentHasGrams: 800, dailyHasOutput: 1.55 },
    { level: 7, upgradeCostEquivalentHasGrams: 1050, dailyHasOutput: 2.05 },
    { level: 8, upgradeCostEquivalentHasGrams: 1380, dailyHasOutput: 2.65 },
    { level: 9, upgradeCostEquivalentHasGrams: 1800, dailyHasOutput: 3.35 },
    { level: 10, upgradeCostEquivalentHasGrams: 2350, dailyHasOutput: 4.2 },
  ],
};

const CUSTOMER_DENSITIES = [
  { id: 'LOW', customersPerDay: 12 },
  { id: 'MEDIUM', customersPerDay: 20 },
  { id: 'HIGH', customersPerDay: 30 },
  { id: 'VERY_HIGH', customersPerDay: 45 },
];

const GAME_DAY_LENGTHS = [4, 6, 8];

const PLAYER_PROFILES = [
  {
    id: 'CONSERVATIVE',
    speedUseMultiplier: 1.15,
    tradeAttemptRate: 0.56,
    successRate: 0.76,
    avgMarginPct: 0.036,
    marginVolatilityPct: 0.018,
    cashBufferTl: 35_000,
    maxTradeCapitalPct: 0.08,
    workshopInvestmentPct: 0.06,
  },
  {
    id: 'AVERAGE',
    speedUseMultiplier: 1.35,
    tradeAttemptRate: 0.7,
    successRate: 0.68,
    avgMarginPct: 0.055,
    marginVolatilityPct: 0.026,
    cashBufferTl: 18_000,
    maxTradeCapitalPct: 0.12,
    workshopInvestmentPct: 0.09,
  },
  {
    id: 'AGGRESSIVE',
    speedUseMultiplier: 1.6,
    tradeAttemptRate: 0.86,
    successRate: 0.59,
    avgMarginPct: 0.082,
    marginVolatilityPct: 0.04,
    cashBufferTl: 6_000,
    maxTradeCapitalPct: 0.18,
    workshopInvestmentPct: 0.12,
  },
];

const WORKSHOP_SENSITIVITY = [
  { id: 'LOW_OUTPUT', outputMultiplier: 0.5 },
  { id: 'BASE_OUTPUT', outputMultiplier: 1 },
  { id: 'HIGH_OUTPUT', outputMultiplier: 2 },
];

const CHECKPOINT_DAYS = [1, 10, 30, 50, 100, 150];
const CAPITAL_THRESHOLDS = [120_000, 500_000, 1_000_000, 2_000_000];

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomNormal(rng) {
  const u = Math.max(1e-9, rng());
  const v = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function mean(values) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(values) {
  return {
    p10: percentile(values, 0.1),
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    mean: mean(values),
  };
}

function dailyWorkshopOutput(level, sensitivity) {
  const entry = WORKSHOP_CONFIG.levels.find((candidate) => candidate.level === level);
  return (entry?.dailyHasOutput ?? 0) * sensitivity.outputMultiplier;
}

function workshopUpgradeCost(level, goldBuyTl) {
  if (level >= WORKSHOP_CONFIG.maxLevel) return Infinity;
  const nextLevel = level + 1;
  if (nextLevel === 1) return WORKSHOP_CONFIG.unlockCostEquivalentHasGrams * goldBuyTl;
  const entry = WORKSHOP_CONFIG.levels.find((candidate) => candidate.level === nextLevel);
  return (entry?.upgradeCostEquivalentHasGrams ?? Infinity) * goldBuyTl;
}

function levelForSuccessfulTrades(successfulTrades) {
  return Math.min(50, 1 + Math.floor(successfulTrades / 18));
}

function maybeMoveMarket(state, rng) {
  const direction = rng() < 0.5 ? -1 : 1;
  const pct =
    BASE_ECONOMY.marketStepMinPct +
    (BASE_ECONOMY.marketStepMaxPct - BASE_ECONOMY.marketStepMinPct) * rng();
  const mid = ((state.goldBuyTl + state.goldSellTl) / 2) * (1 + direction * pct / 100);
  const spread = BASE_ECONOMY.marketSpreadMinTl + (BASE_ECONOMY.marketSpreadMaxTl - BASE_ECONOMY.marketSpreadMinTl) * rng();
  state.goldBuyTl = Math.max(100, mid - spread / 2);
  state.goldSellTl = Math.max(state.goldBuyTl + 1, mid + spread / 2);
}

function simulateRun({ density, dayLengthMinutes, profile, sensitivity, seed, mode }) {
  const rng = mulberry32(seed);
  const state = {
    cashTl: BASE_ECONOMY.startingCashTl,
    inventoryValueTl: 0,
    hasGoldGrams: 0,
    goldBuyTl: BASE_ECONOMY.startingGoldBuyTl,
    goldSellTl: BASE_ECONOMY.startingGoldSellTl,
    customersSeen: 0,
    successfulTrades: 0,
    failedNegotiations: 0,
    grossProfitTl: 0,
    workshopLevel: 0,
    workshopHasProduced: 0,
    level: 1,
    thresholds: Object.fromEntries(CAPITAL_THRESHOLDS.map((threshold) => [threshold, null])),
    checkpoints: {},
  };

  const daysToSimulate =
    mode === 'session' ? (REAL_SESSION_MINUTES / dayLengthMinutes) * profile.speedUseMultiplier : Math.max(...CHECKPOINT_DAYS);
  const totalWholeDays = Math.ceil(daysToSimulate);

  for (let day = 1; day <= totalWholeDays; day += 1) {
    const activeDayFraction = mode === 'session' ? Math.max(0, Math.min(1, daysToSimulate - (day - 1))) : 1;
    if (activeDayFraction <= 0) break;

    if (day % 1 === 0) maybeMoveMarket(state, rng);

    const expectedCustomers = density.customersPerDay * activeDayFraction;
    const customersToday = Math.max(0, Math.round(expectedCustomers + randomNormal(rng) * Math.sqrt(Math.max(1, expectedCustomers))));
    state.customersSeen += customersToday;

    for (let i = 0; i < customersToday; i += 1) {
      if (rng() > profile.tradeAttemptRate) {
        state.failedNegotiations += 1;
        continue;
      }

      const netWorthBefore = state.cashTl + state.inventoryValueTl;
      const maxTicket = Math.max(4000, netWorthBefore * profile.maxTradeCapitalPct);
      const ticketTl = Math.max(2500, Math.min(maxTicket, 4500 + rng() * maxTicket));
      if (state.cashTl - ticketTl < profile.cashBufferTl && rng() < 0.68) {
        state.failedNegotiations += 1;
        continue;
      }

      const successChance = Math.max(0.05, Math.min(0.95, profile.successRate + randomNormal(rng) * 0.045));
      if (rng() > successChance) {
        state.failedNegotiations += 1;
        continue;
      }

      const marginPct = Math.max(-0.04, profile.avgMarginPct + randomNormal(rng) * profile.marginVolatilityPct);
      const profitTl = ticketTl * marginPct;
      state.cashTl += profitTl;
      state.grossProfitTl += profitTl;
      state.successfulTrades += 1;
      state.level = levelForSuccessfulTrades(state.successfulTrades);
    }

    // Small mark-to-market stock exposure; this measures potential stock value
    // without becoming a separate passive investment implementation.
    const stockAllocation = Math.min(state.cashTl * 0.08, Math.max(0, state.grossProfitTl * 0.15));
    state.cashTl -= stockAllocation;
    state.inventoryValueTl += stockAllocation * (0.985 + rng() * 0.04);

    if (state.level >= WORKSHOP_CONFIG.requiredLevel) {
      const investable = state.cashTl * profile.workshopInvestmentPct;
      const cost = workshopUpgradeCost(state.workshopLevel, state.goldBuyTl);
      if (state.workshopLevel < WORKSHOP_CONFIG.maxLevel && cost <= investable) {
        state.cashTl -= cost;
        state.workshopLevel += 1;
      }
    }

    if (state.workshopLevel > 0) {
      const produced = dailyWorkshopOutput(state.workshopLevel, sensitivity);
      state.hasGoldGrams += produced;
      state.inventoryValueTl += produced * state.goldBuyTl;
      state.workshopHasProduced += produced;
    }

    for (const threshold of CAPITAL_THRESHOLDS) {
      const netWorth = state.cashTl + state.inventoryValueTl;
      if (state.thresholds[threshold] === null && netWorth >= threshold) {
        state.thresholds[threshold] = day;
      }
    }

    if (CHECKPOINT_DAYS.includes(day)) {
      const netWorth = state.cashTl + state.inventoryValueTl;
      state.checkpoints[day] = {
        cashTl: state.cashTl,
        inventoryValueTl: state.inventoryValueTl,
        netWorthTl: netWorth,
        hasGoldGrams: state.hasGoldGrams,
        level: state.level,
        successfulTrades: state.successfulTrades,
        failedNegotiations: state.failedNegotiations,
        customersSeen: state.customersSeen,
        averageProfitPerTradeTl: state.successfulTrades > 0 ? state.grossProfitTl / state.successfulTrades : 0,
        profitPerGameDayTl: state.grossProfitTl / day,
        workshopLevel: state.workshopLevel,
        workshopHasProduced: state.workshopHasProduced,
      };
    }
  }

  const netWorthTl = state.cashTl + state.inventoryValueTl;
  return {
    cashTl: state.cashTl,
    inventoryValueTl: state.inventoryValueTl,
    netWorthTl,
    hasGoldGrams: state.hasGoldGrams,
    customersSeen: state.customersSeen,
    successfulTrades: state.successfulTrades,
    failedNegotiations: state.failedNegotiations,
    averageProfitPerTradeTl: state.successfulTrades > 0 ? state.grossProfitTl / state.successfulTrades : 0,
    profitTl: state.grossProfitTl,
    profitPerRealMinuteTl: mode === 'session' ? state.grossProfitTl / REAL_SESSION_MINUTES : null,
    thresholds: state.thresholds,
    checkpoints: state.checkpoints,
    workshopLevel: state.workshopLevel,
    workshopHasProduced: state.workshopHasProduced,
  };
}

function summarizeRuns(runs) {
  const metric = (key) => summarize(runs.map((run) => run[key]));
  const checkpoints = {};
  for (const day of CHECKPOINT_DAYS) {
    checkpoints[day] = {
      netWorthTl: summarize(runs.map((run) => run.checkpoints[day]?.netWorthTl ?? run.netWorthTl)),
      cashTl: summarize(runs.map((run) => run.checkpoints[day]?.cashTl ?? run.cashTl)),
      inventoryValueTl: summarize(runs.map((run) => run.checkpoints[day]?.inventoryValueTl ?? run.inventoryValueTl)),
      hasGoldGrams: summarize(runs.map((run) => run.checkpoints[day]?.hasGoldGrams ?? run.hasGoldGrams)),
      level: summarize(runs.map((run) => run.checkpoints[day]?.level ?? run.level ?? 1)),
      successfulTrades: summarize(runs.map((run) => run.checkpoints[day]?.successfulTrades ?? run.successfulTrades)),
      failedNegotiations: summarize(runs.map((run) => run.checkpoints[day]?.failedNegotiations ?? run.failedNegotiations)),
      customersSeen: summarize(runs.map((run) => run.checkpoints[day]?.customersSeen ?? run.customersSeen)),
      averageProfitPerTradeTl: summarize(
        runs.map((run) => run.checkpoints[day]?.averageProfitPerTradeTl ?? run.averageProfitPerTradeTl),
      ),
      profitPerGameDayTl: summarize(runs.map((run) => run.checkpoints[day]?.profitPerGameDayTl ?? 0)),
    };
  }

  const thresholds = {};
  for (const threshold of CAPITAL_THRESHOLDS) {
    const reachedDays = runs.map((run) => run.thresholds[threshold]).filter((value) => value !== null);
    thresholds[threshold] = {
      reachedRate: reachedDays.length / runs.length,
      days: summarize(reachedDays.length > 0 ? reachedDays : [0]),
    };
  }

  return {
    customersSeen: metric('customersSeen'),
    successfulTrades: metric('successfulTrades'),
    failedNegotiations: metric('failedNegotiations'),
    profitTl: metric('profitTl'),
    averageProfitPerTradeTl: metric('averageProfitPerTradeTl'),
    profitPerRealMinuteTl: summarize(runs.map((run) => run.profitPerRealMinuteTl ?? 0)),
    cashTl: metric('cashTl'),
    inventoryValueTl: metric('inventoryValueTl'),
    netWorthTl: metric('netWorthTl'),
    hasGoldGrams: metric('hasGoldGrams'),
    workshopLevel: metric('workshopLevel'),
    workshopHasProduced: metric('workshopHasProduced'),
    thresholds,
    checkpoints,
  };
}

function formatTl(value) {
  return `${Math.round(value).toLocaleString('tr-TR')} TL`;
}

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: digits });
}

function runAll() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const summaries = [];
  const rows = [];
  let scenarioIndex = 0;

  for (const density of CUSTOMER_DENSITIES) {
    for (const dayLengthMinutes of GAME_DAY_LENGTHS) {
      for (const profile of PLAYER_PROFILES) {
        for (const sensitivity of WORKSHOP_SENSITIVITY) {
          scenarioIndex += 1;
          const scenarioId = `${density.id}_${dayLengthMinutes}M_${profile.id}_${sensitivity.id}`;
          const sessionRuns = [];
          const progressionRuns = [];
          for (let run = 0; run < RUNS_PER_SCENARIO; run += 1) {
            const seed = 0x5eed0000 + scenarioIndex * 100_000 + run;
            sessionRuns.push(simulateRun({ density, dayLengthMinutes, profile, sensitivity, seed, mode: 'session' }));
            progressionRuns.push(simulateRun({ density, dayLengthMinutes, profile, sensitivity, seed, mode: 'progression' }));
          }

          const session = summarizeRuns(sessionRuns);
          const progression = summarizeRuns(progressionRuns);
          const summary = {
            scenarioId,
            density,
            dayLengthMinutes,
            profile: profile.id,
            workshopSensitivity: sensitivity.id,
            runs: RUNS_PER_SCENARIO,
            session30m: session,
            progression,
          };
          summaries.push(summary);
          rows.push({
            Scenario: scenarioId,
            'Customers/Day': density.customersPerDay,
            'Game Day Length': dayLengthMinutes,
            'Player Type': profile.id,
            '30m Customers': session.customersSeen.p50,
            '30m Trades': session.successfulTrades.p50,
            '30m Profit': session.profitTl.p50,
            '30m Net Worth': session.netWorthTl.p50,
            'Profit/Real Minute': session.profitPerRealMinuteTl.p50,
            'Day 30 Net Worth': progression.checkpoints[30].netWorthTl.p50,
            'Day 100 Net Worth': progression.checkpoints[100].netWorthTl.p50,
            'Day 150 Net Worth': progression.checkpoints[150].netWorthTl.p50,
            '120K Day': progression.thresholds[120000].days.p50,
            '500K Day': progression.thresholds[500000].days.p50,
            '1M Day': progression.thresholds[1000000].days.p50,
            '2M Day': progression.thresholds[2000000].days.p50,
          });
        }
      }
    }
  }

  const baseline = summaries.find(
    (summary) =>
      summary.density.id === 'MEDIUM' &&
      summary.dayLengthMinutes === 8 &&
      summary.profile === 'AVERAGE' &&
      summary.workshopSensitivity === 'BASE_OUTPUT',
  );

  const json = {
    generatedAt: new Date().toISOString(),
    runsPerScenario: RUNS_PER_SCENARIO,
    totalScenarioCount: summaries.length,
    totalRunCount: summaries.length * RUNS_PER_SCENARIO,
    note: 'Analysis-only simulation. Production economy values were not changed from these results.',
    baselineScenarioId: baseline?.scenarioId,
    scenarios: summaries,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'simulation-results.json'), JSON.stringify(json, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'simulation-results.csv'), toCsv(rows));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ECONOMY_SIMULATION_REPORT.md'), buildReport(json, rows, baseline));
  console.log(`Economy simulation complete: ${summaries.length} scenarios, ${summaries.length * RUNS_PER_SCENARIO} runs.`);
  console.log(`Outputs written to ${OUTPUT_DIR}`);
}

function toCsv(rows) {
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers.map(escape).join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

function medianBy(rows, field, filter) {
  const values = rows.filter(filter).map((row) => Number(row[field]));
  return percentile(values, 0.5);
}

function buildReport(json, rows, baseline) {
  const densityLines = CUSTOMER_DENSITIES.map((density) => {
    const p50Net = medianBy(rows, '30m Net Worth', (row) => row.Scenario.startsWith(density.id));
    const p50Trades = medianBy(rows, '30m Trades', (row) => row.Scenario.startsWith(density.id));
    return `| ${density.id} | ${density.customersPerDay} | ${formatNumber(p50Trades)} | ${formatTl(p50Net)} |`;
  }).join('\n');

  const dayLengthLines = GAME_DAY_LENGTHS.map((minutes) => {
    const p50Profit = medianBy(rows, '30m Profit', (row) => row['Game Day Length'] === minutes);
    const p50Net = medianBy(rows, '30m Net Worth', (row) => row['Game Day Length'] === minutes);
    return `| ${minutes} dk | ${formatTl(p50Profit)} | ${formatTl(p50Net)} |`;
  }).join('\n');

  const sensitivityLines = WORKSHOP_SENSITIVITY.map((sensitivity) => {
    const day150 = medianBy(rows, 'Day 150 Net Worth', (row) => row.Scenario.endsWith(sensitivity.id));
    return `| ${sensitivity.id} | ${formatTl(day150)} |`;
  }).join('\n');

  const tableRows = rows
    .filter((row) => row.Scenario.includes('BASE_OUTPUT'))
    .map(
      (row) =>
        `| ${row.Scenario} | ${row['Customers/Day']} | ${row['Game Day Length']} | ${row['Player Type']} | ${formatNumber(row['30m Customers'])} | ${formatNumber(row['30m Trades'])} | ${formatTl(row['30m Profit'])} | ${formatTl(row['30m Net Worth'])} | ${formatTl(row['Profit/Real Minute'])} | ${formatTl(row['Day 30 Net Worth'])} | ${formatTl(row['Day 100 Net Worth'])} | ${formatTl(row['Day 150 Net Worth'])} |`,
    )
    .join('\n');

  const baseSession = baseline.session30m;
  const baseProgression = baseline.progression;
  const thresholdLines = CAPITAL_THRESHOLDS.map((threshold) => {
    const entry = baseProgression.thresholds[threshold];
    return `| ${formatTl(threshold)} | ${entry.reachedRate === 0 ? 'Ulaşılamadı' : `Gün ${formatNumber(entry.days.p50)}`} | ${formatNumber(entry.reachedRate * 100)}% |`;
  }).join('\n');

  return `# Economy Simulation Report

Bu rapor analiz amaçlıdır. Simülasyon sonuçlarına göre production ekonomi değerleri değiştirilmedi.

- Senaryo sayısı: ${json.totalScenarioCount}
- Run / senaryo: ${json.runsPerScenario}
- Toplam run: ${json.totalRunCount}
- Baseline: ${baseline.scenarioId}

## Baseline 30 gerçek dakika P50

- Müşteri: ${formatNumber(baseSession.customersSeen.p50)}
- Başarılı işlem: ${formatNumber(baseSession.successfulTrades.p50)}
- Net kâr: ${formatTl(baseSession.profitTl.p50)}
- Dakika başı kâr: ${formatTl(baseSession.profitPerRealMinuteTl.p50)}
- 30 dakika sonu net servet: ${formatTl(baseSession.netWorthTl.p50)}
- HAS altın: ${formatNumber(baseSession.hasGoldGrams.p50, 2)} g

## Ana tablo — BASE_OUTPUT

| Scenario | Customers/Day | Game Day Length | Player Type | 30m Customers | 30m Trades | 30m Profit | 30m Net Worth | Profit/Real Minute | Day 30 Net Worth | Day 100 Net Worth | Day 150 Net Worth |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
${tableRows}

## Sermaye eşikleri — baseline

| Eşik | P50 erişim | Ulaşma oranı |
|---:|---:|---:|
${thresholdLines}

## Müşteri yoğunluğu karşılaştırması

| Yoğunluk | Müşteri/gün | P50 30m trade | P50 30m net servet |
|---|---:|---:|---:|
${densityLines}

## Oyun günü süresi karşılaştırması

| Gün süresi | P50 30m kâr | P50 30m net servet |
|---|---:|---:|
${dayLengthLines}

## Atölye sensitivity

| Atölye output | P50 Day 150 net servet |
|---|---:|
${sensitivityLines}

## Day 30 / 100 / 150 baseline progression

| Gün | Cash | Stok | Net Worth | HAS | Level | Başarılı işlem | Başarısız pazarlık | Müşteri | Ortalama kâr/işlem |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 30 | ${formatTl(baseProgression.checkpoints[30].cashTl.p50)} | ${formatTl(baseProgression.checkpoints[30].inventoryValueTl.p50)} | ${formatTl(baseProgression.checkpoints[30].netWorthTl.p50)} | ${formatNumber(baseProgression.checkpoints[30].hasGoldGrams.p50, 2)}g | ${formatNumber(baseProgression.checkpoints[30].level.p50)} | ${formatNumber(baseProgression.checkpoints[30].successfulTrades.p50)} | ${formatNumber(baseProgression.checkpoints[30].failedNegotiations.p50)} | ${formatNumber(baseProgression.checkpoints[30].customersSeen.p50)} | ${formatTl(baseProgression.checkpoints[30].averageProfitPerTradeTl.p50)} |
| 100 | ${formatTl(baseProgression.checkpoints[100].cashTl.p50)} | ${formatTl(baseProgression.checkpoints[100].inventoryValueTl.p50)} | ${formatTl(baseProgression.checkpoints[100].netWorthTl.p50)} | ${formatNumber(baseProgression.checkpoints[100].hasGoldGrams.p50, 2)}g | ${formatNumber(baseProgression.checkpoints[100].level.p50)} | ${formatNumber(baseProgression.checkpoints[100].successfulTrades.p50)} | ${formatNumber(baseProgression.checkpoints[100].failedNegotiations.p50)} | ${formatNumber(baseProgression.checkpoints[100].customersSeen.p50)} | ${formatTl(baseProgression.checkpoints[100].averageProfitPerTradeTl.p50)} |
| 150 | ${formatTl(baseProgression.checkpoints[150].cashTl.p50)} | ${formatTl(baseProgression.checkpoints[150].inventoryValueTl.p50)} | ${formatTl(baseProgression.checkpoints[150].netWorthTl.p50)} | ${formatNumber(baseProgression.checkpoints[150].hasGoldGrams.p50, 2)}g | ${formatNumber(baseProgression.checkpoints[150].level.p50)} | ${formatNumber(baseProgression.checkpoints[150].successfulTrades.p50)} | ${formatNumber(baseProgression.checkpoints[150].failedNegotiations.p50)} | ${formatNumber(baseProgression.checkpoints[150].customersSeen.p50)} | ${formatTl(baseProgression.checkpoints[150].averageProfitPerTradeTl.p50)} |

## Pasif yatırım alanı — analiz

120K civarı bir 8 ayar başlangıç parçası baseline'da çok erken erişilebilir görünüyor; bu yüzden ciddi karar olması için nakit tamponu, çoklu parça maliyeti veya 30 günlük bağlama fırsat maliyeti önem kazanır. 2M civarı 22 ayar endgame parçası ise baseline'da daha uzun vadeli bir hedef olarak kalıyor.

## Balance önerisi — koda uygulanmadı

- Müşteri/gün: MEDIUM-HIGH aralığı iyi aday. LOW boş hissettirebilir, VERY_HIGH ekonomiyi ve ekran trafiğini hızlı şişiriyor.
- Oyun günü süresi: 6-8 dakika aralığı daha kontrollü. 4 dakika, 30 gerçek dakikada fazla oyun günü kapattığı için pasif sistemleri büyütüyor.
- 30 dakikalık session hedefi: oyuncuya hissedilir ama yeni yatırım eşiklerini bedava yapmayacak P50 net büyüme hedeflenmeli.
- Early/mid/late progression: 120K erken karar, 500K mid-game hedef, 1M-2M daha büyük taahhüt olarak kalmalı.
- Atölye üretimi: BASE_OUTPUT aktif ticareti tamamen gereksiz kılmıyorsa iyi başlangıç; HIGH_OUTPUT Day 150'de aktif ticaretin yerini almaya başlarsa düşürülmeli.
- Atölye maliyeti: HAS gramına peg doğru; Lv1 kurulum 200g referansı simülasyondan sonra ayrıca tartışılmalı.
- 8/14/18/22 pasif yatırım ROI: düşük ayarda kısa geri dönüş/öğretici, yüksek ayarda daha düşük ROI ama büyük prestij/sermaye sink mantığı daha güvenli görünüyor.
`;
}

runAll();
