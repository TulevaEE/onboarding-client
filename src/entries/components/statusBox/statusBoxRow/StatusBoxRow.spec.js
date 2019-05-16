import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import StatusBoxRow from './StatusBoxRow';

describe('Status Box Row', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StatusBoxRow />);
  });

  it("renders the fund's name", () => {
    component.setProps({ name: 'i am a name' });
    const displayName = <Message>i am a name</Message>;
    expect(component.contains(displayName)).toBe(true);
  });
});
