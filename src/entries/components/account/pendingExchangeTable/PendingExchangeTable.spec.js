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
    const headerField = index =>
      headerFields()
        .at(index)
        .childAt(0)
        .get(0);
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
        sourceFund: { name: 'i am a name 1', isin: '121' },
        targetFund: { name: 'i am a name 2', isin: '122' },
      },
      {
        amount: 0.4,
        date: '2017-02-22T21:00:00Z',
        sourceFund: { name: 'i am a name 3', isin: '123' },
        targetFund: { name: 'i am a name 4', isin: '124' },
      },
    ];
    component.setProps({ pendingExchanges });
    expect(
      component
        .find(PendingExchange)
        .at(0)
        .get(0),
    ).toEqual(
      <PendingExchange
        key="1211222017-05-22T21:00:00Z"
        amount={1}
        date="2017-05-22T21:00:00Z"
        sourceFund={pendingExchanges[0].sourceFund}
        targetFund={pendingExchanges[0].targetFund}
      />,
    );

    expect(
      component
        .find(PendingExchange)
        .at(1)
        .get(0),
    ).toEqual(
      <PendingExchange
        key="1231242017-02-22T21:00:00Z"
        amount={0.4}
        date="2017-02-22T21:00:00Z"
        sourceFund={pendingExchanges[1].sourceFund}
        targetFund={pendingExchanges[1].targetFund}
      />,
    );
  });
});
