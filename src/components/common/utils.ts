import { Fund, FundStatus, SourceFund } from './apiModels';

const isTruthy = (value: unknown) => !!value;

const NOT_FOUND_ITEM_CONSTANT = {}; // using this as a secret comparison reference.

export function findWhere(list = [], predicate = isTruthy) {
  const value = list.reduce((foundItem, current) => {
    if (foundItem === NOT_FOUND_ITEM_CONSTANT && predicate(current)) {
      return current;
    }
    return foundItem;
  }, NOT_FOUND_ITEM_CONSTANT);
  if (value === NOT_FOUND_ITEM_CONSTANT) {
    return null;
  }
  return value;
}

export function createClamper(lowerLimit = 0, upperLimit = 10) {
  return (value: number): number => Math.max(Math.min(value, upperLimit), lowerLimit);
}

export function formatAmountForCurrency(
  amount = 0,
  fractionDigits = 2,
  options: { isSigned?: boolean } = {},
) {
  const { isSigned = false } = options;
  const sign = amount > 0 && isSigned ? '+' : '';
  let formattedAmount = amount.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  if (amount < 0) {
    formattedAmount = formattedAmount.replace('-', '−');
  }
  return `${sign}${formattedAmount}\u00A0€`;
}

export function formatLargeAmountForCurrency(amount = 0) {
  return `${Math.round(amount).toLocaleString('et-EE')}\u00A0€`; // hardcoded euro until more currencies.
}

export function getTotalFundValue(funds: SourceFund[] = []) {
  return funds.reduce((sum, { price }) => sum + price, 0);
}

export const isActive = (fund: Fund) => fund.status === FundStatus.ACTIVE;
export const isSecondPillar = (fund: Fund) => fund.pillar === 2;
export const isThirdPillar = (fund: Fund) => fund.pillar === 3;

export const isTuleva = (fund: Fund) => (fund.fundManager || {}).name === 'Tuleva';
