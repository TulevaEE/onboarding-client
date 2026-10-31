import React, { RefObject } from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { formatAmountForCount } from '../common/utils';
import { TranslationKey } from '../translations';
import {
  CARE_HOME_OWN_SHARES,
  careHomeCoverage,
  COST_LEVELS,
  CostFacts,
  CostLevel,
  costFacts,
  HOUSEHOLDS,
  Household,
  levelTotal,
} from './engine/expenses';
import { ExpensesBreakdown } from './ExpensesBreakdown';
import {
  ExpensesAnswers,
  isLevelEdited,
  levelNeed,
  withHousehold,
  withLevel,
} from './expensesAnswers';
import { StepSection } from './StepSection';
import { FieldLabel } from './YouFields';
import { FutureMeStep } from './steps';
import { EmojiIcon } from './FutureMeIcon';
import { strong } from './richText';
import { euro } from './amountFormat';
import { HelpButton } from './HelpButton';

interface Props {
  answers: ExpensesAnswers;
  headingRef?: RefObject<HTMLHeadingElement>;
  isEmbedded?: boolean;
  hasThirdPillar?: boolean;
  onChange: (answers: ExpensesAnswers) => void;
}

const LEVEL_EMOJI: Record<CostLevel, string> = {
  frugal: '🥔',
  optimal: '⚖️',
  comfortable: '🛋️',
};

const HOUSEHOLD_EMOJI: Record<Household, string> = { alone: '🧍', couple: '👫' };

const DECIMAL_FRACTION_DIGITS = 1;
const TRAILING_ZERO_DECIMAL = /,0$/;

const decimalText = (value: number): string =>
  formatAmountForCount(value, DECIMAL_FRACTION_DIGITS)
    .replace('.', ',')
    .replace(TRAILING_ZERO_DECIMAL, '');

const muted = (chunks: React.ReactNode) => <small>{chunks}</small>;

const factItems = (
  intl: IntlShape,
  facts: CostFacts,
): { emoji: string; text: string; key: string }[] => {
  const isByBus = facts.fuelTanks < 1;
  const items = [
    {
      key: 'food',
      emoji: '🥩',
      text: intl.formatMessage(
        { id: 'futureMe.expenses.fact.food' },
        { amount: euro(facts.foodPerDay) },
      ),
    },
    {
      key: 'fuel',
      emoji: isByBus ? '🚌' : '⛽',
      text: isByBus
        ? intl.formatMessage({ id: 'futureMe.expenses.fact.bus' })
        : intl.formatMessage(
            { id: 'futureMe.expenses.fact.fuel' },
            { count: facts.fuelTanks, shown: decimalText(facts.fuelTanks) },
          ),
    },
    {
      key: 'cafe',
      emoji: '☕',
      text: intl.formatMessage({ id: 'futureMe.expenses.fact.cafe' }, { count: facts.cafeLunches }),
    },
    {
      key: 'trips',
      emoji: facts.tripsPerYear === 0 ? '🚗' : '✈️',
      text:
        facts.tripsPerYear === 0
          ? intl.formatMessage({ id: 'futureMe.expenses.fact.trips.none' })
          : intl.formatMessage(
              { id: 'futureMe.expenses.fact.trips.some' },
              { count: facts.tripsPerYear },
            ),
    },
  ];
  return facts.gifts > 0
    ? [
        ...items,
        {
          key: 'gifts',
          emoji: '🎁',
          text: intl.formatMessage(
            { id: 'futureMe.expenses.fact.gifts' },
            { amount: euro(facts.gifts) },
          ),
        },
      ]
    : items;
};

const barShare = (value: number, widest: number): string => `${(value / widest) * 100}%`;

interface LevelCardProps {
  answers: ExpensesAnswers;
  level: CostLevel;
  widestTotal: number;
  onChange: (answers: ExpensesAnswers) => void;
}

