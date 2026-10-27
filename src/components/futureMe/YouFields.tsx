import React, { ChangeEvent } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { fieldProblem, YouAnswers, YouField } from './youAnswers';

export const FIELD_DOM_IDS: Record<YouField, string> = {
  birthYear: 'future-me-birth-year',
  firstPillarMonthly: 'future-me-first-pillar-monthly',
  grossMonthly: 'future-me-gross-monthly',
  secondPillarAmount: 'future-me-second-pillar-amount',
  thirdPillarAmount: 'future-me-third-pillar-amount',
  thirdPillarMonthly: 'future-me-third-pillar-monthly',
};

const MIN_AMOUNT = 0;

export interface BlockProps {
  answers: YouAnswers;
  touched: ReadonlySet<YouField>;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  onChange: (changes: Partial<YouAnswers>) => void;
  onBlur: (field: YouField) => void;
}

interface AmountFieldProps {
  field: Exclude<YouField, 'birthYear'>;
  answers: YouAnswers;
  touched: ReadonlySet<YouField>;
  label: TranslationKey;
  unit: TranslationKey;
  name: TranslationKey;
  step: number;
  shownValue?: string;
  disabled?: boolean;
  onChange: (changes: Partial<YouAnswers>) => void;
  onBlur: (field: YouField) => void;
}

export const RequiredMark = () => (
  <span className="required-mark">
    <FormattedMessage id="futureMe.required" />
  </span>
);

export const AmountField = ({
  field,
  answers,
  touched,
  label,
  unit,
  name,
  step,
  shownValue,
  disabled = false,
  onChange,
  onBlur,
}: AmountFieldProps) => {
  const intl = useIntl();
  const id = FIELD_DOM_IDS[field];
  const isRequired = !disabled;
  const problem = touched.has(field) && !disabled ? fieldProblem(answers, field) : null;
  const errorId = `${id}-error`;
  const describedBy = classNames(`${id}-unit`, { [errorId]: problem });

  return (
    <div className="col-12 col-sm-6">
      <label className="form-label text-balance" htmlFor={id}>
        <FormattedMessage id={label} />
        {isRequired && (
          <>
            {' '}
            <RequiredMark />
          </>
        )}
      </label>
      <input
        id={id}
        className={classNames('form-control', { 'is-invalid': problem })}
        type="number"
        inputMode="decimal"
        min={MIN_AMOUNT}
        step={step}
        value={shownValue ?? answers[field]}
        disabled={disabled}
        aria-required={isRequired}
        aria-invalid={!!problem}
        aria-describedby={describedBy}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange({ [field]: event.target.value })
        }
        onBlur={() => onBlur(field)}
      />
      <div className="form-text" id={`${id}-unit`}>
        <FormattedMessage id={unit} />
      </div>
      {problem && (
        <div className="invalid-feedback" id={errorId}>
          <FormattedMessage
            id={problem === 'empty' ? 'futureMe.you.error.required' : 'futureMe.you.error.min'}
            values={{ name: intl.formatMessage({ id: name }), min: MIN_AMOUNT }}
          />
        </div>
      )}
    </div>
  );
};

interface SelectFieldProps {
  id: string;
  label: TranslationKey;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export const SelectField = ({ id, label, value, options, onChange }: SelectFieldProps) => (
  <div className="col-12 col-sm-6">
    <label className="form-label text-balance" htmlFor={id}>
      <FormattedMessage id={label} />
    </label>
    <select
      id={id}
      className="form-select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);
