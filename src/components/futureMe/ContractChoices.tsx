import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChoiceCard } from './ChoiceCard';
import { Contract, CONTRACTS, endAgeOf, endAges, longLifeAge, Pillar } from './age66Answers';
import { Sex } from './engine/pension';

interface EndAgeProps {
  id: string;
  startAge: number;
  birthYear: number;
  sex: Sex;
  endAge: string;
  onEndAgeChange: (endAge: string) => void;
}

interface Props extends Omit<EndAgeProps, 'id'> {
  pillar: Pillar;
  idPrefix: string;
  contract: Contract;
  isLegendShown?: boolean;
  onChange: (contract: Contract) => void;
}

const CONTRACT_EMOJI: Record<Contract, string> = { yearly: '♻️', once: '📜' };

const EndAgeField = ({ id, startAge, birthYear, sex, endAge, onEndAgeChange }: EndAgeProps) => {
  const intl = useIntl();
  const [averageAge, ...laterAges] = endAges(sex, startAge);
  const optionText = (age: number, isAverage: boolean) =>
    intl.formatMessage(
      { id: 'futureMe.age66.contract.endAge.option' },
      { age, year: birthYear + age, average: isAverage ? 'yes' : 'no' },
    );

  return (
    <>
      <label className="form-label small fw-medium mb-0" htmlFor={id}>
        <FormattedMessage id="futureMe.age66.contract.endAge.label" />
      </label>
      <select
        id={id}
        className="form-select"
        aria-describedby={`${id}-hint`}
        value={endAgeOf(endAge, sex, startAge) ?? ''}
        onChange={(event) => onEndAgeChange(event.target.value)}
      >
        <option value="">{optionText(averageAge, true)}</option>
        {laterAges.map((age) => (
          <option key={age} value={age}>
            {optionText(age, false)}
          </option>
        ))}
      </select>
      <p id={`${id}-hint`} className="contract-end-age-hint text-pretty">
        <FormattedMessage
          id="futureMe.age66.contract.endAge.hint"
          values={{ sex, startAge, longLifeAge: longLifeAge(sex, startAge) }}
        />
      </p>
    </>
  );
};

export const ContractChoices = ({
  pillar,
  idPrefix,
  contract,
  isLegendShown = true,
  onChange,
  ...endAgeProps
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
          extra={
            option === 'once' &&
            contract === 'once' && (
              <EndAgeField id={`${idPrefix}-${pillar}-end-age`} {...endAgeProps} />
            )
          }
          onChange={() => onChange(option)}
        />
      ))}
    </div>
  </fieldset>
);
