import React from 'react';

interface PaymentDetailRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  tooltip?: React.ReactNode;
  labelCol?: number;
  valueCol?: number;
}

export const PaymentDetailRow: React.FunctionComponent<PaymentDetailRowProps> = ({
  label,
  value,
  tooltip,
  labelCol = 4,
  valueCol = 8,
}) => (
  <div className="row mb-2">
    <div className={`col-12 col-md-${labelCol}`}>{label}:</div>
    <div className={`col-12 col-md-${valueCol}`}>
      {tooltip ? (
        <div className="d-flex justify-content-between align-items-center column-gap-2">
          <b className="text-break">{value}</b>
          {tooltip}
        </div>
      ) : (
        <b>{value}</b>
      )}
    </div>
  </div>
);
