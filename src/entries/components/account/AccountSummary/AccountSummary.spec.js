import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import AccountSummary from '.';
import Table from '../../common/table';
import Euro from '../../common/Euro';

describe('Account summary', () => {
  let component;

  it('passes summary for each pillar as data source', () => {
    component = shallow(
      <AccountSummary
        secondPillarTotal={3}
        thirdPillarTotal={104}
        secondPillarSourceFunds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 1,
            subtractions: 0,
            profit: 0,
            unavailablePrice: 0,
            price: 100,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            unavailablePrice: 0,
            price: 10,
            activeFund: true,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 2,
            subtractions: 0,
            profit: 2,
            unavailablePrice: 0,
            price: 4,
          },
        ]}
        thirdPillarSourceFunds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 100,
            subtractions: 0,
            profit: 20,
            unavailablePrice: 0,
            price: 120,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 10,
            unavailablePrice: 0,
            activeFund: true,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 4,
            subtractions: 0,
            profit: 2,
            price: 6,
            unavailablePrice: 0,
          },
        ]}
      />,
    );

    const dataSource = tableProp('dataSource');

    expect(dataSource).toHaveLength(2);
    expect(dataSource[0].pillar).toEqual(<Message>accountStatement.secondPillar.heading</Message>);
    expect(dataSource[1].pillar).toEqual(<Message>accountStatement.thirdPillar.heading</Message>);
    expect(dataSource[0].contributions).toEqual(<Euro amount={3} />);
    expect(dataSource[1].contributions).toEqual(<Euro amount={104} />);
    expect(dataSource[0].profit).toEqual(
      <span className="text-success">
        <Euro amount={111} />
      </span>,
    );
    expect(dataSource[1].profit).toEqual(
      <span className="text-success">
        <Euro amount={32} />
      </span>,
    );
    expect(dataSource[0].value).toEqual(<Euro amount={114} />);
    expect(dataSource[1].value).toEqual(<Euro amount={136} />);
  });

  it('passes total as each column footer', () => {
    component = shallow(
      <AccountSummary
        secondPillarTotal={1400}
        thirdPillarTotal={1400}
        secondPillarSourceFunds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 2800,
            subtractions: 0,
            profit: 200,
            price: 3000,
            unavailablePrice: 1,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 300,
            unavailablePrice: 1,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 30,
            unavailablePrice: 1,
          },
        ]}
        thirdPillarSourceFunds={[
          {
            isin: 'A1',
            name: 'A',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 3000,
            unavailablePrice: 1,
          },
          {
            isin: 'B2',
            name: 'B',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 300,
            unavailablePrice: 1,
          },
          {
            isin: 'C3',
            name: 'C',
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 30,
            unavailablePrice: 1,
          },
        ]}
      />,
    );

    const { footer: valueFooter } = tableProp('columns')[3];
    const { footer: profitFooter } = tableProp('columns')[2];
    const { footer: contributionFooter } = tableProp('columns')[1];

    expect(contributionFooter).toEqual(<Euro amount={2800} />);
    expect(profitFooter).toEqual(
      <span className="text-success">
        <Euro amount={3866} />
      </span>,
    );
    expect(valueFooter).toEqual(<Euro amount={6666} />);
  });

  const tableProp = name => component.find(Table).prop(name);
});
