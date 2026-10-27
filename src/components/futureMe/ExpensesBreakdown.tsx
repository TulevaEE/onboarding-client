import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { formatAmountForCount, formatAmountForCurrency } from '../common/utils';
import { TranslationKey } from '../translations';
import { CostLevel, costLines, priceFactor, pricesAsOf, studyYear } from './engine/expenses';
import {
  ExpensesAnswers,
  isLevelEdited,
  isLineEdited,
  levelNeed,
  shownAmount,
  withLineEdit,
  withoutLevelEdits,
} from './expensesAnswers';

interface Props {
  answers: ExpensesAnswers;
  onChange: (answers: ExpensesAnswers) => void;
}

const LINE_STEP = 5;
const PRICE_RISE_FRACTION_DIGITS = 0;

const euro = (value: number): string => formatAmountForCurrency(Math.round(value), 0);

const lineDomId = (lineId: string): string => `future-me-cost-${lineId}`;

const emphasis = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

const sourceValues = (answers: ExpensesAnswers, level: CostLevel) => ({
  chip: emphasis,
  level: <FormattedMessage id={`futureMe.expenses.source.level.${level}` as TranslationKey} />,
  household: (
    <FormattedMessage
      id={`futureMe.expenses.source.household.${answers.household}` as TranslationKey}
    />
  ),
  year: String(studyYear),
  prices: pricesAsOf,
  percent: formatAmountForCount((priceFactor - 1) * 100, PRICE_RISE_FRACTION_DIGITS),
  hasQuintile: level === 'frugal' ? 'no' : 'yes',
});

export const ExpensesBreakdown = ({ answers, onChange }: Props) => {
  const { level, household } = answers;
  const lines = costLines(household, level);
  const statisticsTotal = lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <details className="mt-3 cost-breakdown">
      <summary className="btn btn-outline-primary summary-btn">
        <FormattedMessage id="futureMe.expenses.breakdown.summary" />
      </summary>
      <p className="form-text mt-2 mb-2">
        <FormattedMessage id="futureMe.expenses.breakdown.intro" />
      </p>
      <table className="table table-sm align-middle mb-0 cost-table">
        <caption className="visually-hidden">
          <FormattedMessage id="futureMe.expenses.breakdown.caption" />
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <FormattedMessage id="futureMe.expenses.breakdown.head.cost" />
            </th>
            <th scope="col" className="text-end">
              <FormattedMessage id="futureMe.expenses.breakdown.head.level" />
            </th>
            <th scope="col" className="text-end">
              <FormattedMessage id="futureMe.expenses.breakdown.head.own" />
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td>
                <label
                  className="mb-0"
                  id={`${lineDomId(line.id)}-label`}
                  htmlFor={lineDomId(line.id)}
                >
                  <FormattedMessage
                    id={`futureMe.expenses.category.${line.id}` as TranslationKey}
                  />
                </label>
              </td>
              <td className="text-end form-text">{euro(line.amount)}</td>
              <td className="text-end">
                <input
                  id={lineDomId(line.id)}
                  aria-labelledby={`${lineDomId(line.id)}-label`}
                  className={classNames('form-control form-control-sm cost-input', {
                    'is-edited': isLineEdited(answers, line),
                  })}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={LINE_STEP}
                  value={shownAmount(answers, line)}
                  onChange={(event) => onChange(withLineEdit(answers, line.id, event.target.value))}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="fw-bold">
            <th scope="row">
              <FormattedMessage id="futureMe.expenses.breakdown.total" />
            </th>
            <td className="text-end form-text">{euro(statisticsTotal)}</td>
            <td className="text-end">{euro(levelNeed(answers, level))}</td>
          </tr>
        </tfoot>
      </table>
      {isLevelEdited(answers, level) && (
        <button
          type="button"
          className="btn btn-outline-primary btn-sm mt-2"
          onClick={() => onChange(withoutLevelEdits(answers, level))}
        >
          <FormattedMessage id="futureMe.expenses.breakdown.reset" />
        </button>
      )}
      <p className="form-text mt-2 mb-0">
        <FormattedMessage
          id="futureMe.expenses.source.text"
          values={sourceValues(answers, level)}
        />
      </p>
    </details>
  );
};
