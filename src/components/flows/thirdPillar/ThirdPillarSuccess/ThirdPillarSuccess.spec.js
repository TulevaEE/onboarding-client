import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { ThirdPillarSuccess } from './ThirdPillarSuccess';

describe('Third pillar success step', () => {
  let component;

  const secondPillarSourceFundsLowFee = [
    {
      isin: 'EE3600109435',
      name: 'Our Fund',
      ongoingChargesFigure: 0.004,
      contributions: 1,
      subtractions: 0,
      profit: 0,
      unavailablePrice: 0,
      price: 100,
    },
    {
      isin: 'B2',
      name: 'B',
      ongoingChargesFigure: 0.001,
      contributions: 0,
      subtractions: 0,
      profit: 0,
      unavailablePrice: 0,
      price: 10,
      activeFund: true,
    },
  ];
  const secondPillarSourceFundsHighFee = [
    {
      isin: 'EE3600109435',
      name: 'Our Fund',
      ongoingChargesFigure: 0.004,
      contributions: 1,
      subtractions: 0,
      profit: 0,
      unavailablePrice: 0,
      price: 100,
    },
    {
      isin: 'B2',
      name: 'B',
      ongoingChargesFigure: 0.1,
      contributions: 10,
      subtractions: 0,
      profit: 0,
      unavailablePrice: 0,
      price: 10,
      activeFund: true,
    },
  ];

  beforeEach(() => {
    const props = {
      secondPillarSourceFunds: secondPillarSourceFundsLowFee,
    };
    component = shallow(<ThirdPillarSuccess {...props} />);
  });

  it('shows the user default success message and profile button', () => {
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.done" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.message" />)).toBe(true);

    expect(
      component.contains(
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="thirdPillarSuccess.button.account" />
        </a>,
      ),
    ).toBe(true);
  });

  it('shows the user a high fee success message and cta button', () => {
    component.setProps({
      secondPillarSourceFunds: secondPillarSourceFundsHighFee,
    });

    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.done" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.message" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.notice.header" />)).toBe(
      true,
    );
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.ourFund" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.currentFund" />)).toBe(true);

    expect(
      component.contains(
        <FormattedMessage
          id="thirdPillarSuccess.notice.description"
          values={{
            currentFundFee: 10,
            currentFundFeeAmount: 1,
            ourFundFeeAmount: 0.44,
            savingsAmount: 0.56,
          }}
        />,
      ),
    ).toBe(true);

    expect(
      component.contains(
        <a className="btn btn-primary mt-4 profile-link" href="/2nd-pillar-flow">
          <FormattedMessage id="thirdPillarSuccess.button" />
        </a>,
      ),
    ).toBe(true);
  });
});
