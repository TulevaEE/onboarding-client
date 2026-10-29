import React from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { Pillar } from './age66Answers';
import { euro, exactPercent } from './amountFormat';
import { CURRENT_YEAR } from './engine/pension';
import { ResultContext } from './resultAnswers';
import { Rule, rulesOf } from './rules';

const PILLAR_LEGEND: Record<Pillar, string> = { secondPillar: 'second', thirdPillar: 'third' };

const RuleWhen = ({ rule }: { rule: Rule }) =>
  rule.age === null || rule.year === null ? (
    <FormattedMessage id="futureMe.result.rules.endOfLife" />
  ) : (
    <>
      <FormattedMessage id="futureMe.result.decisions.age" values={{ age: rule.age }} />
      <small>
        <FormattedMessage
          id="futureMe.result.decisions.year"
          values={{ year: rule.year, isOpened: rule.year < CURRENT_YEAR }}
        />
      </small>
    </>
  );

const ruleValues = (rule: Rule) => {
  switch (rule.id) {
    case 'earlyRetirement':
      return { years: rule.years, pensionAge: rule.pensionAge, reason: rule.reason };
    case 'flexibleRetirement':
      return { years: rule.years, decrease: exactPercent(rule.decrease) };
    case 'fundPensionContract':
      return { isBoth: Object.keys(rule.contracts).length === 2 ? 'yes' : 'no' };
    case 'inheritance':
      return {
        pillars: rule.pillars,
        hasSecondPillar: rule.pillars === 'thirdPillar' ? 'no' : 'yes',
      };
    default:
      return {};
  }
};

const choiceOf = (rule: Rule, intl: IntlShape): string | null => {
  const format = (id: string, values: Record<string, unknown> = {}) =>
    intl.formatMessage({ id: id as TranslationKey }, values as Record<string, string>);
  switch (rule.id) {
    case 'earlyRetirement':
    case 'flexibleRetirement':
      return format(`futureMe.result.rules.${rule.id}.choice`, ruleValues(rule));
    case 'childSupplement':
      return format('futureMe.result.rules.childSupplement.choice', {
        monthly: euro(rule.monthly),
        inForecast: rule.inForecast,
      });
    case 'specialPension':
      return format('futureMe.result.rules.specialPension.choice', {
        monthly: euro(rule.monthly),
        hasStartAge: rule.startAge === undefined ? 'no' : 'yes',
        startAge: rule.startAge,
      });
    case 'fundPensionContract':
      return (Object.keys(rule.contracts) as Pillar[])
        .map(
          (pillar) =>
            `${format('futureMe.age66.contract.legend', {
              pillar: PILLAR_LEGEND[pillar],
            })}: ${format(`futureMe.age66.contract.${rule.contracts[pillar]}.title`)}`,
        )
        .join(', ');
    default:
      return null;
  }
};

export const ResultRules = ({ context }: { context: ResultContext }) => {
  const intl = useIntl();
  return (
    <>
      <h3 className="h5 section-title mt-4">
        <FormattedMessage id="futureMe.result.rules.title" />
      </h3>
      <p className="text-pretty">
        <FormattedMessage id="futureMe.result.rules.intro" />
      </p>
      <ul
        className="decision-list"
        aria-label={intl.formatMessage({ id: 'futureMe.result.rules.title' })}
      >
        {rulesOf(context).map((rule) => {
          const choice = choiceOf(rule, intl);
          return (
            <li key={rule.id}>
              <div className="decision-row">
                <div className="decision-age">
                  <RuleWhen rule={rule} />
                </div>
                <div className="decision-main">
                  <h4 className="h6">
                    <FormattedMessage
                      id={`futureMe.result.rules.${rule.id}.title` as TranslationKey}
                    />
                  </h4>
                  {choice && (
                    <small className="decision-current">
                      <FormattedMessage
                        id="futureMe.result.decisions.current"
                        values={{ choice }}
                      />
                    </small>
                  )}
                </div>
                <p className="decision-rule text-pretty">
                  <FormattedMessage
                    id={`futureMe.result.rules.${rule.id}.text` as TranslationKey}
                    values={ruleValues(rule)}
                  />
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};
