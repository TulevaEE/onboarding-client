import React from 'react';
import { FormattedMessage } from 'react-intl';
import { HelpButton } from './HelpButton';
import { INFLATION } from './engine/pension';
import { NominalReturns } from './nominal';

const PERCENT = 100;
const NO_BREAK_SPACE = '\u00A0';
const SWITCH_ID = 'future-me-nominal-toggle';

interface SwitchProps {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
}

export const NominalSwitch = ({ isOn, onChange }: SwitchProps) => (
  <div className="result-nominal">
    <HelpButton topic="nominal" />
    <div className="form-check form-switch mb-0">
      <input
        id={SWITCH_ID}
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={isOn}
        onChange={({ target }) => onChange(target.checked)}
      />
      <label htmlFor={SWITCH_ID} className="form-check-label">
        <FormattedMessage id="futureMe.result.nominal.label" />
        {NO_BREAK_SPACE}
        <strong>
          <FormattedMessage
            id={isOn ? 'futureMe.result.nominal.on' : 'futureMe.result.nominal.off'}
          />
        </strong>
      </label>
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
