import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import { MiniComparison } from './MiniComparison';

import { Loader } from '../../';

describe('Mini Comparison', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { activeSourceFund: {} };
    component = shallow(<MiniComparison {...props} />);
  });

  it('renders salary field', () => {
    const salary = 123;
    const onSalaryChange = jest.fn();
    component.setProps({ salary, onSalaryChange });

    expect(component.find('input').length).toBe(1);
    expect(component.find('input').at(0).prop('onChange')).not.toBe(null);
  });

  it('if comparison is present, render current fund fee', () => {
    const comparison = {
      currentFundFee: 123,
    };

    component.setProps({ comparison });

    expect(component.contains(
      <span>-{Math.round(comparison.currentFundFee).toLocaleString('et-EE')}&nbsp;&euro;</span>)).toBe(true);
  });
});
