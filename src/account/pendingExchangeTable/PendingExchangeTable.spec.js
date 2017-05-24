import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import PendingExchangeTable from './PendingExchangeTable';
import PendingExchange from './pendingExchange';

describe('Pending exchange table', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PendingExchangeTable />);
  });

  it('renders a table header', () => {
    const headerFields = () => component.find('div.tv-table__header').children();
    const headerField = index => headerFields().at(index).childAt(0).get(0);
    expect(headerFields().length).toBe(4);
    expect(headerField(0)).toEqual(<Message>pending.exchanges.source.fund.isin</Message>);
    expect(headerField(1)).toEqual(<Message>pending.exchanges.target.fund.isin</Message>);
    expect(headerField(2)).toEqual(<Message>pending.exchanges.date</Message>);
    expect(headerField(3)).toEqual(<Message>pending.exchanges.amount</Message>);
  });

  it('renders a fund row for every fund', () => {
    const pendingExchanges = [
      {
        amount: 1,
        date: '2017-05-22T21:00:00Z',
        sourceFundIsin: 'isin1',
        targetFundIsin: 'isin2',
      },
      {
        amount: 0.4,
        date: '2017-02-22T21:00:00Z',
        sourceFundIsin: 'isin3',
        targetFundIsin: 'isin4',
      },
    ];
    component.setProps({ pendingExchanges });
    expect(component.find(PendingExchange).at(0).get(0))
      .toEqual(<PendingExchange
        key="isin1isin22017-05-22T21:00:00Z"
        amount={1} date="2017-05-22T21:00:00Z" sourceFundIsin="isin1" targetFundIsin="isin2"
      />);
    expect(component.find(PendingExchange).at(1).get(0))
      .toEqual(<PendingExchange
        key="isin3isin42017-02-22T21:00:00Z"
        amount={0.4} date="2017-02-22T21:00:00Z" sourceFundIsin="isin3" targetFundIsin="isin4"
      />);
  });

});
