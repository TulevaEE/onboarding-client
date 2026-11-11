import React, { ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import {
  useFunds,
  useMandateDeadlines,
  useMe,
  useSecondPillarNavHistories,
  useSourceFunds,
  useWorldMarketReturns,
} from '../common/apiHooks';
import { SourceFund } from '../common/apiModels';
import { Shimmer } from '../common/shimmer/Shimmer';
import { PhosphorIcon } from '../common/PhosphorIcon';
import { isLowFee } from '../common/fees';
import { getValueSum } from '../account/AccountStatement/fundSelector';
import { getReturns, Key } from '../account/ComparisonCalculator/api';
import { FeeBase, feeBaseOf, useFeeBasePhrase } from './feeBase';
import {
  formatDateOn,
  formatDateTime,
  formatDateTimeOn,
  formatDateYear,
  todayInTallinn,
} from '../common/dateFormatter';
import {
  Benchmarks,
  benchmarkDateOf,
  benchmarksOf,
  defaultDirectionOf,
  FundRow,
  fundRowsOf,
  MarketReference,
  ReturnBasis,
  Sort,
  SortKey,
  sortRows,
} from './fundRows';
import { isStockFund } from './fundDetails';
import { addDays, minusYears } from './fundReturns';
import { FundTable } from './FundTable';
import { RETURNS_BY_PERIOD_YEARS, ReturnsByPeriodTable } from './ReturnsByPeriodTable';
import { formatReturn } from './ReturnCell';
import { TipTrigger } from './WithTip';
import styles from './SecondPillarFunds.module.scss';

type Filter = 'lowFees' | 'stockFunds';

const FILTERS: Filter[] = ['lowFees', 'stockFunds'];
const FILTER_SLUGS: Record<Filter, string> = { lowFees: 'low-fees', stockFunds: 'stock-funds' };
const FILTER_MATCHES: Record<Filter, (row: FundRow) => boolean> = {
  lowFees: (row) => isLowFee(row.ongoingChargesFigure),
  stockFunds: (row) => isStockFund(row.details),
};

const FILTERS_PARAM = 'filters';
const PERIOD_PARAM = 'period';
const DEFAULT_PERIOD_YEARS = 5;
const SHORTEST_PERIOD_YEARS = 1;
const LONGEST_PERIOD_YEARS = 10;
const PERIOD_OPTIONS = Array.from(
  { length: LONGEST_PERIOD_YEARS - SHORTEST_PERIOD_YEARS + 1 },
  (_, index) => SHORTEST_PERIOD_YEARS + index,
);
const STARTING_NAV_SEARCH_DAYS = 28;

const bold = (chunks: ReactNode) => <b>{chunks}</b>;
const green = (chunks: ReactNode) => <span className={styles.green}>{chunks}</span>;

const isFilter = (filter: Filter | undefined): filter is Filter => filter !== undefined;

const filtersIn = (params: URLSearchParams): Filter[] =>
  (params.get(FILTERS_PARAM) ?? '')
    .split(',')
    .map((slug) => FILTERS.find((filter) => FILTER_SLUGS[filter] === slug.trim()))
    .filter(isFilter);

const periodIn = (params: URLSearchParams) => {
  const years = Number(params.get(PERIOD_PARAM));
  return Number.isInteger(years) && years >= SHORTEST_PERIOD_YEARS && years <= LONGEST_PERIOD_YEARS
    ? years
    : DEFAULT_PERIOD_YEARS;
};

const isOwnFund = (fund: SourceFund) =>
  fund.pillar === 2 && (fund.price + fund.unavailablePrice > 0 || fund.activeFund);

const useUrlState = () => {
  const { pathname, search } = useLocation();
  const [params, setParams] = useState(() => new URLSearchParams(search));
  const update = (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    change(next);
    const query = next.toString().replace(/%2C/gi, ',');
    window.history.replaceState(window.history.state, '', `${pathname}${query ? `?${query}` : ''}`);
    setParams(next);
  };
  return {
    filters: filtersIn(params),
    periodPickerShown: params.has(PERIOD_PARAM),
    periodYears: periodIn(params),
    setFilters: (filters: Filter[]) =>
      update((next) =>
        filters.length > 0
          ? next.set(FILTERS_PARAM, filters.map((filter) => FILTER_SLUGS[filter]).join(','))
          : next.delete(FILTERS_PARAM),
      ),
    setPeriodYears: (years: number) => update((next) => next.set(PERIOD_PARAM, `${years}`)),
  };
};

const FilterChips = ({
  filters,
  onToggle,
  periodPicker,
}: {
  filters: Filter[];
  onToggle: (filter: Filter) => void;
  periodPicker: ReactNode;
}) => {
  const intl = useIntl();
  return (
    <>
      <p className="text-center text-body-secondary mb-2" aria-hidden="true">
        <FormattedMessage id="secondPillarFunds.filters.label" />
      </p>
      <div
        className="d-flex flex-wrap justify-content-center gap-2 mb-4"
        role="group"
        aria-label={intl.formatMessage({ id: 'secondPillarFunds.filters.label' })}
      >
        {FILTERS.map((filter) => {
          const active = filters.includes(filter);
          return (
            <TipTrigger
              key={filter}
              tip={<FormattedMessage id={`secondPillarFunds.filters.${filter}.tip`} />}
            >
              <button
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                aria-pressed={active}
                onClick={() => onToggle(filter)}
              >
                <PhosphorIcon name={active ? 'check' : 'plus'} size={14} />
                <FormattedMessage id={`secondPillarFunds.filters.${filter}`} />
              </button>
            </TipTrigger>
          );
        })}
        {periodPicker}
      </div>
    </>
  );
};

const PeriodPicker = ({
  years,
  onChange,
}: {
  years: number;
  onChange: (years: number) => void;
}) => {
  const intl = useIntl();
  return (
    <select
      className={`form-select ${styles.chip} ${styles.select}`}
      aria-label={intl.formatMessage({ id: 'secondPillarFunds.period.label' })}
      value={years}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {PERIOD_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {intl.formatMessage({ id: 'secondPillarFunds.period.option' }, { years: option })}
        </option>
      ))}
    </select>
  );
};

