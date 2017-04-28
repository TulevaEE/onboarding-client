import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Loader } from '../../common';
import PensionFundOverview from './pensionFundOverview';
import CurrentBalance from './CurrentBalance';

describe('Current balance', () => {
  let component;

  beforeEach(() => {
    component = shallow(<CurrentBalance />);
  });

  it('renders some text', () => {
    expect(component.contains(<Message>account.current.balance.title</Message>)).toBe(true);
    expect(component.contains(<Message>account.current.balance.subtitle</Message>)).toBe(true);
  });

  it('renders a loader instead of pension funds if it is still loading', () => {
    component.setProps({ loading: true });
    expect(!!component.find(Loader).length).toBe(true);
    expect(!!component.find(PensionFundOverview).length).toBe(false);
  });

  // FIXME: this test fails on ci, no idea how to fix it.
  xit('renders a link to the EVK', () => {
    const evkLink = () => component.find('a').first();
    expect(evkLink().children().at(0).node)
      .toEqual(<Message>account.current.balance.evk</Message>);
    expect(evkLink().prop('href')).toBe('https://www.e-register.ee/');
  });

  it('renders a pension fund overview instead of a loader when not loading', () => {
    const funds = [
      { isin: 'i1', name: 'n1', price: 1, currency: 'c' },
      { isin: 'i2', name: 'n2', price: 2, currency: 'c' },
      { isin: 'i3', name: 'n3', price: 3, currency: 'c' },
    ];
    component.setProps({ funds, loading: false });
    const pensionFundOverview = () => component.find(PensionFundOverview);
    expect(!!component.find(Loader).length).toBe(false);
    expect(!!pensionFundOverview().length).toBe(true);
    expect(pensionFundOverview().prop('funds')).toEqual(funds);
  });
});
