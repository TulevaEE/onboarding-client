import { useIntl } from 'react-intl';

const STANDARD_FEE_BASE_EUROS = 10000;

export type FeeBase = { kind: 'savings' | 'standard'; amount: number };

export const feeBaseOf = (secondPillarSavings: number): FeeBase =>
  secondPillarSavings > 0
    ? { kind: 'savings', amount: secondPillarSavings }
    : { kind: 'standard', amount: STANDARD_FEE_BASE_EUROS };

export const useFeeBasePhrase = (feeBase: FeeBase) => {
  const intl = useIntl();
  return feeBase.kind === 'savings'
    ? intl.formatMessage({ id: 'secondPillarFunds.feeBase.savings' })
    : intl.formatMessage({ id: 'secondPillarFunds.feeBase.standard' });
};
