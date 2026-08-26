const fs = require('node:fs');
const path = require('node:path');

const RUNS_PER_SCENARIO = 1000;
const REAL_SESSION_MINUTES = 30;
const OUTPUT_DIR = path.join(__dirname, '..', 'simulation');
const CHECKPOINT_DAYS = [10, 30, 50, 75, 100, 125, 150];
const CAPITAL_THRESHOLDS = [120_000, 500_000, 1_000_000, 2_000_000];

const BASE = {
  startingCashTl: 100_000,
  startingGoldTl: 6845,
  marketClamp: 0.035,
};

const OLD_BASELINE = {
  id: 'OLD_BASELINE',
  dayLengthMinutes: 6,
  customersPerDay: 20,
  charismaTrafficBonus: 0,
  customerRushRatio: 0,
  marketClamp: 0.12,
  passiveInvestments: false,
  workshop: {
    unlockCostEquivalentHasGrams: 200,
    levels: [
      { level: 1, cost: 200, daily: 0.25 },
      { level: 5, cost: 600, daily: 1.15 },
      { level: 10, cost: 2350, daily: 4.2 },
    ],
  },
};

const FAZ6 = {
  id: 'NEW_FAZ6_MODEL',
  customerRushRatio: 0.4,
  marketClamp: 0.035,
  passiveInvestments: true,
  customerCurve: [
    { from: 1, to: 10, min: 16, max: 24 },
    { from: 11, to: 30, min: 18, max: 28 },
    { from: 31, to: 60, min: 22, max: 32 },
    { from: 61, to: 100, min: 25, max: 37 },
    { from: 101, to: 150, min: 29, max: 43 },
    { from: 151, to: Infinity, min: 32, max: 48 },
  ],
  workshop: {
    unlockCostEquivalentHasGrams: 50,
    levels: [
      { level: 1, cost: 50, daily: 0.6 },
      { level: 2, cost: 80, daily: 1.2 },
      { level: 3, cost: 120, daily: 2.1 },
      { level: 4, cost: 180, daily: 3.3 },
      { level: 5, cost: 270, daily: 4.9 },
      { level: 6, cost: 400, daily: 7 },
      { level: 7, cost: 600, daily: 9.8 },
      { level: 8, cost: 900, daily: 13.4 },
      { level: 9, cost: 1350, daily: 18 },
      { level: 10, cost: 2000, daily: 24 },
    ],
  },
};

const PASSIVE_INVESTMENTS = [
  { tier: '8 Ayar', piece: 'Yüzük', principal: 120_000, roi30: 0.24 },
  { tier: '8 Ayar', piece: 'Küpe', principal: 150_000, roi30: 0.24 },
  { tier: '8 Ayar', piece: 'Kolye', principal: 180_000, roi30: 0.24 },
  { tier: '8 Ayar', piece: 'Bileklik', principal: 220_000, roi30: 0.24 },
  { tier: '14 Ayar', piece: 'Yüzük', principal: 300_000, roi30: 0.27 },
  { tier: '14 Ayar', piece: 'Küpe', principal: 380_000, roi30: 0.27 },
  { tier: '14 Ayar', piece: 'Kolye', principal: 470_000, roi30: 0.27 },
  { tier: '14 Ayar', piece: 'Bileklik', principal: 580_000, roi30: 0.27 },
  { tier: '18 Ayar', piece: 'Yüzük', principal: 700_000, roi30: 0.3 },
  { tier: '18 Ayar', piece: 'Küpe', principal: 850_000, roi30: 0.3 },
  { tier: '18 Ayar', piece: 'Kolye', principal: 1_050_000, roi30: 0.3 },
  { tier: '18 Ayar', piece: 'Bileklik', principal: 1_250_000, roi30: 0.3 },
  { tier: '22 Ayar', piece: 'Yüzük', principal: 2_000_000, roi30: 0.34 },
  { tier: '22 Ayar', piece: 'Küpe', principal: 2_400_000, roi30: 0.34 },
  { tier: '22 Ayar', piece: 'Kolye', principal: 2_900_000, roi30: 0.34 },
  { tier: '22 Ayar', piece: 'Bileklik', principal: 3_500_000, roi30: 0.34 },
];

