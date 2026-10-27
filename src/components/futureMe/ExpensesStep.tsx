import React, { RefObject } from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { formatAmountForCount, formatAmountForCurrency } from '../common/utils';
import { TranslationKey } from '../translations';
import {
  careHomeShare,
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

interface Props {
  answers: ExpensesAnswers;
  headingRef: RefObject<HTMLHeadingElement>;
  onChange: (answers: ExpensesAnswers) => void;
}

const LEVEL_EMOJI: Record<CostLevel, string> = {
  frugal: '🥔',
  optimal: '✈️',
  comfortable: '🛋️',
};

const HOUSEHOLD_EMOJI: Record<Household, string> = { alone: '🧍', couple: '👫' };

const LEVEL_WITH_CARE_HOME_ALTERNATIVE: CostLevel = 'comfortable';
const DECIMAL_FRACTION_DIGITS = 1;
const TRAILING_ZERO_DECIMAL = /,0$/;

const euro = (value: number): string => formatAmountForCurrency(Math.round(value), 0);

const decimalText = (value: number): string =>
  formatAmountForCount(value, DECIMAL_FRACTION_DIGITS)
    .replace('.', ',')
    .replace(TRAILING_ZERO_DECIMAL, '');

const emphasis = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
const muted = (chunks: React.ReactNode) => <small>{chunks}</small>;

const factItems = (
  intl: IntlShape,
  facts: CostFacts,
): { emoji: string; text: string; key: string }[] => {
  const fuelShown = decimalText(facts.fuelTanks);
  const items = [
    {
      key: 'beef',
      emoji: '🥩',
      text: facts.beefOnHolidaysOnly
        ? intl.formatMessage({ id: 'futureMe.expenses.fact.beefOnHolidays' })
        : intl.formatMessage(
            { id: 'futureMe.expenses.fact.beef' },
            { kg: decimalText(facts.beefKg) },
          ),
    },
    {
      key: 'fuel',
      emoji: '⛽',
      text: intl.formatMessage(
        { id: 'futureMe.expenses.fact.fuel' },
        { count: facts.fuelTanks, shown: fuelShown, isLow: facts.fuelTanks < 1 ? 'yes' : 'no' },
      ),
    },
    {
      key: 'cafe',
      emoji: '☕',
      text: intl.formatMessage({ id: 'futureMe.expenses.fact.cafe' }, { count: facts.cafeLunches }),
    },
    {
      key: 'trips',
      emoji: '✈️',
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
            {LEVEL_EMOJI[level]}
          </span>
          <strong id={nameId}>
            <FormattedMessage id={`futureMe.expenses.level.${level}.name` as TranslationKey} />
          </strong>
          <span className="cost-level-price" id={priceId}>
            <FormattedMessage
              id="futureMe.expenses.level.price"
              values={{ amount: euro(total), muted }}
            />
          </span>
        </span>
        <span id={detailsId} className="cost-level-details">
          <small>
            <FormattedMessage id={`futureMe.expenses.level.${level}.tagline` as TranslationKey} />
          </small>
          {isLevelEdited(answers, level) && (
            <small className="cost-level-edited">
              <FormattedMessage
                id="futureMe.expenses.level.edited"
                values={{ amount: euro(levelNeed(answers, level)), strong: emphasis }}
              />
            </small>
          )}
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
                <span aria-hidden="true">{fact.emoji}</span> {fact.text}
              </li>
            ))}
          </ul>
          {level === LEVEL_WITH_CARE_HOME_ALTERNATIVE && (
            <>
              <span className="cost-level-or" aria-hidden="true">
                <span>
                  <FormattedMessage id="futureMe.expenses.level.alt.or" />
                </span>
              </span>
              <span className="cost-level-alt">
                <span aria-hidden="true">🏡</span>
                <span>
                  <span className="visually-hidden">
                    <FormattedMessage id="futureMe.expenses.level.alt.srPrefix" />{' '}
                  </span>
                  <FormattedMessage
                    id="futureMe.expenses.level.alt.careHome"
                    values={{ total: euro(total), care: formatAmountForCurrency(careHomeShare, 0) }}
                  />
                </span>
              </span>
            </>
          )}
        </span>
      </span>
    </label>
  );
};

export const ExpensesStep = ({ answers, headingRef, onChange }: Props) => {
  const intl = useIntl();
  const widestTotal = Math.max(...COST_LEVELS.map((level) => levelTotal(answers.household, level)));

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-expenses-heading">
      <p className="chapter-kicker">
        <FormattedMessage id="futureMe.expenses.kicker" />
      </p>
      <h2 id="future-me-expenses-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
        <FormattedMessage id="futureMe.expenses.title" />
      </h2>
      <div className="household-row">
        <div>
          <label className="form-label" htmlFor="future-me-household">
            <FormattedMessage id="futureMe.expenses.household.label" />
          </label>
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
            {HOUSEHOLD_EMOJI[answers.household]}
          </span>
          <span>
            <FormattedMessage
              id={`futureMe.expenses.household.note.${answers.household}` as TranslationKey}
              values={{ strong: emphasis }}
            />
          </span>
        </div>
      </div>
      <details className="household-help">
        <summary>
          <FormattedMessage id="futureMe.expenses.household.help.title" />
        </summary>
        <p>
          <FormattedMessage id="futureMe.expenses.household.help.compare" />
        </p>
        <p>
          <FormattedMessage
            id="futureMe.expenses.household.help.benefit"
            values={{ strong: emphasis }}
          />
        </p>
        <p className="form-text mb-0">
          <FormattedMessage
            id="futureMe.expenses.household.help.source"
            values={{
              link: (chunks: React.ReactNode) => (
                <a
                  href="https://sotsiaalkindlustusamet.ee/pension-ja-seotud-huvitised/muud-pensioniga-seotud-huvitised-ja-toetused/uksi-elava-pensionari"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
            }}
          />
        </p>
      </details>
      <p className="text-secondary">
        <FormattedMessage id="futureMe.expenses.intro" />
      </p>
      <fieldset>
        <legend className="visually-hidden">
          <FormattedMessage id="futureMe.expenses.levels.legend" />
        </legend>
        <div className="cost-levels">
          <p className="cost-legend form-text mb-0" aria-hidden="true">
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
      <ExpensesBreakdown answers={answers} onChange={onChange} />
    </section>
  );
};
