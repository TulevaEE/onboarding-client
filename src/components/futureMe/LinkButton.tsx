import React, { ReactNode } from 'react';

interface Props {
  onClick: () => void;
  'aria-label'?: string;
  children: ReactNode;
}

export const LinkButton = ({ onClick, 'aria-label': ariaLabel, children }: Props) => (
  <button
    type="button"
    className="btn btn-link p-0 align-baseline"
    aria-label={ariaLabel}
    onClick={onClick}
  >
    {children}
  </button>
);
