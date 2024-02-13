import React from 'react';
import success from './success.svg';

export const SuccessNotice2: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={`alert text-center py-4 bg-very-light-blue border-0 ${className}`}>
    <img src={success} alt="" />
    {children}
  </div>
);
