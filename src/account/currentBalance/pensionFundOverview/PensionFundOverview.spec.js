import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

const fakeUtils = jest.genMockFromModule('../../../common/utils');
jest.mock('../../../common/utils', () => fakeUtils);

const PensionFundOverview = require('./PensionFundOverview').default;

describe('Pension fund overview', () => {
  let component;
  let funds;

  beforeEach(() => {
    fakeUtils.formatAmountForCurrency = (amount, currency) => `formatted(${amount}, ${currency})`;
    funds = [
      { isin: 'i1', name: 'n1', price: 1, currency: 'c' },
      { isin: 'i2', name: 'n2', price: 2, currency: 'c' },
      { isin: 'i3', name: 'n3', price: 3, currency: 'c' },
    ];
    component = shallow(<PensionFundOverview funds={funds} />);
  });

  it('renders a header', () => {
    expect(component.contains(<Message>select.sources.pension.fund</Message>)).toBe(true);
    expect(component.contains(<Message>select.sources.value</Message>)).toBe(true);
  });

  it('renders rows for every pension fund given', () => {
    funds.forEach((fund) => {
      expect(component.contains(<Message>{fund.name}</Message>)).toBe(true);
      expect(component.text()).toContain(`formatted(${fund.price}, ${fund.currency})`);
    });
  });

  it('renders a sum row', () => {
    expect(component.contains(<Message>account.current.balance.total</Message>)).toBe(true);
    expect(component.text()).toContain('formatted(6, c)');
  });
});
