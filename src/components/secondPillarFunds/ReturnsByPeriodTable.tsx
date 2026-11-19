import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TUK75_ISIN } from '../common/fundPrecision';
import { formatDateYear } from '../common/dateFormatter';
import { Benchmarks, FundRow, sortRows } from './fundRows';
import { ReturnCell } from './ReturnCell';
import styles from './SecondPillarFunds.module.scss';

export const RETURNS_BY_PERIOD_YEARS = [2, 3, 5];
const SORTED_BY_YEARS = 5;
const RETURNS_BY_PERIOD_ID = 'returns-by-period';

export const ReturnsByPeriodTable = ({
  rows,
  benchmarks,
  valuationDate,
  ownFundIsins,
}: {
  rows: FundRow[];
  ownFundIsins: string[];
  benchmarks: Benchmarks;
  valuationDate: string;
}) => (
  <section id={RETURNS_BY_PERIOD_ID} className="mt-5">
    <h2
      id={`${RETURNS_BY_PERIOD_ID}-title`}
      className={`${styles.periodsTitle} text-center text-balance mb-2`}
    >
      <FormattedMessage id="secondPillarFunds.periods.title" />
    </h2>
    <table className={styles.periodsTable} aria-labelledby={`${RETURNS_BY_PERIOD_ID}-title`}>
      <thead>
        <tr>
          <th scope="col">
            <FormattedMessage id="secondPillarFunds.table.fund" />
          </th>
          {RETURNS_BY_PERIOD_YEARS.map((years) => (
            <th scope="col" className="text-end" key={years}>
              <FormattedMessage id="secondPillarFunds.periods.column" values={{ years }} />
              <br />
              <span className={styles.headerUnit}>
                <FormattedMessage id="secondPillarFunds.table.return.unit" />
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortRows(rows, { key: 'return', direction: -1 }, SORTED_BY_YEARS).map((row) => (
          <tr
            key={row.isin}
            className={
              row.isin === TUK75_ISIN || ownFundIsins.includes(row.isin)
                ? styles.highlighted
                : undefined
            }
          >
            <td>{row.name}</td>
            {RETURNS_BY_PERIOD_YEARS.map((years) => (
              <td className="text-end" key={years}>
                <ReturnCell
                  row={row}
                  years={years}
                  benchmark={benchmarks[years]}
                  valuationDate={valuationDate}
                  unit="%"
                  basis="fund"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <p className={`${styles.footNote} text-center mt-3 mb-0`}>
      <FormattedMessage
        id="secondPillarFunds.periods.note"
        values={{ date: formatDateYear(valuationDate) }}
      />
    </p>
  </section>
);
