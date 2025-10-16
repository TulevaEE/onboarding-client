import React from 'react';
import { PaymentDetailRow } from './PaymentDetailRow';

export const PaymentAmountRow: React.FunctionComponent<{
  amount: string;
  label: React.ReactNode;
  tooltip?: React.ReactNode;
}> = ({ amount, label, tooltip }) => {
  if (!amount || Number(amount) <= 0) {
    return null;
  }

  return (
    <PaymentDetailRow label={label} value={`${Number(amount).toFixed(2)} EUR`} tooltip={tooltip} />
  );
};
