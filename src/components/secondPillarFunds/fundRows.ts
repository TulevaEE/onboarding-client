import { Fund, FundNavHistory, WorldMarketReturn, WorldMarketReturns } from '../common/apiModels';
import { annualizedReturn, daysBetween } from './fundReturns';
import { FUND_DETAILS, FundDetails } from './fundDetails';

export const NEAR_MARKET_TOLERANCE = 0.01;
const BENCHMARK_DATE_TOLERANCE_DAYS = 7;

export type FundRow = {
  isin: string;
  name: string;
  ongoingChargesFigure: number;
  volume: number | null;
  details: FundDetails | undefined;
  returns: Record<number, number | null>;
};

export type SortKey = 'return' | 'fees' | 'volume';
export type ReturnBasis = 'personal' | 'fund';
export type Sort = { key: SortKey; direction: 1 | -1 };

export const defaultDirectionOf = (key: SortKey): 1 | -1 => (key === 'fees' ? 1 : -1);

const latestDateOf = (navHistories: FundNavHistory[]) =>
  navHistories
    .map((history) => history.nav[history.nav.length - 1].date)
    .reduce((latest, date) => (date > latest ? date : latest));

export const fundRowsOf = (funds: Fund[], navHistories: FundNavHistory[], years: number[]) => {
  const withNavs = navHistories.filter((history) => history.nav.length > 0);
  const navsByIsin = new Map(withNavs.map((history) => [history.isin, history.nav]));
  const valuationDate = withNavs.length > 0 ? latestDateOf(withNavs) : null;
  const rows: FundRow[] = funds
    .filter((fund) => fund.pillar === 2 && fund.status === 'ACTIVE')
    .map((fund) => {
      const nav = navsByIsin.get(fund.isin) ?? [];
      return {
        isin: fund.isin,
        name: fund.name,
        ongoingChargesFigure: fund.ongoingChargesFigure,
        volume: fund.volume ?? null,
        details: FUND_DETAILS[fund.isin],
        returns: Object.fromEntries(
          years.map((period) => [
            period,
            valuationDate ? annualizedReturn(nav, period, valuationDate) : null,
          ]),
        ),
      };
    });
  return { rows, valuationDate };
};

const compareNullsLast = (first: number | null, second: number | null, direction: 1 | -1) => {
  if (first === null && second === null) {
    return 0;
  }
  if (first === null) {
    return 1;
  }
  if (second === null) {
    return -1;
  }
  return (first - second) * direction;
};

export type MarketReference = { kind: 'market'; rate: number };
export type TableEntry = FundRow | MarketReference;

export const isMarketReference = (entry: TableEntry): entry is MarketReference =>
  'kind' in entry && entry.kind === 'market';

const sortValueOf = (entry: TableEntry, key: SortKey, years: number) => {
  if (isMarketReference(entry)) {
    return key === 'return' ? entry.rate : null;
  }
  if (key === 'return') {
    return entry.returns[years] ?? null;
  }
  return key === 'fees' ? entry.ongoingChargesFigure : entry.volume;
};

const volumeOf = (entry: TableEntry) => (isMarketReference(entry) ? null : entry.volume);
const nameOf = (entry: TableEntry) => (isMarketReference(entry) ? '' : entry.name);

export const sortRows = <T extends TableEntry>(entries: T[], sort: Sort, years: number): T[] =>
  [...entries].sort(
    (first, second) =>
      compareNullsLast(
        sortValueOf(first, sort.key, years),
        sortValueOf(second, sort.key, years),
        sort.direction,
      ) ||
      compareNullsLast(volumeOf(first), volumeOf(second), -1) ||
      nameOf(first).localeCompare(nameOf(second), 'et'),
  );

export type Benchmarks = Record<number, number>;

const isAlignedWith = (valuationDate: string) => (benchmark: WorldMarketReturn) =>
  Math.abs(daysBetween(benchmark.toDate, valuationDate)) <= BENCHMARK_DATE_TOLERANCE_DAYS;

export const benchmarksOf = (
  worldMarketReturns: WorldMarketReturns | undefined,
  valuationDate: string,
): Benchmarks =>
  Object.fromEntries(
    (worldMarketReturns?.returns ?? [])
      .filter(isAlignedWith(valuationDate))
      .map((benchmark) => [benchmark.years, benchmark.annualizedReturn]),
  );

export const benchmarkDateOf = (
  worldMarketReturns: WorldMarketReturns | undefined,
  valuationDate: string,
) =>
  (worldMarketReturns?.returns ?? [])
    .filter(isAlignedWith(valuationDate))
    .map((benchmark) => benchmark.toDate)
    .reduce<string | null>(
      (latest, date) => (latest === null || date > latest ? date : latest),
      null,
    );

export const isNearMarket = (fundReturn: number, benchmark: number) =>
  fundReturn >= benchmark - NEAR_MARKET_TOLERANCE;
