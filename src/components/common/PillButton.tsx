import React from 'react';

export const PillButton: React.FunctionComponent<{
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ selected, onClick, disabled, children }) => (
  <button
    type="button"
    aria-pressed={selected}
    disabled={disabled}
    className={`btn btn-sm rounded-pill ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
    onClick={onClick}
  >
    {children}
  </button>
);
