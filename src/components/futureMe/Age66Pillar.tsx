import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChoiceCard } from './ChoiceCard';
import {
  Age66Answers,
  Age66Context,
  Contract,
  CONTRACTS,
  contractField,
  fundStartAges,
  fundStartField,
  isContractAsked,
  isGrowing,
  Pillar,
} from './age66Answers';

interface Props {
  pillar: Pillar;
  answers: Age66Answers;
  context: Age66Context;
  isLegendShown: boolean;
  onChange: (answers: Age66Answers) => void;
}

const CONTRACT_EMOJI: Record<Contract, string> = { yearly: '♻️', once: '📜' };

export const Age66Pillar = ({ pillar, answers, context, isLegendShown, onChange }: Props) => {
  const intl = useIntl();
  const pillarKind = pillar === 'secondPillar' ? 'second' : 'third';
  const startId = `future-me-66-${pillar}-from`;

  return (
    <>
      {isGrowing(pillar, context) && (
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
            {fundStartAges(context.plan).map((age) => (
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
      {isContractAsked(pillar, answers, context) && (
        <fieldset className="payout-fieldset mb-3">
          <legend className={isLegendShown ? 'form-label' : 'visually-hidden'}>
            <FormattedMessage id="futureMe.age66.contract.legend" values={{ pillar: pillarKind }} />
          </legend>
          <div className="payout-choices">
            {CONTRACTS.map((contract) => (
              <ChoiceCard
                key={contract}
                idPrefix={`future-me-66-${pillar}`}
                name={`future-me-66-${pillar}-contract`}
                value={contract}
                emoji={CONTRACT_EMOJI[contract]}
                checked={answers[contractField(pillar)] === contract}
                title={<FormattedMessage id={`futureMe.age66.contract.${contract}.title`} />}
                text={<FormattedMessage id={`futureMe.age66.contract.${contract}.text`} />}
                onChange={() => onChange({ ...answers, [contractField(pillar)]: contract })}
              />
            ))}
          </div>
        </fieldset>
      )}
    </>
  );
};
