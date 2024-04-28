import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

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
          {
            label: 'Group Label',
            options: [
              { value: 'three', label: 'Three' },
              { value: 'four', label: 'Four', disabled: true },
            ],
          },
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

  it('renders individual options and option groups', () => {
    const options = component.find('option');
    const groups = component.find('optgroup');
    expect(options.length).toBe(4);
    expect(groups.length).toBe(1);
    expect(groups.find('option').length).toBe(2);
  });

  it('has translated labels for options and groups', () => {
    expect(options().at(0).text()).toEqual('translated One');
    expect(component.find('optgroup').prop('label')).toBe('translated Group Label');
    expect(
      component
        .find('optgroup')
        .find('option')
        .map((o) => o.text()),
    ).toEqual(['translated Three', 'translated Four']);
  });

  it('executes callback with value on change', () => {
    expect(onChange).not.toBeCalled();
    select().simulate('change', { target: { value: 'four' } });
    expect(onChange).toBeCalledWith('four');
  });

  it('displays original option and group labels without translation', () => {
    component.setProps({ translate: false });
    expect(component.find('option').at(0).text()).toEqual('One');
    expect(component.find('optgroup').prop('label')).toBe('Group Label');
    expect(
      component
        .find('optgroup')
        .find('option')
        .map((o) => o.text()),
    ).toEqual(['Three', 'Four']);
  });

  const select = (): ShallowWrapper => component.find('select');
  const options = (): ShallowWrapper => component.find('option');
});
