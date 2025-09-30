/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import './Radio.scss';
import { FC } from 'react';

type RadioProps = {
  children?: React.ReactNode | string | React.ReactNode[];
  onSelect?: (value: boolean) => void;
  selected?: boolean;
  name: string;
  className?: string;
  id: string;
  alignRadioCenter?: boolean;
  disabled?: boolean;
};

const Radio: FC<RadioProps> = ({
  children = '',
  onSelect = () => null,
  selected = false,
  name,
  className = '',
  id,
  alignRadioCenter = false,
  disabled = false,
}) => (
  <label
    className={`tv-radio mb-0 ${selected ? 'tv-radio--selected' : ''} ${
      disabled ? 'tv-radio--disabled' : ''
    } ${className}`}
    htmlFor={id}
  >
    <div className="row mb-0">
      <div className={`col col-auto ${alignRadioCenter ? 'align-self-center' : ''} pe-0`}>
        <input
          type="radio"
          className="visually-hidden"
          name={name}
          id={id}
          checked={selected}
          disabled={disabled}
          onChange={() => !selected && onSelect?.(!selected)}
        />
        <button
          type="button"
          className="tv-radio__button"
          onClick={() => !selected && onSelect?.(!selected)}
          disabled={disabled}
          aria-pressed={selected}
        >
          <span className="tv-radio__check" />
        </button>
      </div>
      <div className="col">{children}</div>
    </div>
  </label>
);

export default Radio;
