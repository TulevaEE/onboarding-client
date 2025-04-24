import React from 'react';
import { shallow } from 'enzyme';
import { FormattedMessage } from 'react-intl';
import AccountStatement from '.';

import Table from '../../common/table';
import { Euro } from '../../common/Euro';

describe('Account statement', () => {
  let component;

  it('adds "Active fund" pill to active fund name', () => {
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

    expect(funds).toEqual([
      <span>A</span>,
      <span>
        B
        <span
          className="ms-2 badge rounded-pill bg-blue-2 text-navy small fw-normal"
          title="Monthly contributions go to this fund."
        >
          <FormattedMessage id="accountStatement.activeFund" />
        </span>
      </span>,
      <span>C</span>,
    ]);
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

  it('shows Active\u00A0fund badge only if there is an active fund', () => {
    // without an active fund → no badge
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
        ]}
      />,
    );

    const hasBadgeNone = tableProp('dataSource').some(({ fund }) =>
      shallow(fund).find('.badge').exists(),
    );
    expect(hasBadgeNone).toBe(false);

    // with an active fund → one badge
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
            activeFund: true,
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
        ]}
      />,
    );

    const hasBadge = tableProp('dataSource').some(({ fund }) =>
      shallow(fund).find('.badge').exists(),
    );
    expect(hasBadge).toBe(true);
  });

  const tableProp = (name) => component.find(Table).prop(name);
});
