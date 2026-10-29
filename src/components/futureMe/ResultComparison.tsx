import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import {
  bestColumnsOf,
  comparisonOf,
  ComparisonRowId,
  comparisonRowsOf,
  ROWS_WITH_BEST_COLUMN,
} from './comparison';
import { MAX_AGE_SHOWN, ResultContext } from './resultAnswers';

const AGE_ROWS: ComparisonRowId[] = ['covers', 'moneyEnd'];
const EURO_ROWS: ComparisonRowId[] = ['spendAt90', 'sustainable', 'expectedLifetime'];

const Cell = ({ rowId, value }: { rowId: ComparisonRowId; value: number }) => {
  const intl = useIntl();
  if (AGE_ROWS.includes(rowId)) {
    if (value > MAX_AGE_SHOWN) {
      return (
        <FormattedMessage
          id={
            rowId === 'covers'
              ? 'futureMe.result.compare.cell.hundredPlus'
              : 'futureMe.result.compare.cell.never'
          }
        />
      );
    }
    return <FormattedMessage id="futureMe.result.compare.cell.age" values={{ age: value }} />;
  }
  if (EURO_ROWS.includes(rowId)) {
    return <>{euro(value)}</>;
  }
  return <>{intl.formatNumber(value, { style: 'percent', maximumFractionDigits: 0 })}</>;
};

export const ComparisonTable = ({
  context,
  captionId,
}: {
  context: ResultContext;
  captionId: string;
}) => {
  const columns = comparisonOf(context);
  const cells = columns.map(({ result }) => comparisonRowsOf(result));
  return (
    <div
      className="table-responsive result-compare-table"
      role="region"
      aria-labelledby={captionId}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region must take keyboard focus (WCAG 2.1.1)
      tabIndex={0}
    >
      <table className="table table-sm align-middle mb-0">
        <caption id={captionId}>
          <FormattedMessage id="futureMe.result.compare.caption" />
        </caption>
        <thead>
          <tr>
            <td>
              <span className="visually-hidden">
                <FormattedMessage id="futureMe.result.compare.measure" />
              </span>
            </td>
            {columns.map(({ id, isMine }) => (
              <th key={id} scope="col" className={isMine ? 'result-compare-mine' : undefined}>
                <FormattedMessage id={`futureMe.result.compare.scenario.${id}` as TranslationKey} />
                {isMine && (
                  <small>
                    <FormattedMessage id="futureMe.result.compare.mine" />
                  </small>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells[0].map(({ id: rowId }, rowIndex) => {
            const best = ROWS_WITH_BEST_COLUMN.includes(rowId)
              ? bestColumnsOf(cells.map((column) => column[rowIndex].value))
              : [];
            return (
              <tr key={rowId}>
                <th scope="row">
                  <FormattedMessage id={`futureMe.result.compare.row.${rowId}` as TranslationKey} />
                </th>
                {cells.map((column, columnIndex) => (
                  <td
                    key={columns[columnIndex].id}
                    className={best.includes(columnIndex) ? 'result-compare-best' : undefined}
                  >
                    <Cell rowId={rowId} value={column[rowIndex].value} />
                    {best.includes(columnIndex) && (
                      <span className="visually-hidden">
                        {' '}
                        <FormattedMessage id="futureMe.result.compare.best" />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const ResultComparison = ({ context }: { context: ResultContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <details className="result-compare" open={isOpen}>
      <summary
        onClick={(event) => {
          event.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        <FormattedMessage id="futureMe.result.compare.title" />
      </summary>
      {isOpen && <ComparisonTable context={context} captionId="future-me-compare-caption" />}
    </details>
  );
};
