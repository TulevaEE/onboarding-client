import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import {
  childRows,
  chosenSpecialCases,
  countedKids,
  hasChildWithoutBirthYear,
  HazardList,
  isChildBirthYearInvalid,
  isChildIIMonthsAsked,
  isChildIIMonthsInvalid,
  isKidsRightAvailableToSelf,
  KidsInForecast,
  KidsUser,
  maxChildBirthYear,
  YouAnswers,
} from './youAnswers';
import { isChildMonthAsked } from './kidsInput';
import { AmountField, BlockProps, FieldLabel, SelectField } from './YouFields';
import { HelpButton } from './HelpButton';
import { HelpTopic } from './helpTopics';
import { sectionLabels } from './YouBlocks';
import { YouOptionalSection, YouSection } from './YouSection';

const CHILD_BIRTH_YEAR_DIGITS = 4;
const MIN_CHILD_BIRTH_YEAR = 1930;
const SOCIAL_INSURANCE_BOARD_URL = 'https://sotsiaalkindlustusamet.ee';
const HAZARD_LISTS: Exclude<HazardList, 'no'>[] = ['list1', 'list2'];
const HAZARD_YEARS_NEEDED = { list1: 10, list2: 12.5 };
const SERVICE_YEARS_NEEDED = { list1: 20, list2: 25 };

type OptionalBlockProps = BlockProps & { optional: YouOptionalSection };
type KidsBlockProps = OptionalBlockProps & { hasRegisterChildren: boolean };

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

const KIDS_USERS: KidsUser[] = ['me', 'other'];
const KIDS_IN_FORECAST: KidsInForecast[] = ['unknown', 'no', 'yes'];
const MONTHS = Array.from({ length: 12 }, (_, month) => new Date(2000, month, 1));

const ChildBirthMonth = ({
  id,
  number,
  value,
  onChange,
}: {
  id: string;
  number: number;
  value: string;
  onChange: (month: string) => void;
}) => {
  const intl = useIntl();
  return (
    <div className="mt-2">
      <label className="form-label text-balance" htmlFor={id}>
        <FormattedMessage id="futureMe.you.kidBirthMonth.label" values={{ number }} />
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
    </div>
  );
};

