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
});
