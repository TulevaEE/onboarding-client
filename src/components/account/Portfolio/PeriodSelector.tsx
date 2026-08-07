import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { PillButton } from '../../common/PillButton';

const today = () => moment().format('YYYY-MM-DD');

export const PeriodSelector: React.FunctionComponent<{
  from: string | undefined;
  to: string;
  allTimeStartDate?: string;
  onPeriodChange: (from: string | undefined, to: string) => void;
}> = ({ from, to, allTimeStartDate, onPeriodChange }) => {
  const presets = [
    {
      id: 'thisYear',
      label: <FormattedMessage id="savingsFund.statement.period.thisYear" />,
      from: moment().startOf('year').format('YYYY-MM-DD'),
      to: today(),
    },
    {
      id: 'lastYear',
      label: <FormattedMessage id="savingsFund.statement.period.lastYear" />,
      from: moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD'),
      to: moment().subtract(1, 'year').endOf('year').format('YYYY-MM-DD'),
    },
    {
      id: 'twelveMonths',
      label: <FormattedMessage id="savingsFund.statement.period.twelveMonths" />,
      from: moment().subtract(12, 'month').format('YYYY-MM-DD'),
      to: today(),
    },
    {
      id: 'allTime',
      label: <FormattedMessage id="savingsFund.statement.period.allTime" />,
      from: undefined,
      to: today(),
    },
  ];

  // All time has no start date of its own: the date box shows where the history it drew
  // actually begins, and stays empty while there is no history to point at.
  const shownFrom = from ?? allTimeStartDate ?? '';

  return (
    <>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <span className="text-body-secondary me-1">
          <FormattedMessage id="savingsFund.statement.period.label" />
        </span>
        {presets.map((preset) => (
          <PillButton
            key={preset.id}
            selected={from === preset.from && to === preset.to}
            onClick={() => onPeriodChange(preset.from, preset.to)}
          >
            {preset.label}
          </PillButton>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center">
        <input
          type="date"
          aria-label="from"
          className="form-control form-control-sm w-auto"
          value={shownFrom}
          max={to}
          // A date input reports '' while a date is half-typed or cleared. No start
          // date means all time, which is a period someone can ask for.
          onChange={(event) => onPeriodChange(event.target.value || undefined, to)}
        />
        <span className="text-body-secondary">–</span>
        <input
          type="date"
          aria-label="to"
          className="form-control form-control-sm w-auto"
          value={to}
          min={shownFrom}
          max={today()}
          // An end date is required, so a half-typed or cleared one is not a period to
          // ask the backend for — the previous end date stands until a whole one arrives.
          onChange={(event) => event.target.value && onPeriodChange(from, event.target.value)}
        />
      </div>
    </>
  );
};
