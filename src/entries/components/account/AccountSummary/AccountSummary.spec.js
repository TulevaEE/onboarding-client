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
        secondPillarContributions={3}
        secondPillarSubtractions={-1}
        thirdPillarContributions={104}
        thirdPillarSubtractions={-2}
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
            profit: -50,
            unavailablePrice: 0,
            price: 50,
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
        memberCapital={{
          capitalPayment: 1,
          unvestedWorkCompensation: 1,
          workCompensation: 1,
          membershipBonus: 1,
          profit: 2,
          total: 6,
        }}
      />,
    );

    const dataSource = tableProp('dataSource');

    expect(dataSource).toHaveLength(3);
    expect(dataSource[0].pillar).toEqual(<Message>accountStatement.secondPillar.heading</Message>);
    expect(dataSource[1].pillar).toEqual(<Message>accountStatement.thirdPillar.heading</Message>);
    expect(dataSource[2].pillar).toEqual(<Message>memberCapital.heading</Message>);

    expect(dataSource[0].contributions).toEqual(<Euro amount={3} />);
    expect(dataSource[0].subtractions).toEqual(<Euro amount={-1} />);

    expect(dataSource[1].contributions).toEqual(<Euro amount={104} />);
    expect(dataSource[1].subtractions).toEqual(<Euro amount={-2} />);

    expect(dataSource[2].contributions).toEqual(<Euro amount={3} />);
    expect(dataSource[2].subtractions).toEqual(<Euro amount={0} />);

    expect(dataSource[0].profit).toEqual(
      <span className="text-success">
        <Euro amount={112} />
      </span>,
    );
    expect(dataSource[1].profit).toEqual(
      <span className="text-danger">
        <Euro amount={-36} />
      </span>,
    );
    expect(dataSource[2].profit).toEqual(
      <span className="text-success">
        <Euro amount={3} />
      </span>,
    );
    expect(dataSource[0].value).toEqual(<Euro amount={114} />);
    expect(dataSource[1].value).toEqual(<Euro amount={66} />);
    expect(dataSource[2].value).toEqual(<Euro amount={6} />);
  });

  it('passes total as each column footer', () => {
    component = shallow(
      <AccountSummary
        secondPillarContributions={1400}
        secondPillarSubtractions={-1}
        thirdPillarContributions={1400}
        thirdPillarSubtractions={-2}
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
        memberCapital={{
          capitalPayment: 1,
          unvestedWorkCompensation: 1,
          workCompensation: 1,
          membershipBonus: 1,
          profit: 2,
          total: 6,
        }}
      />,
    );

    const { footer: valueFooter } = tableProp('columns')[4];
    const { footer: profitFooter } = tableProp('columns')[3];
    const { footer: subtractionFooter } = tableProp('columns')[2];
    const { footer: contributionFooter } = tableProp('columns')[1];

    expect(subtractionFooter).toEqual(<Euro amount={-3} />);
    expect(contributionFooter).toEqual(<Euro amount={2803} />);
    expect(profitFooter).toEqual(
      <span className="text-success">
        <Euro amount={3872} />
      </span>,
    );
    expect(valueFooter).toEqual(<Euro amount={6672} />);
  });

  const tableProp = (name) => component.find(Table).prop(name);
});
