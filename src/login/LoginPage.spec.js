import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { LoginPage } from './LoginPage';
import { AuthenticationLoader } from '../common';
import ErrorAlert from './errorAlert';
import LoginForm from './loginForm';

describe('Login page', () => {
  let props;
  let component;

  beforeEach(() => {
    props = {};
    component = shallow(<LoginPage {...props} />);
  });

  it('renders some messages', () => {
    expect(component.contains(<Message>login.not.member</Message>)).toBe(true);
  });

  it('renders a login form if no actions have not been taken', () => {
    const formProps = {
      phoneNumber: 'number',
      onPhoneNumberChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    component.setProps(formProps);
    expect(component.contains(<LoginForm {...formProps} />)).toBe(true);
  });

  it('renders an authentication loader instead if loading or has control code', () => {
    const onCancelMobileAuthentication = jest.fn();
    component.setProps({ onCancelMobileAuthentication });

    expect(component.contains(
      <AuthenticationLoader controlCode="" onCancel={onCancelMobileAuthentication} />,
    )).toBe(false);
    component.setProps({ loadingControlCode: true });
    expect(component.contains(
      <AuthenticationLoader controlCode="" onCancel={onCancelMobileAuthentication} />,
    )).toBe(true);
    component.setProps({ controlCode: '1337' });
    expect(component.contains(
      <AuthenticationLoader controlCode="1337" onCancel={onCancelMobileAuthentication} />,
    )).toBe(true);
  });

  it('passes an error forwards to ErrorAlert and does not show other components', () => {
    const errorDescription = 'oh no something broke yo';
    component.setProps({ errorDescription });
    expect(component.contains(<ErrorAlert description={errorDescription} />)).toBe(true);
  });
});
