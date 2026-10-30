import React, { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import {
  childRows,
  chosenSpecialCases,
  childNoteOf,
  HazardList,
  isChildBirthYearInvalid,
  isChildIIMonthsAsked,
  isChildIIMonthsInvalid,
  isKidsRightAvailableToSelf,
  KidsSupplementUser,
  KidsUser,
  maxChildBirthYear,
  minChildBirthYear,
  serviceIncreaseAtPension,
  YouAnswers,
} from './youAnswers';
import {
  attributableIIMonths,
  isPrefilledChild,
  isPrefilledIIMonths,
  KidsPrefill,
} from './kidsPrefill';
import { isIIPaymentUserAsked } from './kidsInput';
import { AmountField, BlockProps, FieldLabel, PREFILLED_HINT_ID, SelectField } from './YouFields';
import { HelpButton } from './HelpButton';
import { HelpTopic } from './helpTopics';
import { sectionLabels } from './YouBlocks';
import { YouOptionalSection, YouSection } from './YouSection';

const CHILD_BIRTH_YEAR_DIGITS = 4;
const SOCIAL_INSURANCE_BOARD_URL = 'https://sotsiaalkindlustusamet.ee';
const HAZARD_LISTS: Exclude<HazardList, 'no'>[] = ['list1', 'list2'];
const HAZARD_YEARS_NEEDED = { list1: 10, list2: 12.5 };
const SERVICE_YEARS_NEEDED = { list1: 20, list2: 25 };

type OptionalBlockProps = BlockProps & { optional: YouOptionalSection };
type KidsBlockProps = OptionalBlockProps & { prefilledKids: KidsPrefill | null };

const optionalOf = (
  block: 'kids' | 'work',
  isAdded: boolean,
  onAdd: () => void,
  onRemove: () => void,
): YouOptionalSection => ({
  isAdded,
  labels: {
    add: `futureMe.you.${block}.add` as TranslationKey,
    why: `futureMe.you.${block}.why` as TranslationKey,
    remove: `futureMe.you.${block}.remove` as TranslationKey,
  },
  onAdd,
  onRemove,
});

export const kidsOptional = (answers: YouAnswers, onAdd: () => void, onRemove: () => void) =>
  optionalOf('kids', answers.kidsAdded, onAdd, onRemove);

export const workOptional = (answers: YouAnswers, onAdd: () => void, onRemove: () => void) =>
  optionalOf('work', answers.workAdded, onAdd, onRemove);

const civilIncreaseOf = (answers: YouAnswers) => {
  const { source, increase } = serviceIncreaseAtPension(answers);
  if (source === 'rescue') {
    return { state: increase > 0 ? 'rescue' : 'rescueNone', percent: 0 };
  }
  if (answers.civilYears.trim() === '') {
    return { state: 'empty', percent: 0 };
  }
  return { state: increase > 0 ? 'raises' : 'none', percent: Math.round(increase * 100) };
};

const KIDS_USERS: KidsUser[] = ['me', 'other'];
const SUPPLEMENT_USERS: KidsSupplementUser[] = ['me', 'other', 'split'];
const MONTHS = Array.from({ length: 12 }, (_, month) => new Date(2000, month, 1));

const ChildBirthMonth = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (month: string) => void;
}) => {
  const intl = useIntl();
  return (
    <>
      <label className="form-label" htmlFor={id}>
        <FormattedMessage id="futureMe.you.kidBirthMonth.label" />
      </label>
      <select
        id={id}
        className="form-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{intl.formatMessage({ id: 'futureMe.you.kidBirthMonth.unknown' })}</option>
        {MONTHS.map((date, index) => (
          <option key={date.getMonth()} value={String(index + 1)}>
            {intl.formatDate(date, { month: 'long' })}
          </option>
        ))}
      </select>
    </>
  );
};

