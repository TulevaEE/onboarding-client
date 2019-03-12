import React from 'react';
import { shallow, mount } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { Provider } from 'react-redux';

import { Loader, ErrorMessage } from '../common';
import { AccountPage, TOTAL_CAPITAL } from './AccountPage';
import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';
import PendingExchangesTable from './pendingExchangeTable';
import UpdateUserForm from './updateUserForm';
import ReturnComparison from '../returnComparison';
import Select from './Select';
import { mockStore } from '../../../test/utils';
import getReturnComparisonStartDateOptions from '../returnComparison/options';

jest.mock('../returnComparison/options', () => jest.fn());

describe('Current balance', () => {
  let component;
  let props;

  beforeEach(() => {
    getReturnComparisonStartDateOptions.mockReturnValue([{}, {}]);
    props = {};
    component = shallow(<AccountPage {...props} />);
  });

  it('renders the current balance', () => {
    props.currentBalanceFunds = {};
    expect(component.contains(<PensionFundTable />)).toBe(true);
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

  it('renders initial capital, only if it is present', () => {
    const initialCapital = { amount: 1200, currency: 'EUR' };
    component.setProps({ initialCapital });

    expect(
      component.contains(
        <Message
          params={{ initialCapital: (TOTAL_CAPITAL * initialCapital.ownershipFraction).toFixed(2) }}
        >
          account.initial-capital.statement
        </Message>,
      ),
    ).toBe(true);
    component.setProps({ initialCapital: null });
    expect(component.contains('account.initial-capital.statement')).toBe(false);
  });

  it('renders no second pillar message', () => {
    const initialCapital = { currentBalanceFunds: [] };
    component.setProps({ initialCapital });

    expect(component.contains(<Message>account.second.pillar.missing</Message>)).toBe(true);
    component.setProps({ currentBalanceFunds: [{ sourcefund: true }] });
    expect(component.contains(<Message>account.second.pillar.missing</Message>)).toBe(false);
  });

  it('renders member number', () => {
    const memberNumber = 123;
    component.setProps({ memberNumber });
    expect(
      component.contains(<Message params={{ memberNumber }}>account.member.statement</Message>),
    ).toBe(true);
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

  it('passes return comparison whether it is loading', () => {
    component.setProps({ loadingReturnComparison: false });
    expect(returnComparison().prop('loading')).toBe(false);
    component.setProps({ loadingReturnComparison: true });
    expect(returnComparison().prop('loading')).toBe(true);
  });

  it('does not render return comparison when there is an error', () => {
    component.setProps({ returnComparisonError: {} });
    expect(returnComparison().exists()).toBe(false);
  });

  it('renders return comparison when there is no error', () => {
    expect(returnComparison().exists()).toBe(true);
  });

  it('passes options to return comparison select', () => {
    getReturnComparisonStartDateOptions.mockReturnValue([
      { value: '2002-01-01', label: 'Since the beginning' },
      { value: '2005-10-03', label: '5 years' },
    ]);

    component = mountWithProvider(<AccountPage />);

    expect(returnComparisonSelect().prop('options')).toEqual([
      { value: '2002-01-01', label: 'Since the beginning' },
      { value: '2005-10-03', label: '5 years' },
    ]);
  });

  it('passes first return comparison option value to return comparison select by default', () => {
    getReturnComparisonStartDateOptions.mockReturnValue([
      { value: '2002-01-01', label: 'Since the beginning' },
      { value: '2005-10-03', label: '5 years' },
    ]);

    component = mountWithProvider(<AccountPage />);

    expect(returnComparisonSelect().prop('selected')).toEqual('2002-01-01');
  });

  it('executes callback on return comparison select change', () => {
    getReturnComparisonStartDateOptions.mockReturnValue([
      { value: '2002-01-01', label: 'Since the beginning' },
      { value: '2005-10-03', label: '5 years' },
    ]);

    const getReturnComparisonForStartDate = jest.fn();

    component = mountWithProvider(
      <AccountPage getReturnComparisonForStartDate={getReturnComparisonForStartDate} />,
    );
    returnComparisonSelect().simulate('change', '2005-10-03');

    expect(getReturnComparisonForStartDate).toBeCalled();
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

  it('renders change pension fund button', () => {
    const initialCapital = { currentBalanceFunds: [] };
    component.setProps({ initialCapital });

    expect(
      component.contains(
        <Link className="btn btn-primary mb-3" to="/steps/select-sources">
          <Message>change.my.pension.fund</Message>
        </Link>,
      ),
    ).toBe(false);
    component.setProps({ currentBalanceFunds: [{ sourcefund: true }] });
    expect(
      component.contains(
        <Link className="btn btn-primary mb-3" to="/steps/select-sources">
          <Message>change.my.pension.fund</Message>
        </Link>,
      ),
    ).toBe(true);
  });

  function pendingExchangesTable() {
    return component.find(PendingExchangesTable);
  }

  function pendingExchangesLoader() {
    return component.find(Loader).filter('.mt-5');
  }

  function returnComparison() {
    return component.find(ReturnComparison);
  }

  function returnComparisonSelect() {
    return component.find(Select);
  }

  function mountWithProvider(renderComponent) {
    return mount(
      <Provider store={mockStore({ login: {}, account: {} })}>{renderComponent}</Provider>,
    );
  }
});
