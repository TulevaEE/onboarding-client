import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import FacebookProvider, { Share } from 'react-facebook';

import { Success } from './Success';

describe('Success step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Success />);
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
    expect(component.contains(<Message>success.shares.switched.when</Message>)).toBe(true);
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
    expect(component.contains(<Message>success.shares.switched.when</Message>)).toBe(true);
  });

  it('can download a mandate', () => {
    const onDownloadMandate = jest.fn();
    component.setProps({ onDownloadMandate });
    expect(onDownloadMandate).not.toHaveBeenCalled();
    component
      .find('button')
      .first()
      .simulate('click');
    expect(onDownloadMandate).toHaveBeenCalledTimes(1);
  });

  it('shows facebook share message', () => {
    expect(
      component.contains(
        <p className="text-center">
          <b>
            <Message>success.share.message</Message>
          </b>
        </p>,
      ),
    ).toBe(true);
  });

  it('shows facebook share button', () => {
    expect(
      component.contains(
        <FacebookProvider appId="1939240566313354">
          <Share href="https://tuleva.ee/fondid/">
            <button className="btn btn-primary mt-3" type="button">
              <Message>success.share.cta</Message>
            </button>
          </Share>
        </FacebookProvider>,
      ),
    ).toBe(true);
  });
});
