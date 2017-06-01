import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { OldPensionFundList } from './OldPensionFundList';

describe('Old Pension Fund list', () => {
  let component;

  beforeEach(() => {
    const props = { className: 'test', activeSourceFund: { managementFeePercent: '0.05' } };
    component = shallow(<OldPensionFundList {...props} />);
  });

  it('renders list', () => {
    expect(component.contains(
      <Message>new.user.flow.new.user.old.fund.management.fee</Message>)).toBe(true);
    expect(component.contains('0,05')).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.old.fund.management.fee.yearly</Message>)).toBe(true);
  });

  it('renders an alternative list', () => {
    component.setProps({ showAlternative: true });

    expect(component.contains(
      <Message>new.user.flow.new.user.old.fund.young.age.recommendation</Message>)).toBe(true); 7;
    expect(component.contains(
      <Message>new.user.flow.new.user.old.fund.below.55</Message>)).toBe(true);
    expect(component.contains(
      <Message>target.funds.EE3600109435.title.into</Message>)).toBe(true);
  });

  it('renders an alternative list for over 55 year olds', () => {
    component.setProps({ showAlternative: true, age: 55 });

    expect(component.contains(
      <Message>new.user.flow.new.user.old.fund.low.fees</Message>)).toBe(true);
  });
});
