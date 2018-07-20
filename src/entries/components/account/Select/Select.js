import React from 'react';
import Types from 'prop-types';

const Select = ({ options, selected, onChange }) => (
  <select
    className="custom-select"
    onChange={event => onChange(event.target.value)}
    value={selected}
  >
    {options.map(({ value, label }) => (
      <option value={value} key={label}>
        {label}
      </option>
    ))}
  </select>
);

Select.propTypes = {
  options: Types.arrayOf(Types.shape({})).isRequired,
  selected: Types.any.isRequired, // eslint-disable-line react/forbid-prop-types
  onChange: Types.func.isRequired,
};

export default Select;
