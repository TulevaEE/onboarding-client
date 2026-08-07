import React from 'react';

export const PillButton: React.FunctionComponent<{
  selected: boolean;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}> = ({ selected, onClick, pressed, children }) => (
  <button
    type="button"
    aria-pressed={pressed}
    className={`btn btn-sm rounded-pill ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
    onClick={onClick}
  >
    {children}
  </button>
);
