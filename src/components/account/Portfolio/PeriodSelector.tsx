import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import moment from 'moment';
import { FormattedMessage, useIntl } from 'react-intl';
import uniqueId from 'lodash/uniqueId';
import { PillButton } from '../../common/PillButton';
import { TranslationKey } from '../../translations';
import styles from './PeriodSelector.module.scss';

const ISO_DATE = 'YYYY-MM-DD';
const SHOWN_DATE = 'DD.MM.YYYY';
const TYPED_DATES = ['D.M.YYYY', 'DD.MM.YYYY', 'D.MM.YYYY', 'DD.M.YYYY'];

const today = () => moment().format(ISO_DATE);

const QUIET_PERIOD_MS = 500;
const EARLIEST_YEAR = 1900;

const stopWaiting = (timer: ReturnType<typeof setTimeout> | undefined) => {
  if (timer) {
    clearTimeout(timer);
  }
};

const shownDate = (isoDate: string): string =>
  isoDate === '' ? '' : moment(isoDate, ISO_DATE).format(SHOWN_DATE);

const dateIn = (text: string, formats: string[]): string | undefined => {
  const parsed = moment(text.trim(), formats, true);
  return parsed.isValid() && parsed.year() >= EARLIEST_YEAR ? parsed.format(ISO_DATE) : undefined;
};

const typedDate = (text: string): string | undefined =>
  text.trim() === '' ? '' : dateIn(text, TYPED_DATES);

const fullyTypedDate = (text: string): string | undefined => dateIn(text, [SHOWN_DATE]);

const pickedDate = (isoDate: string): string | undefined =>
  isoDate === '' ? '' : dateIn(isoDate, [ISO_DATE]);

const showsPicker = (dateField: HTMLInputElement): boolean => {
  try {
    dateField.showPicker();
    return true;
  } catch {
    return false;
  }
};

const CalendarIcon: React.FunctionComponent = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857z" />
    <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
  </svg>
);

const DateInput: React.FunctionComponent<{
  label: TranslationKey;
  calendarLabel: TranslationKey;
  value: string;
  min?: string;
  max?: string;
  emptyMeansAllTime?: boolean;
  onCommit: (value: string) => void;
}> = ({ label, calendarLabel, value, min, max, emptyMeansAllTime, onCommit }) => {
  const { formatMessage } = useIntl();
  const [id] = useState(() => uniqueId('period-date-'));
  const [typed, setTyped] = useState<string | null>(null);
  const quietPeriod = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textBox = useRef<HTMLInputElement>(null);
  const calendar = useRef<HTMLInputElement>(null);

  useEffect(() => () => stopWaiting(quietPeriod.current), []);

  useLayoutEffect(() => {
    stopWaiting(quietPeriod.current);
    setTyped(null);
  }, [value]);

  const isCommittable = (date: string | undefined): date is string => {
    if (date === undefined) {
      return false;
    }
    if (date === '') {
      return Boolean(emptyMeansAllTime);
    }
    return (!min || date >= min) && (!max || date <= max);
  };

  const commit = (date: string | undefined) => {
    stopWaiting(quietPeriod.current);
    if (isCommittable(date)) {
      onCommit(date);
    }
    setTyped(null);
  };

  const commitTyped = () => {
    if (typed !== null) {
      commit(typedDate(typed));
    }
  };

  useEffect(() => {
    if (calendar.current) {
      calendar.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    const dateField = calendar.current;
    if (!dateField) {
      return undefined;
    }
    const onDayChosen = () => {
      const picked = pickedDate(dateField.value);
      dateField.value = value;
      dateField.blur();
      commit(picked);
    };
    dateField.addEventListener('change', onDayChosen);
    return () => dateField.removeEventListener('change', onDayChosen);
  });

  const openOnDateInEffect = (): boolean => {
    const dateField = calendar.current;
    if (!dateField) {
      return false;
    }
    dateField.value = value;
    return showsPicker(dateField);
  };

  const openCalendar = () => {
    if (!openOnDateInEffect()) {
      textBox.current?.focus();
    }
  };

  return (
    <>
      <label htmlFor={id} className={`${styles.dateLabel} text-body-secondary`}>
        <FormattedMessage id={label} />
      </label>
      <div className="position-relative">
        <div className="input-group input-group-sm">
          <input
            ref={textBox}
            id={id}
            type="text"
            size={10}
            placeholder={formatMessage({ id: 'savingsFund.statement.period.dateFormat' })}
            className={`form-control ${styles.dateText}`}
            value={typed ?? shownDate(value)}
            onChange={(event) => {
              const text = event.target.value;
              setTyped(text);
              stopWaiting(quietPeriod.current);
              quietPeriod.current = setTimeout(() => {
                const date = fullyTypedDate(text);
                if (date && isCommittable(date)) {
                  commit(date);
                }
              }, QUIET_PERIOD_MS);
            }}
            onBlur={commitTyped}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitTyped();
              }
            }}
          />
          <button
            type="button"
            className={`btn btn-outline-secondary ${styles.calendarButton}`}
            aria-label={formatMessage({ id: calendarLabel })}
            onClick={openCalendar}
          >
            <CalendarIcon />
          </button>
        </div>
        <input
          ref={calendar}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          className={`position-absolute top-0 end-0 h-100 opacity-0 ${styles.calendarPicker}`}
          min={min}
          max={max}
          onClick={openOnDateInEffect}
        />
      </div>
    </>
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
      from: moment().startOf('year').format(ISO_DATE),
      to: today(),
    },
    {
      id: 'lastYear',
      label: <FormattedMessage id="savingsFund.statement.period.lastYear" />,
      from: moment().subtract(1, 'year').startOf('year').format(ISO_DATE),
      to: moment().subtract(1, 'year').endOf('year').format(ISO_DATE),
    },
    {
      id: 'twelveMonths',
      label: <FormattedMessage id="savingsFund.statement.period.twelveMonths" />,
      from: moment().subtract(12, 'month').format(ISO_DATE),
      to: today(),
    },
    {
      id: 'allTime',
      label: <FormattedMessage id="savingsFund.statement.period.allTime" />,
      from: undefined,
      to: today(),
    },
  ];

  const shownFrom = from ?? allTimeStartDate ?? '';

  return (
    <>
      <div className="d-flex flex-column flex-sm-row flex-wrap align-items-start align-items-sm-center gap-2 mb-3">
        <span className="text-body-secondary me-1">
          <FormattedMessage id="savingsFund.statement.period.label" />
        </span>
        <div className="d-flex flex-wrap gap-2">
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
      </div>

      <div className={styles.dates}>
        <DateInput
          label="savingsFund.statement.period.start"
          calendarLabel="savingsFund.statement.period.startCalendar"
          value={shownFrom}
          max={to}
          emptyMeansAllTime
          onCommit={(value) => onPeriodChange(value || undefined, to)}
        />
        <span className={`${styles.dash} text-body-secondary`}>–</span>
        <DateInput
          label="savingsFund.statement.period.end"
          calendarLabel="savingsFund.statement.period.endCalendar"
          value={to}
          min={shownFrom}
          max={today()}
          onCommit={(value) => onPeriodChange(from, value)}
        />
      </div>
    </>
  );
};
