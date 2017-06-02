import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { JoinTulevaList } from './JoinTulevaList';

describe('Join Tuleva list', () => {
  let component;

  beforeEach(() => {
    const props = { className: 'test' };
    component = shallow(<JoinTulevaList {...props} />);
  });

  it('renders list', () => {
    expect(component.contains(
      <Message>new.user.flow.new.user.tuleva.owner</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.member.bonus.start</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.member.bonus.end</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.profit.sharing</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.improve.the.pension.system</Message>)).toBe(true);
  });

  it('renders the same list as alternative ', () => {
    component.setProps({ showAlternative: true });

    expect(component.contains(
      <Message>new.user.flow.new.user.tuleva.owner</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.member.bonus.start</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.member.bonus.end</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.profit.sharing</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.improve.the.pension.system</Message>)).toBe(true);
  });

  it('renders alternative list for people over 55', () => {
    component.setProps({ showAlternative: true, age: 55 });

    expect(component.contains(
      <Message>new.user.flow.new.user.alternative.no.benefit.join</Message>)).toBe(true);
    expect(component.contains(
      <Message>new.user.flow.new.user.alternative.you.can.still.join</Message>)).toBe(true);
  });
});
