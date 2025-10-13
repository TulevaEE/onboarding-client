import React from 'react';
import { shallow } from 'enzyme';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import AccountSummary from '.';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';

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
        memberCapital={[
          {
            type: 'CAPITAL_PAYMENT',
            contributions: 1,
            profit: 1,
            value: 2,
            currency: 'EUR',
          },
          {
            type: 'UNVESTED_WORK_COMPENSATION',
            contributions: 1,
            profit: 0,
            value: 1,
            currency: 'EUR',
          },
          {
            type: 'WORK_COMPENSATION',
            contributions: 1,
            profit: 1,
            value: 2,
            currency: 'EUR',
          },
          {
            type: 'MEMBERSHIP_BONUS',
            contributions: 0,
            profit: 1,
            value: 1,
            currency: 'EUR',
          },
        ]}
        savingsFundBalance={{
          isin: 'EE0000000000',
          price: 12,
          unavailablePrice: 0,
          activeFund: false,
          currency: 'EUR',
          name: 'Tuleva Täiendav Kogumisfond',
          fundManager: { name: 'Tuleva' },
          managementFeePercent: 0.2,
          pillar: null,
          ongoingChargesFigure: 0.0045,
          contributions: 10,
          subtractions: 0,
          profit: 2,
          units: 10,
        }}
      />,
    );

    const dataSource = tableProp('dataSource');

    expect(dataSource).toHaveLength(4);
    expect(dataSource[0].pillarLabel).toEqual(
      <FormattedMessage id="accountStatement.secondPillar.heading" />,
    );
    expect(dataSource[1].pillarLabel).toEqual(
      <FormattedMessage id="accountStatement.thirdPillar.heading" />,
    );
    expect(dataSource[2].pillarLabel).toEqual(<FormattedMessage id="memberCapital.heading" />);

    expect(dataSource[0].contributions).toEqual(
      <Link to="/2nd-pillar-contributions">
        <Euro amount={3} />
      </Link>,
    );
    expect(dataSource[0].subtractions).toEqual(<Euro amount={-1} />);

    expect(dataSource[1].contributions).toEqual(
      <Link to="/3rd-pillar-contributions">
        <Euro amount={104} />
      </Link>,
    );
    expect(dataSource[1].subtractions).toEqual(<Euro amount={-2} />);

    expect(dataSource[2].contributions).toEqual(<Euro amount={3} />);
    expect(dataSource[2].subtractions).toEqual(<Euro amount={0} />);

    expect(dataSource[0].profit).toEqual(<Euro amount={112} />);
    expect(dataSource[1].profit).toEqual(<Euro amount={-36} />);
    expect(dataSource[2].profit).toEqual(<Euro amount={3} />);
    expect(dataSource[0].value).toEqual(<Euro amount={114} />);
    expect(dataSource[1].value).toEqual(<Euro amount={66} />);
    expect(dataSource[2].value).toEqual(<Euro amount={6} />);

    expect(dataSource[3].pillarLabel).toEqual(
      <FormattedMessage id="accountStatement.savingsFund.heading" />,
    );
    expect(dataSource[3].contributions).toEqual(<Euro amount={10} />);
    expect(dataSource[3].subtractions).toEqual(<Euro amount={0} />);
    expect(dataSource[3].profit).toEqual(<Euro amount={2} />);
    expect(dataSource[3].value).toEqual(<Euro amount={12} />);
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
            ongoingChargesFigure: 0.005,
            contributions: 2800,
            subtractions: 0,
            profit: 200,
            price: 3000,
            unavailablePrice: 1,
          },
          {
            isin: 'B2',
            name: 'B',
            ongoingChargesFigure: 0.005,
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 300,
            unavailablePrice: 1,
          },
          {
            isin: 'C3',
            name: 'C',
            ongoingChargesFigure: 0.005,
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
            ongoingChargesFigure: 0.005,
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 3000,
            unavailablePrice: 1,
          },
          {
            isin: 'B2',
            name: 'B',
            ongoingChargesFigure: 0.005,
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 300,
            unavailablePrice: 1,
          },
          {
            isin: 'C3',
            name: 'C',
            ongoingChargesFigure: 0.005,
            contributions: 0,
            subtractions: 0,
            profit: 0,
            price: 30,
            unavailablePrice: 1,
          },
        ]}
        memberCapital={[
          {
            type: 'CAPITAL_PAYMENT',
            contributions: 1,
            profit: 1,
            value: 2,
            currency: 'EUR',
          },
          {
            type: 'UNVESTED_WORK_COMPENSATION',
            contributions: 1,
            profit: 0,
            value: 1,
            currency: 'EUR',
          },
          {
            type: 'WORK_COMPENSATION',
            contributions: 1,
            profit: 1,
            value: 2,
            currency: 'EUR',
          },
          {
            type: 'MEMBERSHIP_BONUS',
            contributions: 0,
            profit: 1,
            value: 1,
            currency: 'EUR',
          },
        ]}
      />,
    );

    const { footer: feesPercentFooter } = tableProp('columns')[1];
    const { footer: feesEuroFooter } = tableProp('columns')[2];
    const { footer: contributionFooter } = tableProp('columns')[3];
    const { footer: subtractionFooter } = tableProp('columns')[4];
    const { footer: profitFooter } = tableProp('columns')[5];
    const { footer: valueFooter } = tableProp('columns')[6];

    expect(feesPercentFooter.props.value).toBeCloseTo(0.005);
    expect(feesEuroFooter.props.amount).toBeCloseTo(-33.33);
    expect(contributionFooter).toEqual(<Euro amount={2803} />);
    expect(subtractionFooter).toEqual(<Euro amount={-3} />);
    expect(profitFooter).toEqual(<Euro amount={3872} />);
    expect(valueFooter).toEqual(<Euro amount={6672} />);
  });

  const tableProp = (name) => component.find(Table).prop(name);
});