const MobileSort = ({
  sort,
  years,
  onSort,
}: {
  sort: Sort;
  years: number;
  onSort: (sort: Sort) => void;
}) => (
  <div className="d-md-none text-center text-body-secondary mb-3">
    <label className="d-inline-flex align-items-center gap-2">
      <FormattedMessage id="secondPillarFunds.sort.label" />
      <select
        className={`form-select ${styles.chip} ${styles.select}`}
        value={sort.key}
        onChange={(event) => {
          const key = event.target.value as SortKey;
          onSort({ key, direction: defaultDirectionOf(key) });
        }}
      >
        <FormattedMessage id="secondPillarFunds.sort.return" values={{ years }}>
          {(label) => <option value="return">{label}</option>}
        </FormattedMessage>
        <FormattedMessage id="secondPillarFunds.sort.fees">
          {(label) => <option value="fees">{label}</option>}
        </FormattedMessage>
        <FormattedMessage id="secondPillarFunds.sort.volume">
          {(label) => <option value="volume">{label}</option>}
        </FormattedMessage>
      </select>
    </label>
  </div>
);

const TableFootNotes = ({
  years,
  valuationDate,
  hasBenchmarks,
  feeBase,
  returnBasis,
}: {
  years: number;
  valuationDate: string;
  hasBenchmarks: boolean;
  feeBase: FeeBase;
  returnBasis: ReturnBasis;
}) => {
  const personal = returnBasis === 'personal';
  const feeBasePhrase = useFeeBasePhrase(feeBase);
  return (
    <div className={`${styles.footNote} text-center mt-3`}>
      <p className="mb-0">
        <FormattedMessage
          id="secondPillarFunds.dataStatus"
          values={{ date: formatDateYear(valuationDate) }}
        />
      </p>
      <p className="mb-0">
        <FormattedMessage
          id={
            personal
              ? 'secondPillarFunds.footnote.pastReturns.personal'
              : 'secondPillarFunds.footnote.pastReturns'
          }
        />{' '}
        {hasBenchmarks && (
          <>
            <FormattedMessage
              id={
                personal
                  ? 'secondPillarFunds.footnote.green.personal'
                  : 'secondPillarFunds.footnote.green'
              }
              values={{ years }}
            />{' '}
          </>
        )}
        <FormattedMessage
          id="secondPillarFunds.footnote.fees"
          values={{ feeBase: feeBasePhrase }}
        />
      </p>
    </div>
  );
};

