import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { InlineLoginPage } from './InlineLoginPage';
import { AuthenticationLoader, ErrorAlert } from '../../../common';
import InlineLoginForm from './../inlineLoginForm';

describe('Login page', () => {
  let props;
  let component;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<InlineLoginPage {...props} />);
  });

  it('renders and persists email field content', () => {
    const formProps = {
      phoneNumber: 'number',
      onPhoneNumberChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    component.setProps(formProps);
    component.setState(() => ({ ctaClicked: false }));
    expect(component.find('input#email').length).toBe(1);
    const newEmailFieldValue = 'aiai';
    component.find('input#email').simulate('change', { target: { value: newEmailFieldValue }, persist: () => null });
    expect(component.state().email).toBe(newEmailFieldValue);
  });

  it('disable cta button until valid email is inserted', () => {
    const formProps = {
      phoneNumber: 'number',
      onPhoneNumberChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    component.setProps(formProps);
    component.setState(() => ({ ctaClicked: false }));
    const ctaButtonDisabled = () => !!component.find('button').prop('disabled');
    expect(ctaButtonDisabled()).toBe(true);
    component.setState(() => ({ email: 'test.email@' }));
    expect(ctaButtonDisabled()).toBe(true);
    component.setState(() => ({ email: 'test.email@gmail.com' }));
    expect(ctaButtonDisabled()).toBe(false);
  });

  it('renders cta', () => {
    const formProps = {
      phoneNumber: 'number',
      onPhoneNumberChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    component.setProps(formProps);
    component.setState(() => ({ ctaClicked: false }));
    expect(component.find('button').length).toBe(1);
    expect(component.find('button').at(0).children().at(0).node)
      .toEqual(<Message>inline.login.cta</Message>);
    // expect(component.find('button').length).toBe(1);
  });

  it('renders a login form if cta is clicked', () => {
    const formProps = {
      phoneNumber: 'number',
      onPhoneNumberChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    component.setProps(formProps);
    component.setState(() => ({ ctaClicked: true }));
    expect(component.contains(<InlineLoginForm {...formProps} />)).toBe(true);
  });

  it('renders an authentication loader instead if loading or has control code', () => {
    const onCancelMobileAuthentication = jest.fn();
    component.setProps({ onCancelMobileAuthentication });
    component.setState(() => ({ ctaClicked: true }));

    expect(component.contains(
      <AuthenticationLoader controlCode="" onCancel={onCancelMobileAuthentication} />,
    )).toBe(false);
    component.setProps({ loadingAuthentication: true });
    expect(component.contains(
      <AuthenticationLoader controlCode="" onCancel={onCancelMobileAuthentication} />,
    )).toBe(true);
    component.setProps({ controlCode: '1337' });
    expect(component.contains(
      <AuthenticationLoader controlCode="1337" onCancel={onCancelMobileAuthentication} />,
    )).toBe(true);
  });

  it('passes an error forwards to ErrorAlert, shows login form and does not show other components', () => {
    const errorDescription = 'oh no something broke yo';
    const formProps = {
      phoneNumber: 'number',
      onPhoneNumberChange: jest.fn(),
      onPhoneNumberSubmit: jest.fn(),
      onAuthenticateWithIdCard: jest.fn(),
    };
    const authProps = {
      controlCode: null,
      onCancel: jest.fn(),
    };
    component.setProps({ errorDescription, ...formProps, ...authProps });
    component.setState(() => ({ ctaClicked: true }));

    expect(component.contains(<ErrorAlert description={errorDescription} />)).toBe(true);
    expect(component.contains(<InlineLoginForm {...formProps} />)).toBe(true);
    expect(component.contains(<AuthenticationLoader {...authProps} />)).toBe(false);
  });
});
