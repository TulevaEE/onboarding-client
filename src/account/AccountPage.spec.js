import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router-dom';

import { Loader, ErrorMessage } from '../common';
import { AccountPage } from './AccountPage';
import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';
import PendingExchangesTable from './pendingExchangeTable';
import UpdateUserForm from './updateUserForm';

describe('Current balance', () => {
  let component;
  let props;

  beforeEach(() => {
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
        <Message params={{ initialCapital: initialCapital.amount }}>
          account.initial-capital.statement
        </Message>,
      ),
    ).toBe(true);
    component.setProps({ initialCapital: null });
    expect(
      component.contains(
        <Message params={{ initialCapital: initialCapital.amount }}>
          account.initial-capital.statement
        </Message>,
      ),
    ).toBe(false);
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

  it('renders pending mandates', () => {
    props.pendingExchanges = {};
    expect(component.contains(<PendingExchangesTable />)).toBe(true);
  });

  it('renders loader when pending exchanges is still loading', () => {
    const loadingPendingExchanges = true;
    component.setProps({ loadingPendingExchanges });
    expect(component.contains(<Loader className="align-middle" />)).toBe(true);
  });

  it('shows update user form', () => {
    const saveUser = () => null;
    component.setProps({ saveUser });
    expect(component.contains(<UpdateUserForm onSubmit={saveUser} />)).toBe(true);
  });

  it('renders error', () => {
    const error = { body: 'aww no' };
    const funds = [{ aFund: true }];

    component.setProps({ error, funds });

    expect(component.contains(<ErrorMessage errors={error.body} />)).toBe(true);
  });

  it('renders CTA to non members', () => {
    const cta = (
      <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/#inline-signup-anchor">
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
});