const CallToAction = () => {
  const { data: deadlines } = useMandateDeadlines();
  return (
    <section className={`${styles.callToAction} text-center mt-5 p-4 p-md-5`}>
      <h2 className="text-balance">
        <FormattedMessage id="secondPillarFunds.cta.title" />
      </h2>
      {deadlines && (
        <p className="lead text-balance mx-auto">
          <FormattedMessage
            id="secondPillarFunds.cta.deadline"
            values={{
              b: bold,
              deadline: formatDateTimeOn(deadlines.periodEnding),
              fulfillmentDate: formatDateOn(deadlines.transferMandateFulfillmentDate),
            }}
          />
        </p>
      )}
      <Link to="/2nd-pillar-flow" className="btn btn-primary btn-lg mt-3">
        <FormattedMessage id="secondPillarFunds.cta.button" />
      </Link>
      <p className="text-body-secondary mt-3 mb-0">
        <FormattedMessage id="secondPillarFunds.cta.free" values={{ b: bold }} />
      </p>
    </section>
  );
};

const Methodology = ({
  years,
  benchmarks,
  benchmarkDate,
  periodPickerShown,
  feeBase,
  returnBasis,
}: {
  years: number;
  benchmarks: Benchmarks;
  benchmarkDate: string | null;
  periodPickerShown: boolean;
  feeBase: FeeBase;
  returnBasis: ReturnBasis;
}) => {
  const personal = returnBasis === 'personal';
  const feeBasePhrase = useFeeBasePhrase(feeBase);
  const benchmarkOf = (period: number) =>
    benchmarks[period] === undefined ? '…' : formatReturn(benchmarks[period]);
  const marketComparison = benchmarkDate && (
    <>
      <FormattedMessage
        id={
          personal
            ? 'secondPillarFunds.methodology.green.personal'
            : 'secondPillarFunds.methodology.green'
        }
        values={{
          green,
          fiveYears: benchmarkOf(5),
          threeYears: benchmarkOf(3),
          twoYears: benchmarkOf(2),
          date: formatDateYear(benchmarkDate),
        }}
      />{' '}
    </>
  );
  return (
    <section className={`${styles.footNote} mt-5`}>
      <p className="mb-2">
        <FormattedMessage
          id={
            personal
              ? 'secondPillarFunds.methodology.returns.personal'
              : 'secondPillarFunds.methodology.returns'
          }
          values={{ b: bold, years, feeBase: feeBasePhrase }}
        />
      </p>
      <p className="mb-2">
        <FormattedMessage
          id={
            personal
              ? 'secondPillarFunds.methodology.period.personal'
              : 'secondPillarFunds.methodology.period'
          }
          values={{ b: bold, years }}
        />
      </p>
      <p className="mb-2">
        {marketComparison}
        {periodPickerShown && (
          <>
            <FormattedMessage id="secondPillarFunds.methodology.cappedEra" />{' '}
          </>
        )}
        <FormattedMessage id="secondPillarFunds.methodology.fees" values={{ green }} />
      </p>
      <p className="mb-2">
        <FormattedMessage id="secondPillarFunds.methodology.unlisted" />
      </p>
      <p className="mb-0">
        <FormattedMessage id="secondPillarFunds.methodology.disclaimer" />
      </p>
    </section>
  );
};

