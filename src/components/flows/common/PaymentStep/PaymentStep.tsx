import { FC, ReactNode } from 'react';

export const PaymentStep: FC<{ number: number; children: ReactNode }> = ({ number, children }) => (
  <div className="d-flex py-2">
    <span className="flex-shrink-0 tv-step__number me-3">
      <b>{number}</b>
    </span>
    <div className="flex-grow-1 align-self-center">{children}</div>
  </div>
);
