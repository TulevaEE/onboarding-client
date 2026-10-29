import React from 'react';
import { FormattedMessage } from 'react-intl';
import { HelpButton } from './HelpButton';
import { INFLATION } from './engine/pension';
import { NominalReturns } from './nominal';

const PERCENT = 100;
const GROUP_LABEL_ID = 'future-me-nominal-group';

interface ChoiceProps {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
}

const CHOICES = [
  { isNominal: false, label: 'futureMe.result.nominal.today' },
  { isNominal: true, label: 'futureMe.result.nominal.future' },
] as const;

export const NominalChoice = ({ isOn, onChange }: ChoiceProps) => (
  <div className="result-nominal">
    <HelpButton topic="nominal" />
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

const fundValuesOf = ({ second, third }: NominalReturns) => {
  if (second !== null && third !== null && second !== third) {
    return { funds: 'both', second, third };
  }
  const rate = second ?? third;
  return rate === null ? { funds: 'none' } : { funds: 'one', rate };
};

export const NominalNote = ({ isOn, returns }: { isOn: boolean; returns: NominalReturns }) => (
  <p className="result-nominal-note text-secondary text-pretty" aria-live="polite">
    {isOn ? (
      <FormattedMessage
        id="futureMe.result.nominal.note.future"
        values={{ inflation: INFLATION * PERCENT, ...fundValuesOf(returns) }}
      />
    ) : (
      <FormattedMessage id="futureMe.result.nominal.note.today" />
    )}
  </p>
);
