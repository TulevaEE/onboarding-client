import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { LoginPage } from './LoginPage';
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
});
