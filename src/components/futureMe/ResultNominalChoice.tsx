import React from 'react';
import { FormattedMessage } from 'react-intl';
import { HelpButton } from './HelpButton';
import { euro } from './amountFormat';
import { INFLATION } from './engine/pension';
import { nominalFactorAtAge, Prices } from './nominal';
import { Result } from './resultAnswers';

const PERCENT = 100;
const TODAYS_MONEY_EXAMPLE = 1000;
const GROUP_LABEL_ID = 'future-me-nominal-group';

interface ChoiceProps {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  result: Result;
  prices: Prices;
}

const CHOICES = [
  { isNominal: false, label: 'futureMe.result.nominal.today' },
  { isNominal: true, label: 'futureMe.result.nominal.future' },
] as const;

export const NominalChoice = ({ isOn, onChange, result, prices: { ageShown } }: ChoiceProps) => (
  <div className="result-nominal">
    <HelpButton
      topic="nominal"
      values={{
        inflation: INFLATION * PERCENT,
        age: ageShown,
        amount: euro(TODAYS_MONEY_EXAMPLE * nominalFactorAtAge(result, ageShown)),
      }}
    />
    <span id={GROUP_LABEL_ID} className="visually-hidden">
      <FormattedMessage id="futureMe.result.nominal.group" />
    </span>
    <div className="btn-group" role="group" aria-labelledby={GROUP_LABEL_ID}>
      {CHOICES.map(({ isNominal, label }) => (
        <button
          key={label}
          type="button"
          className={`btn btn-sm ${isNominal === isOn ? 'btn-primary' : 'btn-outline-primary'}`}
          aria-pressed={isNominal === isOn}
          onClick={() => onChange(isNominal)}
        >
          <FormattedMessage id={label} />
        </button>
      ))}
    </div>
  </div>
);
