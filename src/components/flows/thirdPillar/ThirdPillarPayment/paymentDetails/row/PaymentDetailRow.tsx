import React from 'react';

interface PaymentDetailRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  tooltip?: React.ReactNode;
}

export const PaymentDetailRow: React.FunctionComponent<PaymentDetailRowProps> = ({
  label,
  value,
  tooltip,
}) => (
  <div className="row mb-2">
    <div className={`col-12 col-md-${tooltip ? 4 : 6} text-md-end`}>{label}:</div>
    <div className="col-12 col-md-6">
      <b>{value}</b>
    </div>
    {tooltip && <div className="col-12 col-md-2 d-none d-md-block">{tooltip}</div>}
  </div>
);
