import React from 'react';
import { shallow } from 'enzyme';

import { LoginForm } from './LoginForm';

describe('Login form', () => {
  let props;
  let component;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<LoginForm {...props} />);
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
    component.find('form').simulate('submit', { preventDefault: () => true });
    expect(onPhoneNumberSubmit).toHaveBeenCalledTimes(1);
    expect(onPhoneNumberSubmit).toHaveBeenCalledWith(phoneNumber);
  });
});
