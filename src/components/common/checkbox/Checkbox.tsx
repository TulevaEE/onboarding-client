/* eslint-disable jsx-a11y/label-has-associated-control */
import './Checkbox.scss';
import { FC, ReactNode } from 'react';

type CheckboxProps = {
  children?: ReactNode;
  onToggle?: (checked: boolean) => void;
  checked?: boolean;
  id: string;
  className?: string;
  disabled?: boolean;
};

// Card-styled checkbox mirroring the Radio card (grey background, border, padding)
// so multi-select and single-select options read as one system. The square marker
// with a checkmark signals multi-select where Radio's circle signals single-select.
const Checkbox: FC<CheckboxProps> = ({
  children = '',
  onToggle = () => null,
  checked = false,
  id,
  className = '',
  disabled = false,
}) => (
  <label
    className={`tv-checkbox mb-0 ${checked ? 'tv-checkbox--selected' : ''} ${
      disabled ? 'tv-checkbox--disabled' : ''
    } ${className}`}
    htmlFor={id}
  >
    <div className="row mb-0">
      <div className="col col-auto align-self-center pe-0">
        <input
          type="checkbox"
          className="visually-hidden"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onToggle?.(event.target.checked)}
        />
        <span className="tv-checkbox__button" aria-hidden="true">
          <svg className="tv-checkbox__check" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5.5 4.5 9 11 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <div className="col">{children}</div>
    </div>
  </label>
);

export default Checkbox;
