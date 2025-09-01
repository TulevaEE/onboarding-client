import { useEffect } from 'react';
import { CapitalRow, CapitalType } from '../../../../common/apiModels';
import { CapitalTransferAmountInputState } from '../../../../common/apiModels/capital-transfer';
import { formatAmountForCurrency, useNumberInput } from '../../../../common/utils';

export const CapitalTypeInput = ({
  transferAmount,
  capitalRow,
  onValueUpdate,
}: {
  transferAmount: CapitalTransferAmountInputState;
  capitalRow: CapitalRow;
  onValueUpdate: (newBookValue: number, type: CapitalType) => unknown;
}) => {
  const { type } = transferAmount;
  const bookValueAmountInput = useNumberInput(transferAmount.bookValue);

  /* useEffect(() => {
    onValueUpdate(bookValueAmountInput.value ?? 0, type);
  }, [bookValueAmountInput.value]); */

  useEffect(() => {
    if (transferAmount.bookValue === 0) {
      bookValueAmountInput.setInputValue('', false);
    } else if (transferAmount.bookValue.toFixed(2) !== bookValueAmountInput.value?.toFixed(2)) {
      bookValueAmountInput.setInputValue(transferAmount.bookValue.toFixed(2), false);
    }
  }, [transferAmount.bookValue]);

  const commitValue = () => {
    // bookValueAmountInput.setInputValue(transferAmount.bookValue.toFixed(2));
    onValueUpdate(bookValueAmountInput.value ?? 0, type);
  };

  if (!(type in typeToNameMap)) {
    return null;
  }

  const displayName = typeToNameMap[type as keyof typeof typeToNameMap];
  return (
    <div className="d-flex justify-space-between">
      <div className="col">
        <div>{displayName}</div>
        <div className="text-secondary">max {formatAmountForCurrency(capitalRow.value)}</div>
      </div>
      <div className="col">
        <div className="input-group">
          <input
            className={`form-control form-control-lg text-end ${
              bookValueAmountInput.value && bookValueAmountInput.value > capitalRow.value
                ? 'border-danger'
                : ''
            }`}
            id={type}
            placeholder="0"
            aria-label={`Müüdav osa ${displayName}-st`}
            onBlur={commitValue}
            {...bookValueAmountInput.inputProps}
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
