import React from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { formatAmountForCount } from '../common/utils';
import { EARLY_DECREASE } from './engine/pension';
import { SelectField } from './YouFields';
import {
  birthYearOrFallback,
  earlyRetirementRight,
  earlyRetirementYears,
  earlyRightSources,
  isKidsRightAvailableToSelf,
  isSpecialPensionOnly,
  maxEarlyYearsOption,
  pensionAgeValue,
  YouAnswers,
} from './youAnswers';
import { strong } from './richText';

const NO_START_AGE = 'none';

const PERCENT_FRACTION_DIGITS = 2;
const TRAILING_ZEROS = /,?0+$/;

const percentText = (share: number): string =>
  `${formatAmountForCount(share * 100, PERCENT_FRACTION_DIGITS)
    .replace('.', ',')
    .replace(TRAILING_ZEROS, '')}%`;

const earlyYearsLabel = (intl: IntlShape, years: number, right: number): string => {
  if (years === 0) {
    return intl.formatMessage({ id: 'futureMe.you.earlyYears.none' });
  }
  if (years <= right) {
    return intl.formatMessage(
      { id: 'futureMe.you.earlyYears.unreduced' },
      { years, isEarliest: years === right ? 'yes' : 'no' },
    );
  }
  return intl.formatMessage(
    { id: 'futureMe.you.earlyYears.flexible' },
    { years, percent: percentText(-EARLY_DECREASE[years]) },
  );
};

const reasonsText = (intl: IntlShape, answers: YouAnswers): string => {
  const { kids, hazard, rescue } = earlyRightSources(answers);
  const reasons = [
    kids > 0 && intl.formatMessage({ id: 'futureMe.you.earlyYears.reasonKids' }, { years: kids }),
    hazard > 0 &&
      intl.formatMessage({ id: 'futureMe.you.earlyYears.reasonHazard' }, { years: hazard }),
    rescue > 0 &&
      intl.formatMessage({ id: 'futureMe.you.earlyYears.reasonRescue' }, { years: rescue }),
  ].filter((reason): reason is string => reason !== false);
  const [first, second, third] = reasons;
  return intl.formatMessage(
    { id: 'futureMe.you.earlyYears.reasons' },
    { count: reasons.length, first, second, third },
  );
};

const summaryOf = (intl: IntlShape, answers: YouAnswers): React.ReactNode => {
  const years = earlyRetirementYears(answers);
  const right = earlyRetirementRight(answers);
  const age = pensionAgeValue(answers);
  const when = { years, age, year: birthYearOrFallback(answers) + age, strong };
  if (years > right) {
    return (
      <FormattedMessage
        id="futureMe.you.earlyYears.summaryFlexible"
        values={{
          ...when,
          percent: percentText(EARLY_DECREASE[years]),
          hasReasons: right > 0 ? 'yes' : 'no',
          unreducedYears: right,
        }}
      />
    );
  }
  if (years > 0) {
    return (
      <FormattedMessage
        id="futureMe.you.earlyYears.summaryUnreduced"
        values={{
          ...when,
          reasons: reasonsText(intl, answers),
          hasSeveral:
            Object.values(earlyRightSources(answers)).filter(Boolean).length > 1 ? 'yes' : 'no',
        }}
      />
    );
  }
  const isRightLeftToOtherParent =
    answers.kidsAdded && answers.kidsEarlyUser === 'other' && isKidsRightAvailableToSelf(answers);
  return isRightLeftToOtherParent ? (
    <FormattedMessage id="futureMe.you.earlyYears.summaryOtherParent" />
  ) : null;
};

interface Props {
  answers: YouAnswers;
  onChange: (changes: Partial<YouAnswers>) => void;
}

export const EarlyRetirementFields = ({ answers, onChange }: Props) => {
  const intl = useIntl();
  const right = earlyRetirementRight(answers);
  const summary = summaryOf(intl, answers);
  const startAge = answers.specialPensionStartAge.trim();

  return (
    <>
      {isSpecialPensionOnly(answers) ? (
        <p className="you-note">
          <FormattedMessage
            id="futureMe.you.earlyYears.specialPensionOnly"
            values={{ startAge: startAge === '' ? NO_START_AGE : startAge }}
          />
        </p>
      ) : (
        <div className="row g-3 mb-3">
          <SelectField
            id="future-me-early-years"
            label="futureMe.you.earlyYears.label"
            help="soodusYears"
            hint="futureMe.you.earlyYears.hint"
            value={String(earlyRetirementYears(answers))}
            options={Array.from({ length: maxEarlyYearsOption(answers) + 1 }, (_, years) => ({
              value: String(years),
              label: earlyYearsLabel(intl, years, right),
            }))}
            onChange={(earlyYearsPicked) => onChange({ earlyYearsPicked })}
          />
        </div>
      )}
      <div role="status" className={summary ? 'you-note' : undefined}>
        {summary}
      </div>
    </>
  );
};
