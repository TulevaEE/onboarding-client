import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Redirect } from 'react-router-dom';
import { SignUpPage } from './SignUpPage';
import InlineSignUpForm from './inlineSignUp/inlineSignUpForm';

describe('Sign up page', () => {
  let component: ShallowWrapper;

  beforeEach(() => {
    component = shallow(<SignUpPage isMember saveUser={() => {}} />);
  });

  it('redirects to the membership success page when already a member', () => {
    const redirects = () => component.contains(<Redirect to="/join/success" />);

    component.setProps({ isMember: true });
    expect(redirects()).toBe(true);

    component.setProps({ isMember: false });
    expect(redirects()).toBe(false);
  });

  it('renders sign up form', () => {
    expect(component.find(InlineSignUpForm).length).toBe(1);
  });
});
