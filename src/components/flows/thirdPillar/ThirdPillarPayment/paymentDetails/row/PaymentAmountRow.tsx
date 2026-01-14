import React from 'react';
import { PaymentDetailRow } from './PaymentDetailRow';

export const PaymentAmountRow: React.FunctionComponent<{
  amount: string;
  label: React.ReactNode;
  tooltip?: React.ReactNode;
  labelCol?: number;
  valueCol?: number;
}> = ({ amount, label, tooltip, labelCol, valueCol }) => {
  if (!amount || Number(amount) <= 0) {
    return null;
  }

  return (
    <PaymentDetailRow
      label={label}
      value={`${Number(amount).toFixed(2)} EUR`}
      tooltip={tooltip}
      labelCol={labelCol}
      valueCol={valueCol}
    />
  );
};
