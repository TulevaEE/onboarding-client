import React from 'react';
import { HTMLAttributes, shallow, ShallowWrapper } from 'enzyme';

import { Select } from './Select';

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: jest.fn().mockImplementation(({ id }) => `translated ${id}`),
  }),
}));

describe('Select', () => {
  let component: ShallowWrapper;
  let onChange: (selected: string) => void;
  beforeEach(() => {
    onChange = jest.fn();
    component = shallow(
      <Select
        options={[
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
          { value: 'three', label: 'Three' },
        ]}
        selected="one"
        onChange={onChange}
      />,
    );
  });

  it('has value as selected', () => {
    component.setProps({ selected: 'three' });
    expect(select().prop('value')).toBe('three');
  });

  it('has option values', () => {
    expect(options().map((option) => option.prop('value'))).toEqual(['one', 'two', 'three']);
  });

  it('has translated option labels', () => {
    expect(options().map((option) => option.text())).toEqual([
      'translated One',
      'translated Two',
      'translated Three',
    ]);
  });

  it('executes callback with value on change', () => {
    expect(onChange).not.toBeCalled();
    select().simulate('change', { target: { value: 'three' } });
    expect(onChange).toBeCalledWith('three');
  });

  const select = (): ShallowWrapper<HTMLAttributes, HTMLSelectElement> => component.find('select');
  const options = (): ShallowWrapper<HTMLAttributes, HTMLOptionElement> => component.find('option');
});
