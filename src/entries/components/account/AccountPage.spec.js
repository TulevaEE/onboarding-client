import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Loader, ErrorMessage } from '../common';
import { AccountPage } from './AccountPage';
import PendingExchangesTable from './pendingExchangeTable';
import UpdateUserForm from './updateUserForm';
import ReturnComparison from '../returnComparison/ReturnComparison';
import ReturnComparisonDateSelect from '../returnComparison/ReturnComparisonDateSelect';
import { getReturnComparison } from '../returnComparison/api';
import getReturnComparisonDateOptions from '../returnComparison/options';
import AccountStatement from './AccountStatement';

jest.mock('../returnComparison/options', () => jest.fn());
jest.mock('../returnComparison/api', () => ({ getReturnComparison: jest.fn() }));

describe('Current balance', () => {
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
    getReturnComparisonDateOptions.mockReturnValue([{}, {}]);
    props = {};
    component = shallow(<AccountPage {...props} />);
  });

  describe('return comparison', () => {
    it('does not get return comparison when no token', () => {
      component = shallow(<AccountPage token={undefined} />);

      expect(getReturnComparison).not.toHaveBeenCalled();
    });

    it('gets return comparison for first option date', () => {
      getReturnComparisonDateOptions.mockReturnValueOnce([
        { value: '2002-28-02', label: 'Beginning' },
        ...someReturnComparisonOptions(),
      ]);

      expect(getReturnComparison).not.toHaveBeenCalled();
      component = shallow(<AccountPage token="a-token" />);
      expect(getReturnComparison).toHaveBeenCalledWith('2002-28-02', 'a-token');
    });

    it('does not show return comparison section by default', () => {
      component = shallow(<AccountPage />);

      expect(returnComparisonSection(component).exists()).toBe(false);
    });

    it('shows return comparison section only after successful retrieval', async () => {
      getReturnComparison.mockResolvedValueOnce({});
      component = shallow(<AccountPage token={aToken()} />);

      expect(returnComparisonSection(component).exists()).toBe(false);
      await flushPromises();
      expect(returnComparisonSection(component).exists()).toBe(true);
    });

    it('retrieves return comparison on date change', async () => {
      getReturnComparison.mockResolvedValueOnce({});
      component = shallow(<AccountPage token="a-token" />);

      await flushPromises();
      getReturnComparison.mockClear();
      expect(getReturnComparison).not.toHaveBeenCalled();

      returnComparisonDateSelect(component).simulate('change', '2020-06-25');
      expect(getReturnComparison).toHaveBeenCalledWith('2020-06-25', 'a-token');
    });

    it('hides return comparison section after failed retrieval', async () => {
      getReturnComparison.mockResolvedValueOnce({});
      component = shallow(<AccountPage token={aToken()} />);

      await flushPromises();
      expect(returnComparisonSection(component).exists()).toBe(true);

      getReturnComparison.mockRejectedValueOnce({});
      returnComparisonDateSelect(component).simulate('change', aDate());
      await flushPromises();
      expect(returnComparisonSection(component).exists()).toBe(false);
    });

    it('shows return comparison as loading while retrieving', async () => {
      getReturnComparison.mockResolvedValueOnce({});
      getReturnComparisonDateOptions.mockReturnValue(someReturnComparisonOptions());
      component = shallow(<AccountPage token={aToken()} />);
      await flushPromises();

      getReturnComparison.mockResolvedValueOnce({});
      returnComparisonDateSelect(component).simulate('change', aDate());

      expect(returnComparison(component).prop('loading')).toBe(true);
      await flushPromises();
      expect(returnComparison(component).prop('loading')).toBe(false);
    });

    it('passes first return comparison date to select by default', async () => {
      getReturnComparison.mockResolvedValueOnce({});
      getReturnComparisonDateOptions.mockReturnValue([
        { value: '2002-01-01', label: aLabel() },
        ...someReturnComparisonOptions(),
      ]);

      component = shallow(<AccountPage token={aToken()} />);
      await flushPromises();

      expect(returnComparisonDateSelect(component).prop('selectedDate')).toEqual('2002-01-01');
    });
  });

  describe('when 2nd and 3rd pillar source funds exist', () => {
    const secondPillarSourceFunds = [
      {
        fund: {
          id: 1,
          fundManager: { id: 1, name: 'Tuleva' },
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
          id: 1,
          fundManager: { id: 1, name: 'Tuleva' },
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

    beforeEach(() => {
      component.setProps({
        secondPillarSourceFunds,
        thirdPillarSourceFunds,
        loadingCapital: true,
        initialCapital: capital,
      });
    });

    // it('renders the status box', () => {
    //   expect(component.find(StatusBox).exists()).toBe(true);
    // });

    it('renders loader when current balance is still loading', () => {
      component.setProps({ loadingCurrentBalance: true });
      expect(component.contains(<Loader className="align-middle" />)).toBe(true);
    });

    it('renders loader when pending exchanges are still loading', () => {
      component.setProps({ loadingPendingExchanges: true });
      expect(pendingExchangesLoader().exists()).toBe(true);
    });

    it('renders pending exchanges when at least one exists', () => {
      component.setProps({ pendingExchanges: [{}] });
      expect(pendingExchangesTable().exists()).toBe(true);
    });

    it('renders the 2nd and 3rd pillar account statements', () => {
      expect(accountStatement()).toHaveLength(2);
    });
  });

  it('does not render any account statements when there are no source funds', () => {
    expect(accountStatement().exists()).toBe(false);
  });

  it('renders converted user statement only when user is fully converted', () => {
    let conversion = { transfersComplete: true, selectionComplete: true };
    component.setProps({ conversion });

    expect(component.contains(<Message>account.converted.user.statement</Message>)).toBe(true);

    conversion = { transfersComplete: false, selectionComplete: true };
    component.setProps({ conversion });

    expect(component.contains(<Message>account.converted.user.statement</Message>)).toBe(false);

    conversion = { transfersComplete: true, selectionComplete: false };
    component.setProps({ conversion });

    expect(component.contains(<Message>account.converted.user.statement</Message>)).toBe(false);
  });

  it('renders no second pillar message', () => {
    expect(component.contains(<Message>account.second.pillar.missing</Message>)).toBe(true);
    component.setProps({ secondPillarSourceFunds: [{ sourcefund: true }] });
    expect(component.contains(<Message>account.second.pillar.missing</Message>)).toBe(false);
  });

  it('renders alternative text when user is not a member yet', () => {
    const memberNumber = null;
    component.setProps({ memberNumber });
    expect(component.contains(<Message>account.non.member.statement</Message>)).toBe(true);
  });

  it('renders loader when current balance is still loading', () => {
    const loadingCurrentBalance = true;
    component.setProps({ loadingCurrentBalance });
    expect(component.contains(<Loader className="align-middle" />)).toBe(true);
  });

  it('renders loader when pending exchanges are still loading', () => {
    component.setProps({ loadingPendingExchanges: true });
    expect(pendingExchangesLoader().exists()).toBe(true);
  });

  it('does not render pending exchanges when they are still loading', () => {
    component.setProps({ loadingPendingExchanges: true });
    expect(pendingExchangesTable().exists()).toBe(false);
  });

  it('does not render pending exchanges when none exist', () => {
    component.setProps({ pendingExchanges: [] });
    expect(pendingExchangesTable().exists()).toBe(false);
  });

  it('renders pending exchanges when at least one exists', () => {
    component.setProps({ pendingExchanges: [{}] });
    expect(pendingExchangesTable().exists()).toBe(true);
  });

  it('shows update user form', () => {
    const saveUser = () => null;
    component.setProps({ saveUser });
    expect(component.contains(<UpdateUserForm onSubmit={saveUser} />)).toBe(true);
  });

  it('renders error', () => {
    const error = { body: Error('aww no') };
    const funds = [{ aFund: true }];

    component.setProps({ error, funds });

    expect(component.contains(<ErrorMessage errors={error.body} />)).toBe(true);
  });

  it('renders CTA to non members', () => {
    const cta = (
      <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/tulundusyhistu/">
        <Message>login.join.tuleva</Message>
      </a>
    );
    expect(component.contains(cta)).toBe(true);

    const memberNumber = 123;
    component.setProps({ memberNumber });
    expect(component.contains(cta)).toBe(false);
  });

  const returnComparisonSection = c => c.find('[data-test-id="return-comparison-section"]');
  const returnComparison = c => c.find(ReturnComparison);
  const returnComparisonDateSelect = c => c.find(ReturnComparisonDateSelect);
  const someReturnComparisonOptions = () => [
    { value: '2015-03-10', label: 'A date' },
    { value: '2020-10-03', label: 'Another date' },
  ];
  const aDate = () => '2020-06-25';
  const aToken = () => 'a-token';
  const aLabel = () => 'a label';

  function pendingExchangesTable() {
    return component.find(PendingExchangesTable);
  }

  function pendingExchangesLoader() {
    return component.find(Loader).filter('.mt-5');
  }

  function accountStatement() {
    return component.find(AccountStatement);
  }

  function flushPromises() {
    return new Promise(resolve => {
      process.nextTick(() => {
        resolve();
      });
    });
  }
});
