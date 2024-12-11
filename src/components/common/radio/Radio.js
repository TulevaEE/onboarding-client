import React from 'react';
import { PropTypes as Types } from 'prop-types';

import './Radio.scss';

const Radio = ({
  children,
  onSelect,
  selected,
  name,
  className,
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
      <div className={`col col-auto ${alignRadioCenter ? 'align-self-center' : ''} pr-0`}>
        <input
          type="radio"
          className="sr-only"
          name={name}
          id={id}
          checked={selected}
          disabled={disabled}
          onChange={() => !selected && onSelect(!selected)}
        />
        <button
          type="button"
          className="tv-radio__button"
          onClick={() => !selected && onSelect(!selected)}
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

const noop = () => null;

Radio.defaultProps = {
  children: '',
  onSelect: noop,
  selected: false,
  className: '',
  disabled: false,
};

Radio.propTypes = {
  children: Types.oneOfType([Types.node, Types.string, Types.arrayOf(Types.node)]),
  onSelect: Types.func,
  selected: Types.bool,
  name: Types.string.isRequired,
  className: Types.string,
  id: Types.string.isRequired,
  disabled: Types.bool,
};

export default Radio;
