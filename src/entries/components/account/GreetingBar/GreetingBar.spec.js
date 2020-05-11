import React from 'react';
import { shallow } from 'enzyme';
import { GreetingBar } from './GreetingBar';

describe('Greeting bar', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      user: { firstName: 'first', lastName: 'last', email: 'email', phoneNumber: 'phoneNumber' },
    };
    component = shallow(<GreetingBar {...props} />);
  });
  it('renders greeting message', () => {
    const content = component.text();
    expect(content).toContain(props.user.firstName);
    expect(content).toContain(props.user.lastName);
    expect(content).toContain(props.user.email);
    expect(content).toContain(props.user.phoneNumber);
    expect(component.exists('Link')).toBe(true);
  });
});
