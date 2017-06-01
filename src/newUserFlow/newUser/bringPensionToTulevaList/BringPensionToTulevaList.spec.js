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
      <Message>new.user.flow.new.user.cheapest</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.stock.investing.fund</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.management.fee</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.safety</Message>)).toBe(true);
  });

  it('renders alternative list for people over 55', () => {
    component.setProps({ showAlternative: true, age: 55 });

    expect(component.contains(
      <Message>new.user.flow.new.user.no.benefit</Message>)).toBe(true);
  });
});
