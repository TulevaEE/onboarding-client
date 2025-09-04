import { ChangeEventHandler, useEffect, useState } from 'react';
import { CapitalRow, CapitalType } from '../../../../common/apiModels';
import { CapitalTransferAmountInputState } from '../../../../common/apiModels/capital-transfer';
import { formatAmountForCurrency } from '../../../../common/utils';

import styles from '../../../AddListing.module.scss';
import { InfoTooltip } from '../../../../common/infoTooltip/InfoTooltip';

export const CapitalTypeInput = ({
  transferAmount,
  capitalRow,
  onValueUpdate,
  lastInput,
  setLastInput,
}: {
  transferAmount: CapitalTransferAmountInputState;
  capitalRow: CapitalRow;
  onValueUpdate: (newBookValue: number, type: CapitalType) => unknown;
  lastInput: 'TOTAL' | 'TYPE_INPUTS';
  setLastInput: (type: 'TOTAL' | 'TYPE_INPUTS') => unknown;
}) => {
  const { type } = transferAmount;

  const [inputValue, setInputValue] = useState(
    Number(transferAmount.bookValue.toFixed(2)).toString(),
  );
  const [value, setValue] = useState<number | null>(transferAmount.bookValue);

  const handleInputChangeEvent: ChangeEventHandler<HTMLInputElement> = (event) => {
    setLastInput('TYPE_INPUTS');
    updateInput(event.target.value);
  };

  const updateInput = (changedInputValue: string, updateParsedValue = true) => {
    const formattedInputValue = changedInputValue.replace(',', '.');

    setInputValue(formattedInputValue);

    if (changedInputValue === '') {
      setValue(null);
      onValueUpdate(0, type);
      return;
    }

    const parsedValue = Number(formattedInputValue);
    const zeroOrMoreValue = Math.max(0, parsedValue);

    const clampedValue = Math.min(capitalRow.value, zeroOrMoreValue);

    if (!Number.isNaN(parsedValue) && updateParsedValue) {
      setValue(clampedValue);
      onValueUpdate(clampedValue, type);

      if (parsedValue < 0 || parsedValue > capitalRow.value) {
        setInputValue(clampedValue.toFixed(2));
      }
    }
  };

  useEffect(() => {
    if (lastInput === 'TOTAL') {
      setInputValue(transferAmount.bookValue.toFixed(2));
    }
  }, [lastInput, transferAmount.bookValue]);

  if (!(type in typeToNameMap)) {
    return null;
  }

  const displayName = typeToNameMap[type as keyof typeof typeToNameMap];
  return (
    <div
      className="d-flex justify-content-between align-items-center"
      data-testid={`capital-input-${type}`}
    >
      <div>
        <span className="d-block">
          {displayName}{' '}
          {transferAmount.type === 'CAPITAL_PAYMENT' && (
            <InfoTooltip>
              Müümist võib olla mõistlik alustada rahalisest panusest, sest saad selle
              soetamismaksumuse tuludeklaratsiooni esitades maksustatavast tulust maha arvata.
            </InfoTooltip>
          )}
        </span>
        <span className="d-block text-secondary small lh-sm">
          max {formatAmountForCurrency(capitalRow.value)}
        </span>
      </div>
      <div className={`input-group ${styles.subInputGroup}`}>
        <input
          className={`form-control ${value && value > capitalRow.value ? 'border-danger' : ''}`}
          id={type}
          placeholder="0"
          aria-label={`Müüdav osa ${displayName.toLowerCase()}est`}
          value={inputValue}
          onChange={handleInputChangeEvent}
          type="text"
          inputMode="decimal"
        />
        <span className="input-group-text">&euro;</span>
      </div>
    </div>
  );
};

// TODO map to translationkey
const typeToNameMap = {
  CAPITAL_ACQUIRED: 'Omandatud kapital',
  CAPITAL_PAYMENT: 'Rahaline panus',
  WORK_COMPENSATION: 'Tööpanus',
  MEMBERSHIP_BONUS: 'Liikmeboonus',
} as const;
