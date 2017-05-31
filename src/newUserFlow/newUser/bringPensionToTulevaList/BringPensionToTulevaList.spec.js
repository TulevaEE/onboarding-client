import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { BringPensionToTulevaList } from './BringPensionToTulevaList';

describe('Bring Pension to Tuleva list', () => {
  let component;

  beforeEach(() => {
    const props = { className: 'test' };
    component = shallow(<BringPensionToTulevaList {...props} />);
  });

  it('renders list', () => {
    expect(component.contains(
      <Message>new.user.flow.new.user.cheapest</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.cheapest.fund.management.fee</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.safety</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.money.to.self</Message>)).toBe(true);
  });
});
