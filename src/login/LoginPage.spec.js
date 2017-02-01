import React from "react";
import {shallow} from "enzyme";
import {Message} from "retranslate";
import {LoginPage} from "./LoginPage";
import AuthenticationLoader from "./authenticationLoader";
import LoginForm from "./loginForm";

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

  it('renders a generic error if the server returns some unknown error', () => {
    const formProps = {
      error: { error_description: 'GENERIC_ERROR' },
    };
    component.setProps(formProps);
    expect(component.contains(<Message>login.error.generic</Message>)).toBe(true);
    expect(component.contains(<Message>login.error.invalid.user.credentials</Message>)).toBe(false);
  });

  it('renders a specific signup error message if the server returns that the credentials are invalid', () => {
    const formProps = {
      error: { error_description: 'INVALID_USER_CREDENTIALS' },
    };
    component.setProps(formProps);
    expect(component.contains(<Message>login.error.invalid.user.credentials</Message>)).toBe(true);
    expect(component.contains(<Message>login.error.generic</Message>)).toBe(false);
  });
});
