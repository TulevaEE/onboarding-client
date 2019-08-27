import React from 'react';
import { shallow } from 'enzyme';
import AccountStatement from '.';

import Table from '../../common/table';
import Euro from '../../common/Euro';

describe('Account statement', () => {
  let component;

  it('adds * to active fund name', () => {
    component = shallow(
      <AccountStatement
        funds={[
          { isin: 'A1', name: 'A', price: 100 },
          { isin: 'B2', name: 'B', price: 10, activeFund: true },
          { isin: 'C3', name: 'C', price: 1 },
        ]}
      />,
    );

    const names = tableProp('dataSource').map(({ name }) => name);

    expect(names).toEqual(['A', 'B*', 'C']);
  });

  it('passes total as value column footer', () => {
    component = shallow(
      <AccountStatement
        funds={[
          { isin: 'A1', name: 'A', price: 100 },
          { isin: 'B2', name: 'B', price: 10 },
          { isin: 'C3', name: 'C', price: 1 },
        ]}
      />,
    );

    const { footer } = tableProp('columns')[1];

    expect(footer).toEqual(<Euro amount={111} />);
  });

  const tableProp = name => component.find(Table).prop(name);
});
