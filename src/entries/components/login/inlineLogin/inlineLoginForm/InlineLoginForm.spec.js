import React from 'react';
import { shallow } from 'enzyme';

import { InlineLoginForm } from './InlineLoginForm';

describe('Inline login form', () => {
  let props;
  let component;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<InlineLoginForm {...props} />);
  });

  it('changes value of phone number when typed into input', () => {
    const onPhoneNumberChange = jest.fn();
    const value = 'text';
    component.setProps({ onPhoneNumberChange });

    expect(onPhoneNumberChange).not.toHaveBeenCalled();
    component.find('input#mobile-id-number').simulate('change', { target: { value } });
    expect(onPhoneNumberChange).toHaveBeenCalledTimes(1);
    expect(onPhoneNumberChange).toHaveBeenCalledWith(value);
  });

  it('sets phone number submit button to disabled when no phone number present', () => {
    const submitButtonDisabled = () => !!component.find('input#mobile-id-submit').prop('disabled');
    expect(submitButtonDisabled()).toBe(true);
    component.setProps({ phoneNumber: 'number' });
    expect(submitButtonDisabled()).toBe(false);
  });

  it('can submit a phone number', () => {
    const phoneNumber = 'number';
    const onPhoneNumberSubmit = jest.fn();
    component.setProps({ phoneNumber, onPhoneNumberSubmit });

    expect(onPhoneNumberSubmit).not.toHaveBeenCalled();
    component
      .find('form')
      .first()
      .simulate('submit', { preventDefault: () => true });
    expect(onPhoneNumberSubmit).toHaveBeenCalledTimes(1);
    expect(onPhoneNumberSubmit).toHaveBeenCalledWith(phoneNumber);
  });

  it('can submit identity code', () => {
    const identityCode = 'number';
    const onIdCodeSubmit = jest.fn();
    component.setProps({ identityCode, onIdCodeSubmit });

    expect(onIdCodeSubmit).not.toHaveBeenCalled();
    component
      .find('form')
      .last()
      .simulate('submit', { preventDefault: () => true });
    expect(onIdCodeSubmit).toHaveBeenCalledTimes(1);
    expect(onIdCodeSubmit).toHaveBeenCalledWith(identityCode);
  });

  it('can log in with id card', () => {
    const onAuthenticateWithIdCard = jest.fn();
    component.setProps({ onAuthenticateWithIdCard });

    expect(onAuthenticateWithIdCard).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onAuthenticateWithIdCard).toHaveBeenCalledTimes(1);
  });
});
