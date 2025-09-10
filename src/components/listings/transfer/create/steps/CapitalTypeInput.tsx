import { ChangeEventHandler, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { CapitalRow, CapitalType } from '../../../../common/apiModels';
import { CapitalTransferAmountInputState } from '../../../../common/apiModels/capital-transfer';
import { formatAmountForCurrency } from '../../../../common/utils';

import styles from '../../../AddListing.module.scss';
import { InfoTooltip } from '../../../../common/infoTooltip/InfoTooltip';
import { isTranslationKey } from '../../../../translations';

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
  const { formatMessage } = useIntl();
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

  const translationKey = `capital.transfer.create.amount.type.${type}`;
  if (!isTranslationKey(translationKey)) {
    return null;
  }

  return (
    <div
      className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center row-gap-1 column-gap-3"
      data-testid={`capital-input-${type}`}
    >
      <div className="d-flex flex-row flex-sm-column align-items-baseline column-gap-2">
        <label className="d-block" htmlFor={type}>
          <FormattedMessage id={translationKey} />
          {transferAmount.type === 'CAPITAL_PAYMENT' && (
            <InfoTooltip>
              <FormattedMessage id="capital.transfer.create.amount.type.CAPITAL_PAYMENT.tooltip" />
            </InfoTooltip>
          )}
        </label>
        <span className="d-block text-secondary small lh-sm">
          max {formatAmountForCurrency(capitalRow.value)}
        </span>
      </div>
      <div className={`input-group ${styles.subInputGroup}`}>
        <input
          className={`form-control ${
            value && value > capitalRow.value ? 'border-danger focus-ring focus-ring-danger' : ''
          }`}
          id={type}
          placeholder="0"
          aria-label={formatMessage({ id: translationKey })}
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
