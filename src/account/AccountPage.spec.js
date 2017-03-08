import React from 'react';
import { shallow } from 'enzyme';

import { AccountPage } from './AccountPage';
import CurrentBalance from './currentBalance';

describe('Current balance', () => {
  let component;

  beforeEach(() => {
    component = shallow(<AccountPage />);
  });

  it('renders the current balance', () => {
    const currentBalanceProp = propName => component.find(CurrentBalance).prop(propName);
    const currentBalanceFunds = [
      { isin: 'i1', name: 'n1', price: 1, currency: 'c' },
      { isin: 'i2', name: 'n2', price: 2, currency: 'c' },
    ];
    component.setProps({ currentBalanceFunds, loadingCurrentBalanceFunds: false });
    expect(currentBalanceProp('funds')).toEqual(currentBalanceFunds);
    expect(currentBalanceProp('loading')).toBe(false);
    component.setProps({ currentBalanceFunds: [], loadingCurrentBalanceFunds: true });
    expect(currentBalanceProp('funds')).toEqual([]);
    expect(currentBalanceProp('loading')).toBe(true);
  });
});
