import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Select } from './Select';

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
        translations={{ translate: jest.fn() }}
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

  it('has translated option labels', () => {
    const translate = jest.fn().mockImplementation(key => `translated ${key}`);
    component.setProps({ translations: { translate } });

    expect(options().map(option => option.text())).toEqual([
      'translated One',
      'translated Two',
      'translated Three',
    ]);
  });

  it('executes callback with value on change', () => {
    expect(onChange).not.toBeCalled();
    select().simulate('change', { target: { value: 3 } });
    expect(onChange).toBeCalledWith(3);
  });

  const select = (): ShallowWrapper<HTMLSelectElement> => component.find('select');
  const options = (): ShallowWrapper<HTMLOptionElement> => component.find('option');
});
