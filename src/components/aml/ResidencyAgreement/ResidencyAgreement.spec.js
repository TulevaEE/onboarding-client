import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { ResidencyAgreement } from './ResidencyAgreement';

describe('ResidencyAgreement', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ResidencyAgreement />);
  });

  it('has default radio checked only when initial state is true', () => {
    const checked = () => component.find('#aml-resident-checkbox').prop('checked');

    expect(checked()).toBe(false);
    component.setProps({ isResident: true });
    expect(checked()).toBe(true);
    component.setProps({ isResident: false });
    expect(checked()).toBe(false);
  });

  it('submits when checked', () => {
    const mock = jest.fn();
    component.setProps({ onResidentChange: mock });

    component.find('Field').simulate('change', { target: { checked: true } });
    expect(mock).toBeCalledWith(true);

    component.find('Field').simulate('change', { target: { checked: false } });
    expect(mock).toBeCalledWith(false);
  });

  it('has resident tooltip', () => {
    const hasTooltip = () => component.contains(<FormattedMessage id="aml.residentTooltip" />);
    expect(hasTooltip()).toBe(true);
  });
});