const LevelCard = ({ answers, level, widestTotal, onChange }: LevelCardProps) => {
  const intl = useIntl();
  const { household } = answers;
  const total = levelTotal(household, level);
  const care = careHomeCoverage(levelNeed(answers, level));
  const average = levelTotal(household, 'frugal');
  const extra = Math.max(0, total - average);
  const nameId = `future-me-level-${level}-name`;
  const priceId = `future-me-level-${level}-price`;
  const detailsId = `future-me-level-${level}-details`;

  return (
    <label className="cost-level">
      <input
        type="radio"
        name="future-me-cost-level"
        value={level}
        checked={answers.level === level}
        aria-labelledby={`${nameId} ${priceId}`}
        aria-describedby={detailsId}
        onChange={() => onChange(withLevel(answers, level))}
      />
      <span className="cost-level-body">
        <span className="cost-level-top">
          <span className="cost-level-emoji" aria-hidden="true">
            <EmojiIcon emoji={LEVEL_EMOJI[level]} />
          </span>
          <strong id={nameId}>
            <FormattedMessage id={`futureMe.expenses.level.${level}.name` as TranslationKey} />
          </strong>
          <span className="cost-level-price" id={priceId}>
            <FormattedMessage
              id="futureMe.expenses.level.price"
              values={{ amount: euro(levelNeed(answers, level)), muted }}
            />
            {isLevelEdited(answers, level) && (
              <small className="cost-level-edited">
                <FormattedMessage
                  id="futureMe.expenses.level.edited"
                  values={{ amount: euro(total) }}
                />
              </small>
            )}
          </span>
        </span>
        <span id={detailsId} className="cost-level-details">
          <small className="cost-level-tagline">
            <FormattedMessage id={`futureMe.expenses.level.${level}.tagline` as TranslationKey} />
          </small>
          <span className="cost-level-bar" aria-hidden="true">
            <span className="segment average" style={{ width: barShare(average, widestTotal) }} />
            {extra > 0 && (
              <span className="segment extra" style={{ width: barShare(extra, widestTotal) }} />
            )}
          </span>
          <span className="visually-hidden">
            <FormattedMessage
              id="futureMe.expenses.level.bar"
              values={{
                average: euro(average),
                hasExtra: extra > 0 ? 'yes' : 'no',
                extra: euro(extra),
              }}
            />
          </span>
          <ul className="cost-level-facts">
            {factItems(intl, costFacts(household, level)).map((fact) => (
              <li key={fact.key}>
                <span className="cost-fact-icon" aria-hidden="true">
                  <EmojiIcon emoji={fact.emoji} />
                </span>{' '}
                {fact.text}
              </li>
            ))}
          </ul>
          <span className="cost-level-or" aria-hidden="true">
            <span>
              <FormattedMessage id="futureMe.expenses.level.alt.or" />
            </span>
          </span>
          <span className="cost-level-alt">
            <span className="cost-fact-icon" aria-hidden="true">
              <EmojiIcon emoji="🏡" />
            </span>
            <span>
              <span className="visually-hidden">
                <FormattedMessage id="futureMe.expenses.level.alt.srPrefix" />{' '}
              </span>
              <FormattedMessage
                id="futureMe.expenses.level.care"
                values={{
                  covers: care.covers,
                  missing: euro(care.missing),
                  cheaper: euro(CARE_HOME_OWN_SHARES.cheaper),
                  average: euro(CARE_HOME_OWN_SHARES.average),
                  dearer: euro(CARE_HOME_OWN_SHARES.dearer),
                }}
              />
            </span>
          </span>
        </span>
      </span>
    </label>
  );
};

export const ExpensesStep = ({
  answers,
  headingRef,
  isEmbedded,
  hasThirdPillar = false,
  onChange,
}: Props) => {
  const intl = useIntl();
  const widestTotal = Math.max(...COST_LEVELS.map((level) => levelTotal(answers.household, level)));

  return (
    <StepSection
      step={FutureMeStep.COSTS}
      headingId="future-me-expenses-heading"
      headingRef={headingRef}
      isEmbedded={isEmbedded}
      kicker={<FormattedMessage id="futureMe.expenses.kicker" />}
      title={<FormattedMessage id="futureMe.expenses.title" />}
    >
      <div className="household-row">
        <div>
          <FieldLabel htmlFor="future-me-household" help="household">
            <FormattedMessage id="futureMe.expenses.household.label" />
          </FieldLabel>
          <select
            id="future-me-household"
            className="form-select w-auto"
            value={answers.household}
            onChange={(event) => onChange(withHousehold(answers, event.target.value as Household))}
          >
            {HOUSEHOLDS.map((household) => (
              <option key={household} value={household}>
                {intl.formatMessage({
                  id: `futureMe.expenses.household.option.${household}` as TranslationKey,
                })}
              </option>
            ))}
          </select>
        </div>
        <div className="household-note" aria-live="polite">
          <span className="household-emoji" aria-hidden="true">
            <EmojiIcon emoji={HOUSEHOLD_EMOJI[answers.household]} />
          </span>
          <span>
            <FormattedMessage
              id={`futureMe.expenses.household.note.${answers.household}` as TranslationKey}
              values={{ strong }}
            />
          </span>
        </div>
      </div>
      <p className="text-secondary">
        <FormattedMessage id="futureMe.expenses.intro" />
      </p>
      <fieldset>
        <legend className="visually-hidden">
          <FormattedMessage id="futureMe.expenses.levels.legend" />
        </legend>
        <div className="cost-levels">
          <p className="cost-legend form-text mb-0" aria-hidden="true">
            <span>
              <FormattedMessage id="futureMe.expenses.legend.lead" />
            </span>
            <span className="legend-item">
              <span className="legend-dot average" />
              <FormattedMessage id="futureMe.expenses.legend.average" />
            </span>
            <span className="legend-item">
              <span className="legend-dot extra" />
              <FormattedMessage id="futureMe.expenses.legend.extra" />
            </span>
            <span className="legend-item">
              <span className="legend-dot rest" />
              <FormattedMessage id="futureMe.expenses.legend.rest" />
            </span>
          </p>
          {COST_LEVELS.map((level) => (
            <LevelCard
              key={level}
              answers={answers}
              level={level}
              widestTotal={widestTotal}
              onChange={onChange}
            />
          ))}
        </div>
      </fieldset>
      <p className="form-text text-pretty mt-3">
        <FormattedMessage id="futureMe.expenses.careHome.note" />
        <HelpButton topic="careHome" />
      </p>
      {hasThirdPillar && (
        <p className="form-text text-pretty">
          <FormattedMessage id="futureMe.expenses.thirdPillarContribution.note" />
        </p>
      )}
      <ExpensesBreakdown answers={answers} onChange={onChange} />
    </StepSection>
  );
};