const DENSITIES = [
  { id: 'LOW', customersPerDay: 12 },
  { id: 'MEDIUM', customersPerDay: 20 },
  { id: 'HIGH', customersPerDay: 30 },
  { id: 'VERY_HIGH', customersPerDay: 45 },
];
const DAY_LENGTHS = [4, 6, 8];
const PROFILES = [
  { id: 'CONSERVATIVE', charisma: 35, attempt: 0.58, success: 0.76, margin: 0.038, volatility: 0.016, cashBufferPct: 0.35, ticketPct: 0.08 },
  { id: 'AVERAGE', charisma: 55, attempt: 0.72, success: 0.68, margin: 0.055, volatility: 0.025, cashBufferPct: 0.25, ticketPct: 0.12 },
  { id: 'AGGRESSIVE', charisma: 72, attempt: 0.86, success: 0.58, margin: 0.08, volatility: 0.04, cashBufferPct: 0.14, ticketPct: 0.18 },
];
const WORKSHOP_SENSITIVITY = [
  { id: 'LOW_OUTPUT', multiplier: 0.5 },
  { id: 'BASE_OUTPUT', multiplier: 1 },
  { id: 'HIGH_OUTPUT', multiplier: 2 },
];

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng) {
  const u = Math.max(1e-9, rng());
  const v = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function summary(values) {
  return {
    p10: percentile(values, 0.1),
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    mean: values.reduce((sum, v) => sum + v, 0) / Math.max(1, values.length),
  };
}

function charismaTrafficBonus(score) {
  if (score <= 25) return score * 0.05 / 25;
  if (score <= 50) return 0.05 + (score - 25) * 0.05 / 25;
  if (score <= 75) return 0.1 + (score - 50) * 0.07 / 25;
  return Math.min(0.25, 0.17 + (score - 75) * 0.08 / 25);
}

function faz6CustomersForDay(day, profile, rng, densityOverride) {
  if (densityOverride) return densityOverride.customersPerDay;
  const curve = FAZ6.customerCurve.find((c) => day >= c.from && day <= c.to);
  const base = curve.min + Math.round(rng() * (curve.max - curve.min));
  return Math.round(base * (1 + charismaTrafficBonus(profile.charisma)));
}

function moveMarket(goldTl, clamp, rng) {
  const trend = (rng() * 2 - 1) * 0.004;
  const volatility = (rng() < 0.5 ? -1 : 1) * Math.pow(rng(), 2.1) * 0.018;
  const noise = (rng() * 2 - 1) * 0.013;
  const daily = Math.max(-clamp, Math.min(clamp, trend + volatility + noise));
  return Math.max(100, goldTl * (1 + daily));
}

function levelForTrades(trades) {
  return Math.min(50, 1 + Math.floor(trades / 18));
}

function simulateRun({ model, density, dayLengthMinutes, profile, sensitivity, seed, mode }) {
  const rng = mulberry32(seed);
  const maxDay = mode === 'session' ? Math.ceil(REAL_SESSION_MINUTES / dayLengthMinutes) : 150;
  const sessionDayFraction = mode === 'session' ? REAL_SESSION_MINUTES / dayLengthMinutes : maxDay;
  const state = {
    cash: BASE.startingCashTl,
    inventory: 0,
    goldTl: BASE.startingGoldTl,
    hasGold: 0,
    customers: 0,
    trades: 0,
    failed: 0,
    activeIncome: 0,
    passiveIncome: 0,
    workshopIncomeTl: 0,
    workshopHas: 0,
    workshopLevel: 0,
    investments: [],
    checkpoints: {},
    thresholds: Object.fromEntries(CAPITAL_THRESHOLDS.map((t) => [t, null])),
    investmentAccess: {},
    workshopAccess: {},
  };

  for (let day = 1; day <= maxDay; day += 1) {
    const fraction = mode === 'session' ? Math.max(0, Math.min(1, sessionDayFraction - (day - 1))) : 1;
    if (fraction <= 0) break;
    state.goldTl = moveMarket(state.goldTl, model.marketClamp, rng);

    let customersToday = model.id === 'NEW_FAZ6_MODEL'
      ? faz6CustomersForDay(day, profile, rng, density) * fraction
      : model.customersPerDay * fraction;
    if (model.id === 'NEW_FAZ6_MODEL' && rng() < 0.35) customersToday *= 1 + model.customerRushRatio;
    customersToday = Math.max(0, Math.round(customersToday + normal(rng) * Math.sqrt(Math.max(1, customersToday))));
    state.customers += customersToday;

    for (let i = 0; i < customersToday; i += 1) {
      if (rng() > profile.attempt) {
        state.failed += 1;
        continue;
      }
      const netWorth = state.cash + state.inventory + state.hasGold * state.goldTl;
      const ticket = Math.max(2500, Math.min(netWorth * profile.ticketPct, 4500 + rng() * netWorth * profile.ticketPct));
      if (state.cash - ticket < netWorth * profile.cashBufferPct && rng() < 0.6) {
        state.failed += 1;
        continue;
      }
      const success = rng() < Math.max(0.05, Math.min(0.95, profile.success + normal(rng) * 0.045));
      if (!success) {
        state.failed += 1;
        continue;
      }
      const profit = ticket * Math.max(-0.04, profile.margin + normal(rng) * profile.volatility);
      state.cash += profit;
      state.activeIncome += profit;
      state.trades += 1;
    }

    state.inventory *= 1 + Math.max(-model.marketClamp, Math.min(model.marketClamp, normal(rng) * 0.01));
    state.inventory += Math.max(0, state.cash * 0.035 * rng());
    state.cash -= Math.max(0, state.cash * 0.025 * rng());

    const level = levelForTrades(state.trades);
    if (model.passiveInvestments && level >= 7) {
      for (const candidate of PASSIVE_INVESTMENTS) {
        const key = `${candidate.tier}.${candidate.piece}`;
        const netWorth = state.cash + state.inventory + state.hasGold * state.goldTl;
        if (!state.investmentAccess[key] && netWorth >= candidate.principal) state.investmentAccess[key] = day;
        if (!state.investments.some((inv) => inv.key === key) && state.cash > candidate.principal + netWorth * 0.18) {
          state.cash -= candidate.principal;
          state.investments.push({
            key,
            tier: candidate.tier,
            principal: candidate.principal,
            daily: candidate.principal * candidate.roi30 / 30,
            activatedDay: day,
            maturityDay: day + 30,
            refunded: false,
          });
        }
      }
    }

    const activeByTier = new Map();
    for (const inv of state.investments) {
      if (!inv.refunded && day >= inv.activatedDay && day < inv.maturityDay) {
        activeByTier.set(inv.tier, (activeByTier.get(inv.tier) ?? 0) + 1);
      }
    }
    for (const inv of state.investments) {
      if (!inv.refunded && day >= inv.activatedDay && day < inv.maturityDay) {
        const bonus = activeByTier.get(inv.tier) === 4 ? inv.daily * 0.1 : 0;
        state.cash += inv.daily + bonus;
        state.passiveIncome += inv.daily + bonus;
      }
      if (!inv.refunded && day >= inv.maturityDay) {
        inv.refunded = true;
        state.cash += inv.principal;
      }
    }

    if (level >= 7) {
      const next = model.workshop.levels.find((l) => l.level === state.workshopLevel + 1);
      const cost = (state.workshopLevel === 0 ? model.workshop.unlockCostEquivalentHasGrams : next?.cost ?? Infinity) * state.goldTl;
      const netWorth = state.cash + state.inventory + state.hasGold * state.goldTl;
      if (next && state.cash > cost + netWorth * 0.2) {
        state.cash -= cost;
        state.workshopLevel += 1;
        if (!state.workshopAccess[`Lv${state.workshopLevel}`]) state.workshopAccess[`Lv${state.workshopLevel}`] = day;
      }
    }
    const workshopEntry = model.workshop.levels.find((l) => l.level === state.workshopLevel);
    if (workshopEntry) {
      const has = workshopEntry.daily * sensitivity.multiplier;
      state.hasGold += has;
      state.workshopHas += has;
      state.workshopIncomeTl += has * state.goldTl;
    }

    const netWorth = state.cash + state.inventory + state.hasGold * state.goldTl;
    for (const threshold of CAPITAL_THRESHOLDS) {
      if (state.thresholds[threshold] === null && netWorth >= threshold) state.thresholds[threshold] = day;
    }
    if (CHECKPOINT_DAYS.includes(day)) {
      const totalIncome = Math.max(1, state.activeIncome + state.passiveIncome + state.workshopIncomeTl);
      state.checkpoints[day] = {
        cash: state.cash,
        inventory: state.inventory,
        netWorth,
        hasGold: state.hasGold,
        customers: state.customers,
        trades: state.trades,
        failed: state.failed,
        activeIncomePct: state.activeIncome / totalIncome,
        passiveIncomePct: state.passiveIncome / totalIncome,
        workshopIncomePct: state.workshopIncomeTl / totalIncome,
      };
    }
  }

  const netWorth = state.cash + state.inventory + state.hasGold * state.goldTl;
  return {
    cash: state.cash,
    inventory: state.inventory,
    netWorth,
    hasGold: state.hasGold,
    customers: state.customers,
    trades: state.trades,
    failed: state.failed,
    tradeProfit: state.activeIncome,
    passiveIncome: state.passiveIncome,
    workshopProducedHas: state.workshopHas,
    workshopIncomeTl: state.workshopIncomeTl,
    profitPerRealMinute: mode === 'session' ? state.activeIncome / REAL_SESSION_MINUTES : 0,
    checkpoints: state.checkpoints,
    thresholds: state.thresholds,
    investmentAccess: state.investmentAccess,
    workshopAccess: state.workshopAccess,
  };
}

function summarizeRuns(runs) {
  const metric = (key) => summary(runs.map((run) => run[key] ?? 0));
  const checkpoints = {};
  for (const day of CHECKPOINT_DAYS) {
    checkpoints[day] = {};
    for (const key of ['cash', 'inventory', 'netWorth', 'hasGold', 'customers', 'trades', 'failed', 'activeIncomePct', 'passiveIncomePct', 'workshopIncomePct']) {
      checkpoints[day][key] = summary(runs.map((run) => run.checkpoints[day]?.[key] ?? run[key] ?? 0));
    }
  }
  const thresholds = {};
  for (const threshold of CAPITAL_THRESHOLDS) {
    const reached = runs.map((run) => run.thresholds[threshold]).filter(Boolean);
    thresholds[threshold] = { reachedRate: reached.length / runs.length, day: summary(reached.length ? reached : [0]) };
  }
  const access = {};
  for (const key of [
    '8 Ayar.Yüzük', '8 Ayar.Bileklik', '14 Ayar.Yüzük', '14 Ayar.Bileklik',
    '18 Ayar.Yüzük', '18 Ayar.Bileklik', '22 Ayar.Yüzük', '22 Ayar.Bileklik',
  ]) {
    const reached = runs.map((run) => run.investmentAccess[key]).filter(Boolean);
    access[key] = { reachedRate: reached.length / runs.length, day: summary(reached.length ? reached : [0]) };
  }
  for (const key of ['Lv1', 'Lv5', 'Lv10']) {
    const reached = runs.map((run) => run.workshopAccess[key]).filter(Boolean);
    access[`Workshop ${key}`] = { reachedRate: reached.length / runs.length, day: summary(reached.length ? reached : [0]) };
  }
  return {
    customers: metric('customers'),
    trades: metric('trades'),
    tradeProfit: metric('tradeProfit'),
    passiveIncome: metric('passiveIncome'),
    workshopProducedHas: metric('workshopProducedHas'),
    cash: metric('cash'),
    inventory: metric('inventory'),
    netWorth: metric('netWorth'),
    profitPerRealMinute: metric('profitPerRealMinute'),
    checkpoints,
    thresholds,
    access,
  };
}

function runScenario({ model, density, dayLengthMinutes, profile, sensitivity, scenarioIndex }) {
  const sessionRuns = [];
  const progressionRuns = [];
  for (let run = 0; run < RUNS_PER_SCENARIO; run += 1) {
    const seed = 0x6a600000 + scenarioIndex * 100_000 + run;
    sessionRuns.push(simulateRun({ model, density, dayLengthMinutes, profile, sensitivity, seed, mode: 'session' }));
    progressionRuns.push(simulateRun({ model, density, dayLengthMinutes, profile, sensitivity, seed, mode: 'progression' }));
  }
  return { session30m: summarizeRuns(sessionRuns), progression: summarizeRuns(progressionRuns) };
}

function fmtTl(value) {
  return `${Math.round(value).toLocaleString('tr-TR')} TL`;
}

function fmt(value, digits = 1) {
  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: digits });
}