export const KidsSection = ({
  answers,
  isOpen,
  isComplete,
  optional,
  prefilledKids,
  onToggle,
  onChange,
}: KidsBlockProps) => {
  const intl = useIntl();
  const [leftRows, setLeftRows] = useState<ReadonlySet<number>>(new Set());
  const addChildRef = useRef<HTMLButtonElement>(null);
  const rows = childRows(answers);
  const maxYear = maxChildBirthYear(answers);
  const birthYearValues = { min: minChildBirthYear(answers), max: maxYear };

  const changeBirthYear = (index: number, typed: string) => {
    const years = Array.from({ length: rows }, (_, row) => answers.kidsBirthYears[row] ?? '');
    years[index] = typed;
    onChange({
      kidsBirthYears: years,
      kidsIIMonths: attributableIIMonths(prefilledKids, years, answers.kidsIIMonths),
    });
  };

  const addChild = () => {
    flushSync(() => onChange({ kidsCount: String(rows + 1) }));
    document.getElementById(`future-me-kid-birth-year-${rows + 1}`)?.focus();
  };

  const removeChild = (index: number) => {
    const withoutChild = <T,>(values: T[]) => values.filter((_, row) => row !== index);
    onChange({
      kidsCount: String(rows - 1),
      kidsBirthYears: withoutChild(answers.kidsBirthYears),
      kidsBirthMonths: withoutChild(answers.kidsBirthMonths),
      kidsIIMonths: withoutChild(answers.kidsIIMonths),
      kidsDisabled: withoutChild(answers.kidsDisabled),
    });
    setLeftRows(new Set());
    addChildRef.current?.focus();
  };

  const changeDisabled = (index: number, isDisabled: boolean) => {
    const disabled = Array.from({ length: rows }, (_, row) => answers.kidsDisabled[row] ?? false);
    disabled[index] = isDisabled;
    onChange({ kidsDisabled: disabled });
  };

  const changeIIMonths = (index: number, typed: string) => {
    const months = Array.from({ length: rows }, (_, row) => answers.kidsIIMonths[row] ?? '');
    months[index] = typed;
    onChange({ kidsIIMonths: months });
  };

  const changeBirthMonth = (index: number, month: string) => {
    const months = Array.from({ length: rows }, (_, row) => answers.kidsBirthMonths[row] ?? '');
    months[index] = month;
    onChange({ kidsBirthMonths: months });
  };

  return (
    <YouSection
      id="future-me-kids"
      title={<FormattedMessage id="futureMe.you.kids.title" />}
      help="kids"
      summary={<FormattedMessage id="futureMe.you.kids.summary" values={{ count: rows }} />}
      labels={sectionLabels('kids')}
      isOpen={isOpen}
      isComplete={isComplete}
      onToggle={onToggle}
      optional={optional}
    >
      {Array.from({ length: rows }, (_, index) => {
        const number = index + 1;
        const typed = answers.kidsBirthYears[index] ?? '';
        const id = `future-me-kid-birth-year-${number}`;
        const headingId = `future-me-kid-${number}`;
        const showError =
          isChildBirthYearInvalid(answers, index) &&
          (typed.trim().length === CHILD_BIRTH_YEAR_DIGITS || leftRows.has(index));
        const monthsId = `future-me-kid-ii-months-${number}`;
        const isMonthsAsked = isChildIIMonthsAsked(answers, index);
        const isMonthsInvalid = isMonthsAsked && isChildIIMonthsInvalid(answers, index);
        const note = childNoteOf(answers, index);
        return (
          <div className="future-me-kid" role="group" aria-labelledby={headingId} key={id}>
            <div className="future-me-kid-head">
              <h4 id={headingId}>
                <FormattedMessage id="futureMe.you.kid.title" values={{ number }} />
              </h4>
              {rows > 1 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm px-0"
                  aria-label={intl.formatMessage(
                    { id: 'futureMe.you.kid.removeLabel' },
                    { number },
                  )}
                  onClick={() => removeChild(index)}
                >
                  <FormattedMessage id="futureMe.you.kid.remove" />
                </button>
              )}
            </div>
            <div className="row g-3">
              <div className="col-6 col-sm-4">
                <label className="form-label" htmlFor={id}>
                  <FormattedMessage id="futureMe.you.kidBirthYear.label" />
                </label>
                <input
                  id={id}
                  className={showError ? 'form-control is-invalid' : 'form-control'}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={CHILD_BIRTH_YEAR_DIGITS}
                  autoComplete="off"
                  value={typed}
                  aria-invalid={showError}
                  aria-describedby={
                    classNames({
                      [PREFILLED_HINT_ID]:
                        prefilledKids !== null &&
                        isPrefilledChild(prefilledKids, answers.kidsBirthYears, index),
                      [`${id}-error`]: showError,
                    }) || undefined
                  }
                  onChange={(event) => changeBirthYear(index, event.target.value)}
                  onBlur={() => setLeftRows((previous) => new Set(previous).add(index))}
                />
                {showError && (
                  <div className="invalid-feedback" id={`${id}-error`}>
                    <FormattedMessage
                      id="futureMe.you.kidBirthYear.error"
                      values={{ number, ...birthYearValues }}
                    />
                  </div>
                )}
              </div>
              <div className="col-6 col-sm-4">
                <ChildBirthMonth
                  id={`future-me-kid-birth-month-${number}`}
                  value={answers.kidsBirthMonths[index] ?? ''}
                  onChange={(month) => changeBirthMonth(index, month)}
                />
              </div>
              {isMonthsAsked && (
                <div className="col-12 col-sm-8">
                  <FieldLabel htmlFor={monthsId} help="kidIIMonths">
                    <FormattedMessage id="futureMe.you.kidIIMonths.label" />
                  </FieldLabel>
                  <input
                    id={monthsId}
                    className={isMonthsInvalid ? 'form-control is-invalid' : 'form-control'}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="36"
                    step="1"
                    value={answers.kidsIIMonths[index] ?? ''}
                    aria-invalid={isMonthsInvalid}
                    aria-describedby={classNames(`${monthsId}-hint`, {
                      [PREFILLED_HINT_ID]: isPrefilledIIMonths(
                        prefilledKids,
                        answers.kidsBirthYears,
                        answers.kidsIIMonths,
                        index,
                      ),
                      [`${monthsId}-error`]: isMonthsInvalid,
                    })}
                    onChange={(event) => changeIIMonths(index, event.target.value)}
                  />
                  <div className="form-text" id={`${monthsId}-hint`}>
                    <FormattedMessage id="futureMe.you.kidIIMonths.hint" />
                  </div>
                  {isMonthsInvalid && (
                    <div className="invalid-feedback" id={`${monthsId}-error`}>
                      <FormattedMessage id="futureMe.you.kidIIMonths.error" values={{ number }} />
                    </div>
                  )}
                </div>
              )}
              <div className="col-12">
                <div className="form-check">
                  <input
                    id={`future-me-kid-disabled-${number}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={answers.kidsDisabled[index] ?? false}
                    onChange={(event) => changeDisabled(index, event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor={`future-me-kid-disabled-${number}`}>
                    <FormattedMessage id="futureMe.you.kidDisabled.label" />
                  </label>
                  <HelpButton topic="kidDisabled" />
                </div>
              </div>
            </div>
            {note && (
              <div className="form-text">
                {note.kind === 'noBirthYear' ? (
                  <FormattedMessage id="futureMe.you.kid.noBirthYear" />
                ) : (
                  <FormattedMessage
                    id="futureMe.you.kid.late"
                    values={{ turnsEight: note.turnsEight, year: note.retirementYear }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
      <button
        ref={addChildRef}
        type="button"
        className="btn btn-sm btn-outline-primary"
        onClick={addChild}
      >
        <span aria-hidden="true">+ </span>
        <FormattedMessage id="futureMe.you.kid.add" />
      </button>
      <div className="row g-3 mt-0">
        {isKidsRightAvailableToSelf(answers) && (
          <SelectField
            id="future-me-kids-early-user"
            label="futureMe.you.kidsEarlyUser.label"
            hint="futureMe.you.kidsEarlyUser.hint"
            help="kidsEarlyUser"
            value={answers.kidsEarlyUser}
            options={(['me', 'other'] as const).map((value) => ({
              value,
              label: intl.formatMessage({ id: `futureMe.you.kidsEarlyUser.${value}` }),
            }))}
            onChange={(value) =>
              onChange({ kidsEarlyUser: value as KidsUser, earlyYearsPicked: '' })
            }
          />
        )}
        <SelectField
          id="future-me-kids-sup-user"
          label="futureMe.you.kidsSupUser.label"
          help="kidsSupUser"
          value={answers.kidsSupUser}
          options={SUPPLEMENT_USERS.map((value) => ({
            value,
            label: intl.formatMessage({ id: `futureMe.you.kidsSupUser.${value}` }),
          }))}
          onChange={(value) => onChange({ kidsSupUser: value as KidsSupplementUser })}
        />
        {isIIPaymentUserAsked(answers) && (
          <SelectField
            id="future-me-kids-ii-user"
            label="futureMe.you.kidsIIUser.label"
            help="kidsIIUser"
            value={answers.kidsIIUser}
            options={KIDS_USERS.map((value) => ({
              value,
              label: intl.formatMessage({ id: `futureMe.you.kidsEarlyUser.${value}` }),
            }))}
            onChange={(value) => onChange({ kidsIIUser: value as KidsUser })}
          />
        )}
      </div>
    </YouSection>
  );
};

const SPECIAL_CASE_CHECKBOXES = [
  { id: 'future-me-case-hazard', label: 'futureMe.you.work.hazard' },
  { id: 'future-me-case-special-pension', label: 'futureMe.you.work.specialPension' },
  { id: 'future-me-case-rescue', label: 'futureMe.you.work.rescue' },
  { id: 'future-me-case-civil', label: 'futureMe.you.work.civil' },
  { id: 'future-me-case-other', label: 'futureMe.you.work.other' },
] as const;

type SpecialCaseId = (typeof SPECIAL_CASE_CHECKBOXES)[number]['id'];

const SPECIAL_CASE_HELP: Partial<Record<SpecialCaseId, HelpTopic>> = {
  'future-me-case-special-pension': 'sp',
  'future-me-case-civil': 'civil',
};

export const WorkSection = ({
  answers,
  touched,
  isOpen,
  isComplete,
  optional,
  onToggle,
  onChange,
  onBlur,
}: OptionalBlockProps) => {
  const intl = useIntl();
  const { hazardList } = answers;
  const hasHazard = hazardList !== 'no';
  const hazardYears = parseFloat(answers.hazardYears);
  const hazardNeeded = hasHazard ? HAZARD_YEARS_NEEDED[hazardList] : 0;
  const civilIncreaseText = civilIncreaseOf(answers);
  const isChecked: Record<SpecialCaseId, boolean> = {
    'future-me-case-hazard': hasHazard,
    'future-me-case-special-pension': answers.hasSpecialPension,
    'future-me-case-rescue': answers.hasRescue,
    'future-me-case-civil': answers.isCivilServant,
    'future-me-case-other': answers.hasOtherSpecialCase,
  };
  const toggleCase = (id: keyof typeof isChecked, checked: boolean): Partial<YouAnswers> => {
    switch (id) {
      case 'future-me-case-hazard':
        return { hazardList: checked ? 'list1' : 'no' };
      case 'future-me-case-special-pension':
        return { hasSpecialPension: checked };
      case 'future-me-case-rescue':
        return { hasRescue: checked };
      case 'future-me-case-civil':
        return { isCivilServant: checked };
      default:
        return { hasOtherSpecialCase: checked };
    }
  };

  return (
    <YouSection
      id="future-me-work"
      title={<FormattedMessage id="futureMe.you.work.title" />}
      help="special"
      summary={
        <FormattedMessage
          id="futureMe.you.work.summary"
          values={{ count: chosenSpecialCases(answers) }}
        />
      }
      labels={sectionLabels('work')}
      isOpen={isOpen}
      isComplete={isComplete}
      onToggle={onToggle}
      optional={optional}
    >
      <p className="form-text mt-0 mb-2" id="future-me-work-intro">
        <FormattedMessage id="futureMe.you.work.intro" />
      </p>
      <div className="mb-3" role="group" aria-labelledby="future-me-work-intro">
        {SPECIAL_CASE_CHECKBOXES.map(({ id, label }) => (
          <div className="form-check" key={id}>
            <input
              className="form-check-input"
              type="checkbox"
              id={id}
              checked={isChecked[id]}
              onChange={(event) => onChange(toggleCase(id, event.target.checked))}
            />
            <label className="form-check-label" htmlFor={id}>
              <FormattedMessage id={label} />
            </label>
            {SPECIAL_CASE_HELP[id] && <HelpButton topic={SPECIAL_CASE_HELP[id] as HelpTopic} />}
          </div>
        ))}
      </div>
      {answers.hasOtherSpecialCase && (
        <p className="you-note">
          <FormattedMessage
            id="futureMe.you.work.otherNote"
            values={{
              link: (chunks: React.ReactNode) => <a href={SOCIAL_INSURANCE_BOARD_URL}>{chunks}</a>,
            }}
          />
        </p>
      )}
      <div className="row g-3">
        {hasHazard && (
          <>
            <SelectField
              id="future-me-hazard-list"
              label="futureMe.you.hazardList.label"
              help="hazard"
              value={hazardList}
              hint="futureMe.you.hazardList.hint"
              options={HAZARD_LISTS.map((list) => ({
                value: list,
                label: intl.formatMessage({
                  id: `futureMe.you.hazardList.${list}` as TranslationKey,
                }),
              }))}
              onChange={(list) => onChange({ hazardList: list as HazardList })}
            />
            <AmountField
              field="hazardYears"
              answers={answers}
              touched={touched}
              label="futureMe.you.hazardYears.label"
              labelValues={{ list: hazardList === 'list1' ? 1 : 2 }}
              unit="futureMe.you.hazardYears.hint"
              unitValues={{
                list: hazardList,
                needed: hazardNeeded,
                service: SERVICE_YEARS_NEEDED[hazardList],
                isTooShort: hazardYears >= 0 && hazardYears < hazardNeeded ? 'yes' : 'no',
                years: hazardYears,
              }}
              name="futureMe.you.hazardYears.name"
              step={0.5}
              inputMode="decimal"
              onChange={onChange}
              onBlur={onBlur}
            />
            {hazardList === 'list1' && (
              <AmountField
                field="undergroundYears"
                answers={answers}
                touched={touched}
                label="futureMe.you.undergroundYears.label"
                unit="futureMe.you.undergroundYears.hint"
                name="futureMe.you.undergroundYears.name"
                step={0.5}
                inputMode="decimal"
                onChange={onChange}
                onBlur={onBlur}
              />
            )}
          </>
        )}
        {answers.hasRescue && (
          <AmountField
            field="rescueYears"
            answers={answers}
            touched={touched}
            label="futureMe.you.rescueYears.label"
            help="rescue"
            unit="futureMe.you.rescueYears.hint"
            name="futureMe.you.rescueYears.name"
            step={1}
            inputMode="numeric"
            onChange={onChange}
            onBlur={onBlur}
          />
        )}
        {answers.isCivilServant && (
          <AmountField
            field="civilYears"
            answers={answers}
            touched={touched}
            label="futureMe.you.civilYears.label"
            unit="futureMe.you.civilYears.hint"
            unitValues={civilIncreaseText}
            name="futureMe.you.civilYears.name"
            step={1}
            inputMode="numeric"
            onChange={onChange}
            onBlur={onBlur}
          />
        )}
        {answers.hasSpecialPension && (
          <AmountField
            field="specialPensionStartAge"
            answers={answers}
            touched={touched}
            label="futureMe.you.specialPensionStart.label"
            help="spStart"
            unit="futureMe.you.specialPensionStart.unit"
            emptyError="futureMe.you.specialPensionStart.error"
            name="futureMe.you.specialPensionStart.name"
            step={1}
            inputMode="numeric"
            onChange={onChange}
            onBlur={onBlur}
          />
        )}
      </div>
    </YouSection>
  );
};
