import React from 'react';
import { shallow } from 'enzyme';

import Select from '.';

describe('Select', () => {
  let component;
  let onChange;
  beforeEach(() => {
    onChange = jest.fn();
    component = shallow(
      <Select
        options={[
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
          { value: 3, label: 'Three' },
        ]}
        selected={1}
        onChange={onChange}
      />,
    );
  });

  it('has value as selected', () => {
    component.setProps({ selected: 3 });
    expect(select().prop('value')).toBe(3);
  });

  it('has option values', () => {
    expect(options().map(option => option.prop('value'))).toEqual([1, 2, 3]);
  });

  it('has option labels', () => {
    expect(options().map(option => option.text())).toEqual(['One', 'Two', 'Three']);
  });

  it('executes callback with value on change', () => {
    expect(onChange).not.toBeCalled();
    select().simulate('change', { target: { value: 3 } });
    expect(onChange).toBeCalledWith(3);
  });

  function select() {
    return component.find('select');
  }

  function options() {
    return component.find('option');
  }
});
