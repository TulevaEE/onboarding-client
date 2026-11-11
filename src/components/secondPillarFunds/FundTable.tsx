import React, { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TUK75_ISIN } from '../common/fundPrecision';
import { formatAmountForCount } from '../common/utils';
import { isLowFee, wholeEuros } from '../common/fees';
import { FeeBase, useFeeBasePhrase } from './feeBase';
import { Benchmarks, FundRow, isMarketReference, Sort, SortKey, TableEntry } from './fundRows';
import { chargesPerformanceFee } from './fundDetails';
import { FundSubtitle } from './FundSubtitle';
import { formatReturn, ReturnCell } from './ReturnCell';
import { WithTip } from './WithTip';
import styles from './SecondPillarFunds.module.scss';

const EUROS_IN_MILLION = 1000000;

const ariaSortOf = (isActive: boolean, ascending: boolean) => {
  if (!isActive) {
    return 'none';
  }
  return ascending ? 'ascending' : 'descending';
};

const SortableHeader = ({
  sortKey,
  sort,
  onSort,
  label,
  unit,
}: {
  sortKey: SortKey;
  sort: Sort;
  onSort: (key: SortKey) => void;
  label: ReactNode;
  unit: ReactNode;
}) => {
  const isActive = sort.key === sortKey;
  const ascending = sort.direction === 1;
  return (
    <th scope="col" className="text-end" aria-sort={ariaSortOf(isActive, ascending)}>
      <button type="button" className={styles.sortButton} onClick={() => onSort(sortKey)}>
        {label}
        <br />
        <span className={styles.headerUnit}>{unit}</span>
        <span className={styles.arrow} aria-hidden="true">
          {isActive && (ascending ? '↑' : '↓')}
        </span>
      </button>
    </th>
  );
};

const FeeCell = ({ row, feeBase }: { row: FundRow; feeBase: FeeBase }) => {
  const feeBasePhrase = useFeeBasePhrase(feeBase);
  const amount = wholeEuros(row.ongoingChargesFigure * feeBase.amount);
  const percent = formatAmountForCount(row.ongoingChargesFigure * 100, 2);
  return (
    <WithTip
      tip={
        <FormattedMessage
          id={
            chargesPerformanceFee(row.details)
              ? 'secondPillarFunds.table.feeWithPerformanceFee.tip'
              : 'secondPillarFunds.table.fee.tip'
          }
          values={{ percent, amount, feeBase: feeBasePhrase }}
        />
      }
    >
      {`−${amount} €`}
    </WithTip>
  );
};

const FundTableRow = ({
  row,
  years,
  benchmarks,
  valuationDate,
  isOwnFund,
  feeBase,
}: {
  row: FundRow;
  years: number;
  benchmarks: Benchmarks;
  valuationDate: string;
  isOwnFund: boolean;
  feeBase: FeeBase;
}) => {
  const intl = useIntl();
  const returnLabel = intl.formatMessage({ id: 'secondPillarFunds.table.return' }, { years });
  return (
    <tr className={row.isin === TUK75_ISIN || isOwnFund ? styles.highlighted : undefined}>
      <td>
        <span className={styles.fundName}>{row.name}</span>
        {row.details?.kind === 'index' && (
          <span className={styles.badge}>
            <FormattedMessage id="secondPillarFunds.table.indexFund" />
          </span>
        )}
        {isOwnFund && (
          <span className={`${styles.badge} ${styles.ownFund}`}>
            <FormattedMessage id="secondPillarFunds.table.yourFund" />
          </span>
        )}
        {row.details && <FundSubtitle isin={row.isin} details={row.details} />}
      </td>
      <td className="text-end" data-label={returnLabel}>
        <ReturnCell
          row={row}
          years={years}
          benchmark={benchmarks[years]}
          valuationDate={valuationDate}
          unit={<span className={styles.mobileUnit}>%</span>}
        />
      </td>
      <td
        className={`text-end ${
          isLowFee(row.ongoingChargesFigure) ? styles.lowFee : styles.highFee
        }`}
        data-label={intl.formatMessage({ id: 'secondPillarFunds.table.fees' })}
      >
        <FeeCell row={row} feeBase={feeBase} />
      </td>
      <td
        className={`text-end ${styles.volume}`}
        data-label={`${intl.formatMessage({
          id: 'secondPillarFunds.table.volume',
        })}, ${intl.formatMessage({ id: 'secondPillarFunds.table.volume.unit' })}`}
      >
        {row.volume === null ? (
          <span className={styles.dash}>—</span>
        ) : (
          formatAmountForCount(row.volume / EUROS_IN_MILLION, 0)
        )}
      </td>
    </tr>
  );
};

