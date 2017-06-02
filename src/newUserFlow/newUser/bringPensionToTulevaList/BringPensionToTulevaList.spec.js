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
      <Message>new.user.flow.new.user.cheapest.in.estonia</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.cheapest.fund.management.fee</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.safety</Message>)).toBe(true);
    // expect(component.contains(
    //   <Message>new.user.flow.new.user.money.to.self</Message>)).toBe(true);
  });

  it('renders alternative list', () => {
    component.setProps({ showAlternative: true });

    expect(component.contains(
      <Message>new.user.flow.new.user.alternative.cheapest</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.alternative.stock.investing.fund</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.alternative.management.fee</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.safety</Message>)).toBe(true);
  });

  it('renders alternative list for people over 55', () => {
    component.setProps({ showAlternative: true, age: 55 });

    expect(component.contains(
      <Message>new.user.flow.new.user.alternative.no.benefit</Message>)).toBe(true);
  });
});
