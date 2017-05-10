import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { AccountPage } from './AccountPage';
import CurrentBalance from './currentBalance';

describe('Current balance', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
    component = shallow(<AccountPage {...props} />);
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

  it('renders initial capital, only if it is present', () => {
    const initialCapital = { amount: 1200, currency: 'EUR' };
    component.setProps({ initialCapital });
    expect(component.contains(<Message>account.initial.capital.title</Message>)).toBe(true);
    expect(component.contains(initialCapital.amount)).toBe(true);
    component.setProps({ initialCapital: null });
    expect(component.contains(<Message>account.initial.capital.title</Message>)).not.toBe(true);
  });
});
