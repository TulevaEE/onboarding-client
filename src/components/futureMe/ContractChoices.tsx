import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ChoiceCard } from './ChoiceCard';
import { Contract, CONTRACTS, Pillar } from './age66Answers';

interface Props {
  pillar: Pillar;
  idPrefix: string;
  contract: Contract;
  isLegendShown?: boolean;
  onChange: (contract: Contract) => void;
}

const CONTRACT_EMOJI: Record<Contract, string> = { yearly: '♻️', once: '📜' };

export const ContractChoices = ({
  pillar,
  idPrefix,
  contract,
  isLegendShown = true,
  onChange,
}: Props) => (
  <fieldset className="payout-fieldset mb-3">
    <legend className={isLegendShown ? 'form-label fs-6 fw-medium' : 'visually-hidden'}>
      <FormattedMessage
        id="futureMe.age66.contract.legend"
        values={{ pillar: pillar === 'secondPillar' ? 'second' : 'third' }}
      />
    </legend>
    <div className="payout-choices">
      {CONTRACTS.map((option) => (
        <ChoiceCard
          key={option}
          idPrefix={`${idPrefix}-${pillar}`}
          name={`${idPrefix}-${pillar}-contract`}
          value={option}
          emoji={CONTRACT_EMOJI[option]}
          checked={contract === option}
          title={<FormattedMessage id={`futureMe.age66.contract.${option}.title`} />}
          text={<FormattedMessage id={`futureMe.age66.contract.${option}.text`} />}
          onChange={() => onChange(option)}
        />
      ))}
    </div>
  </fieldset>
);
