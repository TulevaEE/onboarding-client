import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import NonMember from './NonMember';

describe('NonMember', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NonMember />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('renders title and intro', () => {
    expect(component.contains(
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.non.member.title</Message></p>,
    )).toBe(true);
    expect(component.contains(<p><Message>new.user.flow.non.member.intro</Message></p>)).toBe(true);
  });

  it('renders title and intro', () => {
    expect(component.contains(
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.non.member.title</Message></p>,
    )).toBe(true);
    expect(component.contains(<p><Message>new.user.flow.non.member.intro</Message></p>)).toBe(true);
  });

  it('renders collapsible content', () => {
    expect(component.find('Collapsible').length).toBe(4);
  });

  it('renders collapsible content', () => {
    expect(component.find('li').find('Message').length).toBe(41);
  });
});
