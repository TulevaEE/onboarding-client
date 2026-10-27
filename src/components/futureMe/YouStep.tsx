import React, { ChangeEvent, RefObject } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { Sex } from './engine/pension';
import { BIRTH_YEAR_MAX, BIRTH_YEAR_MIN } from './prefill';
import { YouSection, YouSectionLabels } from './YouSection';

const ME_SECTION_LABELS: YouSectionLabels = {
  close: 'futureMe.you.me.close',
  closeLabel: 'futureMe.you.me.closeLabel',
  edit: 'futureMe.you.me.edit',
  editLabel: 'futureMe.you.me.editLabel',
  fill: 'futureMe.you.me.fill',
  fillLabel: 'futureMe.you.me.fillLabel',
  incomplete: 'futureMe.you.me.incomplete',
};

const SEX_OPTIONS = [
  { value: 'N', label: 'futureMe.you.sex.female' },
  { value: 'M', label: 'futureMe.you.sex.male' },
  { value: 'X', label: 'futureMe.you.sex.other' },
] as const;

const BIRTH_YEAR_RANGE = { min: String(BIRTH_YEAR_MIN), max: String(BIRTH_YEAR_MAX) };

interface Props {
  birthYear: string;
  sex: Sex;
  isPrefilled: boolean;
  isMeOpen: boolean;
  isBirthYearComplete: boolean;
  showBirthYearError: boolean;
  headingRef: RefObject<HTMLHeadingElement>;
  birthYearRef: RefObject<HTMLInputElement>;
  onBirthYearChange: (birthYear: string) => void;
  onBirthYearBlur: () => void;
  onSexChange: (sex: Sex) => void;
  onToggleMe: () => void;
}

export const YouStep = ({
  birthYear,
  sex,
  isPrefilled,
  isMeOpen,
  isBirthYearComplete,
  showBirthYearError,
  headingRef,
  birthYearRef,
  onBirthYearChange,
  onBirthYearBlur,
  onSexChange,
  onToggleMe,
}: Props) => {
  const intl = useIntl();
  const describedBy = classNames('future-me-birth-year-hint', {
    'future-me-birth-year-error': showBirthYearError,
  });

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-you-heading">
      <p className="chapter-kicker">
        <FormattedMessage id="futureMe.you.kicker" />
      </p>
      <h2 id="future-me-you-heading" tabIndex={-1} ref={headingRef}>
        <FormattedMessage id="futureMe.you.title" />
      </h2>
      <p>
        <FormattedMessage
          id="futureMe.you.intro"
          values={{ strong: (chunks: React.ReactNode) => <strong>{chunks}</strong> }}
        />
      </p>
      {isPrefilled && (
        <p className="prefill-note">
          <FormattedMessage id="futureMe.you.prefillNote" />
        </p>
      )}
      <ul className="you-list">
        <YouSection
          id="future-me-me"
          title={<FormattedMessage id="futureMe.you.me.title" />}
          summary={<FormattedMessage id="futureMe.you.me.summary" values={{ birthYear, sex }} />}
          labels={ME_SECTION_LABELS}
          isOpen={isMeOpen}
          isComplete={isBirthYearComplete}
          onToggle={onToggleMe}
        >
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="future-me-birth-year">
                <FormattedMessage id="futureMe.you.birthYear.label" />{' '}
                <span className="required-mark">
                  <FormattedMessage id="futureMe.required" />
                </span>
              </label>
              <input
                id="future-me-birth-year"
                ref={birthYearRef}
                className={classNames('form-control', { 'is-invalid': showBirthYearError })}
                type="number"
                inputMode="numeric"
                min={BIRTH_YEAR_MIN}
                max={BIRTH_YEAR_MAX}
                value={birthYear}
                aria-required="true"
                aria-invalid={showBirthYearError}
                aria-describedby={describedBy}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onBirthYearChange(event.target.value)
                }
                onBlur={onBirthYearBlur}
              />
              <div className="form-text" id="future-me-birth-year-hint">
                <FormattedMessage id="futureMe.you.birthYear.hint" values={BIRTH_YEAR_RANGE} />
              </div>
              {showBirthYearError && (
                <div className="invalid-feedback" id="future-me-birth-year-error">
                  <FormattedMessage id="futureMe.you.birthYear.error" values={BIRTH_YEAR_RANGE} />
                </div>
              )}
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="future-me-sex">
                <FormattedMessage id="futureMe.you.sex.label" />
              </label>
              <select
                id="future-me-sex"
                className="form-select"
                value={sex}
                onChange={(event) => onSexChange(event.target.value as Sex)}
              >
                {SEX_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {intl.formatMessage({ id: label })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </YouSection>
      </ul>
    </section>
  );
};
