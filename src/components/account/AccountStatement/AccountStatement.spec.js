import React from 'react';
import { shallow } from 'enzyme';
import AccountStatement from '.';

import Table from '../../common/table';
import { Euro } from '../../common/Euro';

describe('Account statement', () => {
  let component;

  it('adds * to active fund name', () => {
    component = shallow(
      <AccountStatement
        funds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 100,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 10,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
            activeFund: true,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 1,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
          },
        ]}
      />,
    );

    const funds = tableProp('dataSource').map(({ fund }) => fund);

    expect(funds).toEqual([<span>A</span>, <span>B *</span>, <span>C</span>]);
  });

  it('passes total value as value column footer', () => {
    component = shallow(
      <AccountStatement
        funds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 3000,
            unavailablePrice: 1,
            ongoingChargesFigure: 0.002,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 300,
            unavailablePrice: 1,
            ongoingChargesFigure: 0.002,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 30,
            unavailablePrice: 1,
            ongoingChargesFigure: 0.002,
          },
        ]}
      />,
    );

    const { footer } = tableProp('columns')[3];

    expect(footer).toEqual(<Euro className="fw-bold" amount={3333} />);
  });

  it('shows active fund notice only if there is an active fund', () => {
    component = shallow(
      <AccountStatement
        funds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 0,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 0,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 0,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
          },
        ]}
      />,
    );

    expect(activeFundNotice().exists()).toBe(false);

    component = shallow(
      <AccountStatement
        funds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 0,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 0,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
            activeFund: true,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 0,
            unavailablePrice: 0,
            ongoingChargesFigure: 0,
          },
        ]}
      />,
    );

    expect(activeFundNotice().exists()).toBe(true);
  });

  const tableProp = (name) => component.find(Table).prop(name);
  const activeFundNotice = () => component.find('small');
});
