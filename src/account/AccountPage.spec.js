import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { AccountPage } from './AccountPage';
import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';

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

    expect(component.contains(<Message>account.converted.user.statement</Message>)).not.toBe(true);

    conversion = { transfersComplete: true, selectionComplete: false };
    component.setProps({ conversion });

    expect(component.contains(<Message>account.converted.user.statement</Message>)).not.toBe(true);
  });

  it('renders initial capital, only if it is present', () => {
    const initialCapital = { amount: 1200, currency: 'EUR' };
    component.setProps({ initialCapital });

    expect(component.contains(<Message params={{ initialCapital: initialCapital.amount }}>
      account.initial-capital.statement
    </Message>)).toBe(true);
    component.setProps({ initialCapital: null });
    expect(component.contains(<Message params={{ initialCapital: initialCapital.amount }}>
      account.initial-capital.statement
    </Message>)).not.toBe(true);
  });
});
