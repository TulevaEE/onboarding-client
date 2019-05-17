import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import StatusBoxRow from './StatusBoxRow';

describe('Status Box Row', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StatusBoxRow />);
  });

  it('renders the name', () => {
    component.setProps({ name: 'i am a name' });
    const displayName = <Message>i am a name</Message>;
    expect(component.contains(displayName)).toBe(true);
  });

  it('renders action button if row status not ok', () => {
    component.setProps({ showAction: true, children: <Message>do next</Message> });
    expect(component.contains(<Message>do next</Message>)).toBe(true);
  });

  it('renders given lines of text', () => {
    component.setProps({ lines: ['aa', 'bb'] });
    expect(component.contains('aa')).toBe(true);
    expect(component.contains('bb')).toBe(true);
  });
});
