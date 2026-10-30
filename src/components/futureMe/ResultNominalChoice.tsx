import React from 'react';
import { FormattedMessage } from 'react-intl';
import { HelpButton } from './HelpButton';
import { INFLATION } from './engine/pension';

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

export const NominalNote = ({ isOn }: { isOn: boolean }) => (
  <p className="result-nominal-note text-secondary text-pretty" aria-live="polite">
    {isOn ? (
      <FormattedMessage
        id="futureMe.result.nominal.note.future"
        values={{ inflation: INFLATION * PERCENT }}
      />
    ) : (
      <FormattedMessage id="futureMe.result.nominal.note.today" />
    )}
  </p>
);
