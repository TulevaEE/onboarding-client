export type FundTerm =
  | 'stocks100'
  | 'stocks98'
  | 'stockFund'
  | 'mixedFund'
  | 'bondFund'
  | 'wholeWorld'
  | 'developedMarketsOnly'
  | 'mainlyDevelopedMarkets'
  | 'globalBonds'
  | 'esgScreened'
  | 'esg'
  | 'activeCountryWeights'
  | 'lifecycleFund'
  | 'managerSelection'
  | 'performanceFee'
  | 'upTo70PercentUnlisted'
  | 'upTo50PercentUnlisted'
  | 'leverage'
  | 'benchmarkMsciAcwi'
  | 'benchmarkBloombergAggregate'
  | 'noBenchmark';

type EquityShare = '100' | '98' | '75' | '50' | '25' | 'bond';

export type LifecycleFund =
  | 'EE3600109393'
  | 'EE3600019741'
  | 'EE3600019758'
  | 'EE3600103248'
  | 'EE3600001848';

type StrategyChange = { date: string; note: 'riskProfile2024' | 'lifecycle2022' };

export type FundDetails = {
  kind: 'index' | 'active';
  equity: EquityShare;
  features: FundTerm[];
  benchmark?: FundTerm;
  strategyChange?: StrategyChange;
};

const RISK_PROFILE_CHANGE_2024: StrategyChange = { date: '2024-01-02', note: 'riskProfile2024' };
const BECAME_LIFECYCLE_FUND_2022: StrategyChange = { date: '2022-05-02', note: 'lifecycle2022' };

export const FUND_DETAILS: Record<string, FundDetails> = {
  EE3600109435: {
    kind: 'index',
    equity: '100',
    features: ['wholeWorld', 'esgScreened'],
    benchmark: 'benchmarkMsciAcwi',
  },
  EE3600109443: {
    kind: 'index',
    equity: 'bond',
    features: ['globalBonds'],
    benchmark: 'benchmarkBloombergAggregate',
  },
  EE3600109401: {
    kind: 'index',
    equity: '100',
    features: ['wholeWorld', 'activeCountryWeights'],
    benchmark: 'noBenchmark',
  },
  EE3600109393: {
    kind: 'index',
    equity: '98',
    features: ['mainlyDevelopedMarkets', 'esg', 'lifecycleFund'],
    benchmark: 'noBenchmark',
  },
  EE3600001814: {
    kind: 'index',
    equity: '100',
    features: ['developedMarketsOnly', 'esg'],
    benchmark: 'noBenchmark',
  },
  EE3600109427: {
    kind: 'index',
    equity: '100',
    features: ['wholeWorld', 'esg'],
    benchmark: 'noBenchmark',
  },
  EE3600001806: {
    kind: 'index',
    equity: '100',
    features: ['wholeWorld'],
    benchmark: 'noBenchmark',
  },
  EE3600019766: {
    kind: 'active',
    equity: '75',
    features: ['managerSelection', 'performanceFee', 'upTo70PercentUnlisted'],
  },
  EE3600019832: {
    kind: 'active',
    equity: '75',
    features: ['managerSelection', 'performanceFee', 'upTo50PercentUnlisted'],
  },
  EE3600019774: {
    kind: 'active',
    equity: '25',
    features: ['managerSelection', 'performanceFee', 'upTo50PercentUnlisted'],
  },
  EE3600019782: { kind: 'active', equity: 'bond', features: ['managerSelection'] },
  EE3600103503: { kind: 'active', equity: '100', features: ['managerSelection', 'performanceFee'] },
  EE3600098430: { kind: 'active', equity: '50', features: ['managerSelection', 'performanceFee'] },
  EE3600098448: { kind: 'active', equity: '25', features: ['managerSelection', 'performanceFee'] },
  EE3600098455: { kind: 'active', equity: 'bond', features: ['managerSelection'] },
  EE3600001699: { kind: 'active', equity: '100', features: ['managerSelection', 'leverage'] },
  EE3600019725: {
    kind: 'active',
    equity: '100',
    features: ['managerSelection'],
    strategyChange: RISK_PROFILE_CHANGE_2024,
  },
  EE3600098612: {
    kind: 'active',
    equity: '25',
    features: ['managerSelection'],
    strategyChange: RISK_PROFILE_CHANGE_2024,
  },
  EE3600019717: { kind: 'active', equity: 'bond', features: ['managerSelection'] },
  EE3600019741: {
    kind: 'active',
    equity: '25',
    features: ['managerSelection', 'lifecycleFund'],
    strategyChange: BECAME_LIFECYCLE_FUND_2022,
  },
  EE3600019758: {
    kind: 'active',
    equity: '75',
    features: ['managerSelection', 'lifecycleFund'],
    strategyChange: BECAME_LIFECYCLE_FUND_2022,
  },
  EE3600103248: { kind: 'active', equity: '100', features: ['managerSelection', 'lifecycleFund'] },
  EE3600001848: { kind: 'active', equity: '100', features: ['managerSelection', 'lifecycleFund'] },
  EE3600019733: { kind: 'active', equity: 'bond', features: ['managerSelection'] },
};

const LIFECYCLE_FUNDS: LifecycleFund[] = [
  'EE3600109393',
  'EE3600019741',
  'EE3600019758',
  'EE3600103248',
  'EE3600001848',
];

export const isLifecycleFund = (isin: string): isin is LifecycleFund =>
  (LIFECYCLE_FUNDS as string[]).includes(isin);

export const typeTermOf = (details: FundDetails): FundTerm => {
  if (details.equity === '100') {
    return details.kind === 'index' ? 'stocks100' : 'stockFund';
  }
  if (details.equity === '98') {
    return 'stocks98';
  }
  return details.equity === 'bond' ? 'bondFund' : 'mixedFund';
};

export const isStockFund = (details: FundDetails | undefined) =>
  details?.equity === '100' || details?.equity === '98';

export const chargesPerformanceFee = (details: FundDetails | undefined) =>
  Boolean(details?.features.includes('performanceFee'));

export const strategyChangeBefore = (details: FundDetails | undefined, periodStart: string) => {
  const change = details?.strategyChange;
  return change && periodStart < change.date ? change : undefined;
};
