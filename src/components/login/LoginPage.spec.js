import React from 'react';
import { shallow } from 'enzyme';
import { LoginPage } from './LoginPage';
import { AuthenticationLoader, ErrorAlert } from '../common';
import LoginForm from './loginForm';
import { SmartIdDeviceLinkLogin } from './smartId/SmartIdDeviceLinkLogin';

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
      onSmartIdLoginStart: jest.fn(),
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

  it('renders the smart id device link login while a smart id session is running', () => {
    const web2AppLink = 'https://smart-id.com/device-link/?deviceLinkType=Web2App';
    const onCancelMobileAuthentication = jest.fn();
    const onSmartIdLoginStart = jest.fn();
    component.setProps({
      loadingAuthentication: true,
      smartIdWeb2AppLink: web2AppLink,
      onCancelMobileAuthentication,
      onSmartIdLoginStart,
    });

    expect(
      component.contains(
        <SmartIdDeviceLinkLogin
          web2AppLink={web2AppLink}
          onCancel={onCancelMobileAuthentication}
          onSmartIdLoginStart={onSmartIdLoginStart}
        />,
      ),
    ).toBe(true);
    expect(component.find(AuthenticationLoader)).toHaveLength(0);
  });

  it('drops the device link login while a new smart id session is starting', () => {
    component.setProps({
      loadingAuthentication: true,
      smartIdWeb2AppLink: 'https://smart-id.com/device-link/?deviceLinkType=Web2App',
    });
    expect(component.find(SmartIdDeviceLinkLogin)).toHaveLength(1);

    // Starting again clears the link, which unmounts the QR view and with it the expired
    // polling state, so the fresh session is shown a fresh QR code.
    component.setProps({ smartIdWeb2AppLink: null });

    expect(component.find(SmartIdDeviceLinkLogin)).toHaveLength(0);
    expect(component.find(AuthenticationLoader)).toHaveLength(1);
  });

  it('passes an error forwards to ErrorAlert, shows login form and does not show other components', () => {
    const errorDescription = 'oh no something broke yo';
    const formProps = {
      phoneNumber: 'number',
      personalCode: 'idCode',
      onPhoneNumberChange: jest.fn(),
      onPersonalCodeChange: jest.fn(),
      onMobileIdSubmit: jest.fn(),
      onSmartIdLoginStart: jest.fn(),
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
});
