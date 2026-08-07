import React from 'react';

export const PillButton: React.FunctionComponent<{
  selected: boolean;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ selected, onClick, pressed, disabled, children }) => (
  <button
    type="button"
    aria-pressed={pressed}
    disabled={disabled}
    className={`btn btn-sm rounded-pill ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
    onClick={onClick}
  >
    {children}
  </button>
);
