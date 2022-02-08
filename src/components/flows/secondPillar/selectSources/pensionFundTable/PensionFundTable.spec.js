import React from 'react';
import { shallow } from 'enzyme';
import { FormattedMessage } from 'react-intl';

import PensionFundTable from './PensionFundTable';
import FundRow from './fundRow';

describe('Pension fund table', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PensionFundTable />);
  });

  it('renders a table header', () => {
    const headerFields = () => component.find('div.tv-table__header').children();
    expect(headerFields()).toMatchSnapshot();
  });

  it('renders a fund row for every fund', () => {
    const funds = [
      { name: 'fund 1', isin: 'isin 1', price: 1, currency: 'EUR', pillar: 2 },
      { name: 'fund 2', isin: 'isin 2', price: 2, currency: 'EUR', pillar: 2 },
    ];
    component.setProps({ funds });
    expect(component.find(FundRow).at(0).get(0)).toEqual(
      <FundRow name="fund 1" key="isin 1" price={1} currency="EUR" />,
    );
    expect(component.find(FundRow).at(1).get(0)).toEqual(
      <FundRow name="fund 2" key="isin 2" price={2} currency="EUR" />,
    );
  });

  it('renders a tiny legend under the table', () => {
    expect(component.contains(<FormattedMessage id="select.sources.active.fund" />)).toBe(true);
  });

  it('renders a fundrow for totals', () => {
    const funds = [
      { name: 'fund 1', isin: 'isin 1', price: 1, currency: 'EUR', pillar: 2 },
      { name: 'fund 2', isin: 'isin 2', price: 2, currency: 'EUR', pillar: 2 },
    ];
    component.setProps({ funds });
    expect(component.find(FundRow).at(2).get(0)).toEqual(
      <FundRow name="select.sources.total" price={3} currency="EUR" highlighted />,
    );
  });
});
