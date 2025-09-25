import { ChangeEventHandler, HTMLProps, useState } from 'react';
import { Fund } from './apiModels';

const isTruthy = (value: unknown) => !!value;

const NOT_FOUND_ITEM_CONSTANT = {}; // using this as a secret comparison reference.

// TODO why does this exist?
export function findWhere<T>(list: T[] = [], predicate: (val: T) => boolean = isTruthy) {
  const value = list.reduce((foundItem: T, current: T) => {
    if (foundItem === NOT_FOUND_ITEM_CONSTANT && predicate(current)) {
      return current;
    }
    return foundItem;
  }, NOT_FOUND_ITEM_CONSTANT as T);
  if (value === NOT_FOUND_ITEM_CONSTANT) {
    return null;
  }
  return value;
}

export function createClamper(lowerLimit = 0, upperLimit = 10) {
  return (value: number): number => Math.max(Math.min(value, upperLimit), lowerLimit);
}

export const formatAmountForCurrency = (
  amount = 0,
  fractionDigits = 2,
  options: { isSigned?: boolean; smartDecimals?: boolean } = {},
) => `${formatAmountForCount(amount, fractionDigits, options)}\u00A0€`;

export const formatAmountForCount = (
  amount = 0,
  fractionDigits = 2,
  options: { isSigned?: boolean; smartDecimals?: boolean } = {},
) => {
  const { isSigned = false, smartDecimals = false } = options;

  const sign = amount > 0 && isSigned ? '+' : '';
  const decimals = smartDecimals
    ? fractionDigitsForSignificance(amount, fractionDigits) // fractionDigits = min
    : fractionDigits;

  // TODO tofixed rounds
  let formattedAmount = formatWithNbspThousands(amount.toFixed(decimals));

  if (amount < 0) {
    formattedAmount = formattedAmount.replace('-', '−');
  }
  return `${sign}${formattedAmount}`;
};

function fractionDigitsForSignificance(value: number, min: number): number {
  if (!Number.isFinite(value) || value === 0) {
    return min;
  }
  const abs = Math.abs(value);
  if (abs >= 1) {
    return min;
  }

  let decimalsUntilFirstSignificant = 0;
  let scaledAbs = abs;
  const SAFETY_CAP = 12;

  while (scaledAbs < 1 && decimalsUntilFirstSignificant < SAFETY_CAP) {
    decimalsUntilFirstSignificant += 1;
    scaledAbs *= 10;
  }

  return Math.max(min, decimalsUntilFirstSignificant);
}

function formatWithNbspThousands(numericString: string): string {
  const [intPart, decPart] = numericString.split('.');
  const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return decPart !== undefined ? `${intWithSpaces}.${decPart}` : intWithSpaces;
}

export const getFullName = (user: { firstName: string; lastName: string }) =>
  `${user.firstName} ${user.lastName}`;

export const isActive = (fund: Fund) => fund.status === 'ACTIVE';
export const isSecondPillar = (fund: Fund) => fund.pillar === 2;
export const isThirdPillar = (fund: Fund) => fund.pillar === 3;

export const isTuleva = (fund: Fund) => (fund.fundManager || {}).name === 'Tuleva';

export type TulevaSecondPillarStockFund = 'EE3600109435';
export type TulevaSecondPillarBondFund = 'EE3600109443';
export type TulevaThirdPillarFund = 'EE3600001707';
export type TulevaFundIsin =
  | TulevaSecondPillarStockFund
  | TulevaSecondPillarBondFund
  | TulevaThirdPillarFund;
export const isTulevaIsin = (value: string): value is TulevaFundIsin =>
  ['EE3600109435', 'EE3600109443', 'EE3600001707'].includes(value);

export const useNumberInput = (
  defaultValue: number | null = null,
  isValid: (inputValue: string) => boolean = () => true,
): {
  inputProps: Partial<HTMLProps<HTMLInputElement>>;
  value: number | null;
  setInputValue: (val: string) => unknown;
  setInputDisplayValueOnly: (val: string) => unknown;
} => {
  const [inputValue, setInputValue] = useState(defaultValue?.toString() ?? '');
  const [value, setValue] = useState<number | null>(defaultValue);

  const handleInputChangeEvent: ChangeEventHandler<HTMLInputElement> = (event) => {
    updateInput(event.target.value);
  };

  const updateInput = (changedInputValue: string, updateParsedValue = true) => {
    const formattedInputValue = changedInputValue.replace(',', '.');

    if (changedInputValue === '' || isValid(changedInputValue)) {
      setInputValue(formattedInputValue);
    }

    if (changedInputValue === '') {
      setValue(null);
      return;
    }

    if (!isValid(changedInputValue)) {
      return;
    }

    const parsedValue = Number(formattedInputValue);

    if (!Number.isNaN(parsedValue) && updateParsedValue) {
      setValue(parsedValue);
    }
  };

  return {
    inputProps: {
      value: inputValue,
      onChange: handleInputChangeEvent,
      type: 'text',
      inputMode: 'decimal',
    },
    value,
    setInputValue: (val) => updateInput(val, true),
    setInputDisplayValueOnly: (val) => updateInput(val, false),
  };
};
