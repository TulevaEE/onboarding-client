import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { Success } from './Success';

describe('Success step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Success />);
  });

  it('shows the user default succsess message and profile button', () => {
    expect(component.contains(<Message>success.done</Message>)).toBe(true);
    expect(component.contains(<Message>success.view.profile.title</Message>)).toBe(true);
    expect(component.contains(<Message>success.view.profile.title.button</Message>)).toBe(true);
    expect(component.contains(
      <Link className="btn btn-primary mt-4 profile-link" to="/account">
        <Message>success.view.profile.title.button</Message>
      </Link>,
    )).toBe(true);
    expect(component.contains(<Message>success.your.payments</Message>)).not.toBe(true);
    expect(component.contains(<Message>success.shares.switched</Message>)).not.toBe(true);
  });

  it('show message for future contributions only', () => {
    component.setProps({ selectedFutureContributionsFundIsin: 'AAAA' });
    expect(component.contains(<Message>success.your.payments</Message>)).toBe(true);
    expect(component.contains(<Message>success.your.payments.next.payment</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched</Message>)).not.toBe(true);
    expect(component.contains(<Message>success.shares.switched.when</Message>)).not.toBe(true);
  });

  it('show message for switched funds only', () => {
    component.setProps({ sourceSelection: [{isin: "BBBB"}] });
    expect(component.contains(<Message>success.shares.switched</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched.when</Message>)).toBe(true);
    expect(component.contains(<Message>success.your.payments</Message>)).not.toBe(true);
    expect(component.contains(<Message>success.your.payments.next.payment</Message>)).not.toBe(true);
  });

  it('show message both future contributions and switched funds', () => {
    component.setProps({ selectedFutureContributionsFundIsin: 'AAAA', sourceSelection: [{isin: "BBBB"}] });
    expect(component.contains(<Message>success.your.payments</Message>)).toBe(true);
    expect(component.contains(<Message>success.your.payments.next.payment</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched.when</Message>)).toBe(true);
  });

  it('can download a mandate', () => {
    const onDownloadMandate = jest.fn();
    component.setProps({ onDownloadMandate });
    expect(onDownloadMandate).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onDownloadMandate).toHaveBeenCalledTimes(1);
  });
});
