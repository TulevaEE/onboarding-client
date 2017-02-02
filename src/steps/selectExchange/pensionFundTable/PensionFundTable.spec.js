import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import PensionFundTable from './PensionFundTable';
import FundRow from './fundRow';

describe('Pension fund table', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PensionFundTable />);
  });

  it('renders a table header', () => {
    const headerFields = () => component.find('div.tv-table__header').children();
    const headerField = index => headerFields().at(index).childAt(0).get(0);
    expect(headerFields().length).toBe(3);
    expect(headerField(0)).toEqual(<Message>select.exchange.pension.fund</Message>);
    expect(headerField(1)).toEqual(<Message>select.exchange.value</Message>);
    expect(headerField(2)).toEqual(<Message>select.exchange.fees</Message>);
  });

  it('renders a fund row for every fund', () => {
    const funds = [
      { name: 'fund 1', isin: 'isin 1', price: 1, currency: 'EUR' },
      { name: 'fund 2', isin: 'isin 2', price: 2, currency: 'EUR' },
    ];
    component.setProps({ funds });
    expect(component.find(FundRow).at(0).get(0))
      .toEqual(<FundRow name="fund 1" key="isin 1" price={1} currency="EUR" />);
    expect(component.find(FundRow).at(1).get(0))
      .toEqual(<FundRow name="fund 2" key="isin 2" price={2} currency="EUR" />);
  });

  it('renders a fundrow for totals', () => {
    const funds = [
      { name: 'fund 1', isin: 'isin 1', price: 1, currency: 'EUR' },
      { name: 'fund 2', isin: 'isin 2', price: 2, currency: 'EUR' },
    ];
    component.setProps({ funds });
    expect(component.find(FundRow).at(2).get(0))
      .toEqual(<FundRow name="select.exchange.total" price={3} currency="EUR" highlighted />);
  });
});