const TableShimmer = () => (
  <div className="d-flex flex-column gap-3 py-3">
    {[1, 2, 3, 4, 5, 6].map((line) => (
      <Shimmer key={line} height={24} />
    ))}
  </div>
);

export const SecondPillarFunds = () => {
  usePageTitle('pageTitle.secondPillarFunds');
  const { filters, periodPickerShown, periodYears, setFilters, setPeriodYears } = useUrlState();
  const [sort, setSort] = useState<Sort>({ key: 'return', direction: -1 });
  const navStartDate = addDays(
    minusYears(todayInTallinn(), periodPickerShown ? LONGEST_PERIOD_YEARS : DEFAULT_PERIOD_YEARS),
    -STARTING_NAV_SEARCH_DAYS,
  );
  const funds = useFunds();
  const navHistories = useSecondPillarNavHistories(navStartDate);
  const { data: worldMarketReturns } = useWorldMarketReturns();
  const sourceFunds = useSourceFunds();
  const { data: user } = useMe();
  const { data: deadlines } = useMandateDeadlines();

  const { rows, valuationDate } =
    funds.data && navHistories.data
      ? fundRowsOf(funds.data, navHistories.data, [...RETURNS_BY_PERIOD_YEARS, periodYears])
      : { rows: [], valuationDate: null };
  const hasNoPrices = Boolean(funds.data && navHistories.data && !valuationDate);
  const benchmarks = valuationDate ? benchmarksOf(worldMarketReturns, valuationDate) : {};
  const benchmarkDate = valuationDate ? benchmarkDateOf(worldMarketReturns, valuationDate) : null;
  const ownFundIsins = (sourceFunds.data ?? []).filter(isOwnFund).map((fund) => fund.isin);
  const periodStart = minusYears(todayInTallinn(), periodYears);
  const showsPersonalReturns = Boolean(
    user?.secondPillarOpenDate && user.secondPillarOpenDate <= periodStart,
  );
  const fundIsins = rows.filter((row) => row.returns[periodYears] !== null).map((row) => row.isin);
  const personalReturns = useQuery({
    queryKey: ['personalFundReturns', fundIsins.join(','), periodStart],
    queryFn: () => getReturns([...fundIsins, Key.UNION_STOCK_INDEX], periodStart),
    enabled: showsPersonalReturns && fundIsins.length > 0,
  });
  const personalRateOf = (isin: string) =>
    personalReturns.data?.returns.find((personalReturn) => personalReturn.key === isin)?.rate ??
    null;
  const tableRows = showsPersonalReturns
    ? rows.map((row) => ({
        ...row,
        returns: { ...row.returns, [periodYears]: personalRateOf(row.isin) },
      }))
    : rows;
  const personalMarketRate = personalRateOf(Key.UNION_STOCK_INDEX);
  const personalBenchmarks: Benchmarks =
    personalMarketRate === null ? {} : { [periodYears]: personalMarketRate };
  const tableBenchmarks = showsPersonalReturns ? personalBenchmarks : benchmarks;
  const returnBasis: ReturnBasis = showsPersonalReturns ? 'personal' : 'fund';
  const marketReference: MarketReference | null =
    showsPersonalReturns && personalMarketRate !== null
      ? { kind: 'market', rate: personalMarketRate }
      : null;
  const feeBase = feeBaseOf(
    getValueSum((sourceFunds.data ?? []).filter((fund) => fund.pillar === 2)),
  );
  const passesFilters = (row: FundRow) => filters.every((filter) => FILTER_MATCHES[filter](row));
  const listedRows = tableRows.filter(
    (row) => passesFilters(row) || ownFundIsins.includes(row.isin),
  );

  const onSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 1 ? -1 : 1 }
        : { key, direction: defaultDirectionOf(key) },
    );
  const onToggleFilter = (filter: Filter) =>
    setFilters(
      filters.includes(filter)
        ? filters.filter((active) => active !== filter)
        : [...filters, filter],
    );

  const table = () => {
    if (funds.isError || navHistories.isError || personalReturns.isError || hasNoPrices) {
      return (
        <p className="text-center py-4">
          <FormattedMessage id="error.messages.intro" />
        </p>
      );
    }
    if (
      !valuationDate ||
      sourceFunds.isLoading ||
      !user ||
      (showsPersonalReturns && personalReturns.isLoading)
    ) {
      return <TableShimmer />;
    }
    return (
      <>
        <p className="text-center small text-body-secondary mb-3">
          {filters.length > 0 ? (
            <>
              <FormattedMessage
                id="secondPillarFunds.filters.count"
                values={{ count: rows.filter(passesFilters).length, total: rows.length }}
              />{' '}
              <button
                type="button"
                className={`btn btn-link p-0 border-0 ${styles.inlineLink}`}
                onClick={() => setFilters([])}
              >
                <FormattedMessage id="secondPillarFunds.filters.clear" />
              </button>
            </>
          ) : (
            <FormattedMessage id="secondPillarFunds.filters.all" values={{ total: rows.length }} />
          )}
        </p>
        <MobileSort sort={sort} years={periodYears} onSort={setSort} />
        <FundTable
          entries={sortRows(
            marketReference ? [...listedRows, marketReference] : listedRows,
            sort,
            periodYears,
          )}
          years={periodYears}
          benchmarks={tableBenchmarks}
          valuationDate={valuationDate}
          ownFundIsins={ownFundIsins}
          feeBase={feeBase}
          returnBasis={returnBasis}
          sort={sort}
          onSort={onSort}
        />
        <TableFootNotes
          years={periodYears}
          valuationDate={valuationDate}
          hasBenchmarks={benchmarkDate !== null}
          feeBase={feeBase}
          returnBasis={returnBasis}
        />
      </>
    );
  };

  return (
    <div className="col-12 col-lg-10 mx-auto">
      <header className="text-center mx-auto">
        <h1 className="text-balance">
          <FormattedMessage id="secondPillarFunds.title" />
        </h1>
        <p className="lead text-pretty mt-3">
          {showsPersonalReturns ? (
            <FormattedMessage
              id="secondPillarFunds.lead.personal"
              values={{ years: periodYears }}
            />
          ) : (
            <FormattedMessage id="secondPillarFunds.lead" values={{ b: bold }} />
          )}
        </p>
        {deadlines && (
          <p className="text-body-secondary">
            <FormattedMessage
              id="secondPillarFunds.deadline"
              values={{ b: bold, deadline: formatDateTime(deadlines.periodEnding) }}
            />{' '}
            <Link to="/2nd-pillar-flow">
              <FormattedMessage id="secondPillarFunds.deadline.switch" />
            </Link>
          </p>
        )}
      </header>
      <section className="mt-5">
        <FilterChips
          filters={filters}
          onToggle={onToggleFilter}
          periodPicker={
            periodPickerShown && <PeriodPicker years={periodYears} onChange={setPeriodYears} />
          }
        />
        {table()}
      </section>
      <CallToAction />
      {valuationDate && (
        <ReturnsByPeriodTable
          rows={rows}
          benchmarks={benchmarks}
          valuationDate={valuationDate}
          ownFundIsins={ownFundIsins}
        />
      )}
      <Methodology
        years={periodYears}
        benchmarks={benchmarks}
        benchmarkDate={benchmarkDate}
        periodPickerShown={periodPickerShown}
        feeBase={feeBase}
        returnBasis={returnBasis}
      />
    </div>
  );
};