function toCsv(rows) {
  const headers = Object.keys(rows[0]);
  const esc = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers.map(esc).join(','), ...rows.map((row) => headers.map((h) => esc(row[h])).join(','))].join('\n');
}

function runAll() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const scenarios = [];
  const rows = [];
  let index = 0;

  for (const model of [OLD_BASELINE, FAZ6]) {
    const densities = model.id === 'OLD_BASELINE' ? [{ id: 'OLD', customersPerDay: model.customersPerDay }] : DENSITIES;
    const dayLengths = model.id === 'OLD_BASELINE' ? [model.dayLengthMinutes] : DAY_LENGTHS;
    for (const density of densities) {
      for (const dayLengthMinutes of dayLengths) {
        for (const profile of PROFILES) {
          for (const sensitivity of WORKSHOP_SENSITIVITY) {
            index += 1;
            const scenarioId = `${model.id}_${density.id}_${dayLengthMinutes}M_${profile.id}_${sensitivity.id}`;
            const result = runScenario({ model, density, dayLengthMinutes, profile, sensitivity, scenarioIndex: index });
            const summary = { scenarioId, model: model.id, density, dayLengthMinutes, profile: profile.id, sensitivity: sensitivity.id, runs: RUNS_PER_SCENARIO, ...result };
            scenarios.push(summary);
            rows.push({
              Scenario: scenarioId,
              Model: model.id,
              'Customers/Day': density.customersPerDay,
              'Game Day Length': dayLengthMinutes,
              'Player Type': profile.id,
              '30m Customers': summary.session30m.customers.p50,
              '30m Trades': summary.session30m.trades.p50,
              '30m Profit': summary.session30m.tradeProfit.p50,
              '30m Passive Income': summary.session30m.passiveIncome.p50,
              '30m Workshop HAS': summary.session30m.workshopProducedHas.p50,
              '30m Net Worth': summary.session30m.netWorth.p50,
              'Profit/Real Minute': summary.session30m.profitPerRealMinute.p50,
              'Day 30 Net Worth': summary.progression.checkpoints[30].netWorth.p50,
              'Day 75 Net Worth': summary.progression.checkpoints[75].netWorth.p50,
              'Day 100 Net Worth': summary.progression.checkpoints[100].netWorth.p50,
              'Day 150 Net Worth': summary.progression.checkpoints[150].netWorth.p50,
            });
          }
        }
      }
    }
  }

  const baseline = scenarios.find((s) => s.scenarioId === 'NEW_FAZ6_MODEL_MEDIUM_8M_AVERAGE_BASE_OUTPUT');
  const old = scenarios.find((s) => s.scenarioId === 'OLD_BASELINE_OLD_6M_AVERAGE_BASE_OUTPUT');
  const json = {
    generatedAt: new Date().toISOString(),
    runsPerScenario: RUNS_PER_SCENARIO,
    totalScenarioCount: scenarios.length,
    totalRunCount: scenarios.length * RUNS_PER_SCENARIO,
    note: 'Analysis-only simulation. Production economy values were not changed from these results.',
    baselineScenarioId: baseline?.scenarioId,
    oldBaselineScenarioId: old?.scenarioId,
    scenarios,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'simulation-results.json'), JSON.stringify(json, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'simulation-results.csv'), toCsv(rows));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ECONOMY_SIMULATION_REPORT.md'), buildReport(json, rows, baseline, old));
  console.log(`Economy simulation complete: ${scenarios.length} scenarios, ${scenarios.length * RUNS_PER_SCENARIO} runs.`);
  console.log(`Outputs written to ${OUTPUT_DIR}`);
}

