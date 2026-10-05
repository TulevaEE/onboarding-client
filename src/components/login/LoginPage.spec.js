import React from 'react';
import { shallow } from 'enzyme';
import { LoginPage } from './LoginPage';
import { AuthenticationLoader, ErrorAlert } from '../common';
import LoginForm from './loginForm';
import { SmartIdDeviceLinkLogin } from './smartId/SmartIdDeviceLinkLogin';

describe('Login page', () => {
  let props;
  let component;

  const pendingLogin = () => component.find(LoginForm).prop('pendingLogin');
  const alert = () => component.find(LoginForm).prop('alert');

  beforeEach(() => {
    props = {};
    component = shallow(<LoginPage {...props} />);
  });

  it('renders a login form with nothing pending if no actions have not been taken', () => {
    const formProps = {
      phoneNumber: 'number',
      personalCode: 'code',
      onPhoneNumberChange: jest.fn(),
      onPersonalCodeChange: jest.fn(),
      onMobileIdSubmit: jest.fn(),
      onSmartIdLoginStart: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
      onLoginMethodChange: jest.fn(),
      monthlyThirdPillarContribution: 500,
      exchangeExistingThirdPillarUnits: true,
    };
    component.setProps(formProps);
    expect(
      component.contains(
        <LoginForm {...formProps} mobileIdStartError="" alert={null} pendingLogin={null} />,
      ),
    ).toBe(true);
  });

  it('keeps the login form and shows an authentication loader in it while loading', () => {
    const onCancelMobileAuthentication = jest.fn();
    component.setProps({ onCancelMobileAuthentication, loadingAuthentication: true });

    expect(component.find(LoginForm)).toHaveLength(1);
    expect(pendingLogin()).toEqual(
      <AuthenticationLoader
        controlCode=""
        verificationCodeChoice={false}
        onCancel={onCancelMobileAuthentication}
      />,
    );
  });

  it('shows the control code in the login form', () => {
    const onCancelMobileAuthentication = jest.fn();
    component.setProps({ onCancelMobileAuthentication, controlCode: '1337' });

    expect(pendingLogin()).toEqual(
      <AuthenticationLoader
        controlCode="1337"
        verificationCodeChoice={false}
        onCancel={onCancelMobileAuthentication}
      />,
    );
  });

  it('shows an authentication loader in the login form while loading user conversion', () => {
    component.setProps({ loadingUserConversion: true });

    expect(pendingLogin().type).toBe(AuthenticationLoader);
  });

  it('shows the smart id device link login in the login form while a smart id session is running', () => {
    const web2AppLink = 'https://smart-id.com/device-link/?deviceLinkType=Web2App';
    const onCancelMobileAuthentication = jest.fn();
    const onSmartIdLoginStart = jest.fn();
    const onSmartIdQrCodeExpire = jest.fn();
    component.setProps({
      loadingAuthentication: true,
      smartIdWeb2AppLink: web2AppLink,
      smartIdRememberMe: true,
      onCancelMobileAuthentication,
      onSmartIdLoginStart,
      onSmartIdQrCodeExpire,
    });

    expect(pendingLogin().type).toBe(SmartIdDeviceLinkLogin);
    expect(pendingLogin().props).toEqual({
      web2AppLink,
      rememberMe: true,
      onCancel: onCancelMobileAuthentication,
      onSmartIdLoginStart,
      onExpire: onSmartIdQrCodeExpire,
      automaticRenewals: { take: expect.any(Function) },
    });
  });

  it('keeps one allowance of automatic QR code renewals for the whole page view', () => {
    component.setProps({ loadingAuthentication: true, smartIdWeb2AppLink: 'first link' });
    const firstAllowance = pendingLogin().props.automaticRenewals;

    component.setProps({ smartIdWeb2AppLink: null });
    component.setProps({ smartIdWeb2AppLink: 'second link' });

    expect(pendingLogin().props.automaticRenewals).toBe(firstAllowance);
  });

  it('shows an authentication loader until the first smart id session has its device link', () => {
    component.setProps({ loadingAuthentication: true });
    expect(pendingLogin().type).toBe(AuthenticationLoader);

    component.setProps({
      smartIdWeb2AppLink: 'https://smart-id.com/device-link/?deviceLinkType=Web2App',
    });

    expect(pendingLogin().type).toBe(SmartIdDeviceLinkLogin);
  });

  it('starts a fresh device link login for every new smart id session', () => {
    component.setProps({
      loadingAuthentication: true,
      smartIdWeb2AppLink: 'https://smart-id.com/device-link/?deviceLinkType=Web2App',
      smartIdSession: 1,
    });
    const firstSessionKey = pendingLogin().key;

    component.setProps({ smartIdSession: 2 });

    expect(pendingLogin().key).not.toBe(firstSessionKey);
  });

  it('leaves a missing Mobile-ID phone number for the Mobile-ID tab to explain', () => {
    component.setProps({ errorDescription: 'mobile.id.phone.number.required' });

    expect(alert()).toBeNull();
  });

  it('shows an error in the login form instead of anything pending', () => {
    const errorDescription = 'oh no something broke yo';
    component.setProps({ errorDescription, loadingAuthentication: true });

    expect(alert()).toEqual(<ErrorAlert description={errorDescription} />);
    expect(component.find(LoginForm).prop('mobileIdStartError')).toBe(errorDescription);
    expect(pendingLogin()).toBeNull();
  });
});
