import React from 'react';
import { shallow } from 'enzyme';

import { ErrorMessage } from '../common';
import { AccountPage, shouldRedirectToAml } from './AccountPage';
import AccountStatement from './AccountStatement';
import GreetingBar from './GreetingBar';
import AccountSummary from './AccountSummary';
import { StatusBox } from './statusBox';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';
import { activeThirdPillar } from './statusBox/fixtures';

let mockSavingsFundBalance = null;
jest.mock('../common/apiHooks', () => ({
  useFundPensionStatus: () => ({ data: { fundPensions: [] } }),
  useMemberCapitalListingCount: () => ({ data: [] }),
  useSavingsFundBalance: () => ({ data: mockSavingsFundBalance }),
}));
/**
 * @deprecated Use AccountPageView.test.tsx
 */
describe('Account page', () => {
  let component;
  let props;

  const capital = [
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
  ];

  beforeEach(() => {
    mockSavingsFundBalance = null;
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

  it('renders savings fund section', () => {
    mockSavingsFundBalance = {
      isin: 'EE0000000000',
      price: 12,
      unavailablePrice: 0,
      activeFund: false,
      currency: 'EUR',
      name: 'Tuleva Täiendav Kogumisfond',
      fundManager: { name: 'Tuleva' },
      managementFeePercent: 0.49,
      pillar: null,
      ongoingChargesFigure: 0.0049,
      contributions: 10,
      subtractions: 0,
      profit: 2,
      units: 10,
    };
    component = shallow(<AccountPage {...props} />);

    expect(component.find('#accountStatement.savingsFund.heading')).toBeDefined();
    expect(component.contains(<AccountStatement funds={[mockSavingsFundBalance]} />)).toBe(true);
  });

  describe('aml redirect', () => {
    it('should redirect to aml page', () => {
      const state = {
        aml: {
          missingAmlChecks: ['missing'],
          createAmlChecksSuccess: false,
        },
        login: {
          user: {
            thirdPillarActive: true,
          },
        },
        thirdPillar: {
          sourceFunds: [activeThirdPillar],
        },
      };

      const redirectToAml = shouldRedirectToAml(state);

      expect(redirectToAml).toBe(true);
    });

    it('should not redirect when Tuleva fund is not active', () => {
      const state = {
        aml: {
          missingAmlChecks: ['missing'],
          createAmlChecksSuccess: false,
        },
        login: {
          user: {
            thirdPillarActive: true,
          },
        },
        thirdPillar: {
          sourceFunds: [
            {
              activeFund: false,
              name: 'Tuleva III Samba Pensionifond',
              fundManager: { name: 'Tuleva' },
              pillar: 3,
              managementFeePercent: 0.003,
              isin: 'EE3600001707',
              price: 0,
              unavailablePrice: 0,
              currency: 'EUR',
              ongoingChargesFigure: 0.0049,
              contributions: 500,
              subtractions: 0,
              profit: 500,
            },
          ],
        },
      };

      const redirectToAml = shouldRedirectToAml(state);

      expect(redirectToAml).toBe(false);
    });

    it('should redirect when Tuleva fund is active but has no fund balance', () => {
      const state = {
        aml: {
          missingAmlChecks: ['missing'],
          createAmlChecksSuccess: false,
        },
        login: {
          user: {
            thirdPillarActive: true,
          },
        },
        thirdPillar: {
          sourceFunds: [
            {
              activeFund: true,
              name: 'Tuleva III Samba Pensionifond',
              fundManager: { name: 'Tuleva' },
              pillar: 3,
              managementFeePercent: 0.003,
              isin: 'EE3600001707',
              price: 0,
              unavailablePrice: 0,
              currency: 'EUR',
              ongoingChargesFigure: 0.0049,
              contributions: 500,
              subtractions: 0,
              profit: 500,
            },
          ],
        },
      };

      const redirectToAml = shouldRedirectToAml(state);

      expect(redirectToAml).toBe(true);
    });
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
