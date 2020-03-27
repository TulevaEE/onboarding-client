import React from 'react';
import { shallow } from 'enzyme';
import FacebookProvider, { Like } from 'react-facebook';
import { InlineLoginPage } from './InlineLoginPage';
import { AuthenticationLoader, ErrorAlert } from '../../../common';
import InlineLoginForm from '../inlineLoginForm';

describe('Login page', () => {
  let props;
  let component;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<InlineLoginPage {...props} />);
  });

  it('renders a login form', () => {
    const formProps = {
      phoneNumber: 'number',
      midIdentityCode: 'number',
      identityCode: 'idCode',
      onPhoneNumberChange: jest.fn(),
      onMidSSCodeChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onIdCodeSubmit: jest.fn(),
      onIdCodeChange: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    component.setProps(formProps);
    expect(component.contains(<InlineLoginForm {...formProps} />)).toBe(true);
  });

  it('renders an authentication loader instead if loading or has control code', () => {
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
    component.setProps({ controlCode: '1337' });
    expect(
      component.contains(
        <AuthenticationLoader controlCode="1337" onCancel={onCancelMobileAuthentication} />,
      ),
    ).toBe(true);
  });

  it('passes an error forwards to ErrorAlert, shows login form and does not show other components', () => {
    const errorDescription = 'oh no something broke yo';
    const formProps = {
      phoneNumber: 'number',
      midIdentityCode: 'number',
      identityCode: 'idCode',
      onPhoneNumberChange: jest.fn(),
      onMidSSCodeChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onIdCodeSubmit: jest.fn(),
      onIdCodeChange: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    const authProps = {
      controlCode: null,
      onCancel: jest.fn(),
    };
    component.setProps({ errorDescription, ...formProps, ...authProps });

    expect(component.contains(<ErrorAlert description={errorDescription} />)).toBe(true);
    expect(component.contains(<InlineLoginForm {...formProps} />)).toBe(true);
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
