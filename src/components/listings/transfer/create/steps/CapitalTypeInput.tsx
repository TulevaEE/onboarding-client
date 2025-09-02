import { ChangeEventHandler, useEffect, useState } from 'react';
import { CapitalRow, CapitalType } from '../../../../common/apiModels';
import { CapitalTransferAmountInputState } from '../../../../common/apiModels/capital-transfer';
import { formatAmountForCurrency, useNumberInput } from '../../../../common/utils';

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
      return;
    }

    const parsedValue = Number(formattedInputValue);

    if (!Number.isNaN(parsedValue) && updateParsedValue) {
      setValue(parsedValue);
      onValueUpdate(parsedValue, type);
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
    <div className="d-flex justify-space-between mb-3">
      <div className="col">
        <div>
          {displayName}{' '}
          {transferAmount.type === 'CAPITAL_PAYMENT' && (
            <InfoTooltip>
              Müümist võib olla mõistlik alustada rahalisest panusest, sest saad selle
              soetamismaksumuse tuludeklaratsiooni esitades maksustatavast tulust maha arvata.
            </InfoTooltip>
          )}
        </div>
        <div className="text-secondary">max {formatAmountForCurrency(capitalRow.value)}</div>
      </div>
      <div className="col d-flex justify-content-end">
        <div className={`input-group ${styles.inputGroup}`}>
          <input
            className={`form-control form-control-lg text-end ${
              value && value > capitalRow.value ? 'border-danger' : ''
            }`}
            id={type}
            placeholder="0"
            aria-label={`Müüdav osa ${displayName}-st`}
            value={inputValue}
            onChange={handleInputChangeEvent}
            type="text"
            inputMode="decimal"
          />
          <div className="input-group-text">&euro;</div>
        </div>
      </div>
    </div>
  );
};

const typeToNameMap = {
  CAPITAL_PAYMENT: 'Rahaline panus',
  WORK_COMPENSATION: 'Tööpanus',
  MEMBERSHIP_BONUS: 'Liikmeboonus',
} as const;