export const KidsSection = ({
  answers,
  touched,
  isOpen,
  isComplete,
  optional,
  hasRegisterChildren,
  onToggle,
  onChange,
  onBlur,
}: KidsBlockProps) => {
  const intl = useIntl();
  const [leftRows, setLeftRows] = useState<ReadonlySet<number>>(new Set());
  const rows = childRows(answers);
  const maxYear = maxChildBirthYear(answers);
  const { late, lateYear } = countedKids(answers);
  const birthYearValues = { min: MIN_CHILD_BIRTH_YEAR, max: maxYear };

  const changeBirthYear = (index: number, typed: string) => {
    const years = Array.from({ length: rows }, (_, row) => answers.kidsBirthYears[row] ?? '');
    years[index] = typed;
    onChange({ kidsBirthYears: years });
  };

  const changeBirthMonth = (index: number, month: string) => {
    const months = Array.from({ length: rows }, (_, row) => answers.kidsBirthMonths[row] ?? '');
    months[index] = month;
    onChange({ kidsBirthMonths: months });
  };

  const changeIIMonths = (index: number, typed: string) => {
    const months = Array.from({ length: rows }, (_, row) => answers.kidsIIMonths[row] ?? '');
    months[index] = typed;
    onChange({ kidsIIMonths: months });
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
      <div className="row g-3">
        <AmountField
          field="kidsCount"
          answers={answers}
          touched={touched}
          label="futureMe.you.kidsCount.label"
          help="kidsWho"
          name="futureMe.you.kidsCount.name"
          step={1}
          inputMode="numeric"
          onChange={onChange}
          onBlur={onBlur}
        />
        {rows > 0 && (
          <>
            <div className="col-12">
              <p className="form-text mt-0 mb-0" id="future-me-kid-birth-year-hint">
                <FormattedMessage id="futureMe.you.kidBirthYear.hint" />
              </p>
            </div>
            <div
              className="col-12"
              role="group"
              aria-label={intl.formatMessage({ id: 'futureMe.you.kidBirthYear.group' })}
            >
              <div className="row g-3">
                {Array.from({ length: rows }, (_, index) => {
                  const typed = answers.kidsBirthYears[index] ?? '';
                  const id = `future-me-kid-birth-year-${index + 1}`;
                  const showError =
                    isChildBirthYearInvalid(answers, index) &&
                    (typed.trim().length === CHILD_BIRTH_YEAR_DIGITS || leftRows.has(index));
                  const monthsId = `future-me-kid-ii-months-${index + 1}`;
                  const isMonthsAsked = isChildIIMonthsAsked(Number(typed));
                  const isMonthsInvalid = isMonthsAsked && isChildIIMonthsInvalid(answers, index);
                  return (
                    <div className="col-12 col-sm-6 col-lg-4" key={id}>
                      <label className="form-label text-balance" htmlFor={id}>
                        <FormattedMessage
                          id="futureMe.you.kidBirthYear.label"
                          values={{ number: index + 1 }}
                        />
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
                          showError
                            ? `future-me-kid-birth-year-hint ${id}-error`
                            : 'future-me-kid-birth-year-hint'
                        }
                        onChange={(event) => changeBirthYear(index, event.target.value)}
                        onBlur={() => setLeftRows((previous) => new Set(previous).add(index))}
                      />
                      {showError && (
                        <div className="invalid-feedback" id={`${id}-error`}>
                          <FormattedMessage
                            id="futureMe.you.kidBirthYear.error"
                            values={{ number: index + 1, ...birthYearValues }}
                          />
                        </div>
                      )}
                      {isChildMonthAsked(typed) && (
                        <ChildBirthMonth
                          id={`future-me-kid-birth-month-${index + 1}`}
                          number={index + 1}
                          value={answers.kidsBirthMonths[index] ?? ''}
                          onChange={(month) => changeBirthMonth(index, month)}
                        />
                      )}
                      {isMonthsAsked && (
                        <div className="mt-3">
                          <FieldLabel htmlFor={monthsId} help="kidIIMonths">
                            <FormattedMessage
                              id="futureMe.you.kidIIMonths.label"
                              values={{ number: index + 1 }}
                            />
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
                            aria-describedby={
                              isMonthsInvalid
                                ? `${monthsId}-hint ${monthsId}-error`
                                : `${monthsId}-hint`
                            }
                            onChange={(event) => changeIIMonths(index, event.target.value)}
                          />
                          <div className="form-text" id={`${monthsId}-hint`}>
                            <FormattedMessage id="futureMe.you.kidIIMonths.hint" />
                          </div>
                          {isMonthsInvalid && (
                            <div className="invalid-feedback" id={`${monthsId}-error`}>
                              <FormattedMessage
                                id="futureMe.you.kidIIMonths.error"
                                values={{ number: index + 1 }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {hasRegisterChildren && (
              <div className="col-12">
                <div className="form-text mt-0">
                  <FormattedMessage id="futureMe.you.kids.adultNote" />
                </div>
              </div>
            )}
            {hasChildWithoutBirthYear(answers) && (
              <div className="col-12">
                <div className="form-text mt-0">
                  <FormattedMessage id="futureMe.you.kids.missingBirthYear" />
                </div>
              </div>
            )}
            {late > 0 && (
              <div className="col-12">
                <div className="form-text mt-0">
                  <FormattedMessage
                    id="futureMe.you.kids.late"
                    values={{ count: late, year: lateYear }}
                  />
                </div>
              </div>
            )}
            <SelectField
              id="future-me-kids-disabled"
              label="futureMe.you.kidsDisabled.label"
              value={answers.kidsDisabled ? 'yes' : 'no'}
              options={(['no', 'yes'] as const).map((value) => ({
                value,
                label: intl.formatMessage({ id: `futureMe.you.kidsDisabled.${value}` }),
              }))}
              onChange={(value) => onChange({ kidsDisabled: value === 'yes' })}
            />
            {isKidsRightAvailableToSelf(answers) && (
              <SelectField
                id="future-me-kids-early-user"
                label="futureMe.you.kidsEarlyUser.label"
                value={answers.kidsEarlyUser}
                options={(['me', 'other'] as const).map((value) => ({
                  value,
                  label: intl.formatMessage({ id: `futureMe.you.kidsEarlyUser.${value}` }),
                }))}
                onChange={(value) => onChange({ kidsEarlyUser: value as KidsUser })}
              />
            )}
            <SelectField
              id="future-me-kids-sup-user"
              label="futureMe.you.kidsSupUser.label"
              value={answers.kidsSupUser}
              options={KIDS_USERS.map((value) => ({
                value,
                label: intl.formatMessage({ id: `futureMe.you.kidsEarlyUser.${value}` }),
              }))}
              onChange={(value) => onChange({ kidsSupUser: value as KidsUser })}
            />
            <SelectField
              id="future-me-kids-in-forecast"
              label="futureMe.you.kidsInForecast.label"
              hint="futureMe.you.kidsInForecast.hint"
              value={answers.kidsInForecast}
              options={KIDS_IN_FORECAST.map((value) => ({
                value,
                label: intl.formatMessage({ id: `futureMe.you.kidsInForecast.${value}` }),
              }))}
              onChange={(value) => onChange({ kidsInForecast: value as KidsInForecast })}
            />
          </>
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
      {answers.isCivilServant && (
        <p className="you-note">
          <FormattedMessage id="futureMe.you.work.civilNote" />
        </p>
      )}
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
