import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { Assumption, assumptionsOf } from './assumptions';
import { euro } from './amountFormat';
import { EmojiIcon, StepIcon } from './FutureMeIcon';
import { ResultContext } from './resultAnswers';
import { FutureMeStep } from './steps';

const PERCENT = 100;

const AssumptionIcon = ({ assumption }: { assumption: Assumption }) => {
  if (assumption.id === 'you') {
    return <StepIcon step={FutureMeStep.YOU} />;
  }
  return assumption.id === 'expenses' ? (
    <StepIcon step={FutureMeStep.COSTS} />
  ) : (
    <EmojiIcon emoji="🌱" />
  );
};

const AssumptionText = ({ assumption }: { assumption: Assumption }) => {
  const intl = useIntl();
  if (assumption.id === 'you') {
    return (
      <FormattedMessage
        id="futureMe.result.assumptions.you.text"
        values={{
          birthYear: assumption.birthYear,
          hasSecondPillar: assumption.secondPillar === null ? 'no' : 'yes',
          secondPillar: euro(assumption.secondPillar ?? 0),
          hasThirdPillar: assumption.thirdPillar === null ? 'no' : 'yes',
          thirdPillar: euro(assumption.thirdPillar ?? 0),
          hasSpecialPension: assumption.specialPension === null ? 'no' : 'yes',
          specialPension: euro(assumption.specialPension ?? 0),
        }}
      />
    );
  }
  if (assumption.id === 'expenses') {
    return (
      <FormattedMessage
        id="futureMe.result.assumptions.expenses.text"
        values={{
          level: intl.formatMessage({
            id: `futureMe.expenses.level.${assumption.level}.name` as TranslationKey,
          }),
          isEdited: assumption.isEdited ? 'yes' : 'no',
          amount: euro(assumption.amount),
        }}
      />
    );
  }
  return (
    <FormattedMessage
      id={`futureMe.result.assumptions.fund.${assumption.fund}` as TranslationKey}
      values={{ percent: Math.round(assumption.realReturn * PERCENT) }}
    />
  );
};

export const ResultAssumptions = ({ context }: { context: ResultContext }) => {
  const intl = useIntl();
  return (
    <>
      <h3 className="h5 section-title mt-4">
        <FormattedMessage id="futureMe.result.assumptions.title" />
      </h3>
      <p className="text-pretty">
        <FormattedMessage id="futureMe.result.assumptions.intro" />
      </p>
      <ul
        className="assumption-list"
        aria-label={intl.formatMessage({ id: 'futureMe.result.assumptions.title' })}
      >
        {assumptionsOf(context).map((assumption) => (
          <li key={assumption.id} className="assumption-row">
            <span className="assumption-icon">
              <AssumptionIcon assumption={assumption} />
            </span>
            <div>
              <h4 className="h6">
                <FormattedMessage
                  id={`futureMe.result.assumptions.${assumption.id}.title` as TranslationKey}
                />
              </h4>
              <p className="text-pretty">
                <AssumptionText assumption={assumption} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};
