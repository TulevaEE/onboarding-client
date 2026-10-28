import React, { ChangeEvent, RefObject } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { Sex } from './engine/pension';
import { BIRTH_YEAR_MAX, BIRTH_YEAR_MIN } from './prefill';
import { EarlyRetirementFields } from './EarlyRetirementFields';
import { SecondPillarSection, StateSection, ThirdPillarSection } from './YouBlocks';
import { KidsSection, kidsOptional, WorkSection, workOptional } from './YouOptionalBlocks';
import { FIELD_DOM_IDS, FieldLabel, PrefilledHint, RequiredMark } from './YouFields';
import { YouSection, YouSectionLabels } from './YouSection';
import {
  blockedFieldsOf,
  OptionalSectionId,
  YouAnswers,
  YouField,
  YouSectionId,
} from './youAnswers';
import { ChapterHead } from './ChapterHead';
import { FutureMeStep } from './steps';
import { strong } from './richText';

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
  answers: YouAnswers;
  touched: ReadonlySet<YouField>;
  openSections: Record<YouSectionId, boolean>;
  isPrefilled: boolean;
  hasRegisterChildren: boolean;
  headingRef: RefObject<HTMLHeadingElement>;
  onChange: (changes: Partial<YouAnswers>) => void;
  onBlur: (field: YouField) => void;
  onToggle: (section: YouSectionId) => void;
  onAddSection: (section: OptionalSectionId) => void;
  onRemoveSection: (section: OptionalSectionId) => void;
}

export const YouStep = ({
  answers,
  touched,
  openSections,
  isPrefilled,
  hasRegisterChildren,
  headingRef,
  onChange,
  onBlur,
  onToggle,
  onAddSection,
  onRemoveSection,
}: Props) => {
  const intl = useIntl();
  const { birthYear, sex } = answers;
  const showBirthYearError = touched.has('birthYear') && blockedFieldsOf(answers, 'me').length > 0;
  const blockProps = (section: Exclude<YouSectionId, 'me'>) => ({
    answers,
    touched,
    isOpen: openSections[section],
    isComplete: blockedFieldsOf(answers, section).length === 0,
    onToggle: () => onToggle(section),
    onChange,
    onBlur,
  });
  const describedBy = classNames('future-me-birth-year-hint', {
    'future-me-birth-year-error': showBirthYearError,
  });

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-you-heading">
      <ChapterHead step={FutureMeStep.YOU}>
        <p className="chapter-kicker">
          <FormattedMessage id="futureMe.you.kicker" />
        </p>
        <h2 id="future-me-you-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
          <FormattedMessage id="futureMe.you.title" />
        </h2>
      </ChapterHead>
      <p>
        <FormattedMessage id="futureMe.you.intro" values={{ strong }} />
      </p>
      <PrefilledHint />
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
          isOpen={openSections.me}
          isComplete={blockedFieldsOf(answers, 'me').length === 0}
          onToggle={() => onToggle('me')}
        >
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label className="form-label text-balance" htmlFor={FIELD_DOM_IDS.birthYear}>
                <FormattedMessage id="futureMe.you.birthYear.label" /> <RequiredMark />
              </label>
              <input
                id={FIELD_DOM_IDS.birthYear}
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
                  onChange({ birthYear: event.target.value })
                }
                onBlur={() => onBlur('birthYear')}
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
              <FieldLabel htmlFor="future-me-sex" help="sex">
                <FormattedMessage id="futureMe.you.sex.label" />
              </FieldLabel>
              <select
                id="future-me-sex"
                className="form-select"
                value={sex}
                onChange={(event) => onChange({ sex: event.target.value as Sex })}
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
        <StateSection {...blockProps('state')} />
        <SecondPillarSection {...blockProps('secondPillar')} />
        <ThirdPillarSection {...blockProps('thirdPillar')} />
        <KidsSection
          {...blockProps('kids')}
          hasRegisterChildren={hasRegisterChildren}
          optional={kidsOptional(
            answers,
            () => onAddSection('kids'),
            () => onRemoveSection('kids'),
          )}
        />
        <WorkSection
          {...blockProps('work')}
          optional={workOptional(
            answers,
            () => onAddSection('work'),
            () => onRemoveSection('work'),
          )}
        />
      </ul>
      <EarlyRetirementFields answers={answers} onChange={onChange} />
    </section>
  );
};
