import React from 'react';
import { FormattedMessage } from 'react-intl';
import { euro } from './amountFormat';
import { ChoiceCard } from './ChoiceCard';
import { FirstPillarChoice as Choice } from './engine/pension';

interface Props {
  idPrefix: string;
  title: React.ReactNode;
  intro: React.ReactNode;
  special: number;
  oldAge: number;
  larger: Choice;
  chosen: Choice;
  onChange: (choice: Choice) => void;
}

const CHOICES: Choice[] = ['special', 'oldAge'];

export const FirstPillarChoice = ({
  idPrefix,
  title,
  intro,
  special,
  oldAge,
  larger,
  chosen,
  onChange,
}: Props) => {
  const amounts = { special, oldAge };

  return (
    <div className="mb-4">
      <h3 className="h5 section-title mt-4" id={`${idPrefix}-title`}>
        {title}
      </h3>
      <p className="text-secondary text-pretty">{intro}</p>
      <fieldset className="payout-fieldset" aria-labelledby={`${idPrefix}-title`}>
        <div className="payout-choices">
          {CHOICES.map((value) => (
            <ChoiceCard
              key={value}
              idPrefix={idPrefix}
              name={idPrefix}
              value={value}
              checked={chosen === value}
              title={
                <>
                  <FormattedMessage id={`futureMe.firstPillarChoice.${value}.title`} />
                  {larger === value && (
                    <span className="larger-badge">
                      <FormattedMessage id="futureMe.firstPillarChoice.larger" />
                    </span>
                  )}
                </>
              }
              text={
                <FormattedMessage
                  id="futureMe.firstPillarChoice.text"
                  values={{ amount: euro(amounts[value]), choice: value }}
                />
              }
              onChange={() => onChange(value)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
};
