import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Age66Answers,
  Age66Context,
  contractChosenAt,
  contractField,
  contractStartAgeOf,
  endAgeField,
  fundStartAges,
  fundStartField,
  isContractAsked,
  isGrowing,
  Pillar,
} from './age66Answers';
import { ContractChoices } from './ContractChoices';
import { LinkButton } from './LinkButton';
import { strong } from './richText';
import { StepId } from './steps';

interface Props {
  pillar: Pillar;
  answers: Age66Answers;
  context: Age66Context;
  isLegendShown: boolean;
  onChange: (answers: Age66Answers) => void;
  onEditContract: (step: StepId) => void;
}

export const Age66Pillar = ({
  pillar,
  answers,
  context,
  isLegendShown,
  onChange,
  onEditContract,
}: Props) => {
  const intl = useIntl();
  const pillarKind = pillar === 'secondPillar' ? 'second' : 'third';
  const startId = `future-me-66-${pillar}-from`;
  const chosenAt = contractChosenAt(pillar, context);
  const contract = answers[contractField(pillar)];

  return (
    <>
      {isGrowing(pillar, context) && chosenAt === null && (
        <div className="narrow-field mb-3">
          <label className="form-label fw-medium" htmlFor={startId}>
            <FormattedMessage id="futureMe.age66.start.label" values={{ pillar: pillarKind }} />
          </label>
          <select
            id={startId}
            className="form-select"
            aria-describedby="future-me-66-start-hint"
            value={answers[fundStartField(pillar)]}
            onChange={(event) =>
              onChange({ ...answers, [fundStartField(pillar)]: event.target.value })
            }
          >
            <option value="">{intl.formatMessage({ id: 'futureMe.age66.start.none' })}</option>
            {fundStartAges(pillar, context).map((age) => (
              <option key={age} value={age}>
                {intl.formatMessage(
                  { id: 'futureMe.age66.start.option' },
                  { age, year: context.plan.birthYear + age },
                )}
              </option>
            ))}
          </select>
        </div>
      )}
      {chosenAt !== null && (
        <p className="payout-note">
          <FormattedMessage
            id="futureMe.age66.contract.chosen"
            values={{
              pillar: pillarKind,
              age: chosenAt.age,
              contract: intl.formatMessage({ id: `futureMe.age66.contract.${contract}.title` }),
              strong,
            }}
          />{' '}
          <LinkButton onClick={() => onEditContract(chosenAt.step)}>
            <FormattedMessage id="futureMe.age66.contract.change" />
            <span className="visually-hidden">
              <FormattedMessage
                id="futureMe.age66.contract.changeWhat"
                values={{ pillar: pillarKind }}
              />
            </span>
          </LinkButton>
        </p>
      )}
      {isContractAsked(pillar, answers, context) && chosenAt === null && (
        <ContractChoices
          pillar={pillar}
          idPrefix="future-me-66"
          contract={contract}
          isLegendShown={isLegendShown}
          startAge={contractStartAgeOf(pillar, answers, context) ?? 0}
          birthYear={context.plan.birthYear}
          sex={context.you.sex}
          endAge={answers[endAgeField(pillar)]}
          onChange={(chosen) => onChange({ ...answers, [contractField(pillar)]: chosen })}
          onEndAgeChange={(endAge) => onChange({ ...answers, [endAgeField(pillar)]: endAge })}
        />
      )}
    </>
  );
};