const MarketRow = ({ rate, years }: { rate: number; years: number }) => {
  const intl = useIntl();
  return (
    <tr className={styles.market}>
      <td>
        <span className={styles.fundName}>
          <FormattedMessage id="secondPillarFunds.table.market" />
        </span>
        <div className={styles.fundSubtitle}>
          <FormattedMessage id="secondPillarFunds.table.market.subtitle" />
        </div>
      </td>
      <td
        className="text-end"
        data-label={intl.formatMessage({ id: 'secondPillarFunds.table.return' }, { years })}
      >
        <span className={`${styles.value} ${styles.nearMarket}`}>
          {formatReturn(rate)}
          <span className={styles.mobileUnit}>%</span>
        </span>
      </td>
      <td className="text-end">
        <span className={styles.dash}>—</span>
      </td>
      <td className="text-end">
        <span className={styles.dash}>—</span>
      </td>
    </tr>
  );
};

export const FundTable = ({
  entries,
  years,
  benchmarks,
  valuationDate,
  ownFundIsins,
  feeBase,
  sort,
  onSort,
}: {
  entries: TableEntry[];
  years: number;
  benchmarks: Benchmarks;
  valuationDate: string;
  ownFundIsins: string[];
  feeBase: FeeBase;
  sort: Sort;
  onSort: (key: SortKey) => void;
}) => (
  <div className={styles.tableCard}>
    <table className={styles.fundTable}>
      <caption className="visually-hidden">
        <FormattedMessage id="secondPillarFunds.table.caption" />
      </caption>
      <thead>
        <tr>
          <th scope="col">
            <FormattedMessage id="secondPillarFunds.table.fund" />
          </th>
          <SortableHeader
            sortKey="return"
            sort={sort}
            onSort={onSort}
            label={<FormattedMessage id="secondPillarFunds.table.return" values={{ years }} />}
            unit={<FormattedMessage id="secondPillarFunds.table.return.unit" />}
          />
          <SortableHeader
            sortKey="fees"
            sort={sort}
            onSort={onSort}
            label={<FormattedMessage id="secondPillarFunds.table.fees" />}
            unit={<FormattedMessage id="secondPillarFunds.table.fees.unit" />}
          />
          <SortableHeader
            sortKey="volume"
            sort={sort}
            onSort={onSort}
            label={<FormattedMessage id="secondPillarFunds.table.volume" />}
            unit={<FormattedMessage id="secondPillarFunds.table.volume.unit" />}
          />
        </tr>
      </thead>
      <tbody>
        {entries.filter((entry) => !isMarketReference(entry)).length === 0 ? (
          <tr>
            <td colSpan={4} className="text-center text-body-secondary py-4">
              <FormattedMessage id="secondPillarFunds.table.empty" />
            </td>
          </tr>
        ) : (
          entries.map((entry) =>
            isMarketReference(entry) ? (
              <MarketRow key="market" rate={entry.rate} years={years} />
            ) : (
              <FundTableRow
                key={entry.isin}
                row={entry}
                years={years}
                benchmarks={benchmarks}
                valuationDate={valuationDate}
                isOwnFund={ownFundIsins.includes(entry.isin)}
                feeBase={feeBase}
              />
            ),
          )
        )}
      </tbody>
    </table>
  </div>
);
