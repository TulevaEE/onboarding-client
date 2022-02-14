import React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router-dom';

import { FormattedMessage } from 'react-intl';
import { Success } from './Success';

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
    expect(component.contains(<FormattedMessage id="success.done" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="success.view.profile.title" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="success.view.profile.title.button" />)).toBe(
      true,
    );
    expect(
      component.contains(
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="success.view.profile.title.button" />
        </a>,
      ),
    ).toBe(true);
    expect(component.contains(<FormattedMessage id="success.your.payments" />)).toBe(false);
    expect(component.contains(<FormattedMessage id="success.shares.switched" />)).toBe(false);
  });

  it('show message for future contributions only', () => {
    component.setProps({ userContributingFuturePayments: true });
    expect(component.contains(<FormattedMessage id="success.your.payments" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="success.your.payments.next.payment" />)).toBe(
      true,
    );
    expect(component.contains(<FormattedMessage id="success.shares.switched" />)).toBe(false);
    expect(component.contains(<FormattedMessage id="success.shares.switched.when" />)).toBe(false);
  });

  it('show message for switched funds only', () => {
    Date.now = jest.fn().mockReturnValue(new Date('2021-11-30'));
    component.setProps({ userHasTransferredFunds: true });

    expect(component.contains(<FormattedMessage id="success.shares.switched" />)).toBe(true);
    expect(
      component.contains(
        <FormattedMessage
          id="success.shares.switched.when"
          values={{ transferDate: '01.01.2022' }}
        />,
      ),
    ).toBe(true);
    expect(component.contains(<FormattedMessage id="success.your.payments" />)).toBe(false);
    expect(component.contains(<FormattedMessage id="success.your.payments.next.payment" />)).toBe(
      false,
    );
  });

  it('show message both future contributions and switched funds', () => {
    Date.now = jest.fn().mockReturnValue(new Date('2021-11-30'));
    component.setProps({
      userContributingFuturePayments: true,
      userHasTransferredFunds: true,
    });

    expect(component.contains(<FormattedMessage id="success.your.payments" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="success.your.payments.next.payment" />)).toBe(
      true,
    );
    expect(component.contains(<FormattedMessage id="success.shares.switched" />)).toBe(true);
    expect(
      component.contains(
        <FormattedMessage
          id="success.shares.switched.when"
          values={{ transferDate: '01.01.2022' }}
        />,
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
