import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Redirect } from 'react-router-dom';

import { Success } from './Success';
import secondPillarTransferDate from '../secondPillarTransferDate';

describe('Success step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Success />);
  });

  it('redirects to previous path only when no signed mandate id', () => {
    component.setProps({ previousPath: '/previous-path' });
    const redirects = () => component.contains(<Redirect to="/previous-path" />);

    expect(redirects()).toBe(true);
    component.setProps({ signedMandateId: 123 });
    expect(redirects()).toBe(false);
  });

  it('shows the user default success message and profile button', () => {
    expect(component.contains(<Message>success.done</Message>)).toBe(true);
    expect(component.contains(<Message>success.view.profile.title</Message>)).toBe(true);
    expect(component.contains(<Message>success.view.profile.title.button</Message>)).toBe(true);
    expect(
      component.contains(
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <Message>success.view.profile.title.button</Message>
        </a>,
      ),
    ).toBe(true);
    expect(component.contains(<Message>success.your.payments</Message>)).toBe(false);
    expect(component.contains(<Message>success.shares.switched</Message>)).toBe(false);
  });

  it('show message for future contributions only', () => {
    component.setProps({ userContributingFuturePayments: true });
    expect(component.contains(<Message>success.your.payments</Message>)).toBe(true);
    expect(component.contains(<Message>success.your.payments.next.payment</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched</Message>)).toBe(false);
    expect(component.contains(<Message>success.shares.switched.when</Message>)).toBe(false);
  });

  it('show message for switched funds only', () => {
    component.setProps({ userHasTransferredFunds: true });
    expect(component.contains(<Message>success.shares.switched</Message>)).toBe(true);
    expect(
      component.contains(
        <Message
          params={{
            transferDate: secondPillarTransferDate().toLocaleDateString('et'),
          }}
        >
          success.shares.switched.when
        </Message>,
      ),
    ).toBe(true);
    expect(component.contains(<Message>success.your.payments</Message>)).toBe(false);
    expect(component.contains(<Message>success.your.payments.next.payment</Message>)).toBe(false);
  });

  it('show message both future contributions and switched funds', () => {
    component.setProps({
      userContributingFuturePayments: true,
      userHasTransferredFunds: true,
    });
    expect(component.contains(<Message>success.your.payments</Message>)).toBe(true);
    expect(component.contains(<Message>success.your.payments.next.payment</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched</Message>)).toBe(true);
    expect(
      component.contains(
        <Message
          params={{
            transferDate: secondPillarTransferDate().toLocaleDateString('et'),
          }}
        >
          success.shares.switched.when
        </Message>,
      ),
    ).toBe(true);
  });

  it('can download a mandate', () => {
    const onDownloadMandate = jest.fn();
    component.setProps({ onDownloadMandate });
    expect(onDownloadMandate).not.toHaveBeenCalled();
    component.find('button').first().simulate('click');
    expect(onDownloadMandate).toHaveBeenCalledTimes(1);
  });
});
