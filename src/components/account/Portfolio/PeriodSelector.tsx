import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { PillButton } from '../../common/PillButton';

const today = () => moment().format('YYYY-MM-DD');

// A date input reports every keystroke, and a half-typed year is still a whole date:
// typing 2013 passes through 0002, 0020 and 0201. Asking the backend for each of those
// redraws the chart under the person while they are still typing, so a date is only
// acted on once the typing stops — or at once when they leave the field.
const QUIET_PERIOD_MS = 500;
const EARLIEST_YEAR = 1900;

const stopWaiting = (timer: ReturnType<typeof setTimeout> | undefined) => {
  if (timer) {
    clearTimeout(timer);
  }
};

const isWholeDate = (value: string): boolean => {
  const parsed = moment(value, 'YYYY-MM-DD', true);
  return parsed.isValid() && parsed.year() >= EARLIEST_YEAR;
};

const DateInput: React.FunctionComponent<{
  label: string;
  value: string;
  min?: string;
  max?: string;
  emptyMeansAllTime?: boolean;
  onCommit: (value: string) => void;
}> = ({ label, value, min, max, emptyMeansAllTime, onCommit }) => {
  const [typed, setTyped] = useState<string | null>(null);
  const [discarded, setDiscarded] = useState(0);
  const quietPeriod = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => stopWaiting(quietPeriod.current), []);

  // A period chosen elsewhere — a preset, or the start the backend resolved — replaces
  // whatever was being typed. The wait has to be called off in the same breath as the
  // value changing, before a timer that is already due can slip in and commit the old date.
  useLayoutEffect(() => {
    stopWaiting(quietPeriod.current);
    setTyped(null);
  }, [value]);

  // The min and max on the box only colour a date outside them: whatever is typed still
  // arrives here. A start after the end of the period, or an end before its start, is
  // not a period anyone can be shown — it is left standing like half a date rather than
  // sent on for the backend to refuse.
  const isPeriodBoundary = (next: string) =>
    isWholeDate(next) && (!min || next >= min) && (!max || next <= max);

  const isCommittable = (next: string) =>
    next === '' ? Boolean(emptyMeansAllTime) : isPeriodBoundary(next);

  const commit = (next: string) => {
    stopWaiting(quietPeriod.current);

    if (isCommittable(next)) {
      // The new period goes out first. React does not batch these two when the quiet
      // period runs them, so letting go of what was typed beforehand would put the old
      // date back into the box for one pass — and writing a date input's value throws
      // away the segment the cursor was sitting in. Letting go afterwards is only left
      // to do at all when the date committed is the one already in effect.
      onCommit(next);
      setTyped(null);
      return;
    }
    // Half a date is not a period. The box goes back to the one actually in effect
    // rather than standing there showing a year nobody asked for. A date input keeps
    // whatever was typed into it, so the box is remounted to take the value back.
    setTyped(null);
    setDiscarded((count) => count + 1);
  };

  return (
    <input
      key={discarded}
      type="date"
      aria-label={label}
      className="form-control form-control-sm w-auto"
      value={typed ?? value}
      min={min}
      max={max}
      onChange={(event) => {
        const next = event.target.value;
        setTyped(next);
        stopWaiting(quietPeriod.current);
        // A pause between keystrokes is not the end of the typing: a date that is not
        // whole yet is left standing in the box, with the cursor still in it. An empty
        // box only means all time once the person leaves it — clearing a date to type
        // another one empties the box for as long as they take to start typing.
        quietPeriod.current = setTimeout(() => {
          if (isPeriodBoundary(next)) {
            commit(next);
          }
        }, QUIET_PERIOD_MS);
      }}
      // Nothing typed is nothing to act on: the box shows the start the backend resolved
      // for all time, and merely passing through it must not turn that into a chosen date.
      onBlur={() => {
        if (typed !== null) {
          commit(typed);
        }
      }}
    />
  );
};

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
        <DateInput
          label="from"
          value={shownFrom}
          max={to}
          emptyMeansAllTime
          onCommit={(value) => onPeriodChange(value || undefined, to)}
        />
        <span className="text-body-secondary">–</span>
        <DateInput
          label="to"
          value={to}
          min={shownFrom}
          max={today()}
          onCommit={(value) => onPeriodChange(from, value)}
        />
      </div>
    </>
  );
};
