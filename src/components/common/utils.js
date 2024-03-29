import { FundStatus } from './apiModels';

const isTruthy = (value) => !!value;

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
  return (value) => Math.max(Math.min(value, upperLimit), lowerLimit);
}

export function formatAmountForCurrency(amount = 0, fractionDigits = 2) {
  return `${amount.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')}\u00A0€`;
}

export function formatLargeAmountForCurrency(amount = 0) {
  return `${Math.round(amount).toLocaleString('et-EE')}\u00A0€`; // hardcoded euro until more currencies.
}

export function getTotalFundValue(funds) {
  return (funds || []).reduce((sum, { price }) => sum + price, 0);
}

export const isActive = (fund) => fund.status === FundStatus.ACTIVE;
export const isSecondPillar = (fund) => fund.pillar === 2;
export const isThirdPillar = (fund) => fund.pillar === 3;

export const isTuleva = (fund) => (fund.fundManager || {}).name === 'Tuleva';
