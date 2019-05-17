import React from 'react';
import { shallow } from 'enzyme';

import { ResidencyAgreement } from './ResidencyAgreement';

describe('ResidencyAgreement', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ResidencyAgreement />);
  });

  it('has default radio checked only when initial state is true', () => {
    const checked = () => component.find('#third-pillar-resident-radio').prop('defaultChecked');

    expect(checked()).toBe(false);
    component.setProps({ isResident: true });
    expect(checked()).toBe(true);
    component.setProps({ isResident: false });
    expect(checked()).toBe(false);
  });

  it('submits when checked', () => {
    const mock = jest.fn();
    component.setProps({ onResidentChange: mock });
    component.find('#residency-radio-container').simulate('change', { target: { value: 'true' } });
    expect(mock).toBeCalledWith(true);
    component.find('#residency-radio-container').simulate('change', { target: { value: 'false' } });
    expect(mock).toBeCalledWith(false);
  });
});
