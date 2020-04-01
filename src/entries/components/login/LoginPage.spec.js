import React from 'react';
import FacebookProvider, { Like } from 'react-facebook';
import { shallow } from 'enzyme';
import { LoginPage } from './LoginPage';
import { AuthenticationLoader, ErrorAlert } from '../common';
import LoginForm from './loginForm';

describe('Login page', () => {
  let props;
  let component;

  beforeEach(() => {
    props = {};
    component = shallow(<LoginPage {...props} />);
  });

  it('renders a login form if no actions have not been taken', () => {
    const formProps = {
      phoneNumber: 'number',
      personalCode: 'code',
      onPhoneNumberChange: jest.fn(),
      onPersonalCodeChange: jest.fn(),
      onMobileIdSubmit: jest.fn(),
      onIdCodeSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
      monthlyThirdPillarContribution: 500,
      exchangeExistingThirdPillarUnits: true,
    };
    component.setProps(formProps);
    expect(component.contains(<LoginForm {...formProps} />)).toBe(true);
  });

  it('renders an authentication loader instead if loading', () => {
    const onCancelMobileAuthentication = jest.fn();
    component.setProps({ onCancelMobileAuthentication });

    expect(
      component.contains(
        <AuthenticationLoader controlCode="" onCancel={onCancelMobileAuthentication} />,
      ),
    ).toBe(false);
    component.setProps({ loadingAuthentication: true });
    expect(
      component.contains(
        <AuthenticationLoader controlCode="" onCancel={onCancelMobileAuthentication} />,
      ),
    ).toBe(true);
  });

  it('renders an authentication loader instead if has control code', () => {
    const onCancelMobileAuthentication = jest.fn();
    component.setProps({ onCancelMobileAuthentication });

    component.setProps({ controlCode: '1337' });
    expect(
      component.contains(
        <AuthenticationLoader controlCode="1337" onCancel={onCancelMobileAuthentication} />,
      ),
    ).toBe(true);
  });

  it('renders an authentication loader instead if loading user conversion', () => {
    const onCancelMobileAuthentication = jest.fn();
    component.setProps({
      onCancelMobileAuthentication,
      loadingUserConversion: true,
    });
    expect(
      component.contains(
        <AuthenticationLoader controlCode="" onCancel={onCancelMobileAuthentication} />,
      ),
    ).toBe(true);
  });

  it('passes an error forwards to ErrorAlert, shows login form and does not show other components', () => {
    const errorDescription = 'oh no something broke yo';
    const formProps = {
      phoneNumber: 'number',
      personalCode: 'idCode',
      onPhoneNumberChange: jest.fn(),
      onPersonalCodeChange: jest.fn(),
      onMobileIdSubmit: jest.fn(),
      onIdCodeSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
      monthlyThirdPillarContribution: 500,
      exchangeExistingThirdPillarUnits: true,
    };
    const authProps = {
      controlCode: null,
      onCancel: jest.fn(),
    };
    component.setProps({ errorDescription, ...formProps, ...authProps });

    expect(component.contains(<ErrorAlert description={errorDescription} />)).toBe(true);
    expect(component.contains(<LoginForm {...formProps} />)).toBe(true);
    expect(component.contains(<AuthenticationLoader {...authProps} />)).toBe(false);
  });

  it('shows facebook likes', () => {
    expect(
      component.contains(
        <FacebookProvider appId="1939240566313354">
          <Like href="http://www.facebook.com/Tuleva.ee" colorScheme="dark" showFaces />
        </FacebookProvider>,
      ),
    ).toBe(true);
  });
});