function medianRow(rows, field, filter) {
  return percentile(rows.filter(filter).map((row) => Number(row[field])), 0.5);
}

function accessLine(label, entry) {
  return `| ${label} | ${entry.reachedRate === 0 ? 'Ulaşılamadı' : `Gün ${fmt(entry.day.p50)}`} | ${fmt(entry.reachedRate * 100)}% |`;
}

function buildReport(json, rows, baseline, old) {
  const baseSession = baseline.session30m;
  const baseProgression = baseline.progression;
  const densityLines = DENSITIES.map((density) => `| ${density.id} | ${density.customersPerDay} | ${fmt(medianRow(rows, '30m Customers', (row) => row.Model === 'NEW_FAZ6_MODEL' && row.Scenario.includes(`${density.id}_`)))} | ${fmtTl(medianRow(rows, '30m Net Worth', (row) => row.Model === 'NEW_FAZ6_MODEL' && row.Scenario.includes(`${density.id}_`)))} |`).join('\n');
  const dayLengthLines = DAY_LENGTHS.map((minutes) => `| ${minutes} dk | ${fmtTl(medianRow(rows, '30m Profit', (row) => row.Model === 'NEW_FAZ6_MODEL' && row['Game Day Length'] === minutes))} | ${fmtTl(medianRow(rows, '30m Net Worth', (row) => row.Model === 'NEW_FAZ6_MODEL' && row['Game Day Length'] === minutes))} |`).join('\n');
  const splitRows = [30, 75, 100, 150].map((day) => {
    const cp = baseProgression.checkpoints[day];
    return `| ${day} | ${fmt(cp.activeIncomePct.p50 * 100)}% | ${fmt(cp.passiveIncomePct.p50 * 100)}% | ${fmt(cp.workshopIncomePct.p50 * 100)}% |`;
  }).join('\n');
  const accessRows = [
    accessLine('İlk 8 Ayar yatırım (Yüzük)', baseProgression.access['8 Ayar.Yüzük']),
    accessLine('8 Ayar set tamamı (Bileklik)', baseProgression.access['8 Ayar.Bileklik']),
    accessLine('14 Ayar ilk/set', baseProgression.access['14 Ayar.Yüzük']),
    accessLine('18 Ayar ilk/set', baseProgression.access['18 Ayar.Yüzük']),
    accessLine('22 Ayar ilk/set', baseProgression.access['22 Ayar.Yüzük']),
    accessLine('Atölye Lv1', baseProgression.access['Workshop Lv1']),
    accessLine('Atölye Lv5', baseProgression.access['Workshop Lv5']),
    accessLine('Atölye Lv10', baseProgression.access['Workshop Lv10']),
  ].join('\n');
  const thresholdRows = CAPITAL_THRESHOLDS.map((threshold) => accessLine(fmtTl(threshold), baseProgression.thresholds[threshold])).join('\n');
  const mainRows = rows
    .filter((row) => row.Model === 'NEW_FAZ6_MODEL' && row.Scenario.includes('BASE_OUTPUT'))
    .map((row) => `| ${row.Scenario} | ${row['Customers/Day']} | ${row['Game Day Length']} | ${row['Player Type']} | ${fmt(row['30m Customers'])} | ${fmt(row['30m Trades'])} | ${fmtTl(row['30m Profit'])} | ${fmtTl(row['30m Net Worth'])} | ${fmtTl(row['Profit/Real Minute'])} | ${fmtTl(row['Day 30 Net Worth'])} | ${fmtTl(row['Day 100 Net Worth'])} | ${fmtTl(row['Day 150 Net Worth'])} |`)
    .join('\n');

  return `# Economy Simulation Report — v0.2 Faz 6

Analiz amaçlıdır; production economy değerleri bu rapora göre değiştirilmedi.

- Senaryo: ${json.totalScenarioCount}
- Run / senaryo: ${json.runsPerScenario}
- Toplam run: ${json.totalRunCount}
- NEW baseline: ${baseline.scenarioId}
- OLD baseline: ${old.scenarioId}

## OLD BASELINE vs NEW FAZ6 — 30m P50

| Model | Customers | Trades | Trade Profit | Passive Income | Workshop HAS | Net Worth |
|---|---:|---:|---:|---:|---:|---:|
| OLD | ${fmt(old.session30m.customers.p50)} | ${fmt(old.session30m.trades.p50)} | ${fmtTl(old.session30m.tradeProfit.p50)} | ${fmtTl(old.session30m.passiveIncome.p50)} | ${fmt(old.session30m.workshopProducedHas.p50, 2)}g | ${fmtTl(old.session30m.netWorth.p50)} |
| NEW FAZ6 | ${fmt(baseSession.customers.p50)} | ${fmt(baseSession.trades.p50)} | ${fmtTl(baseSession.tradeProfit.p50)} | ${fmtTl(baseSession.passiveIncome.p50)} | ${fmt(baseSession.workshopProducedHas.p50, 2)}g | ${fmtTl(baseSession.netWorth.p50)} |

## Ana tablo — NEW FAZ6 BASE_OUTPUT

| Scenario | Customers/Day | Game Day Length | Player Type | 30m Customers | 30m Trades | 30m Profit | 30m Net Worth | Profit/Real Minute | Day 30 Net Worth | Day 100 Net Worth | Day 150 Net Worth |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
${mainRows}

## Progression P50 — baseline

| Gün | Net Worth | Cash | Stok | HAS | Customers | Trades |
|---:|---:|---:|---:|---:|---:|---:|
${[30, 75, 100, 150].map((day) => {
  const cp = baseProgression.checkpoints[day];
  return `| ${day} | ${fmtTl(cp.netWorth.p50)} | ${fmtTl(cp.cash.p50)} | ${fmtTl(cp.inventory.p50)} | ${fmt(cp.hasGold.p50, 2)}g | ${fmt(cp.customers.p50)} | ${fmt(cp.trades.p50)} |`;
}).join('\n')}

## Active / Passive / Workshop gelir payı — baseline P50

| Gün | Active Trading | Passive Investment | Workshop |
|---:|---:|---:|---:|
${splitRows}

## Erişim günleri — baseline P50

| Eşik/Sistem | P50 erişim | Ulaşma oranı |
|---|---:|---:|
${thresholdRows}
${accessRows}

## Müşteri yoğunluğu karşılaştırması

| Yoğunluk | Aday müşteri/gün | P50 30m Customers | P50 30m Net Worth |
|---|---:|---:|---:|
${densityLines}

## Oyun günü süresi karşılaştırması

| Gün süresi | P50 30m trade kârı | P50 30m net servet |
|---|---:|---:|
${dayLengthLines}

## Balance yorumu — koda uygulanmadı

- 8 dakikalık gün, pasif yatırım vadelerini 30 dakikalık oturumda aşırı hızlı büyütmeden test edilebilir tutuyor.
- MEDIUM müşteri yoğunluğu ana aday; HIGH daha yoğun ve eğlenceli olabilir ama aktif gelir eğrisini şişiriyor.
- Day 100/150 tarafında passive+workshop payı aktif ticareti ezmeye başlarsa ROI ya da atölye üretimi düşürülmeli; bu script yalnızca ölçer.
- 8 ayar parçalar early-mid sermaye bağlama kararı, 22 ayar parçalar endgame sermaye sink’i olarak kalmalı.
`;
}

runAll();
