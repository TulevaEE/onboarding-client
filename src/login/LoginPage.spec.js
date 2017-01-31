import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { LoginPage } from './LoginPage';
import AuthenticationLoader from './authenticationLoader';
import LoginForm from './loginForm';

describe('Login page', () => {
  let props;
  let component;

  beforeEach(() => {
    props = {};
    component = shallow(<LoginPage {...props} />);
  });

  it('renders some messages', () => {
    expect(component.contains(<Message>login.title</Message>)).toBe(true);
  });

  it('renders a login form if no actions have not been taken', () => {
    const formProps = {
      phoneNumber: 'number',
      onPhoneNumberChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
    };
    component.setProps(formProps);
    expect(component.contains(<LoginForm {...formProps} />)).toBe(true);
  });

  it('renders an authentication loader instead if loading or has control code', () => {
    expect(component.contains(<AuthenticationLoader controlCode="" />)).toBe(false);
    component.setProps({ loadingControlCode: true });
    expect(component.contains(<AuthenticationLoader controlCode="" />)).toBe(true);
    component.setProps({ controlCode: '1337' });
    expect(component.contains(<AuthenticationLoader controlCode="1337" />)).toBe(true);
  });
});
