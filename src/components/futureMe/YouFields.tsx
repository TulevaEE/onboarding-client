import React, { ChangeEvent } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { fieldProblem, limitsOf, YouAnswers, YouField } from './youAnswers';
import { HelpButton } from './HelpButton';
import { HelpTopic } from './helpTopics';

export const FIELD_DOM_IDS: Record<YouField, string> = {
  birthYear: 'future-me-birth-year',
  firstPillarMonthly: 'future-me-first-pillar-monthly',
  grossMonthly: 'future-me-gross-monthly',
  secondPillarAmount: 'future-me-second-pillar-amount',
  thirdPillarAmount: 'future-me-third-pillar-amount',
  thirdPillarMonthly: 'future-me-third-pillar-monthly',
  kidsCount: 'future-me-kids-count',
  hazardYears: 'future-me-hazard-years',
  rescueYears: 'future-me-rescue-years',
  specialPensionStartAge: 'future-me-special-pension-start-age',
};

const MIN_AMOUNT = 0;

interface FieldLabelProps {
  htmlFor: string;
  help?: HelpTopic;
  children: React.ReactNode;
}

export const FieldLabel = ({ htmlFor, help, children }: FieldLabelProps) =>
  help ? (
    <div className="label-line text-balance">
      <label className="form-label" htmlFor={htmlFor}>
        {children}
      </label>
      <HelpButton topic={help} />
    </div>
  ) : (
    <label className="form-label text-balance" htmlFor={htmlFor}>
      {children}
    </label>
  );

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
  labelValues?: Record<string, string | number>;
  unit?: TranslationKey;
  unitValues?: Record<string, string | number>;
  emptyError?: TranslationKey;
  name: TranslationKey;
  step: number;
  inputMode?: 'decimal' | 'numeric';
  shownValue?: string;
  disabled?: boolean;
  help?: HelpTopic;
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
  labelValues,
  unit,
  unitValues,
  emptyError,
  name,
  step,
  inputMode = 'decimal',
  shownValue,
  disabled = false,
  help,
  onChange,
  onBlur,
}: AmountFieldProps) => {
  const intl = useIntl();
  const id = FIELD_DOM_IDS[field];
  const isRequired = !disabled;
  const problem = touched.has(field) && !disabled ? fieldProblem(answers, field) : null;
  const errorId = `${id}-error`;
  const describedBy = classNames({ [`${id}-unit`]: unit, [errorId]: problem });
  const limits = limitsOf(field);
  const min = limits?.min ?? MIN_AMOUNT;
  const errorMessage = (() => {
    if (problem === 'empty') {
      return emptyError ?? 'futureMe.you.error.required';
    }
    return problem === 'range' ? 'futureMe.you.error.range' : 'futureMe.you.error.min';
  })();

  return (
    <div className="col-12 col-sm-6">
      <FieldLabel htmlFor={id} help={help}>
        <FormattedMessage id={label} values={labelValues} />
        {isRequired && (
          <>
            {' '}
            <RequiredMark />
          </>
        )}
      </FieldLabel>
      <input
        id={id}
        className={classNames('form-control', { 'is-invalid': problem })}
        type="number"
        inputMode={inputMode}
        min={min}
        max={limits?.max}
        step={step}
        value={shownValue ?? answers[field]}
        disabled={disabled}
        aria-required={isRequired}
        aria-invalid={!!problem}
        aria-describedby={describedBy || undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange({ [field]: event.target.value })
        }
        onBlur={() => onBlur(field)}
      />
      {unit && (
        <div className="form-text" id={`${id}-unit`}>
          <FormattedMessage id={unit} values={unitValues} />
        </div>
      )}
      {problem && (
        <div className="invalid-feedback" id={errorId}>
          <FormattedMessage
            id={errorMessage}
            values={{ name: intl.formatMessage({ id: name }), min, max: limits?.max }}
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
  hint?: TranslationKey;
  help?: HelpTopic;
  onChange: (value: string) => void;
}

export const SelectField = ({
  id,
  label,
  value,
  options,
  hint,
  help,
  onChange,
}: SelectFieldProps) => (
  <div className="col-12 col-sm-6">
    <FieldLabel htmlFor={id} help={help}>
      <FormattedMessage id={label} />
    </FieldLabel>
    <select
      id={id}
      className="form-select"
      value={value}
      aria-describedby={hint ? `${id}-hint` : undefined}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {hint && (
      <div className="form-text" id={`${id}-hint`}>
        <FormattedMessage id={hint} />
      </div>
    )}
  </div>
);
