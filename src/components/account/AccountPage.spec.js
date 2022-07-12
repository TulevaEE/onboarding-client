import React from 'react';
import { shallow } from 'enzyme';

import { ErrorMessage } from '../common';
import { AccountPage } from './AccountPage';
import AccountStatement from './AccountStatement';
import GreetingBar from './GreetingBar';
import AccountSummary from './AccountSummary';
import StatusBox from './statusBox';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';

describe('Account page', () => {
  let component;
  let props;

  const capital = {
    membershipBonus: 10,
    capitalPayment: 1000,
    unvestedWorkCompensation: 1000,
    workCompensation: 1000,
    profit: 0.1,
  };

  beforeEach(() => {
    props = {};
    component = shallow(<AccountPage {...props} />);
  });

  describe('when 2nd and 3rd pillar source funds exist', () => {
    const secondPillarSourceFunds = [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600109435',
          name: 'Tuleva Maailma Aktsiate Pensionifond',
          managementFeeRate: 0.0034,
        },
        value: 14818.92591924,
        currency: 'EUR',
        pillar: 2,
        activeContributions: true,
      },
    ];
    const thirdPillarSourceFunds = [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600109435',
          name: 'Tuleva Vabatahtlik Pensionifond',
          managementFeeRate: 0.0034,
        },
        value: 11818.92591924,
        currency: 'EUR',
        pillar: 3,
        activeContributions: true,
      },
    ];
    const conversion = {
      secondPillar: { contribution: { total: 0 }, subtraction: { total: 0 } },
      thirdPillar: { contribution: { total: 0 }, subtraction: { total: 0 } },
    };

    beforeEach(() => {
      component.setProps({
        secondPillarSourceFunds,
        thirdPillarSourceFunds,
        conversion,
        loadingCapital: true,
        initialCapital: capital,
      });
    });

    it('renders the status box', () => {
      expect(component.find(StatusBox).exists()).toBe(true);
    });

    it('renders greeting message', () => {
      expect(component.contains(<GreetingBar />)).toBe(true);
    });

    it('renders the 2nd and 3rd pillar account statements', () => {
      expect(accountStatement()).toHaveLength(2);
    });

    it('renders account summary table', () => {
      expect(accountSummary()).toHaveLength(1);
    });
  });

  it('renders an application section', () => {
    expect(applicationSection().exists()).toBe(true);
  });

  it('does not render any account statements when there are no source funds', () => {
    expect(accountStatement().exists()).toBe(false);
  });

  it('does not render any account summary table when there are no source funds', () => {
    component.setProps({
      secondPillarSourceFunds: null,
      thirdPillarSourceFunds: null,
    });
    expect(accountSummary().exists()).toBe(false);
  });

  it('renders error', () => {
    const error = { body: Error('aww no') };
    const funds = [{ aFund: true }];

    component.setProps({ error, funds });

    expect(component.contains(<ErrorMessage errors={error.body} />)).toBe(true);
  });

  function accountStatement() {
    return component.find(AccountStatement);
  }

  function applicationSection() {
    return component.find(ApplicationSection);
  }

  function accountSummary() {
    return component.find(AccountSummary);
  }
});
